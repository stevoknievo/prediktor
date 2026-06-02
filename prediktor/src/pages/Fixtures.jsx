// src/pages/Fixtures.jsx
import { useState, useEffect, useRef } from 'react'
import { subscribeFixtures, getPlayerPredictions, savePrediction, getDeadline } from '../lib/db'
import { generateRoundOf32, getKnockoutWinner, GROUP_FIXTURES } from '../lib/qualification'

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
  'Round of 32':'⚔️','Round of 16':'🔥','Quarter-final':'⭐',
  'Semi-final':'🌟','3rd Place Final':'🥉','Final':'🏆'
}

// Maps each knockout stage to its fixture IDs in bracket order
// Bracket order matters — winners of m073 vs m074 meet in R16, etc.
const KNOCKOUT_IDS = {
  'Round of 32':    ['m073','m074','m075','m076','m077','m078','m079','m080','m081','m082','m083','m084','m085','m086','m087','m088'],
  'Round of 16':    ['m089','m090','m091','m092','m093','m094','m095','m096'],
  'Quarter-final':  ['m097','m098','m099','m100'],
  'Semi-final':     ['m101','m102'],
  'Final':          ['m104'],
  '3rd Place Final':['m103'],
}

// Which pairs from R32 feed into each R16 fixture
// R16 m089 = winner of m073 vs winner of m074, etc.
const R32_TO_R16 = {
  'm089': ['m073','m074'], 'm090': ['m075','m076'],
  'm091': ['m077','m078'], 'm092': ['m079','m080'],
  'm093': ['m081','m082'], 'm094': ['m083','m084'],
  'm095': ['m085','m086'], 'm096': ['m087','m088'],
}
const R16_TO_QF = {
  'm097': ['m089','m090'], 'm098': ['m091','m092'],
  'm099': ['m093','m094'], 'm100': ['m095','m096'],
}
const QF_TO_SF = {
  'm101': ['m097','m098'], 'm102': ['m099','m100'],
}
const SF_TO_FINAL = {
  'm104': ['m101','m102'],
}
// Losers of SF go to 3rd place
const SF_TO_3RD = {
  'm103': ['m101','m102'],
}

function groupByStage(fixtures) {
  return fixtures.reduce((acc, f) => {
    const key = f.stage || 'Unknown'
    if (!acc[key]) acc[key] = []
    acc[key].push(f)
    return acc
  }, {})
}

function NumInput({ value, onChange, disabled, large, min = 0 }) {
  return (
    <input
      type="number" min={min} max={20}
      value={value}
      onChange={e => { const v = e.target.value; if (v === '' || Number(v) >= min) onChange(v) }}
      disabled={disabled}
      style={{
        width: large ? '4rem' : '3.2rem',
        textAlign: 'center',
        fontFamily: 'var(--font-display)',
        fontSize: large ? '1.8rem' : '1.3rem',
        padding: '0.35rem 0',
        background: large ? 'rgba(245,200,66,0.08)' : undefined,
        borderColor: large ? 'rgba(245,200,66,0.25)' : undefined,
      }}
    />
  )
}

function FixtureRow({ fixture, prediction, onSave, locked }) {
  const isKnockout = fixture.isKnockout
  const isTBD = false // Always allow predictions even if teams not yet resolved
  const isUnresolved = fixture.homeTeam === 'TBD' || fixture.awayTeam === 'TBD'
  const actual = fixture.completed

  const [h90, setH90] = useState(prediction?.score90Home ?? '')
  const [a90, setA90] = useState(prediction?.score90Away ?? '')
  const [hET, setHET] = useState(prediction?.scoreETHome ?? '')
  const [aET, setAET] = useState(prediction?.scoreETAway ?? '')
  const [hPen, setHPen] = useState(prediction?.scorePenHome ?? '')
  const [aPen, setAPen] = useState(prediction?.scorePenAway ?? '')
  const [status, setStatus] = useState(null)
  const saveTimer = useRef(null)

  const isDraw90 = h90 !== '' && a90 !== '' && Number(h90) === Number(a90)
  const isDrawET = hET !== '' && aET !== '' && Number(hET) === Number(aET)
  const showET = isKnockout && !isTBD && isDraw90
  const showPen = showET && isDrawET

  useEffect(() => {
    if (prediction?.score90Home !== undefined) setH90(prediction.score90Home)
    if (prediction?.score90Away !== undefined) setA90(prediction.score90Away)
    if (prediction?.scoreETHome !== undefined) setHET(prediction.scoreETHome)
    if (prediction?.scoreETAway !== undefined) setAET(prediction.scoreETAway)
    if (prediction?.scorePenHome !== undefined) setHPen(prediction.scorePenHome)
    if (prediction?.scorePenAway !== undefined) setAPen(prediction.scorePenAway)
  }, [prediction])

  useEffect(() => {
    if (locked || actual) return
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
      borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '0.75rem',
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
            : isTBD ? <span className="badge badge-muted">TBD</span>
            : <span className={`badge ${isKnockout ? 'badge-gold' : 'badge-cyan'}`}>OPEN</span>}
        </div>
      </div>

      {fixture.venue && (
        <div style={{ fontSize: '0.68rem', color: 'var(--muted)', textAlign: 'center', marginBottom: '0.5rem' }}>
          {fixture.venue}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '0.5rem', textAlign: 'center' }}>
        <div>
          {fixture.homeLogo && <img src={fixture.homeLogo} alt="" style={{ width: isKnockout ? 34 : 26, height: isKnockout ? 34 : 26, marginBottom: 3 }} />}
          <div style={{ fontFamily: 'var(--font-display)', fontSize: isKnockout ? '1.25rem' : '1rem', color: isKnockout ? 'var(--gold)' : 'var(--white)' }}>
            {fixture.homeTeam === 'TBD' ? '?' : (fixture.homeTeamCode || fixture.homeTeam)}
          </div>
        </div>

        {actual ? (
          <div style={{ fontFamily: 'var(--font-display)', fontSize: isKnockout ? '1.8rem' : '1.5rem', color: 'var(--gold)' }}>
            {scoreStr}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <NumInput value={h90} onChange={setH90} disabled={locked} large={isKnockout} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--muted)' }}>-</span>
            <NumInput value={a90} onChange={setA90} disabled={locked} large={isKnockout} />
          </div>
        )}

        <div>
          {fixture.awayLogo && <img src={fixture.awayLogo} alt="" style={{ width: isKnockout ? 34 : 26, height: isKnockout ? 34 : 26, marginBottom: 3 }} />}
          <div style={{ fontFamily: 'var(--font-display)', fontSize: isKnockout ? '1.25rem' : '1rem', color: isKnockout ? 'var(--gold)' : 'var(--white)' }}>
            {fixture.awayTeam === 'TBD' ? '?' : (fixture.awayTeamCode || fixture.awayTeam)}
          </div>
        </div>
      </div>

      {!actual && !locked && !isTBD && showET && (
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--cyan)', textAlign: 'center', marginBottom: '0.4rem' }}>After Extra Time (cumulative score)</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            <NumInput value={hET} onChange={setHET} disabled={locked} min={Number(h90) || 0} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--muted)' }}>-</span>
            <NumInput value={aET} onChange={setAET} disabled={locked} min={Number(a90) || 0} />
          </div>
        </div>
      )}

      {!actual && !locked && !isTBD && showPen && (
        <div style={{ marginTop: '0.5rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--red)', textAlign: 'center', marginBottom: '0.4rem' }}>Penalty Shootout</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            <NumInput value={hPen} onChange={setHPen} disabled={locked} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--muted)' }}>-</span>
            <NumInput value={aPen} onChange={setAPen} disabled={locked} />
          </div>
        </div>
      )}

      {prediction && !actual && !locked && (
        <div style={{ marginTop: '0.4rem', textAlign: 'right', fontSize: '0.72rem', color: 'var(--muted)' }}>
          Saved: {prediction.score90Home}-{prediction.score90Away}
          {prediction.scoreETHome !== undefined ? ` · ET: ${prediction.scoreETHome}-${prediction.scoreETAway}` : ''}
          {prediction.scorePenHome !== undefined ? ` · Pens: ${prediction.scorePenHome}-${prediction.scorePenAway}` : ''}
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

  useEffect(() => { const unsub = subscribeFixtures(setFixturesArr); return unsub }, [])

  useEffect(() => {
    if (!playerId) return
    getPlayerPredictions(playerId).then(preds => {
      const map = {}
      preds.forEach(p => { map[p.fixtureId] = p })
      setPredictions(map)
    })
  }, [playerId])

  useEffect(() => { getDeadline().then(d => { setDeadline(d); setLoading(false) }) }, [])

  const now = new Date()
  const isLocked = deadline ? now > new Date(deadline) : false

  async function handleSave(fixtureId, data) {
    await savePrediction(playerId, fixtureId, data)
    setPredictions(prev => ({ ...prev, [fixtureId]: { ...prev[fixtureId], ...data, fixtureId } }))
  }

  // Build fixtures map
  const fixturesMap = {}
  fixturesArr.forEach(f => { fixturesMap[f.id] = f })

  // ── Cascade knockout resolution ──────────────────────────────────────────
  // Helper: get winner of a fixture from predictions
  function getWinner(fid, resolvedTeams) {
    const pred = predictions[fid]
    const fixture = resolvedTeams[fid] || fixturesMap[fid]
    if (!pred || !fixture || fixture.homeTeam === 'TBD' || fixture.awayTeam === 'TBD') return null
    return getKnockoutWinner(pred, fixture)
  }

  // Helper: get LOSER of a fixture (for 3rd place)
  function getLoser(fid, resolvedTeams) {
    const pred = predictions[fid]
    const fixture = resolvedTeams[fid] || fixturesMap[fid]
    if (!pred || !fixture || fixture.homeTeam === 'TBD' || fixture.awayTeam === 'TBD') return null
    const winner = getKnockoutWinner(pred, fixture)
    if (!winner) return null
    return winner === fixture.homeTeam ? fixture.awayTeam : fixture.homeTeam
  }

  // Start with base fixtures
  const resolvedTeams = { ...fixturesMap }

  // 1. Resolve Round of 32 from group predictions
  try {
    const r32 = generateRoundOf32(fixturesMap, predictions)
    r32.forEach(r => {
      if (resolvedTeams[r.id]) {
        resolvedTeams[r.id] = { ...resolvedTeams[r.id], homeTeam: r.homeTeam, awayTeam: r.awayTeam }
      }
    })
  } catch (e) {}

  // 2. Resolve Round of 16 from R32 winners
  Object.entries(R32_TO_R16).forEach(([r16id, [fid1, fid2]]) => {
    const home = getWinner(fid1, resolvedTeams)
    const away = getWinner(fid2, resolvedTeams)
    if (resolvedTeams[r16id]) {
      resolvedTeams[r16id] = {
        ...resolvedTeams[r16id],
        homeTeam: home || 'TBD',
        awayTeam: away || 'TBD',
      }
    }
  })

  // 3. Resolve Quarter-finals from R16 winners
  Object.entries(R16_TO_QF).forEach(([qfid, [fid1, fid2]]) => {
    const home = getWinner(fid1, resolvedTeams)
    const away = getWinner(fid2, resolvedTeams)
    if (resolvedTeams[qfid]) {
      resolvedTeams[qfid] = {
        ...resolvedTeams[qfid],
        homeTeam: home || 'TBD',
        awayTeam: away || 'TBD',
      }
    }
  })

  // 4. Resolve Semi-finals from QF winners
  Object.entries(QF_TO_SF).forEach(([sfid, [fid1, fid2]]) => {
    const home = getWinner(fid1, resolvedTeams)
    const away = getWinner(fid2, resolvedTeams)
    if (resolvedTeams[sfid]) {
      resolvedTeams[sfid] = {
        ...resolvedTeams[sfid],
        homeTeam: home || 'TBD',
        awayTeam: away || 'TBD',
      }
    }
  })

  // 5. Resolve Final from SF winners
  Object.entries(SF_TO_FINAL).forEach(([fid, [sf1, sf2]]) => {
    const home = getWinner(sf1, resolvedTeams)
    const away = getWinner(sf2, resolvedTeams)
    if (resolvedTeams[fid]) {
      resolvedTeams[fid] = {
        ...resolvedTeams[fid],
        homeTeam: home || 'TBD',
        awayTeam: away || 'TBD',
      }
    }
  })

  // 6. Resolve 3rd place from SF losers
  Object.entries(SF_TO_3RD).forEach(([fid, [sf1, sf2]]) => {
    const home = getLoser(sf1, resolvedTeams)
    const away = getLoser(sf2, resolvedTeams)
    if (resolvedTeams[fid]) {
      resolvedTeams[fid] = {
        ...resolvedTeams[fid],
        homeTeam: home || 'TBD',
        awayTeam: away || 'TBD',
      }
    }
  })

  const allResolved = Object.values(resolvedTeams)

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

  // Progress
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

      {!isLocked && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.3rem' }}>
            <span>Group stage predictions</span>
            <span style={{ color: predictedCount === 72 ? 'var(--green)' : 'var(--gold)' }}>{predictedCount}/72</span>
          </div>
          <div style={{ height: 4, background: 'var(--panel2)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(predictedCount / 72) * 100}%`, background: predictedCount === 72 ? 'var(--green)' : 'var(--gold)', borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
          {predictedCount === 72
            ? <div style={{ fontSize: '0.75rem', color: 'var(--green)', marginTop: '0.3rem' }}>✓ All group predictions done — predict the knockouts below!</div>
            : <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.3rem' }}>Complete all group predictions to auto-populate knockout fixtures</div>
          }
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        {[['all','All'],['group','Groups'],['knockout','⚔️ Knockouts']].map(([val, label]) => (
          <button key={val} className="btn btn-ghost"
            style={{ fontSize: '0.82rem', padding: '0.35rem 0.9rem', ...(stageFilter === val ? { borderColor: 'var(--gold)', color: 'var(--gold)' } : {}) }}
            onClick={() => setStageFilter(val)}>{label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {['all','upcoming','predicted'].map(f => (
          <button key={f} className="btn btn-ghost"
            style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem', ...(filter === f ? { borderColor: 'var(--cyan)', color: 'var(--cyan)' } : {}) }}
            onClick={() => setFilter(f)}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
        ))}
      </div>

      {allResolved.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}><p>No fixtures loaded yet.</p></div>
      )}

      {visibleStages.map((stage, idx) => {
        const isKnockoutStage = KNOCKOUT_STAGES.includes(stage)
        const stageFixtures = grouped[stage] || []
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
                <span style={{ fontSize: '0.75rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap', fontWeight: 600 }}>Knockout Rounds</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(245,200,66,0.3)' }} />
              </div>
            )}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: isKnockoutStage ? 'var(--gold)' : 'var(--muted)' }}>
                {STAGE_EMOJI[stage] && `${STAGE_EMOJI[stage]} `}{stage}
              </h3>
              {visible.map(f => (
                <FixtureRow key={f.id} fixture={f} prediction={predictions[f.id]} onSave={handleSave} locked={isLocked || f.completed} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
