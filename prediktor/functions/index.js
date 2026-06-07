// functions/index.js v5
// Firebase Cloud Functions for The Prediktor

const functions = require('firebase-functions')
const admin = require('firebase-admin')
const https = require('https')

admin.initializeApp()
const db = admin.firestore()

const WC_LEAGUE_ID = 1
const WC_SEASON = 2026

// ── HTTP helpers ──────────────────────────────────────────────────────────

function apiFetch(path, apiKey) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'v3.football.api-sports.io',
      path,
      method: 'GET',
      headers: { 'x-apisports-key': apiKey }
    }
    const req = https.request(options, res => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.end()
  })
}

function normalizeFixture(f) {
  const fixture = f.fixture
  const teams = f.teams
  const goals = f.goals
  const score = f.score
  const isKnockout = ['Round of 32', 'Round of 16', 'Quarter-finals', 'Semi-finals', 'Final', '3rd Place Final'].includes(f.league?.round)
  return {
    id: String(fixture.id),
    date: fixture.date,
    status: fixture.status?.short,
    stage: f.league?.round,
    isKnockout,
    homeTeam: teams.home?.name,
    awayTeam: teams.away?.name,
    homeTeamCode: teams.home?.code,
    awayTeamCode: teams.away?.code,
    homeLogo: teams.home?.logo,
    awayLogo: teams.away?.logo,
    completed: ['FT', 'AET', 'PEN'].includes(fixture.status?.short),
    hasExtraTime: ['AET', 'PEN'].includes(fixture.status?.short),
    hasPenalties: fixture.status?.short === 'PEN',
    score90Home: goals?.home ?? null,
    score90Away: goals?.away ?? null,
    scoreAfterETHome: score?.extratime?.home ?? null,
    scoreAfterETAway: score?.extratime?.away ?? null,
    scorePenHome: score?.penalty?.home ?? null,
    scorePenAway: score?.penalty?.away ?? null,
  }
}

// ── Sync Fixtures + Events ────────────────────────────────────────────────

exports.syncFixtures = functions.https.onCall(async (data, context) => {
  try {
    const secretDoc = await db.collection('meta').doc('secrets').get()
    const footballApiKey = secretDoc.data()?.footballApiKey
    if (!footballApiKey) {
      return { success: false, message: 'Football API key not configured in meta/secrets' }
    }

    // Fetch all fixtures
    const result = await apiFetch(`/fixtures?league=${WC_LEAGUE_ID}&season=${WC_SEASON}`, footballApiKey)
    if (!result.response || result.response.length === 0) {
      return { success: false, count: 0, message: 'No fixtures returned from API' }
    }

    const fixtures = result.response.map(normalizeFixture)
    const batch = db.batch()
    for (const f of fixtures) {
      batch.set(db.collection('fixtures').doc(f.id), f, { merge: true })
    }
    await batch.commit()

    // Fetch events for all newly completed fixtures
    const completedFixtures = fixtures.filter(f => f.completed)
    let eventsUpdated = 0

    for (const fixture of completedFixtures) {
      try {
        // Check if we already have events for this fixture
        const existingEvents = await db.collection('matchEvents').doc(fixture.id).get()
        if (existingEvents.exists()) continue // already fetched

        const eventsResult = await apiFetch(`/fixtures/events?fixture=${fixture.id}`, footballApiKey)
        if (!eventsResult.response) continue

        const events = eventsResult.response
        const goalScorers = []
        const assisters = []
        const yellowCards = []
        const redCards = []

        for (const e of events) {
          if (e.type === 'Goal' && e.detail !== 'Own Goal') {
            if (e.player?.name) goalScorers.push(e.player.name)
            if (e.assist?.name) assisters.push(e.assist.name)
          }
          if (e.type === 'Card') {
            if (e.detail === 'Yellow Card' && e.player?.name) {
              yellowCards.push({ player: e.player.name, team: e.team?.name })
            }
            if ((e.detail === 'Red Card' || e.detail === 'Second Yellow card') && e.player?.name) {
              redCards.push({ player: e.player.name, team: e.team?.name })
            }
          }
        }

        // Clean sheet: team conceded 0 goals at 90 min
        const cleanSheetTeams = []
        if (fixture.score90Home === 0) cleanSheetTeams.push(fixture.awayTeam)
        if (fixture.score90Away === 0) cleanSheetTeams.push(fixture.homeTeam)

        await db.collection('matchEvents').doc(fixture.id).set({
          fixtureId: fixture.id,
          homeTeam: fixture.homeTeam,
          awayTeam: fixture.awayTeam,
          date: fixture.date,
          goalScorers,
          assisters,
          yellowCards,
          redCards,
          cleanSheetTeams,
          fetchedAt: admin.firestore.FieldValue.serverTimestamp()
        })

        eventsUpdated++

        // Small delay to avoid rate limiting (100 req/day on free tier)
        await new Promise(r => setTimeout(r, 200))
      } catch (err) {
        console.error(`Error fetching events for fixture ${fixture.id}:`, err.message)
      }
    }

    return {
      success: true,
      count: fixtures.length,
      eventsUpdated,
      message: `Synced ${fixtures.length} fixtures, fetched events for ${eventsUpdated} completed matches`
    }
  } catch (err) {
    console.error('syncFixtures error:', err)
    return { success: false, message: err.message }
  }
})

// ── Score all players ─────────────────────────────────────────────────────

exports.scoreAllPlayers = functions.https.onCall(async (data, context) => {
  try {
    const [fixturesSnap, predsSnap, tournPredsSnap, playersSnap, eventsSnap, secretSnap] = await Promise.all([
      db.collection('fixtures').get(),
      db.collection('predictions').get(),
      db.collection('tournamentPredictions').get(),
      db.collection('players').get(),
      db.collection('matchEvents').get(),
      db.collection('meta').doc('secrets').get()
    ])

    const fixtures = {}
    fixturesSnap.docs.forEach(d => { fixtures[d.id] = d.data() })

    const matchEvents = {}
    eventsSnap.docs.forEach(d => { matchEvents[d.id] = d.data() })

    const predictions = {}
    predsSnap.docs.forEach(d => {
      const p = d.data()
      if (!predictions[p.playerId]) predictions[p.playerId] = {}
      predictions[p.playerId][p.fixtureId] = p
    })

    const tournamentPredictions = {}
    tournPredsSnap.docs.forEach(d => { tournamentPredictions[d.id] = d.data() })

    const players = playersSnap.docs.map(d => d.data())

    // Get tournament outcomes
    const outcomesSnap = await db.collection('meta').doc('tournamentOutcomes').get()
    const outcomes = outcomesSnap.exists() ? outcomesSnap.data() : {}

    const results = []
    const batch = db.batch()

    for (const player of players) {
      let total = 0
      const breakdown = []

      const playerPreds = predictions[player.id] || {}
      const tournPred = tournamentPredictions[player.id] || {}

      // ── Match score predictions ──────────────────────────────────────
      for (const [fixtureId, pred] of Object.entries(playerPreds)) {
        const fixture = fixtures[fixtureId]
        if (!fixture?.completed) continue

        const h90 = Number(pred.score90Home)
        const a90 = Number(pred.score90Away)
        if (isNaN(h90) || isNaN(a90)) continue

        const actH90 = Number(fixture.score90Home)
        const actA90 = Number(fixture.score90Away)

        const predResult = h90 > a90 ? 'h' : a90 > h90 ? 'a' : 'd'
        const actResult = actH90 > actA90 ? 'h' : actA90 > actH90 ? 'a' : 'd'

        // 90 min result (3pts) + exact score bonus (3pts)
        const correctScore90 = h90 === actH90 && a90 === actA90
        if (correctScore90) {
          total += 6
          breakdown.push(`+6 correct score: ${h90}-${a90} (${fixture.homeTeam} v ${fixture.awayTeam})`)
        } else if (predResult === actResult) {
          total += 3
          breakdown.push(`+3 correct result: ${fixture.homeTeam} v ${fixture.awayTeam}`)
        }

        // ET
        if (fixture.hasExtraTime && pred.scoreETHome !== undefined) {
          const hET = Number(pred.scoreETHome)
          const aET = Number(pred.scoreETAway)
          const actHET = Number(fixture.scoreAfterETHome)
          const actAET = Number(fixture.scoreAfterETAway)
          const predResET = hET > aET ? 'h' : aET > hET ? 'a' : 'd'
          const actResET = actHET > actAET ? 'h' : actAET > actHET ? 'a' : 'd'
          if (hET === actHET && aET === actAET) { total += 4; breakdown.push('+4 correct ET score') }
          else if (predResET === actResET) { total += 2; breakdown.push('+2 correct ET result') }
        }

        // Penalties
        if (fixture.hasPenalties && pred.scorePenHome !== undefined) {
          const hPen = Number(pred.scorePenHome)
          const aPen = Number(pred.scorePenAway)
          const actHPen = Number(fixture.scorePenHome)
          const actAPen = Number(fixture.scorePenAway)
          const predPenW = hPen > aPen ? 'h' : 'a'
          const actPenW = actHPen > actAPen ? 'h' : 'a'
          if (hPen === actHPen && aPen === actAPen) { total += 6; breakdown.push('+6 correct shootout score') }
          else if (predPenW === actPenW) { total += 3; breakdown.push('+3 correct shootout result') }
        }
      }

      // ── Named player stats (per match) ───────────────────────────────
      const namedScorers = (tournPred.namedScorers || []).filter(Boolean)
      const namedAssisters = (tournPred.namedAssisters || []).filter(Boolean)
      const namedGoalies = (tournPred.namedGoalies || []).filter(Boolean)

      for (const events of Object.values(matchEvents)) {
        // Goals — 2pts each
        for (const scorer of (events.goalScorers || [])) {
          if (namedScorers.some(n => n.toLowerCase() === scorer.toLowerCase())) {
            total += 2
            breakdown.push(`+2 goal: ${scorer}`)
          }
        }
        // Assists — 2pt each
        for (const assister of (events.assisters || [])) {
          if (namedAssisters.some(n => n.toLowerCase() === assister.toLowerCase())) {
            total += 2
            breakdown.push(`+2 assist: ${assister}`)
          }
        }
        // Clean sheets — 3pts each (GK must be in named goalies and their team kept clean sheet)
        for (const team of (events.cleanSheetTeams || [])) {
          // Find goalies from this team in the player's named goalies
          // We match by checking squads data — but we don't have it in functions
          // So we award 3pts for any named goalie whose team kept a clean sheet
          // This requires squads data — we'll do a best-effort match below
          for (const goalie of namedGoalies) {
            // We can't easily match goalie to team here without squad data
            // Instead store for post-processing — see note below
          }
        }
      }

      // ── Clean sheet scoring via squad data ───────────────────────────
      // Load squads to match goalies to teams
      const squadsSnap = await db.collection('meta').doc('squads').get()
      if (squadsSnap.exists()) {
        const squads = squadsSnap.data().players
        // Build goalie->team map
        const goalieTeamMap = {}
        for (const [team, squad] of Object.entries(squads)) {
          for (const gk of (squad.goalkeepers || [])) {
            goalieTeamMap[gk.toLowerCase()] = team
          }
        }

        for (const events of Object.values(matchEvents)) {
          for (const cleanTeam of (events.cleanSheetTeams || [])) {
            for (const goalie of namedGoalies) {
              const goalieTeam = goalieTeamMap[goalie.toLowerCase()]
              if (goalieTeam === cleanTeam) {
                total += 3
                breakdown.push(`+3 clean sheet: ${goalie} (${cleanTeam})`)
              }
            }
          }
        }
      }

      // ── Tournament outcome bonuses ────────────────────────────────────
      // Tournament winner
      if (tournPred.tournamentWinner && outcomes.winner) {
        if (tournPred.tournamentWinner === outcomes.winner) {
          total += 15
          breakdown.push('+15 tournament winner')
        }
      }

      // Golden Boot
      if (outcomes.topScorer && namedScorers.length > 0) {
        const topScorers = outcomes.topScorer.split(',').map(s => s.trim().toLowerCase())
        const outright = topScorers.length === 1
        for (const scorer of namedScorers) {
          if (topScorers.includes(scorer.toLowerCase())) {
            const pts = outright ? 15 : 10
            total += pts
            breakdown.push(`+${pts} Golden Boot: ${scorer}`)
          }
        }
      }

      // Most assists
      if (outcomes.topAssister && namedAssisters.length > 0) {
        const topAssisters = outcomes.topAssister.split(',').map(s => s.trim().toLowerCase())
        const outright = topAssisters.length === 1
        for (const assister of namedAssisters) {
          if (topAssisters.includes(assister.toLowerCase())) {
            const pts = outright ? 15 : 10
            total += pts
            breakdown.push(`+${pts} Most assists: ${assister}`)
          }
        }
      }

      // Most clean sheets
      if (outcomes.topCleanSheet && namedGoalies.length > 0) {
        const topGKs = outcomes.topCleanSheet.split(',').map(s => s.trim().toLowerCase())
        const outright = topGKs.length === 1
        for (const goalie of namedGoalies) {
          if (topGKs.includes(goalie.toLowerCase())) {
            const pts = outright ? 15 : 10
            total += pts
            breakdown.push(`+${pts} Most clean sheets: ${goalie}`)
          }
        }
      }

      // Red card predictions
      if (outcomes.totalRedCards !== undefined && tournPred.totalRedCards !== undefined) {
        if (Math.abs(Number(tournPred.totalRedCards) - Number(outcomes.totalRedCards)) <= 2) {
          total += 15
          breakdown.push('+15 total red cards')
        }
      }
      if (outcomes.mostRedCardTeam && tournPred.mostRedCardTeam === outcomes.mostRedCardTeam) {
        total += 20; breakdown.push('+20 most red card team')
      }

      // Yellow card predictions
      if (outcomes.totalYellowCards !== undefined && tournPred.totalYellowCards !== undefined) {
        if (Math.abs(Number(tournPred.totalYellowCards) - Number(outcomes.totalYellowCards)) <= 15) {
        total += 25
          breakdown.push('+25 total yellow cards')
        }
      }
      if (outcomes.mostYellowCardTeam && tournPred.mostYellowCardTeam === outcomes.mostYellowCardTeam) {
        total += 20; breakdown.push('+20 most yellow card team')
      }
      if (outcomes.fewestYellowCardTeam && tournPred.fewestYellowCardTeam === outcomes.fewestYellowCardTeam) {
        total += 30; breakdown.push('+30 fewest yellow card team')
      }

      // Save player total
      batch.update(db.collection('players').doc(player.id), { totalPoints: total })
      results.push({ nickname: player.nickname, total, breakdown })
    }

    await batch.commit()

    return {
      success: true,
      results: results.map(r => ({ nickname: r.nickname, total: r.total }))
    }
  } catch (err) {
    console.error('scoreAllPlayers error:', err)
    return { success: false, error: err.message }
  }
})

// ── Tournament Odds ───────────────────────────────────────────────────────

exports.getTournamentOdds = functions.https.onCall(async (data, context) => {
  const apiKey = process.env.ODDS_API_KEY
  if (!apiKey) return { success: false, odds: null }
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.the-odds-api.com',
      path: `/v4/sports/soccer_fifa_world_cup_winner/odds/?apiKey=${apiKey}&regions=uk&markets=outrights&oddsFormat=decimal`,
      method: 'GET',
    }
    const req = https.request(options, res => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          const odds = {}
          if (json?.[0]?.bookmakers?.[0]?.markets?.[0]?.outcomes) {
            json[0].bookmakers[0].markets[0].outcomes.forEach(o => { odds[o.name] = o.price })
          }
          resolve({ success: true, odds })
        } catch (e) { resolve({ success: false, odds: null }) }
      })
    })
    req.on('error', () => resolve({ success: false, odds: null }))
    req.end()
  })
})

// ── Generate Scout Report ─────────────────────────────────────────────────

exports.generateScoutReport = functions.https.onCall(async (data, context) => {
  const secretDoc = await db.collection('meta').doc('secrets').get()
  const anthropicKey = secretDoc.data()?.anthropicKey
  if (!anthropicKey) {
    return { success: false, error: 'Anthropic API key not configured' }
  }

  let { prompt } = data
  if (!prompt) return { success: false, error: 'No prompt provided' }

  // Fetch odds server-side
  let oddsText = 'Odds unavailable'
  try {
    const oddsKey = secretDoc.data()?.oddsApiKey
    if (oddsKey) {
      oddsText = await new Promise((resolve) => {
        const options = {
          hostname: 'api.the-odds-api.com',
          path: `/v4/sports/soccer_fifa_world_cup_winner/odds/?apiKey=${oddsKey}&regions=uk&markets=outrights&oddsFormat=decimal`,
          method: 'GET',
        }
        const req = https.request(options, res => {
          let d = ''
          res.on('data', chunk => { d += chunk })
          res.on('end', () => {
            try {
              const json = JSON.parse(d)
              const outcomes = json?.[0]?.bookmakers?.[0]?.markets?.[0]?.outcomes || []
              resolve(outcomes.slice(0, 15).map(o => `${o.name}: ${o.price}`).join(', ') || 'Odds unavailable')
            } catch { resolve('Odds unavailable') }
          })
        })
        req.on('error', () => resolve('Odds unavailable'))
        req.end()
      })
    }
  } catch { oddsText = 'Odds unavailable' }

  prompt = prompt.replace('To be provided by the server', oddsText)

  return new Promise((resolve) => {
    const body = JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    })
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    }
    const req = https.request(options, res => {
      let responseData = ''
      res.on('data', chunk => { responseData += chunk })
      res.on('end', () => {
        try {
          const json = JSON.parse(responseData)
          const text = json.content?.[0]?.text
          if (text) {
            resolve({ success: true, report: text })
          } else {
            console.error('Unexpected response:', responseData.substring(0, 500))
            resolve({ success: false, error: json.error?.message || 'No content in response' })
          }
        } catch (e) {
          console.error('Parse error:', e.message)
          resolve({ success: false, error: e.message })
        }
      })
    })
    req.on('error', e => resolve({ success: false, error: e.message }))
    req.write(body)
    req.end()
  })
})
