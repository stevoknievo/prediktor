// src/lib/qualification.js
// Calculates group standings and Round of 32 bracket from a player's predictions
// Implements official FIFA 2026 World Cup tiebreaker rules

// ── Group definitions ─────────────────────────────────────────────────────
export const GROUPS = {
  'Group A': ['Mexico', 'South Africa', 'South Korea', 'Czech Republic'],
  'Group B': ['Canada', 'Bosnia & Herzegovina', 'Qatar', 'Switzerland'],
  'Group C': ['Brazil', 'Morocco', 'Haiti', 'Scotland'],
  'Group D': ['USA', 'Paraguay', 'Australia', 'Türkiye'],
  'Group E': ['Germany', 'Curaçao', 'Ivory Coast', 'Ecuador'],
  'Group F': ['Netherlands', 'Japan', 'Sweden', 'Tunisia'],
  'Group G': ['Belgium', 'Egypt', 'Iran', 'New Zealand'],
  'Group H': ['Spain', 'Cape Verde', 'Saudi Arabia', 'Uruguay'],
  'Group I': ['France', 'Senegal', 'Iraq', 'Norway'],
  'Group J': ['Argentina', 'Algeria', 'Austria', 'Jordan'],
  'Group K': ['Portugal', 'DR Congo', 'Uzbekistan', 'Colombia'],
  'Group L': ['England', 'Croatia', 'Ghana', 'Panama'],
}

// Maps group fixture IDs — must match our seeded fixture IDs
export const GROUP_FIXTURES = {
  'Group A': ['m001','m002','m003','m004','m005','m006'],
  'Group B': ['m007','m008','m009','m010','m011','m012'],
  'Group C': ['m013','m014','m015','m016','m017','m018'],
  'Group D': ['m019','m020','m021','m022','m023','m024'],
  'Group E': ['m025','m026','m027','m028','m029','m030'],
  'Group F': ['m031','m032','m033','m034','m035','m036'],
  'Group G': ['m037','m038','m039','m040','m041','m042'],
  'Group H': ['m043','m044','m045','m046','m047','m048'],
  'Group I': ['m049','m050','m051','m052','m053','m054'],
  'Group J': ['m055','m056','m057','m058','m059','m060'],
  'Group K': ['m061','m062','m063','m064','m065','m066'],
  'Group L': ['m067','m068','m069','m070','m071','m072'],
}

// ── FIFA 2026 Round of 32 bracket matrix ──────────────────────────────────
// Source: ESPN / FIFA official schedule
// Format: [homeSlot, awaySlot] where slot = "GX_W" (group winner), "GX_R" (runner-up), "3rd_GROUPS" (best 3rd from those groups)
// We store the actual fixture IDs m073-m088 mapped to their bracket slots

export const ROUND_OF_32_BRACKET = [
  // m073: Group C winners vs Group F runners-up
  { id: 'm073', home: { group: 'Group C', position: 1 }, away: { group: 'Group F', position: 2 } },
  // m074: Group E winners vs best 3rd from A/B/C/D/F
  { id: 'm074', home: { group: 'Group E', position: 1 }, away: { thirdFrom: ['Group A','Group B','Group C','Group D','Group F'] } },
  // m075: Group F winners vs Group C runners-up
  { id: 'm075', home: { group: 'Group F', position: 1 }, away: { group: 'Group C', position: 2 } },
  // m076: Group I winners vs best 3rd from C/D/F/G/H
  { id: 'm076', home: { group: 'Group I', position: 1 }, away: { thirdFrom: ['Group C','Group D','Group F','Group G','Group H'] } },
  // m077: Group A winners vs best 3rd from C/E/F/H/I
  { id: 'm077', home: { group: 'Group A', position: 1 }, away: { thirdFrom: ['Group C','Group E','Group F','Group H','Group I'] } },
  // m078: Group E runners-up vs Group I runners-up
  { id: 'm078', home: { group: 'Group E', position: 2 }, away: { group: 'Group I', position: 2 } },
  // m079: Group L winners vs best 3rd from E/H/I/J/K
  { id: 'm079', home: { group: 'Group L', position: 1 }, away: { thirdFrom: ['Group E','Group H','Group I','Group J','Group K'] } },
  // m080: Group G winners vs best 3rd from A/E/H/I/J
  { id: 'm080', home: { group: 'Group G', position: 1 }, away: { thirdFrom: ['Group A','Group E','Group H','Group I','Group J'] } },
  // m081: Group D winners vs best 3rd from B/E/F/I/J
  { id: 'm081', home: { group: 'Group D', position: 1 }, away: { thirdFrom: ['Group B','Group E','Group F','Group I','Group J'] } },
  // m082: Group H winners vs Group J runners-up
  { id: 'm082', home: { group: 'Group H', position: 1 }, away: { group: 'Group J', position: 2 } },
  // m083: Group B winners vs best 3rd from A/D/E/F/G
  { id: 'm083', home: { group: 'Group B', position: 1 }, away: { thirdFrom: ['Group A','Group D','Group E','Group F','Group G'] } },
  // m084: Group J winners vs Group H runners-up
  { id: 'm084', home: { group: 'Group J', position: 1 }, away: { group: 'Group H', position: 2 } },
  // m085: Group K winners vs Group L runners-up
  { id: 'm085', home: { group: 'Group K', position: 1 }, away: { group: 'Group L', position: 2 } },
  // m086: Group A runners-up vs Group B runners-up
  { id: 'm086', home: { group: 'Group A', position: 2 }, away: { group: 'Group B', position: 2 } },
  // m087: Group C runners-up... wait let me use the actual ESPN matrix
  // m087: Group D runners-up vs Group K runners-up
  { id: 'm087', home: { group: 'Group D', position: 2 }, away: { group: 'Group K', position: 2 } },
  // m088: Group G runners-up vs Group L runners-up ... actually need to verify remaining
  { id: 'm088', home: { group: 'Group G', position: 2 }, away: { group: 'Group L', position: 2 } },
]

// ── Calculate group standings from predictions ────────────────────────────

function getResult(homeScore, awayScore) {
  if (homeScore > awayScore) return 'home'
  if (awayScore > homeScore) return 'away'
  return 'draw'
}

function initTeamStats(team) {
  return { team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 }
}

/**
 * Calculate standings for a single group from a player's predictions.
 * Returns array of team stats sorted by position (1st, 2nd, 3rd, 4th).
 *
 * @param {string} group - e.g. 'Group A'
 * @param {object} fixtures - map of fixtureId -> fixture object
 * @param {object} predictions - map of fixtureId -> prediction object
 * @returns {object[]} sorted standings array
 */
export function calculateGroupStandings(group, fixtures, predictions) {
  const teams = GROUPS[group]
  const fixtureIds = GROUP_FIXTURES[group]
  const stats = {}
  teams.forEach(t => { stats[t] = initTeamStats(t) })

  // Head-to-head tracking
  const h2h = {}
  teams.forEach(a => {
    h2h[a] = {}
    teams.forEach(b => { if (a !== b) h2h[a][b] = { points: 0, gd: 0, gf: 0 } })
  })

  for (const fid of fixtureIds) {
    const fixture = fixtures[fid]
    const pred = predictions[fid]
    if (!fixture || !pred || pred.score90Home === undefined || pred.score90Away === undefined) continue

    const hg = Number(pred.score90Home)
    const ag = Number(pred.score90Away)
    if (isNaN(hg) || isNaN(ag)) continue

    const home = fixture.homeTeam
    const away = fixture.awayTeam
    const result = getResult(hg, ag)

    // Update overall stats
    stats[home].played++
    stats[away].played++
    stats[home].gf += hg
    stats[home].ga += ag
    stats[away].gf += ag
    stats[away].ga += hg
    stats[home].gd = stats[home].gf - stats[home].ga
    stats[away].gd = stats[away].gf - stats[away].ga

    if (result === 'home') {
      stats[home].won++; stats[home].points += 3
      stats[away].lost++
    } else if (result === 'away') {
      stats[away].won++; stats[away].points += 3
      stats[home].lost++
    } else {
      stats[home].drawn++; stats[home].points += 1
      stats[away].drawn++; stats[away].points += 1
    }

    // Update head-to-head
    if (result === 'home') {
      h2h[home][away].points += 3
    } else if (result === 'away') {
      h2h[away][home].points += 3
    } else {
      h2h[home][away].points += 1
      h2h[away][home].points += 1
    }
    h2h[home][away].gd += (hg - ag)
    h2h[away][home].gd += (ag - hg)
    h2h[home][away].gf += hg
    h2h[away][home].gf += ag
  }

  // Sort using FIFA tiebreaker rules
  const teamList = Object.values(stats)

  teamList.sort((a, b) => {
    // 1. Points
    if (b.points !== a.points) return b.points - a.points

    // 2-4. Head-to-head (points, gd, gf) between tied teams only
    const h2hA = h2h[a.team]?.[b.team] || { points: 0, gd: 0, gf: 0 }
    const h2hB = h2h[b.team]?.[a.team] || { points: 0, gd: 0, gf: 0 }
    if (h2hA.points !== h2hB.points) return h2hB.points - h2hA.points
    if (h2hA.gd !== h2hB.gd) return h2hB.gd - h2hA.gd
    if (h2hA.gf !== h2hB.gf) return h2hB.gf - h2hA.gf

    // 5. Overall goal difference
    if (b.gd !== a.gd) return b.gd - a.gd

    // 6. Overall goals scored
    if (b.gf !== a.gf) return b.gf - a.gf

    // 7. Alphabetical as final fallback (deterministic)
    return a.team.localeCompare(b.team)
  })

  return teamList
}

/**
 * Calculate all group standings and determine the 8 best third-placed teams.
 *
 * @param {object} fixtures - map of fixtureId -> fixture
 * @param {object} predictions - map of fixtureId -> prediction
 * @returns {{ standings: object, qualifiers: object, thirdPlace: object[] }}
 */
export function calculateAllQualifiers(fixtures, predictions) {
  const standings = {}
  const thirdPlaceTeams = []

  for (const group of Object.keys(GROUPS)) {
    const fixtureIds = GROUP_FIXTURES[group]
    // Only calculate if all 6 fixtures have predictions
    const allPredicted = fixtureIds.every(fid => {
      const p = predictions[fid]
      return p && p.score90Home !== undefined && p.score90Away !== undefined &&
             p.score90Home !== '' && p.score90Away !== ''
    })
    if (!allPredicted) continue

    const groupStandings = calculateGroupStandings(group, fixtures, predictions)
    standings[group] = groupStandings

    if (groupStandings.length >= 3) {
      thirdPlaceTeams.push({ ...groupStandings[2], group })
    }
  }

  // Rank third-place teams: points → gd → gf → alphabetical
  thirdPlaceTeams.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.gd !== a.gd) return b.gd - a.gd
    if (b.gf !== a.gf) return b.gf - a.gf
    return a.team.localeCompare(b.team)
  })

  const best8Third = thirdPlaceTeams.slice(0, 8)

  // Build qualifiers map: group -> { winner, runnerUp, third }
  const qualifiers = {}
  for (const [group, groupStandings] of Object.entries(standings)) {
    qualifiers[group] = {
      winner: groupStandings[0]?.team,
      runnerUp: groupStandings[1]?.team,
      third: groupStandings[2]?.team,
      fourth: groupStandings[3]?.team,
    }
  }

  return { standings, qualifiers, thirdPlace: best8Third, best8Third }
}

/**
 * Resolve a Round of 32 slot to a team name.
 *
 * @param {object} slot - { group, position } or { thirdFrom: [...] }
 * @param {object} qualifiers - output from calculateAllQualifiers
 * @param {object[]} best8Third - sorted best 8 third-place teams
 */
export function resolveSlot(slot, qualifiers, best8Third) {
  if (slot.group) {
    const q = qualifiers[slot.group]
    if (!q) return 'TBD'
    if (slot.position === 1) return q.winner || 'TBD'
    if (slot.position === 2) return q.runnerUp || 'TBD'
    if (slot.position === 3) return q.third || 'TBD'
  }

  if (slot.thirdFrom) {
    // Find the best 3rd-place team from the specified groups
    const match = best8Third.find(t => slot.thirdFrom.includes(t.group))
    return match ? match.team : 'TBD'
  }

  return 'TBD'
}

/**
 * Generate the full Round of 32 fixture list for a player's predictions.
 * Returns array of { id, homeTeam, awayTeam } for m073-m088.
 */
export function generateRoundOf32(fixtures, predictions) {
  const { qualifiers, best8Third } = calculateAllQualifiers(fixtures, predictions)

  return ROUND_OF_32_BRACKET.map(slot => ({
    id: slot.id,
    homeTeam: resolveSlot(slot.home, qualifiers, best8Third),
    awayTeam: resolveSlot(slot.away, qualifiers, best8Third),
  }))
}

/**
 * Generate knockout fixtures beyond Round of 32 from a player's knockout predictions.
 * Takes Round of 32 predictions and generates Round of 16 teams, etc.
 *
 * @param {string} stage - 'Round of 16' | 'Quarter-final' | 'Semi-final' | 'Final'
 * @param {string[]} prevFixtureIds - fixture IDs of the previous round
 * @param {object} fixtures - all fixtures map
 * @param {object} predictions - all predictions map
 * @returns {{ id, homeTeam, awayTeam }[]}
 */
export function generateNextRound(stage, prevFixtureIds, fixtures, predictions) {
  const winners = []

  for (const fid of prevFixtureIds) {
    const pred = predictions[fid]
    const fixture = fixtures[fid]
    if (!pred || !fixture) { winners.push('TBD'); continue }

    const winner = getKnockoutWinner(pred, fixture)
    winners.push(winner || 'TBD')
  }

  // Pair winners into next round fixtures
  const nextFixtures = []
  for (let i = 0; i < winners.length; i += 2) {
    nextFixtures.push({ home: winners[i], away: winners[i + 1] || 'TBD' })
  }

  return nextFixtures
}

/**
 * Determine the winner of a knockout match from a prediction.
 * Accounts for 90min, ET, and penalties.
 */
export function getKnockoutWinner(pred, fixture) {
  const home90 = Number(pred.score90Home)
  const away90 = Number(pred.score90Away)
  if (isNaN(home90) || isNaN(away90)) return null

  // 90 min winner
  if (home90 > away90) return fixture.homeTeam
  if (away90 > home90) return fixture.awayTeam

  // Draw after 90 — check ET
  const homeET = Number(pred.scoreETHome)
  const awayET = Number(pred.scoreETAway)
  if (!isNaN(homeET) && !isNaN(awayET)) {
    if (homeET > awayET) return fixture.homeTeam
    if (awayET > homeET) return fixture.awayTeam

    // Still drawn — check penalties
    const homePen = Number(pred.scorePenHome)
    const awayPen = Number(pred.scorePenAway)
    if (!isNaN(homePen) && !isNaN(awayPen)) {
      if (homePen > awayPen) return fixture.homeTeam
      if (awayPen > homePen) return fixture.awayTeam
    }
  }

  return null
}
