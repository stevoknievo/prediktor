// src/pages/Rivals.jsx
import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'

async function getAllTournamentPredictions() {
  const [playersSnap, predsSnap] = await Promise.all([
    getDocs(collection(db, 'players')),
    getDocs(collection(db, 'tournamentPredictions'))
  ])
  const players = {}
  playersSnap.docs.forEach(d => { players[d.id] = d.data() })
  return predsSnap.docs.map(d => ({
    ...d.data(),
    nickname: players[d.id]?.nickname || 'Unknown',
    totalPoints: players[d.id]?.totalPoints || 0
  }))
}

function Section({ title, points, children }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{title}</div>
        {points && <span className="badge badge-gold">{points}</span>}
      </div>
      {children}
    </div>
  )
}

function PlayerCard({ pred, isMe }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="card"
      style={{
        marginBottom: '0.75rem',
        ...(isMe ? { borderColor: 'rgba(245,200,66,0.4)', background: 'rgba(245,200,66,0.06)' } : {})
      }}
    >
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setExpanded(e => !e)}
      >
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: isMe ? 'var(--gold)' : 'var(--white)' }}>
            {pred.nickname}
            {isMe && <span style={{ fontSize: '0.7rem', marginLeft: '0.5rem', fontFamily: 'var(--font-body)', color: 'var(--gold)' }}>YOU</span>}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.15rem' }}>
            🏆 {pred.tournamentWinner || <em>No pick</em>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: isMe ? 'var(--gold)' : 'var(--white)' }}>{pred.totalPoints}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase' }}>pts</div>
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '1.2rem' }}>{expanded ? '▲' : '▼'}</div>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>

          <Section title="Tournament Winner" points="15pts">
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--cyan)' }}>
              {pred.tournamentWinner || '—'}
            </div>
          </Section>

          <Section title="Goal Scorers" points="2pts/goal • 15pts Golden Boot">
            {(pred.namedScorers || []).filter(Boolean).length > 0
              ? (pred.namedScorers || []).filter(Boolean).map((s, i) => (
                <div key={i} style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>⚽ {s}</div>
              ))
              : <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No picks</div>
            }
          </Section>

          <Section title="Assisters" points="1pt/assist • 10pts top assister">
            {(pred.namedAssisters || []).filter(Boolean).length > 0
              ? (pred.namedAssisters || []).filter(Boolean).map((s, i) => (
                <div key={i} style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>🎯 {s}</div>
              ))
              : <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No picks</div>
            }
          </Section>

          <Section title="Goalkeepers" points="3pts/clean sheet • 15pts top GK">
            {(pred.namedGoalies || []).filter(Boolean).length > 0
              ? (pred.namedGoalies || []).filter(Boolean).map((s, i) => (
                <div key={i} style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>🧤 {s}</div>
              ))
              : <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No picks</div>
            }
          </Section>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Section title="Total Red Cards" points="15pts">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--red)' }}>
                🟥 {pred.totalRedCards || '—'}
              </div>
            </Section>
            <Section title="Most Red Cards" points="20pts">
              <div style={{ fontSize: '0.88rem' }}>{pred.mostRedCardTeam || '—'}</div>
            </Section>
            <Section title="Total Yellows" points="25pts">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: '#f5c842' }}>
                🟨 {pred.totalYellowCards || '—'}
              </div>
            </Section>
            <Section title="Most Yellows" points="20pts">
              <div style={{ fontSize: '0.88rem' }}>{pred.mostYellowCardTeam || '—'}</div>
            </Section>
            <Section title="Fewest Yellows" points="30pts">
              <div style={{ fontSize: '0.88rem' }}>{pred.fewestYellowCardTeam || '—'}</div>
            </Section>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Rivals({ playerId, initialPlayerId }) {
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getAllTournamentPredictions().then(preds => {
      // Sort: current player first, then by points
      preds.sort((a, b) => {
        if (a.playerId === playerId) return -1
        if (b.playerId === playerId) return 1
        return b.totalPoints - a.totalPoints
      })
      setPredictions(preds)
      setLoading(false)
    })
  }, [playerId])

  // If opened from leaderboard for a specific player, auto-expand them
  useEffect(() => {
    if (initialPlayerId) {
      // scroll to that player card
      setTimeout(() => {
        const el = document.getElementById(`rival-${initialPlayerId}`)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)
    }
  }, [initialPlayerId, predictions])

  const filtered = predictions.filter(p =>
    p.nickname.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="page"><div className="spinner" /></div>

  return (
    <div className="page">
      <h2 style={{ marginBottom: '0.5rem' }}>RIVALS</h2>
      <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
        See everyone's tournament predictions. Tap a player to expand.
      </p>

      <input
        type="text"
        placeholder="Search by name..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: '1.25rem' }}
      />

      {filtered.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p>No predictions submitted yet.</p>
        </div>
      )}

      {filtered.map(pred => (
        <div key={pred.playerId} id={`rival-${pred.playerId}`}>
          <PlayerCard
            pred={pred}
            isMe={pred.playerId === playerId}
          />
        </div>
      ))}
    </div>
  )
}
