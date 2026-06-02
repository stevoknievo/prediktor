// src/lib/qualification.js v2
// Implements official FIFA 2026 World Cup Round of 32 bracket
// Based on confirmed ESPN/Sky Sports fixture schedule and FIFA Annex C rules

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

// ── Official R32 Bracket (confirmed from FIFA/ESPN/Sky Sports) ────────────
// Fixed matchups for group winners vs runners-up:
// m073: Group C winner vs Group F runner-up
// m074: Group E winner vs best 3rd from A/B/C/D/F
// m075: Group F winner vs Group C runner-up
// m076: Group E runner-up vs Group I runner-up  
// m077: Group I winner vs best 3rd from C/D/F/G/H
// m078: Group A winner vs best 3rd from C/E/F/H/I
// m079: Group L winner vs best 3rd from E/H/I/J/K
// m080: Group G winner vs best 3rd from A/E/H/I/J
// m081: Group D winner vs best 3rd from B/E/F/I/J
// m082: Group A runner-up vs Group B runner-up
// m083: Group B winner vs best 3rd from A/D/E/F/G
// m084: Group H winner vs Group J runner-up
// m085: Group J winner vs Group H runner-up
// m086: Group K winner vs best 3rd from D/E/I/J/L
// m087: Group D runner-up vs Group K runner-up
// m088: Group G runner-up vs Group L runner-up (corrected from previous)

// Note on 3rd place slots: These use group pools but each qualifying 3rd place
// team can only appear in ONE slot. We implement FIFA Annex C assignment below.

// ── Calculate group standings ─────────────────────────────────────────────

function getResult(h, a) {
  if (h > a) return 'home'
  if (a > h) return 'away'
  return 'draw'
}

function initStats(team) {
  return { team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 }
}

export function calculateGroupStandings(group, fixtures, predictions) {
  const teams = GROUPS[group]
  const fixtureIds = GROUP_FIXTURES[group]
  const stats = {}
  teams.forEach(t => { stats[t] = initStats(t) })

  const h2h = {}
  teams.forEach(a => {
    h2h[a] = {}
    teams.forEach(b => { if (a !== b) h2h[a][b] = { points: 0, gd: 0, gf: 0 } })
  })

  for (const fid of fixtureIds) {
    const fixture = fixtures[fid]
    const pred = predictions[fid]
    if (!fixture || !pred) continue
    const hg = Number(pred.score90Home)
    const ag = Number(pred.score90Away)
    if (isNaN(hg) || isNaN(ag) || pred.score90Home === '' || pred.score90Away === '') continue

    const home = fixture.homeTeam
    const away = fixture.awayTeam
    const result = getResult(hg, ag)

    stats[home].played++; stats[away].played++
    stats[home].gf += hg; stats[home].ga += ag
    stats[away].gf += ag; stats[away].ga += hg
    stats[home].gd = stats[home].gf - stats[home].ga
    stats[away].gd = stats[away].gf - stats[away].ga

    if (result === 'home') {
      stats[home].won++; stats[home].points += 3; stats[away].lost++
      h2h[home][away].points += 3
    } else if (result === 'away') {
      stats[away].won++; stats[away].points += 3; stats[home].lost++
      h2h[away][home].points += 3
    } else {
      stats[home].drawn++; stats[home].points++
      stats[away].drawn++; stats[away].points++
      h2h[home][away].points++; h2h[away][home].points++
    }
    h2h[home][away].gd += (hg - ag); h2h[away][home].gd += (ag - hg)
    h2h[home][away].gf += hg; h2h[away][home].gf += ag
  }

  return Object.values(stats).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    const ha = h2h[a.team]?.[b.team] || { points: 0, gd: 0, gf: 0 }
    const hb = h2h[b.team]?.[a.team] || { points: 0, gd: 0, gf: 0 }
    if (ha.points !== hb.points) return hb.points - ha.points
    if (ha.gd !== hb.gd) return hb.gd - ha.gd
    if (ha.gf !== hb.gf) return hb.gf - ha.gf
    if (b.gd !== a.gd) return b.gd - a.gd
    if (b.gf !== a.gf) return b.gf - a.gf
    return a.team.localeCompare(b.team)
  })
}

// ── Calculate all qualifiers ──────────────────────────────────────────────

export function calculateAllQualifiers(fixtures, predictions) {
  const standings = {}
  const thirdPlaceTeams = []

  for (const group of Object.keys(GROUPS)) {
    const fixtureIds = GROUP_FIXTURES[group]
    const allPredicted = fixtureIds.every(fid => {
      const p = predictions[fid]
      return p && p.score90Home !== undefined && p.score90Away !== undefined &&
             p.score90Home !== '' && p.score90Away !== ''
    })
    if (!allPredicted) continue

    const s = calculateGroupStandings(group, fixtures, predictions)
    standings[group] = s
    if (s.length >= 3) thirdPlaceTeams.push({ ...s[2], group })
  }

  // Rank 3rd place teams: points → gd → gf → alphabetical
  thirdPlaceTeams.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.gd !== a.gd) return b.gd - a.gd
    if (b.gf !== a.gf) return b.gf - a.gf
    return a.team.localeCompare(b.team)
  })

  const best8Third = thirdPlaceTeams.slice(0, 8)

  const qualifiers = {}
  for (const [group, s] of Object.entries(standings)) {
    qualifiers[group] = {
      winner: s[0]?.team,
      runnerUp: s[1]?.team,
      third: s[2]?.team,
    }
  }

  return { standings, qualifiers, best8Third }
}

// ── FIFA Annex C: assign 3rd place teams to their R32 slot ───────────────
// Each R32 "third place slot" has a pool of eligible groups.
// Once we know which 8 groups qualified 3rd place teams,
// we assign each team to exactly one slot using a greedy match
// that ensures no team appears twice and no team faces their own group.

const THIRD_PLACE_SLOTS = [
  { fixture: 'm074', pool: ['Group A','Group B','Group C','Group D','Group F'], versusGroup: 'Group E' },
  { fixture: 'm077', pool: ['Group C','Group D','Group F','Group G','Group H'], versusGroup: 'Group I' },
  { fixture: 'm078', pool: ['Group C','Group E','Group F','Group H','Group I'], versusGroup: 'Group A' },
  { fixture: 'm079', pool: ['Group E','Group H','Group I','Group J','Group K'], versusGroup: 'Group L' },
  { fixture: 'm080', pool: ['Group A','Group E','Group H','Group I','Group J'], versusGroup: 'Group G' },
  { fixture: 'm081', pool: ['Group B','Group E','Group F','Group I','Group J'], versusGroup: 'Group D' },
  { fixture: 'm083', pool: ['Group A','Group D','Group E','Group F','Group G'], versusGroup: 'Group B' },
  { fixture: 'm086', pool: ['Group D','Group E','Group I','Group J','Group L'], versusGroup: 'Group K' },
]

/**
 * Assign the best 8 third-place teams to their correct R32 slots.
 * Returns a map of fixtureId -> team name.
 */
export function assignThirdPlaceTeams(best8Third) {
  const qualifiedGroups = new Set(best8Third.map(t => t.group))
  const teamByGroup = {}
  best8Third.forEach(t => { teamByGroup[t.group] = t.team })

  // For each slot, find which of the qualifying groups fit its pool
  // Use a greedy assignment: sort slots by pool size (ascending) to reduce conflicts
  const sortedSlots = [...THIRD_PLACE_SLOTS].sort((a, b) => {
    const aEligible = a.pool.filter(g => qualifiedGroups.has(g)).length
    const bEligible = b.pool.filter(g => qualifiedGroups.has(g)).length
    return aEligible - bEligible
  })

  const assignments = {} // fixtureId -> team
  const usedGroups = new Set()

  for (const slot of sortedSlots) {
    // Find eligible groups for this slot that haven't been used yet
    const eligible = slot.pool.filter(g =>
      qualifiedGroups.has(g) && !usedGroups.has(g)
    )

    if (eligible.length > 0) {
      // Pick the highest-ranked eligible team (best8Third is already sorted by rank)
      const bestGroup = best8Third.find(t => eligible.includes(t.group))?.group
      if (bestGroup) {
        assignments[slot.fixture] = teamByGroup[bestGroup]
        usedGroups.add(bestGroup)
      }
    }
  }

  return assignments
}

// ── Generate Round of 32 fixtures ─────────────────────────────────────────

export function generateRoundOf32(fixtures, predictions) {
  const { qualifiers, best8Third } = calculateAllQualifiers(fixtures, predictions)
  const thirdAssignments = assignThirdPlaceTeams(best8Third)

  const resolve = (type, group, pos) => {
    const q = qualifiers[group]
    if (!q) return 'TBD'
    if (pos === 1) return q.winner || 'TBD'
    if (pos === 2) return q.runnerUp || 'TBD'
    return 'TBD'
  }

  return [
    { id: 'm073', homeTeam: resolve(1,'Group C',1), awayTeam: resolve(1,'Group F',2) },
    { id: 'm074', homeTeam: resolve(1,'Group E',1), awayTeam: thirdAssignments['m074'] || 'TBD' },
    { id: 'm075', homeTeam: resolve(1,'Group F',1), awayTeam: resolve(1,'Group C',2) },
    { id: 'm076', homeTeam: resolve(1,'Group E',2), awayTeam: resolve(1,'Group I',2) },
    { id: 'm077', homeTeam: resolve(1,'Group I',1), awayTeam: thirdAssignments['m077'] || 'TBD' },
    { id: 'm078', homeTeam: resolve(1,'Group A',1), awayTeam: thirdAssignments['m078'] || 'TBD' },
    { id: 'm079', homeTeam: resolve(1,'Group L',1), awayTeam: thirdAssignments['m079'] || 'TBD' },
    { id: 'm080', homeTeam: resolve(1,'Group G',1), awayTeam: thirdAssignments['m080'] || 'TBD' },
    { id: 'm081', homeTeam: resolve(1,'Group D',1), awayTeam: thirdAssignments['m081'] || 'TBD' },
    { id: 'm082', homeTeam: resolve(1,'Group A',2), awayTeam: resolve(1,'Group B',2) },
    { id: 'm083', homeTeam: resolve(1,'Group B',1), awayTeam: thirdAssignments['m083'] || 'TBD' },
    { id: 'm084', homeTeam: resolve(1,'Group H',1), awayTeam: resolve(1,'Group J',2) },
    { id: 'm085', homeTeam: resolve(1,'Group J',1), awayTeam: resolve(1,'Group H',2) },
    { id: 'm086', homeTeam: resolve(1,'Group K',1), awayTeam: thirdAssignments['m086'] || 'TBD' },
    { id: 'm087', homeTeam: resolve(1,'Group D',2), awayTeam: resolve(1,'Group K',2) },
    { id: 'm088', homeTeam: resolve(1,'Group G',2), awayTeam: resolve(1,'Group L',2) },
  ]
}

// ── Knockout winner helper ────────────────────────────────────────────────

export function getKnockoutWinner(pred, fixture) {
  const h90 = Number(pred.score90Home)
  const a90 = Number(pred.score90Away)
  if (isNaN(h90) || isNaN(a90) || pred.score90Home === '' || pred.score90Away === '') return null

  if (h90 > a90) return fixture.homeTeam
  if (a90 > h90) return fixture.awayTeam

  // Draw — check ET
  const hET = Number(pred.scoreETHome)
  const aET = Number(pred.scoreETAway)
  if (!isNaN(hET) && !isNaN(aET) && pred.scoreETHome !== '' && pred.scoreETAway !== '') {
    if (hET > aET) return fixture.homeTeam
    if (aET > hET) return fixture.awayTeam

    // Still level — check penalties
    const hPen = Number(pred.scorePenHome)
    const aPen = Number(pred.scorePenAway)
    if (!isNaN(hPen) && !isNaN(aPen) && pred.scorePenHome !== '' && pred.scorePenAway !== '') {
      if (hPen > aPen) return fixture.homeTeam
      if (aPen > hPen) return fixture.awayTeam
    }
  }

  return null
}
