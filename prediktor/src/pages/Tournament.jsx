// src/pages/Tournament.jsx
import { useState, useEffect, useRef } from 'react'
import { saveTournamentPrediction, getTournamentPrediction, getDeadline } from '../lib/db'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'

const WC2026_TEAMS = [
  'Algeria','Argentina','Australia','Austria','Belgium',
  'Bosnia & Herzegovina','Brazil','Canada','Cape Verde',
  'Colombia','Croatia','Curaçao','Czech Republic','DR Congo',
  'Ecuador','Egypt','England','France','Germany','Ghana',
  'Haiti','Iran','Iraq','Ivory Coast','Japan','Jordan',
  'Mexico','Morocco','Netherlands','New Zealand','Nigeria','Norway',
  'Panama','Paraguay','Poland','Portugal','Qatar','Saudi Arabia',
  'Senegal','Scotland','South Africa','South Korea','Spain',
  'Sweden','Switzerland','Tunisia','Türkiye','Ukraine','Uruguay',
  'USA','Uzbekistan'
].sort()

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
  if (pLast.length > 5 && pLast === aLast) return true  // min 6 chars to avoid false positives
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

function calcPlayerStats(matchEvents, goalieTeamMap) {
  // Returns { playerName -> { goals, assists, cleanSheets } }
  const stats = {}
  const ensure = name => { if (!stats[name]) stats[name] = { goals: 0, assists: 0, cleanSheets: 0 } }
  for (const events of Object.values(matchEvents)) {
    for (const s of (events.goalScorers || [])) { ensure(s); stats[s].goals++ }
    for (const a of (events.assisters || [])) { ensure(a); stats[a].assists++ }
    const startingGKNames = (events.startingGoalkeepers || []).map(g => g.name)
    for (const team of (events.cleanSheetTeams || [])) {
      for (const [gkName, gkTeam] of Object.entries(goalieTeamMap)) {
        if (gkTeam === team) {
          if (startingGKNames.length === 0) {
            ensure(gkName); stats[gkName].cleanSheets++
          } else {
            // Check if this GK started — always store under squad name (gkName) for consistent lookup
            const started = startingGKNames.some(n => namesMatch(gkName, n))
            if (started) { ensure(gkName); stats[gkName].cleanSheets++ }
          }
        }
      }
    }
  }
  return stats
}

function PlayerSearch({ value, onChange, placeholder, players, disabled }) {
  const [query, setQuery] = useState(value || '')
  const [open, setOpen] = useState(false)
  const [filtered, setFiltered] = useState([])
  const ref = useRef(null)

  useEffect(() => { setQuery(value || '') }, [value])
  useEffect(() => {
    if (query.length < 2) { setFiltered([]); return }
    const q = query.toLowerCase()
    setFiltered(players.filter(p => p.toLowerCase().includes(q)).slice(0, 8))
  }, [query, players])
  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelect(player) { setQuery(player); onChange(player); setOpen(false) }
  function handleChange(e) { setQuery(e.target.value); onChange(e.target.value); setOpen(true) }

  return (
    <div ref={ref} style={{ position: 'relative', marginBottom: '0.5rem' }}>
      <input
        type="text" placeholder={placeholder || 'Search player...'}
        value={query} onChange={handleChange}
        onFocus={() => query.length >= 2 && setOpen(true)}
        disabled={disabled} autoComplete="off" style={{ paddingRight: '2rem' }}
      />
      {query && !disabled && (
        <button onClick={() => { setQuery(''); onChange(''); setFiltered([]) }}
          style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '1rem', padding: '0 0.25rem' }}>×</button>
      )}
      {open && filtered.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'var(--panel2)', border: '1px solid var(--border)', borderRadius: '0 0 8px 8px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', maxHeight: '200px', overflowY: 'auto' }}>
          {filtered.map(player => (
            <div key={player} onMouseDown={() => handleSelect(player)}
              style={{ padding: '0.6rem 1rem', cursor: 'pointer', fontSize: '0.9rem', borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--panel)'}
              onMouseLeave={e => e.currentTarget.style.background = ''}>{player}</div>
          ))}
        </div>
      )}
    </div>
  )
}

function NamedPlayerSection({ label, hint, badge, names, onChange, players, disabled, playerStats, statKey, ptsPer, icon }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
        <label style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>{label}</label>
        <span className="badge badge-gold">{badge}</span>
      </div>
      <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '0.6rem' }}>{hint}</p>
      {[0, 1, 2].map(i => {
        const name = names[i] || ''
        // Find matching stats using namesMatch
        const matchedEntry = name ? Object.entries(playerStats).find(([k]) => namesMatch(name, k)) : null
        const statCount = matchedEntry ? matchedEntry[1][statKey] : 0
        const pts = statCount * ptsPer
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div style={{ flex: 1 }}>
              <PlayerSearch
                value={name}
                onChange={v => { const updated = [...names]; updated[i] = v; onChange(updated) }}
                placeholder={`Player ${i + 1} — type to search`}
                players={players}
                disabled={disabled}
              />
            </div>
            {name && pts > 0 && (
              <div style={{
                flexShrink: 0, fontSize: '0.78rem', fontFamily: 'var(--font-display)',
                color: 'var(--gold)', background: 'rgba(245,200,66,0.12)',
                border: '1px solid rgba(245,200,66,0.25)',
                borderRadius: 6, padding: '0.2rem 0.5rem', whiteSpace: 'nowrap',
              }}>
                {icon} {statCount} = +{pts}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Tournament({ playerId }) {
  const [data, setData] = useState({
    tournamentWinner: '',
    namedScorers: ['', '', ''],
    namedAssisters: ['', '', ''],
    namedGoalies: ['', '', ''],
    totalRedCards: '',
    mostRedCardTeam: '',
    totalYellowCards: '',
    mostYellowCardTeam: '',
    fewestYellowCardTeam: ''
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [allPlayers, setAllPlayers] = useState([])
  const [goalkeepers, setGoalkeepers] = useState([])
  const [isLocked, setIsLocked] = useState(false)
  const [playerStats, setPlayerStats] = useState({})
  const [goalieTeamMap, setGoalieTeamMap] = useState({})

  useEffect(() => {
    async function loadSquads() {
      try {
        const snap = await getDoc(doc(db, 'meta', 'squads'))
        if (snap.exists()) {
          const squads = snap.data().players
          const outfield = [], gks = [], gtMap = {}
          for (const [team, squad] of Object.entries(squads)) {
            outfield.push(...(squad.outfield || []))
            gks.push(...(squad.goalkeepers || []))
            for (const gk of (squad.goalkeepers || [])) gtMap[gk.toLowerCase()] = team
          }
          setAllPlayers([...new Set(outfield)].sort())
          setGoalkeepers([...new Set(gks)].sort())
          setGoalieTeamMap(gtMap)
        }
      } catch (err) { console.error('Failed to load squads:', err) }
    }
    loadSquads()
  }, [])

  useEffect(() => {
    if (!playerId) return
    Promise.all([
      getTournamentPrediction(playerId),
      getDeadline(),
      getDoc(doc(db, 'meta', 'config')),
      getDocs(collection(db, 'matchEvents')),
    ]).then(([existing, deadline, configSnap, eventsSnap]) => {
      if (existing) setData(d => ({ ...d, ...existing }))
      const unlocked = configSnap.exists() ? (configSnap.data().unlockedPlayers || []) : []
      if (deadline) setIsLocked(new Date() > new Date(deadline) && !unlocked.includes(playerId))
      const eventsMap = {}
      eventsSnap.docs.forEach(d => { eventsMap[d.id] = d.data() })
      setLoading(false)
      setPlayerStats({ _events: eventsMap })
    })
  }, [playerId])

  // Recalculate stats when both events and goalieTeamMap are available
  // goalieTeamMap is populated by the squads useEffect which may run after this one
  useEffect(() => {
    if (!playerStats._events) return
    // Always recalc — if goalieTeamMap is empty, clean sheets just won't show yet
    const stats = calcPlayerStats(playerStats._events, goalieTeamMap)
    setPlayerStats(stats)
  }, [playerStats._events, JSON.stringify(goalieTeamMap)])

  async function handleSave() {
    if (isLocked) return
    setSaving(true)
    await saveTournamentPrediction(playerId, data)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return <div className="page"><div className="spinner" /></div>

  const outfieldPlayers = allPlayers.length > 0 ? allPlayers : []
  const gkPlayers = goalkeepers.length > 0 ? goalkeepers : []
  const stats = (playerStats && !playerStats._events) ? playerStats : {} // use empty while loading

  return (
    <div className="page">
      <h2 style={{ marginBottom: '0.5rem' }}>MY PICKS</h2>

      {isLocked ? (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius)', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.88rem', color: 'var(--red)' }}>
          🔒 The deadline has passed — your picks are locked in.
        </div>
      ) : (
        <p style={{ marginBottom: '1.75rem', fontSize: '0.9rem' }}>
          These predictions score big points — set them before the tournament starts!
        </p>
      )}

      {/* Winner */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>🏆 TOURNAMENT WINNER</h3>
          <span className="badge badge-gold">15 pts</span>
        </div>
        <select value={data.tournamentWinner} onChange={e => setData(d => ({ ...d, tournamentWinner: e.target.value }))} disabled={isLocked}>
          <option value="">-- Select a team --</option>
          {WC2026_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Named Players */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>⚽ NAMED PLAYERS</h3>
        <p style={{ fontSize: '0.82rem', marginBottom: '1.25rem' }}>
          Pick 3 scorers, 3 assisters and 3 goalkeepers. Points earned so far shown in gold.
          {allPlayers.length === 0 && <span style={{ color: 'var(--red)' }}> (Squad data loading...)</span>}
        </p>

        <NamedPlayerSection
          label="3 GOAL SCORERS" hint="2pts per goal · 15pts Golden Boot (outright) · 10pts joint"
          badge="2pts/goal" icon="⚽" statKey="goals" ptsPer={2}
          names={data.namedScorers} onChange={v => setData(d => ({ ...d, namedScorers: v }))}
          players={outfieldPlayers} disabled={isLocked} playerStats={stats}
        />
        <NamedPlayerSection
          label="3 ASSISTERS" hint="2pts per assist · 15pts most assists (outright) · 10pts joint"
          badge="2pts/assist" icon="🎯" statKey="assists" ptsPer={2}
          names={data.namedAssisters} onChange={v => setData(d => ({ ...d, namedAssisters: v }))}
          players={outfieldPlayers} disabled={isLocked} playerStats={stats}
        />
        <NamedPlayerSection
          label="3 GOALKEEPERS" hint="3pts per clean sheet · 15pts most clean sheets (outright) · 10pts joint"
          badge="3pts/clean sheet" icon="🧤" statKey="cleanSheets" ptsPer={3}
          names={data.namedGoalies} onChange={v => setData(d => ({ ...d, namedGoalies: v }))}
          players={gkPlayers} disabled={isLocked} playerStats={stats}
        />
      </div>

      {/* Cards */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '1.25rem' }}>🟥 CARD PREDICTIONS</h3>

        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <label style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem' }}>TOTAL RED CARDS IN TOURNAMENT</label>
            <span className="badge badge-gold">15 pts</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Within 2 of actual total</p>
          <input type="number" min={0} max={100} placeholder="e.g. 8" value={data.totalRedCards}
            onChange={e => setData(d => ({ ...d, totalRedCards: e.target.value }))} disabled={isLocked} />
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <label style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem' }}>TEAM WITH MOST RED CARDS</label>
            <span className="badge badge-gold">20 pts</span>
          </div>
          <select value={data.mostRedCardTeam} onChange={e => setData(d => ({ ...d, mostRedCardTeam: e.target.value }))} disabled={isLocked}>
            <option value="">-- Select a team --</option>
            {WC2026_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <label style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem' }}>TOTAL YELLOW CARDS IN TOURNAMENT</label>
            <span className="badge badge-gold">25 pts</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Within 15 of actual total</p>
          <input type="number" min={0} max={500} placeholder="e.g. 180" value={data.totalYellowCards}
            onChange={e => setData(d => ({ ...d, totalYellowCards: e.target.value }))} disabled={isLocked} />
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <label style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem' }}>TEAM WITH MOST YELLOW CARDS</label>
            <span className="badge badge-gold">20 pts</span>
          </div>
          <select value={data.mostYellowCardTeam} onChange={e => setData(d => ({ ...d, mostYellowCardTeam: e.target.value }))} disabled={isLocked}>
            <option value="">-- Select a team --</option>
            {WC2026_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <label style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem' }}>TEAM WITH FEWEST YELLOW CARDS</label>
            <span className="badge badge-gold">30 pts</span>
          </div>
          <select value={data.fewestYellowCardTeam} onChange={e => setData(d => ({ ...d, fewestYellowCardTeam: e.target.value }))} disabled={isLocked}>
            <option value="">-- Select a team --</option>
            {WC2026_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {!isLocked && (
        <button className="btn btn-primary w-full" style={{ marginTop: '0.5rem', fontSize: '1.2rem', padding: '1rem' }}
          onClick={handleSave} disabled={saving}>
          {saving ? 'SAVING...' : saved ? '✓ SAVED!' : 'SAVE PREDICTIONS'}
        </button>
      )}
    </div>
  )
}
