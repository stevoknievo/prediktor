// functions/index.js v7
// Firebase Cloud Functions for The Prediktor

const functions = require('firebase-functions')
const admin = require('firebase-admin')
const https = require('https')

admin.initializeApp()
const db = admin.firestore()
db.settings({ ignoreUndefinedProperties: true })

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
    date: fixture.date || null,
    status: fixture.status?.short || null,
    stage: f.league?.round || null,
    isKnockout,
    homeTeam: normaliseTeamName(teams.home?.name) || null,
    awayTeam: normaliseTeamName(teams.away?.name) || null,
    homeTeamCode: teams.home?.code || null,
    awayTeamCode: teams.away?.code || null,
    homeLogo: teams.home?.logo || null,
    awayLogo: teams.away?.logo || null,
    completed: ['FT', 'AET', 'PEN'].includes(fixture.status?.short),
    hasExtraTime: ['AET', 'PEN'].includes(fixture.status?.short),
    hasPenalties: fixture.status?.short === 'PEN',
    score90Home: goals?.home ?? null,
    score90Away: goals?.away ?? null,
    scoreAfterETHome: score?.extratime?.home ?? null,
    scoreAfterETAway: score?.extratime?.away ?? null,
    scorePenHome: score?.penalty?.home ?? null,
    scorePenAway: score?.penalty?.away ?? null,
    venue: fixture.venue?.name || null,
  }
}

// ── Team name normalisation ───────────────────────────────────────────────
// Maps API-Football team names to our seeded names

const TEAM_NAME_MAP = {
  'Cape Verde Islands': 'Cape Verde',
  'Cabo Verde': 'Cape Verde',
  "Côte d'Ivoire": 'Ivory Coast',
  "Cote d'Ivoire": 'Ivory Coast',
  'Congo DR': 'DR Congo',
  'DR Congo': 'DR Congo',
  'Democratic Republic of Congo': 'DR Congo',
  'Czechia': 'Czech Republic',
  'United States': 'USA',
  'Korea Republic': 'South Korea',
  'Republic of Korea': 'South Korea',
  'Curacao': 'Curaçao',
  'Bosnia and Herzegovina': 'Bosnia & Herzegovina',
  'Bosnia-Herzegovina': 'Bosnia & Herzegovina',
  'Turkey': 'Türkiye',
}

function normaliseTeamName(name) {
  if (!name) return name
  return TEAM_NAME_MAP[name] || name
}

// ── Shared scoring logic ──────────────────────────────────────────────────

function scorePlayer(player, playerPreds, tournPred, fixtures, matchEvents, goalieTeamMap, outcomes) {
  let total = 0
  const breakdown = []

  const namedScorers = (tournPred.namedScorers || []).filter(Boolean)
  const namedAssisters = (tournPred.namedAssisters || []).filter(Boolean)
  const namedGoalies = (tournPred.namedGoalies || []).filter(Boolean)

  // Match score predictions
  for (const [fixtureId, pred] of Object.entries(playerPreds)) {
    const fixture = fixtures[fixtureId]
    if (!fixture?.completed) continue
    const h90 = Number(pred.score90Home), a90 = Number(pred.score90Away)
    if (isNaN(h90) || isNaN(a90)) continue
    const actH90 = Number(fixture.score90Home), actA90 = Number(fixture.score90Away)
    const predResult = h90 > a90 ? 'h' : a90 > h90 ? 'a' : 'd'
    const actResult = actH90 > actA90 ? 'h' : actA90 > actH90 ? 'a' : 'd'

    if (h90 === actH90 && a90 === actA90) {
      total += 6; breakdown.push(`+6 correct score: ${h90}-${a90} (${fixture.homeTeam} v ${fixture.awayTeam})`)
    } else if (predResult === actResult) {
      total += 3; breakdown.push(`+3 correct result: ${fixture.homeTeam} v ${fixture.awayTeam}`)
    }

    if (fixture.hasExtraTime && pred.scoreETHome !== undefined) {
      const hET = Number(pred.scoreETHome), aET = Number(pred.scoreETAway)
      const actHET = Number(fixture.scoreAfterETHome), actAET = Number(fixture.scoreAfterETAway)
      if (!isNaN(hET) && !isNaN(aET) && !isNaN(actHET) && !isNaN(actAET)) {
        if (hET === actHET && aET === actAET) { total += 4; breakdown.push('+4 correct ET score') }
        else if ((hET > aET ? 'h' : aET > hET ? 'a' : 'd') === (actHET > actAET ? 'h' : actAET > actHET ? 'a' : 'd')) {
          total += 2; breakdown.push('+2 correct ET result')
        }
      }
    }

    if (fixture.hasPenalties && pred.scorePenHome !== undefined) {
      const hPen = Number(pred.scorePenHome), aPen = Number(pred.scorePenAway)
      const actHPen = Number(fixture.scorePenHome), actAPen = Number(fixture.scorePenAway)
      if (!isNaN(hPen) && !isNaN(aPen) && !isNaN(actHPen) && !isNaN(actAPen)) {
        if (hPen === actHPen && aPen === actAPen) { total += 6; breakdown.push('+6 correct shootout score') }
        else if ((hPen > aPen ? 'h' : 'a') === (actHPen > actAPen ? 'h' : 'a')) {
          total += 3; breakdown.push('+3 correct shootout result')
        }
      }
    }
  }

  // Partial name matching helper — handles "Vinicius" matching "Vinicius Junior" etc
  function namesMatch(predName, apiName) {
    const normalise = n => n.toLowerCase().trim()
      .replace(/\bjr\.?\b/g, 'junior')
      .replace(/\bst\.?\b/g, 'saint')
      .replace(/[-']/g, ' ')
      .replace(/\s+/g, ' ')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const p = normalise(predName), a = normalise(apiName)
    if (p === a) return true
    if (a.includes(p) || p.includes(a)) return true
    const pParts = p.split(' '), aParts = a.split(' ')
    const pLast = pParts[pParts.length-1], aLast = aParts[aParts.length-1]
    if (pLast.length > 5 && pLast === aLast) return true
    if (aParts.length === 2 && aParts[0].endsWith('.')) {
      const apiInitial = aParts[0][0], apiLast = aParts[1]
      if (pParts.length >= 2 && pParts[0][0] === apiInitial && pParts[pParts.length-1] === apiLast) return true
    }
    if (pParts.length === 2 && pParts[0].endsWith('.')) {
      const predInitial = pParts[0][0], predLast = pParts[1]
      if (aParts.length >= 2 && aParts[0][0] === predInitial && aParts[aParts.length-1] === predLast) return true
    }
    return false
  }

  // Named player stats per match — only process mXXX documents to prevent double-counting
  for (const [eventId, events] of Object.entries(matchEvents)) {
    if (!eventId.startsWith('m')) continue
    for (const scorer of (events.goalScorers || [])) {
      if (namedScorers.some(n => namesMatch(n, scorer))) {
        total += 2; breakdown.push(`+2 goal: ${scorer}`)
      }
    }
    for (const assister of (events.assisters || [])) {
      if (namedAssisters.some(n => namesMatch(n, assister))) {
        total += 2; breakdown.push(`+2 assist: ${assister}`)
      }
    }
    // Clean sheets — only award if the named goalkeeper actually started
    const startingGKNames = (events.startingGoalkeepers || []).map(g => g.name.toLowerCase())
    for (const cleanTeam of (events.cleanSheetTeams || [])) {
      for (const goalie of namedGoalies) {
        const goalieTeam = goalieTeamMap[goalie.toLowerCase().trim()]
        if (goalieTeam === cleanTeam) {
          if (startingGKNames.length === 0 || startingGKNames.some(n => namesMatch(goalie, n))) {
            total += 3; breakdown.push(`+3 clean sheet: ${goalie} (${cleanTeam})`)
          } else {
            breakdown.push(`0 pts clean sheet: ${goalie} did not start (${cleanTeam})`)
          }
        }
      }
    }
  }

  // Tournament outcome bonuses
  if (outcomes.winner && tournPred.tournamentWinner === outcomes.winner) {
    total += 15; breakdown.push('+15 tournament winner')
  }

  if (outcomes.topScorer && namedScorers.length > 0) {
    const topScorers = outcomes.topScorer.split(',').map(s => s.trim().toLowerCase())
    const outright = topScorers.length === 1
    for (const s of namedScorers) {
      if (topScorers.includes(s.toLowerCase())) {
        const pts = outright ? 15 : 10; total += pts; breakdown.push(`+${pts} Golden Boot: ${s}`)
      }
    }
  }

  if (outcomes.topAssister && namedAssisters.length > 0) {
    const topAssisters = outcomes.topAssister.split(',').map(s => s.trim().toLowerCase())
    const outright = topAssisters.length === 1
    for (const a of namedAssisters) {
      if (topAssisters.includes(a.toLowerCase())) {
        const pts = outright ? 15 : 10; total += pts; breakdown.push(`+${pts} Most assists: ${a}`)
      }
    }
  }

  if (outcomes.topCleanSheet && namedGoalies.length > 0) {
    const topGKs = outcomes.topCleanSheet.split(',').map(s => s.trim().toLowerCase())
    const outright = topGKs.length === 1
    for (const g of namedGoalies) {
      if (topGKs.includes(g.toLowerCase())) {
        const pts = outright ? 15 : 10; total += pts; breakdown.push(`+${pts} Most clean sheets: ${g}`)
      }
    }
  }

  if (outcomes.totalRedCards !== undefined && tournPred.totalRedCards !== undefined) {
    if (Math.abs(Number(tournPred.totalRedCards) - Number(outcomes.totalRedCards)) <= 2) {
      total += 15; breakdown.push('+15 total red cards')
    }
  }
  if (outcomes.mostRedCardTeam && tournPred.mostRedCardTeam === outcomes.mostRedCardTeam) {
    total += 20; breakdown.push('+20 most red card team')
  }
  if (outcomes.totalYellowCards !== undefined && tournPred.totalYellowCards !== undefined) {
    if (Math.abs(Number(tournPred.totalYellowCards) - Number(outcomes.totalYellowCards)) <= 15) {
      total += 25; breakdown.push('+25 total yellow cards')
    }
  }
  if (outcomes.mostYellowCardTeam && tournPred.mostYellowCardTeam === outcomes.mostYellowCardTeam) {
    total += 20; breakdown.push('+20 most yellow card team')
  }
  if (outcomes.fewestYellowCardTeam && tournPred.fewestYellowCardTeam === outcomes.fewestYellowCardTeam) {
    total += 30; breakdown.push('+30 fewest yellow card team')
  }

  return { total, breakdown }
}

// ── Sync Fixtures + Events ────────────────────────────────────────────────

exports.syncFixtures = functions.https.onCall(async (data, context) => {
  try {
    const secretDoc = await db.collection('meta').doc('secrets').get()
    const footballApiKey = secretDoc.data()?.footballApiKey
    if (!footballApiKey) {
      return { success: false, message: 'Football API key not configured in meta/secrets' }
    }

    const result = await apiFetch(`/fixtures?league=${WC_LEAGUE_ID}&season=${WC_SEASON}`, footballApiKey)
    if (!result.response || result.response.length === 0) {
      console.error('syncFixtures: No fixtures returned. API response:', JSON.stringify(result).substring(0, 500))
      return { success: false, count: 0, message: `No fixtures returned from API. Response: ${JSON.stringify(result).substring(0, 200)}` }
    }

    const fixtures = result.response.map(normalizeFixture)

    // Load our seeded fixtures to build a team-name -> mXXX ID lookup
    const seededSnap = await db.collection('fixtures').get()

    // Build sorted-key lookup AND seeded home team map for swap detection
    const teamLookup = {}    // "TeamA|TeamB" (sorted) -> mXXX doc ID
    const seededHomeMap = {} // mXXX doc ID -> seeded homeTeam name
    seededSnap.docs.forEach(d => {
      const data = d.data()
      if (d.id.startsWith('m') && data.homeTeam && data.awayTeam) {
        const key = [data.homeTeam, data.awayTeam].sort().join('|')
        teamLookup[key] = d.id
        seededHomeMap[d.id] = data.homeTeam
      }
    })

    const batch = db.batch()
    const apiToOurId = {} // API numeric ID -> our mXXX ID

    for (const f of fixtures) {
      const key = [f.homeTeam, f.awayTeam].sort().join('|')
      const ourId = teamLookup[key]
      if (ourId) {
        apiToOurId[f.id] = ourId

        // If the API has teams in the opposite order to our seeded data, flip all scores
        const seededHome = seededHomeMap[ourId]
        const scoresAreSwapped = seededHome && f.homeTeam !== seededHome

        if (scoresAreSwapped) {
          console.log(`syncFixtures: swapping scores for ${f.homeTeam} vs ${f.awayTeam} (seeded home: ${seededHome})`)
        }

        batch.set(db.collection('fixtures').doc(ourId), {
          date: f.date,
          venue: f.venue,
          completed: f.completed,
          status: f.status,
          hasExtraTime: f.hasExtraTime,
          hasPenalties: f.hasPenalties,
          score90Home:      scoresAreSwapped ? f.score90Away      : f.score90Home,
          score90Away:      scoresAreSwapped ? f.score90Home      : f.score90Away,
          scoreAfterETHome: scoresAreSwapped ? f.scoreAfterETAway : f.scoreAfterETHome,
          scoreAfterETAway: scoresAreSwapped ? f.scoreAfterETHome : f.scoreAfterETAway,
          scorePenHome:     scoresAreSwapped ? f.scorePenAway     : f.scorePenHome,
          scorePenAway:     scoresAreSwapped ? f.scorePenHome     : f.scorePenAway,
          apiFixtureId: f.id,
        }, { merge: true })
      } else {
        console.warn(`syncFixtures: no mXXX match for ${f.homeTeam} vs ${f.awayTeam}`)
      }
    }
    await batch.commit()

    // Safety net: delete any numeric fixture documents
    const allFixSnap = await db.collection('fixtures').get()
    const cleanBatch = db.batch()
    let numCount = 0
    allFixSnap.docs.forEach(d => {
      if (!d.id.startsWith('m')) { cleanBatch.delete(db.collection('fixtures').doc(d.id)); numCount++ }
    })
    if (numCount > 0) {
      await cleanBatch.commit()
      console.warn(`syncFixtures: deleted ${numCount} stale numeric fixture documents`)
    }

    // Use our mXXX IDs for events, filter to completed fixtures that have a mapping
    const completedFixtures = fixtures.filter(f => f.completed && apiToOurId[f.id]).map(f => ({
      ...f,
      ourId: apiToOurId[f.id]
    }))
    let eventsUpdated = 0

    for (const fixture of completedFixtures) {
      try {
        const docId = fixture.ourId || fixture.id
        const existingEvents = await db.collection('matchEvents').doc(docId).get()
        const fixtureDate = new Date(fixture.date)
        const hoursSinceCompletion = (Date.now() - fixtureDate.getTime()) / 3600000
        if (existingEvents.exists && hoursSinceCompletion > 48) continue

        const [eventsResult, lineupsResult] = await Promise.all([
          apiFetch(`/fixtures/events?fixture=${fixture.id}`, footballApiKey),
          apiFetch(`/fixtures/lineups?fixture=${fixture.id}`, footballApiKey),
        ])
        if (!eventsResult.response) continue

        const events = eventsResult.response
        const goalScorers = [], assisters = [], yellowCards = [], redCards = []
        const seenEvents = new Set()

        for (const e of events) {
          const elapsed = e.time?.elapsed ?? e.time?.extra ?? 0
          const eventKey = `${e.player?.name}_${e.type}_${e.detail}_${elapsed}`
          if (seenEvents.has(eventKey)) continue
          seenEvents.add(eventKey)

          if (e.type === 'Goal' && e.detail !== 'Own Goal' && e.detail !== 'Missed Penalty') {
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

        // Extract starting goalkeepers from lineups
        const startingGoalkeepers = []
        if (lineupsResult?.response) {
          for (const teamLineup of lineupsResult.response) {
            const teamName = teamLineup.team?.name
            const startXI = teamLineup.startXI || []
            for (const player of startXI) {
              if (player.player?.pos === 'G') {
                startingGoalkeepers.push({ name: player.player.name, team: teamName })
              }
            }
          }
        }

        // Clean sheets: apply same swap correction so teams are in seeded order
        const seededHome = seededHomeMap[fixture.ourId]
        const swapped = seededHome && fixture.homeTeam !== seededHome
        const correctedHomeScore = swapped ? fixture.score90Away : fixture.score90Home
        const correctedAwayScore = swapped ? fixture.score90Home : fixture.score90Away
        const correctedHomeTeam = swapped ? fixture.awayTeam : fixture.homeTeam
        const correctedAwayTeam = swapped ? fixture.homeTeam : fixture.awayTeam

        const cleanSheetTeams = []
        if (correctedHomeScore === 0) cleanSheetTeams.push(correctedAwayTeam)
        if (correctedAwayScore === 0) cleanSheetTeams.push(correctedHomeTeam)

        await db.collection('matchEvents').doc(docId).set({
          fixtureId: docId,
          homeTeam: correctedHomeTeam,
          awayTeam: correctedAwayTeam,
          date: fixture.date,
          goalScorers, assisters, yellowCards, redCards, cleanSheetTeams,
          startingGoalkeepers,
          fetchedAt: admin.firestore.FieldValue.serverTimestamp()
        })

        eventsUpdated++
        await new Promise(r => setTimeout(r, 250))
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
    const [fixturesSnap, predsSnap, tournPredsSnap, playersSnap, eventsSnap, squadsSnap, outcomesSnap] =
      await Promise.all([
        db.collection('fixtures').get(),
        db.collection('predictions').get(),
        db.collection('tournamentPredictions').get(),
        db.collection('players').get(),
        db.collection('matchEvents').get(),
        db.collection('meta').doc('squads').get(),
        db.collection('meta').doc('tournamentOutcomes').get(),
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
    const outcomes = outcomesSnap.exists ? outcomesSnap.data() : {}

    // Build goalie->team map
    const goalieTeamMap = {}
    if (squadsSnap.exists) {
      const squads = squadsSnap.data().players
      for (const [team, squad] of Object.entries(squads)) {
        for (const gk of (squad.goalkeepers || [])) {
          goalieTeamMap[gk.toLowerCase()] = team
        }
      }
    }

    const results = []
    const batch = db.batch()

    for (const player of players) {
      const playerPreds = predictions[player.id] || {}
      const tournPred = tournamentPredictions[player.id] || {}
      const { total, breakdown } = scorePlayer(player, playerPreds, tournPred, fixtures, matchEvents, goalieTeamMap, outcomes)
      batch.update(db.collection('players').doc(player.id), { totalPoints: total })
      results.push({ nickname: player.nickname, total, breakdown })
    }

    await batch.commit()
    return { success: true, results }
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
          const parsed = JSON.parse(data)
          resolve({ success: true, odds: parsed })
        } catch (e) {
          resolve({ success: false, odds: null })
        }
      })
    })
    req.on('error', () => resolve({ success: false, odds: null }))
    req.end()
  })
})
