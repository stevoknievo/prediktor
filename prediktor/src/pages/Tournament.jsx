// src/pages/Tournament.jsx
import { useState, useEffect, useRef } from 'react'
import { saveTournamentPrediction, getTournamentPrediction } from '../lib/db'
import { doc, getDoc } from 'firebase/firestore'
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

// Player search autocomplete component
function PlayerSearch({ value, onChange, placeholder, players, disabled }) {
  const [query, setQuery] = useState(value || '')
  const [open, setOpen] = useState(false)
  const [filtered, setFiltered] = useState([])
  const ref = useRef(null)

  useEffect(() => {
    setQuery(value || '')
  }, [value])

  useEffect(() => {
    if (query.length < 2) { setFiltered([]); return }
    const q = query.toLowerCase()
    const matches = players
      .filter(p => p.toLowerCase().includes(q))
      .slice(0, 8)
    setFiltered(matches)
  }, [query, players])

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelect(player) {
    setQuery(player)
    onChange(player)
    setOpen(false)
  }

  function handleChange(e) {
    setQuery(e.target.value)
    onChange(e.target.value)
    setOpen(true)
  }

  return (
    <div ref={ref} style={{ position: 'relative', marginBottom: '0.5rem' }}>
      <input
        type="text"
        placeholder={placeholder || 'Search player...'}
        value={query}
        onChange={handleChange}
        onFocus={() => query.length >= 2 && setOpen(true)}
        disabled={disabled}
        autoComplete="off"
        style={{ paddingRight: '2rem' }}
      />
      {query && !disabled && (
        <button
          onClick={() => { setQuery(''); onChange(''); setFiltered([]) }}
          style={{
            position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '1rem', padding: '0 0.25rem'
          }}
        >×</button>
      )}
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: 'var(--panel2)', border: '1px solid var(--border)', borderRadius: '0 0 8px 8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)', maxHeight: '200px', overflowY: 'auto'
        }}>
          {filtered.map(player => (
            <div
              key={player}
              onMouseDown={() => handleSelect(player)}
              style={{
                padding: '0.6rem 1rem', cursor: 'pointer', fontSize: '0.9rem',
                borderBottom: '1px solid var(--border)',
                transition: 'background 0.1s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--panel)'}
              onMouseLeave={e => e.currentTarget.style.background = ''}
            >
              {player}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function NamedPlayerSection({ label, hint, badge, names, onChange, players, gkMode }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
        <label style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>{label}</label>
        <span className="badge badge-gold">{badge}</span>
      </div>
      <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '0.6rem' }}>{hint}</p>
      {[0, 1, 2].map(i => (
        <PlayerSearch
          key={i}
          value={names[i] || ''}
          onChange={v => {
            const updated = [...names]
            updated[i] = v
            onChange(updated)
          }}
          placeholder={`Player ${i + 1} — type to search`}
          players={players}
        />
      ))}
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

  // Load squads from Firestore
  useEffect(() => {
    async function loadSquads() {
      try {
        const snap = await getDoc(doc(db, 'meta', 'squads'))
        if (snap.exists()) {
          const squads = snap.data().players
          const outfield = []
          const gks = []
          for (const team of Object.values(squads)) {
            outfield.push(...(team.outfield || []))
            gks.push(...(team.goalkeepers || []))
          }
          setAllPlayers([...new Set(outfield)].sort())
          setGoalkeepers([...new Set(gks)].sort())
        }
      } catch (err) {
        console.error('Failed to load squads:', err)
      }
    }
    loadSquads()
  }, [])

  useEffect(() => {
    if (!playerId) return
    getTournamentPrediction(playerId).then(existing => {
      if (existing) setData(d => ({ ...d, ...existing }))
      setLoading(false)
    })
  }, [playerId])

  async function handleSave() {
    setSaving(true)
    await saveTournamentPrediction(playerId, data)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return <div className="page"><div className="spinner" /></div>

  // All outfield players for scorers/assisters
  const outfieldPlayers = allPlayers.length > 0 ? allPlayers : []
  const gkPlayers = goalkeepers.length > 0 ? goalkeepers : []

  return (
    <div className="page">
      <h2 style={{ marginBottom: '0.5rem' }}>MY PICKS</h2>
      <p style={{ marginBottom: '1.75rem', fontSize: '0.9rem' }}>
        These predictions score big points — set them before the tournament starts!
      </p>

      {/* Winner */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>🏆 TOURNAMENT WINNER</h3>
          <span className="badge badge-gold">15 pts</span>
        </div>
        <select
          value={data.tournamentWinner}
          onChange={e => setData(d => ({ ...d, tournamentWinner: e.target.value }))}
        >
          <option value="">-- Select a team --</option>
          {WC2026_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Named Players */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>⚽ NAMED PLAYERS</h3>
        <p style={{ fontSize: '0.82rem', marginBottom: '1.25rem' }}>
          Pick 3 scorers, 3 assisters and 3 goalkeepers. Earn points every time they perform throughout the tournament, plus big bonuses if they lead the charts.
          {allPlayers.length === 0 && <span style={{ color: 'var(--red)' }}> (Squad data loading...)</span>}
        </p>

        <NamedPlayerSection
          label="3 GOAL SCORERS"
          hint="2pts per goal · 15pts Golden Boot (outright) · 10pts joint"
          badge="2pts/goal"
          names={data.namedScorers}
          onChange={v => setData(d => ({ ...d, namedScorers: v }))}
          players={outfieldPlayers}
        />

        <NamedPlayerSection
          label="3 ASSISTERS"
          hint="2pt per assist · 15pts most assists (outright) · 10pts joint"
          badge="2pt/assist"
          names={data.namedAssisters}
          onChange={v => setData(d => ({ ...d, namedAssisters: v }))}
          players={outfieldPlayers}
        />

        <NamedPlayerSection
          label="3 GOALKEEPERS"
          hint="3pts per clean sheet · 15pts most clean sheets (outright) · 10pts joint"
          badge="3pts/clean sheet"
          names={data.namedGoalies}
          onChange={v => setData(d => ({ ...d, namedGoalies: v }))}
          players={gkPlayers}
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
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Within 1 of actual total</p>
          <input type="number" min={0} max={100} placeholder="e.g. 8" value={data.totalRedCards}
            onChange={e => setData(d => ({ ...d, totalRedCards: e.target.value }))} />
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <label style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem' }}>TEAM WITH MOST RED CARDS</label>
            <span className="badge badge-gold">20 pts</span>
          </div>
          <select value={data.mostRedCardTeam} onChange={e => setData(d => ({ ...d, mostRedCardTeam: e.target.value }))}>
            <option value="">-- Select a team --</option>
            {WC2026_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <label style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem' }}>TOTAL YELLOW CARDS IN TOURNAMENT</label>
            <span className="badge badge-gold">25 pts</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Within 10 of actual total</p>
          <input type="number" min={0} max={500} placeholder="e.g. 180" value={data.totalYellowCards}
            onChange={e => setData(d => ({ ...d, totalYellowCards: e.target.value }))} />
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <label style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem' }}>TEAM WITH MOST YELLOW CARDS</label>
            <span className="badge badge-gold">20 pts</span>
          </div>
          <select value={data.mostYellowCardTeam} onChange={e => setData(d => ({ ...d, mostYellowCardTeam: e.target.value }))}>
            <option value="">-- Select a team --</option>
            {WC2026_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <label style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem' }}>TEAM WITH FEWEST YELLOW CARDS</label>
            <span className="badge badge-gold">30 pts</span>
          </div>
          <select value={data.fewestYellowCardTeam} onChange={e => setData(d => ({ ...d, fewestYellowCardTeam: e.target.value }))}>
            <option value="">-- Select a team --</option>
            {WC2026_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <button
        className="btn btn-primary w-full"
        style={{ marginTop: '0.5rem', fontSize: '1.2rem', padding: '1rem' }}
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'SAVING...' : saved ? '✓ SAVED!' : 'SAVE PREDICTIONS'}
      </button>
    </div>
  )
}
