// functions/index.js v3
// Firebase Cloud Function — proxies API-Football calls server-side
// avoiding CORS issues from the browser
//
// Deploy with: firebase deploy --only functions
// (handled automatically by GitHub Actions)

const functions = require('firebase-functions')
const admin = require('firebase-admin')
const https = require('https')

admin.initializeApp()
const db = admin.firestore()

const WC_LEAGUE_ID = 1
const WC_SEASON = 2026

function apiFetch(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'v3.football.api-sports.io',
      path,
      method: 'GET',
      headers: { 'x-apisports-key': functions.config().football.api_key }
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

// HTTP function — called from Admin panel
exports.syncFixtures = functions.https.onCall(async (data, context) => {
  try {
    const result = await apiFetch(`/fixtures?league=${WC_LEAGUE_ID}&season=${WC_SEASON}`)

    if (!result.response || result.response.length === 0) {
      return { success: false, count: 0, message: 'No fixtures returned from API' }
    }

    const fixtures = result.response.map(normalizeFixture)
    const batch = db.batch()

    for (const f of fixtures) {
      // Only update score/status fields for existing fixtures to preserve our seeded data
      const ref = db.collection('fixtures').doc(f.id)
      batch.set(ref, f, { merge: true })
    }

    await batch.commit()
    return { success: true, count: fixtures.length }
  } catch (err) {
    console.error('syncFixtures error:', err)
    return { success: false, message: err.message }
  }
})

// ── Scout Report functions (v2) ───────────────────────────────────────────

/**
 * Fetch tournament winner odds from The Odds API
 */
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
            json[0].bookmakers[0].markets[0].outcomes.forEach(o => {
              odds[o.name] = o.price
            })
          }
          resolve({ success: true, odds })
        } catch (e) {
          resolve({ success: false, odds: null })
        }
      })
    })
    req.on('error', () => resolve({ success: false, odds: null }))
    req.end()
  })
})

/**
 * Generate scout report via Anthropic API
 */
exports.generateScoutReport = functions.https.onCall(async (data, context) => {
  const secretDoc = await db.collection('meta').doc('secrets').get()
const anthropicKey = secretDoc.data()?.anthropicKey
if (!anthropicKey) {
  return { success: false, error: 'Anthropic API key not configured' }
}

  let { prompt } = data
prompt = prompt.replace('To be provided by the server', oddsText)
  if (!prompt) return { success: false, error: 'No prompt provided' }

  // Fetch odds server-side to avoid CORS
  let oddsText = 'Odds unavailable'
  try {
    const oddsDoc = await db.collection('meta').doc('secrets').get()
    const oddsKey = oddsDoc.data()?.oddsApiKey
    if (oddsKey) {
      const oddsResult = await new Promise((resolve) => {
        const oddsOptions = {
          hostname: 'api.the-odds-api.com',
          path: `/v4/sports/soccer_fifa_world_cup_winner/odds/?apiKey=${oddsKey}&regions=uk&markets=outrights&oddsFormat=decimal`,
          method: 'GET',
        }
        const req = https.request(oddsOptions, res => {
          let d = ''
          res.on('data', chunk => { d += chunk })
          res.on('end', () => {
            try {
              const json = JSON.parse(d)
              const outcomes = json?.[0]?.bookmakers?.[0]?.markets?.[0]?.outcomes || []
              resolve(outcomes.slice(0, 15).map(o => `${o.name}: ${o.price}`).join(', '))
            } catch { resolve('Odds unavailable') }
          })
        })
        req.on('error', () => resolve('Odds unavailable'))
        req.end()
      })
      oddsText = oddsResult
    }
  } catch { oddsText = 'Odds unavailable' }

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
    resolve({ success: false, error: json.error?.message || 'No content in response', raw: responseData.substring(0, 200) })
  }
} catch (e) {
  console.error('Parse error:', e.message, responseData.substring(0, 200))
  resolve({ success: false, error: e.message })
}
      })
    })
    req.on('error', e => resolve({ success: false, error: e.message }))
    req.write(body)
    req.end()
  })
})
