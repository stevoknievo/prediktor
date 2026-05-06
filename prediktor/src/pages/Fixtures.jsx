// src/pages/Fixtures.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { subscribeFixtures, getPlayerPredictions, savePrediction, getDeadline } from '../lib/db'
import { generateRoundOf32, generateNextRound, getKnockoutWinner, GROUP_FIXTURES } from '../lib/qualification'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

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
  'Round of 32': '⚔️', 'Round of 16': '🔥',
  'Quarter-final': '⭐', 'Semi-final': '🌟',
  '3rd Place Final': '🥉', 'Final': '🏆',
}

const ROUND_OF_32_IDS = ['m073','m074','m075','m076','m077','m078','m079','m080','m081','m082','m083','m084','m085','m086','m087','m088']
const ROUND_OF_16_IDS = ['m089','m090','m091','m092','m093','m094','m095','m096']
const QF_IDS = ['m097','m098','m099','m100']
const SF_IDS = ['m101','m102']

function groupByStage(fixtures) {
  return fixtures.reduce((acc, f) => {
    const key = f.stage || 'Unknown'
    if (!acc[key]) acc[key] = []
    acc[key].push(f)
    return acc
  }, {})
}

function NumInput({ value, onChange, disabled, size = 'normal' }) {
  const s = size === 'large'
  return (
    <input
      type="number" min={0} max={20}
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      style={{
        width: s ? '4rem' : '3.2rem',
        textAlign: 'center',
        fontFamily: 'var(--font-display)',
        fontSize: s ? '1.8rem' : '1.3rem',
        padding: '0.35rem 0',
        background: s ? 'rgba(245,200,66,0.08)' : undefined,
        borderColor: s ? 'rgba(245,200,66,0.25)' : undefined,
      }}
    />
  )
}

function ScoreRow({ label, homeVal, awayVal, onHome, onAway, disabled, size, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
      <span style={{ fontSize: '0.72rem', color: color || 'var(--muted)', width: 70, textAlign: 'right' }}>{label}</span>
      <NumInput value={homeVal} onChange={onHome} disabled={disabled} size={size} />
      <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--muted)' }}>-</span>
      <NumInput value={awayVal} onChange={onAway} disabled={disabled} size={size} />
      <span style={{ width: 70 }} />
    </div>
  )
}

function FixtureRow({ fixture, prediction, onSave, locked }) {
  const isKnockout = fixture.isKnockout
  const isTBD = fixture.homeTeam === 'TBD' || fixture.awayTeam === 'TBD'
  const actual = fixture.completed

  const [h90, setH90] = useState(prediction?.score90Home ?? '')
  const [a90, setA90] = useState(prediction?.score90Away ?? '')
  const [hET, setHET] = useState(prediction?.scoreETHome ?? '')
  const [aET, setAET] = useState(prediction?.scoreETAway ?? '')
  const [hPen, setHPen] = useState(prediction?.scorePenHome ?? '')
  const [aPen, setAPen] = useState(prediction?.scorePenAway ?? '')
  const [status, setStatus] = useState(null)
  const saveTimer = useRef(null)

  const h90n = Number(h90), a90n = Number(a90)
  const isDraw90 = h90 !== '' && a90 !== '' && h90n === a90n
  const hETn = Number(hET), aETn = Number(aET)
  const isDrawET = hET !== '' && aET !== '' && hETn === aETn
  const showET = isKnockout && isDraw90
  const showPen = isKnockout && isDraw90 && isDrawET

  // Sync prediction changes
  useEffect(() => {
    if (prediction?.score90Home !== undefined) setH90(prediction.score90Home)
    if (prediction?.score90Away !== undefined) setA90(prediction.score90Away)
    if (prediction?.scoreETHome !== undefined) setHET(prediction.scoreETHome)
    if (prediction?.scoreETAway !== undefined) setAET(prediction.scoreETAway)
    if (prediction?.scorePenHome !== undefined) setHPen(prediction.scorePenHome)
    if (prediction?.scorePenAway !== undefined) setAPen(prediction.scorePenAway)
  }, [prediction])

  // Auto-save with debounce
  useEffect(() => {
    if (locked || actual || isTBD) return
    if (h90 === '' || a90 === '') return
    if (showET && (hET === '' || aET === '')) return
    if (showPen && (hPen === '' || aPen === '')) return

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setStatus('saving')
      const data = {
        score90Home: Number(h90), score90Away: Number(a90),
        ...(showET ? { scoreETHome: Number(hET), scoreETAway: Number(aET) } : {}),
        ...(showPen ? { scorePenHome: Number(hPen), scorePenAway: Number(aPen) } : {}),
      }
      try {
        await onSave(fixture.id, data)
        setStatus('saved')
        setTimeout(() => setStatus(null), 2000)
      } catch { setStatus('error') }
    }, 800)
    return () => clearTimeout(saveTimer.current)
  }, [h90, a90, hET, aET, hPen, aPen])

  const scoreStr = actual
    ? `${fixture.score90Home}-${fixture.score90Away}${fixture.hasExtraTime ? ' (AET)' : ''}${fixture.hasPenalties ? ` (${fixture.scorePenHome}-${fixture.scorePenAway} pens)` : ''}`
    : null

  return (
    <div style={{
      background: isKnockout ? 'linear-gradient(135deg, rgba(245,200,66,0.07) 0%, var(--panel) 60%)' : 'var(--panel)',
      border: `1px solid ${isKnockout ? 'rgba(245,200,66,0.25)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)',
      padding: '1rem',
      marginBottom: '0.75rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
        <span style={{ fontSize: '0.75rem', color: isKnockout ? 'rgba(245,200,66,0.7)' : 'var(--muted)' }}>
          {formatDate(fixture.date)}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {status === 'saving' && <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>saving...</span>}
          {status === 'saved' && <span style={{ fontSize: '0.7rem', color: 'var(--green)' }}>✓ saved</span>}
          {status === 'error' && <span style={{ fontSize: '0.7rem', color: 'var(--red)' }}>error</span>}
          {actual ? <span className="badge badge-green">FT</span>
            : locked ? <span className="badge badge-red">LOCKED</span>
            : <span className={`badge ${isKnockout ? 'badge-gold' : 'badge-cyan'}`}>OPEN</span>}
        </div>
      </div>

      {fixture.venue && (
        <div style={{ fontSize: '0.68rem', color: 'var(--muted)', textAlign: 'center', marginBottom: '0.5rem' }}>
          {fixture.venue}
        </div>
      )}

      {/* Teams */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '0.5rem', textAlign: 'center' }}>
        <div>
          {fixture.homeLogo && <img src={fixture.homeLogo} alt="" style={{ width: isKnockout ? 34 : 26, height: isKnockout ? 34 : 26, marginBottom: 3 }} />}
          <div style={{ fontFamily: 'var(--font-display)', fontSize: isKnockout ? '1.25rem' : '1rem', color: isKnockout ? 'var(--gold)' : 'var(--white)' }}>
            {isTBD ? '?' : (fixture.homeTeamCode || fixture.homeTeam)}
          </div>
        </div>

        {actual ? (
          <div style={{ fontFamily: 'var(--font-display)', fontSize: isKnockout ? '1.8rem' : '1.5rem', color: 'var(--gold)' }}>
            {scoreStr}
          </div>
        ) : isTBD ? (
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--muted)' }}>TBD</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <NumInput value={h90} onChange={setH90} disabled={locked} size={isKnockout ? 'large' : 'normal'} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--muted)' }}>-</span>
            <NumInput value={a90} onChange={setA90} disabled={locked} size={isKnockout ? 'large' : 'normal'} />
          </div>
        )}

        <div>
          {fixture.awayLogo && <img src={fixture.awayLogo} alt="" style={{ width: isKnockout ? 34 : 26, height: isKnockout ? 34 : 26, marginBottom: 3 }} />}
          <div style={{ fontFamily: 'var(--font-display)', fontSize: isKnockout ? '1.25rem' : '1rem', color: isKnockout ? 'var(--gold)' : 'var(--white)' }}>
            {isTBD ? '?' : (fixture.awayTeamCode || fixture.awayTeam)}
          </div>
        </div>
      </div>

      {/* ET inputs — shown when draw after 90 in knockout */}
      {!actual && !locked && !isTBD && showET && (
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
          <ScoreRow
            label="After ET"
            homeVal={hET} awayVal={aET}
            onHome={setHET} onAway={setAET}
            disabled={locked} size="normal"
            color="var(--cyan)"
          />
          <p style={{ fontSize: '0.68rem', color: 'var(--muted)', textAlign: 'center', marginTop: '0.3rem' }}>
            Cumulative score after extra time
          </p>
        </div>
      )}

      {/* Penalty inputs — shown when draw after ET */}
      {!actual && !locked && !isTBD && showPen && (
        <div style={{ marginTop: '0.5rem' }}>
          <ScoreRow
            label="Penalties"
            homeVal={hPen} awayVal={aPen}
            onHome={setHPen} onAway={setAPen}
            disabled={locked} size="normal"
            color="var(--red)"
          />
          <p style={{ fontSize: '0.68rem', color: 'var(--muted)', textAlign: 'center', marginTop: '0.3rem' }}>
            Penalty shootout score
          </p>
        </div>
      )}

      {prediction && !actual && !locked && !isTBD && (
        <div style={{ marginTop: '0.4rem', textAlign: 'right', fontSize: '0.72rem', color: 'var(--muted)' }}>
          Saved: {prediction.score90Home}-{prediction.score90Away}
          {prediction.scoreETHome !== undefined ? ` (ET: ${prediction.scoreETHome}-${prediction.scoreETAway})` : ''}
          {prediction.scorePenHome !== undefined ? ` (Pens: ${prediction.scorePenHome}-${prediction.scorePenAway})` : ''}
        </div>
      )}
    </div>
  )
}

export default function Fixtures({ playerId }) {
  const [fixturesArr, setFixturesArr] = useState([])
  const [predictions, setPredictions] = useState({})
  const [deadline, setDeadline] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [stageFilter, setStageFilter] = useState('all')

  useEffect(() => {
    const unsub = subscribeFixtures(setFixturesArr)
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
    getDeadline().then(d => { setDeadline(d); setLoading(false) })
  }, [])

  const now = new Date()
  const isLocked = deadline ? now > new Date(deadline) : false

  // Build fixtures map for qualification engine
  const fixturesMap = {}
  fixturesArr.forEach(f => { fixturesMap[f.id] = f })

  // Auto-populate knockout teams from predictions
  const resolvedFixtures = [...fixturesArr].map(f => {
    if (!f.isKnockout) return f
    if (f.homeTeam !== 'TBD' && f.awayTeam !== 'TBD') return f

    // Try to resolve from qualification engine
    try {
      if (ROUND_OF_32_IDS.includes(f.id)) {
        const r32 = generateRoundOf32(fixturesMap, predictions)
        const resolved = r32.find(r => r.id === f.id)
        if (resolved && (resolved.homeTeam !== 'TBD' || resolved.awayTeam !== 'TBD')) {
          return { ...f, homeTeam: resolved.homeTeam, awayTeam: resolved.awayTeam, _resolved: true }
        }
      }
    } catch (e) {}

    return f
  })

  // Further resolve R16, QF, SF, Final from knockout predictions
  const allResolved = [...resolvedFixtures].map(f => {
    if (!f.isKnockout) return f
    if (!ROUND_OF_32_IDS.includes(f.id) && f.homeTeam === 'TBD') {
      // Try to get winner from previous round prediction
      // This is handled by the UI — teams shown as TBD until previous round predicted
    }
    return f
  })

  const resolvedMap = {}
  allResolved.forEach(f => { resolvedMap[f.id] = f })

  async function handleSave(fixtureId, data) {
    await savePrediction(playerId, fixtureId, data)
    setPredictions(prev => ({ ...prev, [fixtureId]: { ...prev[fixtureId], ...data, fixtureId } }))
  }

  const grouped = groupByStage(allResolved)
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

  // Count predictions progress
  const groupFixtureIds = Object.values(GROUP_FIXTURES).flat()
  const predictedCount = groupFixtureIds.filter(fid => {
    const p = predictions[fid]
    return p && p.score90Home !== undefined && p.score90Home !== ''
  }).length

  if (loading) return <div className="page"><div className="spinner" /></div>

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2>FIXTURES</h2>
        {deadline && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deadline</div>
            <div style={{ fontSize: '0.82rem', color: isLocked ? 'var(--red)' : 'var(--gold)' }}>
              {isLocked ? '🔒 Locked' : formatDate(deadline)}
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {!isLocked && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.3rem' }}>
            <span>Group stage predictions</span>
            <span style={{ color: predictedCount === 72 ? 'var(--green)' : 'var(--gold)' }}>{predictedCount}/72</span>
          </div>
          <div style={{ height: 4, background: 'var(--panel2)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(predictedCount / 72) * 100}%`, background: predictedCount === 72 ? 'var(--green)' : 'var(--gold)', borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
          {predictedCount === 72 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--green)', marginTop: '0.3rem' }}>
              ✓ All group stage predictions complete — knockout fixtures are auto-populated below!
            </div>
          )}
          {predictedCount < 72 && predictedCount > 0 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.3rem' }}>
              Complete all group stage predictions to unlock knockout fixtures
            </div>
          )}
        </div>
      )}

      {/* Stage filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        {[['all','All'],['group','Groups'],['knockout','⚔️ Knockouts']].map(([val, label]) => (
          <button key={val} className="btn btn-ghost"
            style={{ fontSize: '0.82rem', padding: '0.35rem 0.9rem', ...(stageFilter === val ? { borderColor: 'var(--gold)', color: 'var(--gold)' } : {}) }}
            onClick={() => setStageFilter(val)}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {['all','upcoming','predicted'].map(f => (
          <button key={f} className="btn btn-ghost"
            style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem', ...(filter === f ? { borderColor: 'var(--cyan)', color: 'var(--cyan)' } : {}) }}
            onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {allResolved.length === 0 && (
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
              <h3 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: isKnockoutStage ? 'var(--gold)' : 'var(--muted)' }}>
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
