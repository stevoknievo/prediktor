// src/lib/qualification.js v3
// CORRECT bracket based on official FIFA schedule (verified against Hermann Baum spreadsheet)
// R32 fixture numbers match our seeded fixture IDs m073-m088

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

// ── Official R32 bracket (verified from FIFA schedule) ────────────────────
// m073 = FIFA match 73: 2A vs 2B
// m074 = FIFA match 74: 1E vs 3-ABCDF
// m075 = FIFA match 75: 1F vs 2C
// m076 = FIFA match 76: 1C vs 2F
// m077 = FIFA match 77: 1I vs 3-CDFGH
// m078 = FIFA match 78: 2E vs 2I
// m079 = FIFA match 79: 1A vs 3-CEFHI
// m080 = FIFA match 80: 1L vs 3-EHIJK
// m081 = FIFA match 81: 1D vs 3-BEFIJ
// m082 = FIFA match 82: 1G vs 3-AEHIJ
// m083 = FIFA match 83: 2K vs 2L
// m084 = FIFA match 84: 1H vs 2J
// m085 = FIFA match 85: 1B vs 3-EFGIJ
// m086 = FIFA match 86: 1J vs 2H
// m087 = FIFA match 87: 1K vs 3-DEIJL
// m088 = FIFA match 88: 2D vs 2G

// ── Group standings calculation ───────────────────────────────────────────

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

// ── Third place assignment (FIFA Annex C) ─────────────────────────────────
// Each slot has a pool of groups whose 3rd place team can fill it.
// Corrected pools from official schedule.

const THIRD_PLACE_SLOTS = [
  { fixture: 'm074', pool: ['Group A','Group B','Group C','Group D','Group F'] },
  { fixture: 'm077', pool: ['Group C','Group D','Group F','Group G','Group H'] },
  { fixture: 'm079', pool: ['Group C','Group E','Group F','Group H','Group I'] },
  { fixture: 'm080', pool: ['Group E','Group H','Group I','Group J','Group K'] },
  { fixture: 'm081', pool: ['Group B','Group E','Group F','Group I','Group J'] },
  { fixture: 'm082', pool: ['Group A','Group E','Group H','Group I','Group J'] },
  { fixture: 'm085', pool: ['Group E','Group F','Group G','Group I','Group J'] },
  { fixture: 'm087', pool: ['Group D','Group E','Group I','Group J','Group L'] },
]

export function assignThirdPlaceTeams(best8Third) {
  const qualifiedGroups = new Set(best8Third.map(t => t.group))
  const teamByGroup = {}
  best8Third.forEach(t => { teamByGroup[t.group] = t.team })

  // Sort slots by number of eligible groups ascending (most constrained first)
  const sortedSlots = [...THIRD_PLACE_SLOTS].sort((a, b) => {
    const aElig = a.pool.filter(g => qualifiedGroups.has(g)).length
    const bElig = b.pool.filter(g => qualifiedGroups.has(g)).length
    return aElig - bElig
  })

  const assignments = {}
  const usedGroups = new Set()

  for (const slot of sortedSlots) {
    const eligible = slot.pool.filter(g => qualifiedGroups.has(g) && !usedGroups.has(g))
    if (eligible.length > 0) {
      // Pick the highest ranked eligible (best8Third is sorted by rank)
      const bestGroup = best8Third.find(t => eligible.includes(t.group))?.group
      if (bestGroup) {
        assignments[slot.fixture] = teamByGroup[bestGroup]
        usedGroups.add(bestGroup)
      }
    }
  }

  return assignments
}

// ── Generate Round of 32 ──────────────────────────────────────────────────

export function generateRoundOf32(fixtures, predictions) {
  const { qualifiers, best8Third } = calculateAllQualifiers(fixtures, predictions)
  const tp = assignThirdPlaceTeams(best8Third)

  const w = (group, pos) => {
    const q = qualifiers[group]
    if (!q) return 'TBD'
    return (pos === 1 ? q.winner : q.runnerUp) || 'TBD'
  }

  return [
    { id: 'm073', homeTeam: w('Group A', 2), awayTeam: w('Group B', 2) },
    { id: 'm074', homeTeam: w('Group E', 1), awayTeam: tp['m074'] || 'TBD' },
    { id: 'm075', homeTeam: w('Group F', 1), awayTeam: w('Group C', 2) },
    { id: 'm076', homeTeam: w('Group C', 1), awayTeam: w('Group F', 2) },
    { id: 'm077', homeTeam: w('Group I', 1), awayTeam: tp['m077'] || 'TBD' },
    { id: 'm078', homeTeam: w('Group E', 2), awayTeam: w('Group I', 2) },
    { id: 'm079', homeTeam: w('Group A', 1), awayTeam: tp['m079'] || 'TBD' },
    { id: 'm080', homeTeam: w('Group L', 1), awayTeam: tp['m080'] || 'TBD' },
    { id: 'm081', homeTeam: w('Group D', 1), awayTeam: tp['m081'] || 'TBD' },
    { id: 'm082', homeTeam: w('Group G', 1), awayTeam: tp['m082'] || 'TBD' },
    { id: 'm083', homeTeam: w('Group K', 2), awayTeam: w('Group L', 2) },
    { id: 'm084', homeTeam: w('Group H', 1), awayTeam: w('Group J', 2) },
    { id: 'm085', homeTeam: w('Group B', 1), awayTeam: tp['m085'] || 'TBD' },
    { id: 'm086', homeTeam: w('Group J', 1), awayTeam: w('Group H', 2) },
    { id: 'm087', homeTeam: w('Group K', 1), awayTeam: tp['m087'] || 'TBD' },
    { id: 'm088', homeTeam: w('Group D', 2), awayTeam: w('Group G', 2) },
  ]
}

// ── Knockout winner helper ────────────────────────────────────────────────

export function getKnockoutWinner(pred, fixture) {
  const h90 = Number(pred.score90Home)
  const a90 = Number(pred.score90Away)
  if (isNaN(h90) || isNaN(a90) || pred.score90Home === '' || pred.score90Away === '') return null

  if (h90 > a90) return fixture.homeTeam
  if (a90 > h90) return fixture.awayTeam

  const hET = Number(pred.scoreETHome)
  const aET = Number(pred.scoreETAway)
  if (!isNaN(hET) && !isNaN(aET) && pred.scoreETHome !== '' && pred.scoreETAway !== '') {
    if (hET > aET) return fixture.homeTeam
    if (aET > hET) return fixture.awayTeam

    const hPen = Number(pred.scorePenHome)
    const aPen = Number(pred.scorePenAway)
    if (!isNaN(hPen) && !isNaN(aPen) && pred.scorePenHome !== '' && pred.scorePenAway !== '') {
      if (hPen > aPen) return fixture.homeTeam
      if (aPen > hPen) return fixture.awayTeam
    }
  }

  return null
}
