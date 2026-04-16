// src/pages/Fixtures.jsx
import { useState, useEffect } from 'react'
import { subscribeFixtures, getPlayerPredictions, savePrediction, getDeadline } from '../lib/db'

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function groupByStage(fixtures) {
  return fixtures.reduce((acc, f) => {
    const key = f.stage || 'Unknown'
    if (!acc[key]) acc[key] = []
    acc[key].push(f)
    return acc
  }, {})
}

function ScoreInput({ value, onChange, disabled }) {
  return (
    <input
      type="number"
      min={0} max={20}
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      style={{ width: '3.5rem', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: '1.4rem', padding: '0.4rem 0' }}
    />
  )
}

function FixtureRow({ fixture, prediction, onSave, locked }) {
  const [home, setHome] = useState(prediction?.score90Home ?? '')
  const [away, setAway] = useState(prediction?.score90Away ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const actual = fixture.completed
  const scoreStr = actual ? `${fixture.score90Home}–${fixture.score90Away}` : null

  async function handleSave() {
    if (home === '' || away === '') return
    setSaving(true)
    await onSave(fixture.id, { score90Home: Number(home), score90Away: Number(away) })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="fixture-card">
      <div className="fixture-meta">
        <span>{formatDate(fixture.date)}</span>
        {actual
          ? <span className="badge badge-green">FT</span>
          : locked
          ? <span className="badge badge-red">LOCKED</span>
          : <span className="badge badge-cyan">OPEN</span>
        }
      </div>

      <div className="fixture-teams">
        <div>
          {fixture.homeLogo && <img src={fixture.homeLogo} alt="" style={{ width: 28, height: 28, marginBottom: 4 }} />}
          <div className="team-name">{fixture.homeTeamCode || fixture.homeTeam}</div>
        </div>

        {actual ? (
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--gold)' }}>
            {scoreStr}
          </div>
        ) : (
          <div className="score-pair">
            <ScoreInput value={home} onChange={setHome} disabled={locked} />
            <span className="sep">–</span>
            <ScoreInput value={away} onChange={setAway} disabled={locked} />
          </div>
        )}

        <div>
          {fixture.awayLogo && <img src={fixture.awayLogo} alt="" style={{ width: 28, height: 28, marginBottom: 4 }} />}
          <div className="team-name">{fixture.awayTeamCode || fixture.awayTeam}</div>
        </div>
      </div>

      {!actual && !locked && (
        <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-primary"
            style={{ fontSize: '0.95rem', padding: '0.45rem 1.25rem' }}
            onClick={handleSave}
            disabled={saving || home === '' || away === ''}
          >
            {saving ? '...' : saved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      )}

      {prediction && !actual && (
        <div style={{ marginTop: '0.5rem', textAlign: 'right', fontSize: '0.78rem', color: 'var(--muted)' }}>
          Your pick: {prediction.score90Home}–{prediction.score90Away}
        </div>
      )}
    </div>
  )
}

export default function Fixtures({ playerId }) {
  const [fixtures, setFixtures] = useState([])
  const [predictions, setPredictions] = useState({})
  const [deadline, setDeadline] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all' | 'predicted' | 'upcoming'

  useEffect(() => {
    const unsub = subscribeFixtures(setFixtures)
    return unsub
  }, [])

  useEffect(() => {
    if (!playerId) return
    getPlayerPredictions(playerId).then(preds => {
      const map = {}
      preds.forEach(p => { map[p.fixtureId] = p })
      setPredictions(map)
    })
  }, [playerId])

  useEffect(() => {
    getDeadline().then(d => {
      setDeadline(d)
      setLoading(false)
    })
  }, [])

  const now = new Date()
  const isLocked = deadline ? now > new Date(deadline) : false

  async function handleSave(fixtureId, data) {
    await savePrediction(playerId, fixtureId, data)
    setPredictions(prev => ({ ...prev, [fixtureId]: { ...prev[fixtureId], ...data, fixtureId } }))
  }

  const grouped = groupByStage(fixtures)

  if (loading) return <div className="page"><div className="spinner" /></div>

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h2>FIXTURES</h2>
        {deadline && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deadline</div>
            <div style={{ fontSize: '0.85rem', color: isLocked ? 'var(--red)' : 'var(--gold)' }}>
              {isLocked ? '🔒 Locked' : formatDate(deadline)}
            </div>
          </div>
        )}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {['all', 'upcoming', 'predicted'].map(f => (
          <button
            key={f}
            className={`btn btn-ghost ${filter === f ? 'active' : ''}`}
            style={{ fontSize: '0.82rem', padding: '0.35rem 0.9rem', ...(filter === f ? { borderColor: 'var(--gold)', color: 'var(--gold)' } : {}) }}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {fixtures.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>No fixtures loaded yet. Check back soon!</p>
        </div>
      )}

      {Object.entries(grouped).map(([stage, stageFixtures]) => {
        const visible = stageFixtures.filter(f => {
          if (filter === 'upcoming') return !f.completed
          if (filter === 'predicted') return predictions[f.id]
          return true
        })
        if (visible.length === 0) return null
        return (
          <div key={stage} style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.75rem', color: 'var(--muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {stage}
            </h3>
            {visible.map(f => (
              <FixtureRow
                key={f.id}
                fixture={f}
                prediction={predictions[f.id]}
                onSave={handleSave}
                locked={isLocked || f.completed}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}
