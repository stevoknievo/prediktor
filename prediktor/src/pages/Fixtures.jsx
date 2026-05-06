// src/pages/Fixtures.jsx
import { useState, useEffect, useRef } from 'react'
import { subscribeFixtures, getPlayerPredictions, savePrediction, getDeadline } from '../lib/db'

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const STAGE_ORDER = [
  'Group A','Group B','Group C','Group D','Group E','Group F',
  'Group G','Group H','Group I','Group J','Group K','Group L',
  'Round of 32','Round of 16','Quarter-final','Semi-final','3rd Place Final','Final'
]

const KNOCKOUT_STAGES = ['Round of 32','Round of 16','Quarter-final','Semi-final','3rd Place Final','Final']

const STAGE_EMOJI = {
  'Round of 32': '⚔️',
  'Round of 16': '🔥',
  'Quarter-final': '⭐',
  'Semi-final': '🌟',
  '3rd Place Final': '🥉',
  'Final': '🏆',
}

function groupByStage(fixtures) {
  return fixtures.reduce((acc, f) => {
    const key = f.stage || 'Unknown'
    if (!acc[key]) acc[key] = []
    acc[key].push(f)
    return acc
  }, {})
}

function ScoreInput({ value, onChange, disabled, knockout }) {
  return (
    <input
      type="number"
      min={0} max={20}
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      style={{
        width: knockout ? '4rem' : '3.5rem',
        textAlign: 'center',
        fontFamily: 'var(--font-display)',
        fontSize: knockout ? '1.8rem' : '1.4rem',
        padding: '0.4rem 0',
        background: knockout ? 'rgba(245,200,66,0.08)' : undefined,
        borderColor: knockout ? 'rgba(245,200,66,0.3)' : undefined,
      }}
    />
  )
}

function FixtureRow({ fixture, prediction, onSave, locked }) {
  const [home, setHome] = useState(prediction?.score90Home ?? '')
  const [away, setAway] = useState(prediction?.score90Away ?? '')
  const [status, setStatus] = useState(null)
  const saveTimer = useRef(null)
  const isKnockout = fixture.isKnockout
  const isTBD = fixture.homeTeam === 'TBD'

  const actual = fixture.completed
  const scoreStr = actual ? `${fixture.score90Home}-${fixture.score90Away}` : null

  useEffect(() => {
    if (home === '' || away === '' || locked || actual) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setStatus('saving')
      try {
        await onSave(fixture.id, { score90Home: Number(home), score90Away: Number(away) })
        setStatus('saved')
        setTimeout(() => setStatus(null), 2000)
      } catch {
        setStatus('error')
      }
    }, 800)
    return () => clearTimeout(saveTimer.current)
  }, [home, away])

  useEffect(() => {
    if (prediction?.score90Home !== undefined) setHome(prediction.score90Home)
    if (prediction?.score90Away !== undefined) setAway(prediction.score90Away)
  }, [prediction?.score90Home, prediction?.score90Away])

  return (
    <div style={{
      background: isKnockout
        ? 'linear-gradient(135deg, rgba(245,200,66,0.07) 0%, var(--panel) 60%)'
        : 'var(--panel)',
      border: `1px solid ${isKnockout ? 'rgba(245,200,66,0.25)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)',
      padding: '1rem',
      marginBottom: '0.75rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.78rem', color: isKnockout ? 'rgba(245,200,66,0.7)' : 'var(--muted)' }}>
          {formatDate(fixture.date)}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {status === 'saving' && <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>saving...</span>}
          {status === 'saved' && <span style={{ fontSize: '0.72rem', color: 'var(--green)' }}>saved</span>}
          {status === 'error' && <span style={{ fontSize: '0.72rem', color: 'var(--red)' }}>error</span>}
          {actual
            ? <span className="badge badge-green">FT</span>
            : locked
            ? <span className="badge badge-red">LOCKED</span>
            : <span className={`badge ${isKnockout ? 'badge-gold' : 'badge-cyan'}`}>OPEN</span>
          }
        </div>
      </div>

      {fixture.venue && (
        <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '0.6rem', textAlign: 'center' }}>
          {fixture.venue}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '0.75rem', textAlign: 'center' }}>
        <div>
          {fixture.homeLogo && <img src={fixture.homeLogo} alt="" style={{ width: isKnockout ? 36 : 28, height: isKnockout ? 36 : 28, marginBottom: 4 }} />}
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: isKnockout ? '1.3rem' : '1.1rem',
            color: isKnockout ? 'var(--gold)' : 'var(--white)'
          }}>
            {isTBD ? '?' : (fixture.homeTeamCode || fixture.homeTeam)}
          </div>
        </div>

        {actual ? (
          <div style={{ fontFamily: 'var(--font-display)', fontSize: isKnockout ? '2rem' : '1.6rem', color: 'var(--gold)' }}>
            {scoreStr}
          </div>
        ) : isTBD ? (
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--muted)', textAlign: 'center', lineHeight: 1.4 }}>
            TBD
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ScoreInput value={home} onChange={setHome} disabled={locked} knockout={isKnockout} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: isKnockout ? '1.8rem' : '1.5rem', color: 'var(--muted)' }}>-</span>
            <ScoreInput value={away} onChange={setAway} disabled={locked} knockout={isKnockout} />
          </div>
        )}

        <div>
          {fixture.awayLogo && <img src={fixture.awayLogo} alt="" style={{ width: isKnockout ? 36 : 28, height: isKnockout ? 36 : 28, marginBottom: 4 }} />}
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: isKnockout ? '1.3rem' : '1.1rem',
            color: isKnockout ? 'var(--gold)' : 'var(--white)'
          }}>
            {isTBD ? '?' : (fixture.awayTeamCode || fixture.awayTeam)}
          </div>
        </div>
      </div>

      {prediction && !actual && !locked && !isTBD && (
        <div style={{ marginTop: '0.5rem', textAlign: 'right', fontSize: '0.78rem', color: 'var(--muted)' }}>
          Your pick: {prediction.score90Home}-{prediction.score90Away}
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
  const [filter, setFilter] = useState('all')
  const [stageFilter, setStageFilter] = useState('all')

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
  const sortedStages = Object.keys(grouped).sort((a, b) => {
    const ai = STAGE_ORDER.indexOf(a)
    const bi = STAGE_ORDER.indexOf(b)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  const groupStages = sortedStages.filter(s => !KNOCKOUT_STAGES.includes(s))
  const knockoutStages = sortedStages.filter(s => KNOCKOUT_STAGES.includes(s))
  const visibleStages = stageFilter === 'group' ? groupStages
    : stageFilter === 'knockout' ? knockoutStages
    : sortedStages

  if (loading) return <div className="page"><div className="spinner" /></div>

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h2>FIXTURES</h2>
        {deadline && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deadline</div>
            <div style={{ fontSize: '0.85rem', color: isLocked ? 'var(--red)' : 'var(--gold)' }}>
              {isLocked ? 'Locked' : formatDate(deadline)}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        {[['all','All'],['group','Groups'],['knockout','Knockouts']].map(([val, label]) => (
          <button
            key={val}
            className="btn btn-ghost"
            style={{ fontSize: '0.82rem', padding: '0.35rem 0.9rem', ...(stageFilter === val ? { borderColor: 'var(--gold)', color: 'var(--gold)' } : {}) }}
            onClick={() => setStageFilter(val)}
          >
            {val === 'knockout' ? `⚔️ ${label}` : label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {['all','upcoming','predicted'].map(f => (
          <button
            key={f}
            className="btn btn-ghost"
            style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem', ...(filter === f ? { borderColor: 'var(--cyan)', color: 'var(--cyan)' } : {}) }}
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

      {visibleStages.map((stage, idx) => {
        const isKnockoutStage = KNOCKOUT_STAGES.includes(stage)
        const stageFixtures = grouped[stage]
        const visible = stageFixtures.filter(f => {
          if (filter === 'upcoming') return !f.completed
          if (filter === 'predicted') return predictions[f.id]
          return true
        })
        if (visible.length === 0) return null

        const prevStage = visibleStages[idx - 1]
        const showKnockoutDivider = isKnockoutStage && (!prevStage || !KNOCKOUT_STAGES.includes(prevStage))

        return (
          <div key={stage}>
            {showKnockoutDivider && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.5rem 0 1rem' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(245,200,66,0.3)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap', fontWeight: 600 }}>
                  Knockout Rounds
                </span>
                <div style={{ flex: 1, height: 1, background: 'rgba(245,200,66,0.3)' }} />
              </div>
            )}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{
                marginBottom: '0.75rem',
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: isKnockoutStage ? 'var(--gold)' : 'var(--muted)',
              }}>
                {STAGE_EMOJI[stage] && `${STAGE_EMOJI[stage]} `}{stage}
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
          </div>
        )
      })}
    </div>
  )
}
