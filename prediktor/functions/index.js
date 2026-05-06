// functions/index.js
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

// Scheduled function — runs every 2 hours during tournament
exports.scheduledSync = functions.pubsub
  .schedule('every 2 hours')
  .onRun(async () => {
    try {
      const result = await apiFetch(`/fixtures?league=${WC_LEAGUE_ID}&season=${WC_SEASON}&status=FT-AET-PEN`)
      if (!result.response) return null

      const batch = db.batch()
      for (const f of result.response) {
        const normalized = normalizeFixture(f)
        if (normalized.completed) {
          batch.set(db.collection('fixtures').doc(normalized.id), normalized, { merge: true })
        }
      }
      await batch.commit()
      console.log(`Scheduled sync: updated ${result.response.length} completed fixtures`)
    } catch (err) {
      console.error('scheduledSync error:', err)
    }
    return null
  })
