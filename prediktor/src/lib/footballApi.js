// src/lib/footballApi.js
// API-Football integration (api-football.com / rapidapi.com)
// Free tier: 100 requests/day — sufficient for World Cup sync
//
// Sign up at: https://www.api-football.com/
// Set VITE_FOOTBALL_API_KEY in your .env file

const API_KEY = import.meta.env.VITE_FOOTBALL_API_KEY
const BASE_URL = 'https://v3.football.api-sports.io'

// FIFA World Cup 2026 league ID = 1 (FIFA World Cup), season = 2026
const WC_LEAGUE_ID = 1
const WC_SEASON = 2026

async function apiFetch(endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'x-apisports-key': API_KEY
    }
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

/**
 * Fetch all World Cup 2026 fixtures
 */
export async function fetchFixtures() {
  const data = await apiFetch(`/fixtures?league=${WC_LEAGUE_ID}&season=${WC_SEASON}`)
  return data.response.map(normalizeFixture)
}

/**
 * Fetch a single fixture by ID
 */
export async function fetchFixture(fixtureId) {
  const data = await apiFetch(`/fixtures?id=${fixtureId}`)
  return normalizeFixture(data.response[0])
}

/**
 * Fetch standings / group stage table
 */
export async function fetchStandings() {
  const data = await apiFetch(`/standings?league=${WC_LEAGUE_ID}&season=${WC_SEASON}`)
  return data.response
}

/**
 * Fetch top scorers
 */
export async function fetchTopScorers() {
  const data = await apiFetch(`/players/topscorers?league=${WC_LEAGUE_ID}&season=${WC_SEASON}`)
  return data.response
}

/**
 * Normalize fixture from API shape to our internal shape
 */
function normalizeFixture(f) {
  const fixture = f.fixture
  const teams = f.teams
  const goals = f.goals
  const score = f.score

  const isKnockout = ['Round of 32', 'Round of 16', 'Quarter-finals', 'Semi-finals', 'Final', '3rd Place Final'].includes(f.league?.round)

  return {
    id: String(fixture.id),
    date: fixture.date,
    status: fixture.status?.short, // NS, 1H, HT, 2H, FT, AET, PEN
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

    // 90 min scores
    score90Home: goals?.home ?? null,
    score90Away: goals?.away ?? null,

    // Extra time scores (cumulative after ET)
    scoreAfterETHome: score?.extratime?.home ?? null,
    scoreAfterETAway: score?.extratime?.away ?? null,

    // Penalty scores
    scorePenHome: score?.penalty?.home ?? null,
    scorePenAway: score?.penalty?.away ?? null,
  }
}

/**
 * Fetch fixture events (goals, assists, cards) for player stats scoring
 */
export async function fetchFixtureEvents(fixtureId) {
  const data = await apiFetch(`/fixtures/events?fixture=${fixtureId}`)
  const events = data.response

  const goalScorers = []
  const assisters = []
  const cards = { yellow: [], red: [] }

  for (const e of events) {
    if (e.type === 'Goal' && e.detail !== 'Own Goal') {
      if (e.player?.name) goalScorers.push(e.player.name)
      if (e.assist?.name) assisters.push(e.assist.name)
    }
    if (e.type === 'Card') {
      if (e.detail === 'Yellow Card') cards.yellow.push({ player: e.player?.name, team: e.team?.name })
      if (e.detail === 'Red Card') cards.red.push({ player: e.player?.name, team: e.team?.name })
    }
  }

  return { goalScorers, assisters, cards }
}
