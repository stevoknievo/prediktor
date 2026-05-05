// src/pages/Tournament.jsx
import { useState, useEffect } from 'react'
import { saveTournamentPrediction, getTournamentPrediction } from '../lib/db'

const WC2026_TEAMS = [
  'Algeria','Argentina','Australia','Austria','Belgium',
  'Bosnia & Herzegovina','Brazil','Canada','Cape Verde',
  'Colombia','Croatia','Curaçao','Czech Republic','DR Congo',
  'Ecuador','Egypt','England','France','Germany','Ghana',
  'Haiti','Iran','Iraq','Ivory Coast','Japan','Jordan',
  'Mexico','Morocco','Netherlands','New Zealand','Norway',
  'Panama','Paraguay','Portugal','Qatar','Saudi Arabia',
  'Senegal','Scotland','South Africa','South Korea','Spain',
  'Sweden','Switzerland','Tunisia','Türkiye','Uruguay',
  'USA','Uzbekistan'
].sort()

function NamedPlayerInput({ label, hint, names, onChange }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '0.25rem' }}>
        {label}
      </label>
      <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '0.6rem' }}>{hint}</p>
      {[0, 1, 2].map(i => (
        <input
          key={i}
          type="text"
          placeholder={`Player ${i + 1}`}
          value={names[i] || ''}
          onChange={e => {
            const updated = [...names]
            updated[i] = e.target.value
            onChange(updated)
          }}
          style={{ marginBottom: '0.5rem' }}
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

  return (
    <div className="page">
      <h2 style={{ marginBottom: '0.5rem' }}>TOURNAMENT</h2>
      <p style={{ marginBottom: '1.75rem', fontSize: '0.9rem' }}>
        These predictions score big points — set them before the tournament starts!
      </p>

      {/* Winner */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🏆 <span>TOURNAMENT WINNER</span>
          <span className="badge badge-gold" style={{ marginLeft: 'auto' }}>15 pts</span>
        </h3>
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
        <h3 style={{ marginBottom: '1.25rem' }}>⚽ NAMED PLAYERS</h3>
        <p style={{ fontSize: '0.82rem', marginBottom: '1.25rem' }}>
          Pick 3 scorers, 3 assisters, and 3 goalkeepers. You earn points each time they score/assist/keep a clean sheet throughout the tournament, plus big bonuses if they lead the charts.
        </p>

        <NamedPlayerInput
          label="3 GOAL SCORERS"
          hint="2pts per goal scored. 15pts if one wins Golden Boot outright."
          names={data.namedScorers}
          onChange={v => setData(d => ({ ...d, namedScorers: v }))}
        />

        <NamedPlayerInput
          label="3 ASSISTERS"
          hint="1pt per assist. 10pts if one leads assists outright."
          names={data.namedAssisters}
          onChange={v => setData(d => ({ ...d, namedAssisters: v }))}
        />

        <NamedPlayerInput
          label="3 GOALKEEPERS"
          hint="3pts per clean sheet (90 min). 15pts if one leads clean sheets outright."
          names={data.namedGoalies}
          onChange={v => setData(d => ({ ...d, namedGoalies: v }))}
        />
      </div>

      {/* Cards */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '1.25rem' }}>🟥 CARD PREDICTIONS</h3>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontFamily: 'var(--font-display)', display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span>TOTAL RED CARDS IN TOURNAMENT</span>
            <span className="badge badge-gold">15 pts</span>
          </label>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Within 1 card of actual total (or closest predictor)</p>
          <input
            type="number" min={0} max={100}
            placeholder="e.g. 8"
            value={data.totalRedCards}
            onChange={e => setData(d => ({ ...d, totalRedCards: e.target.value }))}
          />
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontFamily: 'var(--font-display)', display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span>TEAM WITH MOST RED CARDS</span>
            <span className="badge badge-gold">20 pts</span>
          </label>
          <select value={data.mostRedCardTeam} onChange={e => setData(d => ({ ...d, mostRedCardTeam: e.target.value }))}>
            <option value="">-- Select a team --</option>
            {WC2026_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontFamily: 'var(--font-display)', display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span>TOTAL YELLOW CARDS IN TOURNAMENT</span>
            <span className="badge badge-gold">25 pts</span>
          </label>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Within 10 cards of actual total (or closest predictor)</p>
          <input
            type="number" min={0} max={500}
            placeholder="e.g. 180"
            value={data.totalYellowCards}
            onChange={e => setData(d => ({ ...d, totalYellowCards: e.target.value }))}
          />
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontFamily: 'var(--font-display)', display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span>TEAM WITH MOST YELLOW CARDS</span>
            <span className="badge badge-gold">20 pts</span>
          </label>
          <select value={data.mostYellowCardTeam} onChange={e => setData(d => ({ ...d, mostYellowCardTeam: e.target.value }))}>
            <option value="">-- Select a team --</option>
            {WC2026_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label style={{ fontFamily: 'var(--font-display)', display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span>TEAM WITH FEWEST YELLOW CARDS</span>
            <span className="badge badge-gold">30 pts</span>
          </label>
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
