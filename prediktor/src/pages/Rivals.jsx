// src/pages/Rivals.jsx
import { useState, useEffect } from 'react'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { generateRoundOf32, getKnockoutWinner } from '../lib/qualification'

const R32_TO_R16 = {
  'm089': ['m074','m077'], 'm090': ['m073','m075'],
  'm091': ['m076','m078'], 'm092': ['m079','m080'],
  'm093': ['m083','m084'], 'm094': ['m081','m082'],
  'm095': ['m086','m088'], 'm096': ['m085','m087'],
}
const R16_TO_QF = {
  'm097': ['m089','m090'], 'm098': ['m093','m094'],
  'm099': ['m091','m092'], 'm100': ['m095','m096'],
}
const QF_TO_SF = {
  'm101': ['m097','m098'], 'm102': ['m099','m100'],
}
const SF_TO_FINAL = { 'm104': ['m101','m102'] }
const SF_TO_3RD = { 'm103': ['m101','m102'] }

function resolveKnockoutTeams(fixturesMap, predictions) {
  const resolved = { ...fixturesMap }

  function getWinner(fid) {
    const pred = predictions[fid]
    const fixture = resolved[fid]
    if (!pred || !fixture || fixture.homeTeam === 'TBD' || fixture.awayTeam === 'TBD') return null
    return getKnockoutWinner(pred, fixture)
  }

  function getLoser(fid) {
    const pred = predictions[fid]
    const fixture = resolved[fid]
    if (!pred || !fixture || fixture.homeTeam === 'TBD' || fixture.awayTeam === 'TBD') return null
    const w = getKnockoutWinner(pred, fixture)
    if (!w) return null
    return w === fixture.homeTeam ? fixture.awayTeam : fixture.homeTeam
  }

  try {
    const r32 = generateRoundOf32(fixturesMap, predictions)
    r32.forEach(r => {
      if (resolved[r.id]) resolved[r.id] = { ...resolved[r.id], homeTeam: r.homeTeam, awayTeam: r.awayTeam }
    })
  } catch (e) {}

  Object.entries(R32_TO_R16).forEach(([id, [f1, f2]]) => {
    if (resolved[id]) resolved[id] = { ...resolved[id], homeTeam: getWinner(f1) || 'TBD', awayTeam: getWinner(f2) || 'TBD' }
  })
  Object.entries(R16_TO_QF).forEach(([id, [f1, f2]]) => {
    if (resolved[id]) resolved[id] = { ...resolved[id], homeTeam: getWinner(f1) || 'TBD', awayTeam: getWinner(f2) || 'TBD' }
  })
  Object.entries(QF_TO_SF).forEach(([id, [f1, f2]]) => {
    if (resolved[id]) resolved[id] = { ...resolved[id], homeTeam: getWinner(f1) || 'TBD', awayTeam: getWinner(f2) || 'TBD' }
  })
  Object.entries(SF_TO_FINAL).forEach(([id, [f1, f2]]) => {
    if (resolved[id]) resolved[id] = { ...resolved[id], homeTeam: getWinner(f1) || 'TBD', awayTeam: getWinner(f2) || 'TBD' }
  })
  Object.entries(SF_TO_3RD).forEach(([id, [f1, f2]]) => {
    if (resolved[id]) resolved[id] = { ...resolved[id], homeTeam: getLoser(f1) || 'TBD', awayTeam: getLoser(f2) || 'TBD' }
  })

  return resolved
}

async function getAllTournamentPredictions() {
  const [playersSnap, predsSnap] = await Promise.all([
    getDocs(collection(db, 'players')),
    getDocs(collection(db, 'tournamentPredictions'))
  ])
  const tournPreds = {}
  predsSnap.docs.forEach(d => { tournPreds[d.id] = d.data() })
  
  return playersSnap.docs.map(d => {
    const player = d.data()
    const tourn = tournPreds[player.id] || {}
    return {
      ...tourn,
      playerId: player.id,
      nickname: player.nickname,
      totalPoints: player.totalPoints || 0,
    }
  })
}

function calcMatchPoints(fixture, pred) {
  if (!fixture?.completed || !pred) return 0
  const h90 = Number(pred.score90Home), a90 = Number(pred.score90Away)
  const actH90 = Number(fixture.score90Home), actA90 = Number(fixture.score90Away)
  let total = 0
  if (!isNaN(h90) && !isNaN(a90) && !isNaN(actH90) && !isNaN(actA90)) {
    const predResult = h90 > a90 ? 'h' : a90 > h90 ? 'a' : 'd'
    const actResult = actH90 > actA90 ? 'h' : actA90 > actH90 ? 'a' : 'd'
    if (h90 === actH90 && a90 === actA90) total += 6
    else if (predResult === actResult) total += 3
  }
  if (fixture.hasExtraTime && pred.scoreETHome !== undefined && pred.scoreETHome !== '') {
    const hET = Number(pred.scoreETHome), aET = Number(pred.scoreETAway)
    const actHET = Number(fixture.scoreAfterETHome), actAET = Number(fixture.scoreAfterETAway)
    if (!isNaN(hET) && !isNaN(aET) && !isNaN(actHET) && !isNaN(actAET)) {
      const predResET = hET > aET ? 'h' : aET > hET ? 'a' : 'd'
      const actResET = actHET > actAET ? 'h' : actAET > actHET ? 'a' : 'd'
      if (hET === actHET && aET === actAET) total += 4
      else if (predResET === actResET) total += 2
    }
  }
  if (fixture.hasPenalties && pred.scorePenHome !== undefined && pred.scorePenHome !== '') {
    const hPen = Number(pred.scorePenHome), aPen = Number(pred.scorePenAway)
    const actHPen = Number(fixture.scorePenHome), actAPen = Number(fixture.scorePenAway)
    if (!isNaN(hPen) && !isNaN(aPen) && !isNaN(actHPen) && !isNaN(actAPen)) {
      if (hPen === actHPen && aPen === actAPen) total += 6
      else if ((hPen > aPen ? 'h' : 'a') === (actHPen > actAPen ? 'h' : 'a')) total += 3
    }
  }
  return total
}

// Modal showing all fixture predictions for a player
function FixturePredictionsModal({ nickname, playerId, onClose, fixtures }) {
  const [predictions, setPredictions] = useState({})
  const [resolvedFixtures, setResolvedFixtures] = useState(fixtures)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDocs(collection(db, 'predictions')).then(snap => {
      const preds = {}
      snap.docs.forEach(d => {
        const p = d.data()
        if (p.playerId === playerId) preds[p.fixtureId] = p
      })
      setPredictions(preds)
      setResolvedFixtures(resolveKnockoutTeams(fixtures, preds))
      setLoading(false)
    })
  }, [playerId])

  const STAGE_ORDER = [
    'Group A','Group B','Group C','Group D','Group E','Group F',
    'Group G','Group H','Group I','Group J','Group K','Group L',
    'Round of 32','Round of 16','Quarter-final','Semi-final','3rd Place Final','Final'
  ]

  const fixturesList = Object.values(resolvedFixtures)
    .filter(f => predictions[f.id])
    .sort((a, b) => {
      const ai = STAGE_ORDER.indexOf(a.stage), bi = STAGE_ORDER.indexOf(b.stage)
      if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
      return new Date(a.date) - new Date(b.date)
    })

  const totalPts = fixturesList.reduce((sum, f) => sum + calcMatchPoints(f, predictions[f.id]), 0)
  const predictedCount = fixturesList.length
  const completedWithPred = fixturesList.filter(f => f.completed).length

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--bg)',
        maxWidth: 560, width: '100%',
        margin: '1rem auto',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {/* Header */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(245,200,66,0.06)',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--gold)' }}>
              {nickname}'s Fixture Picks
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
              {predictedCount} predictions · {completedWithPred} played · {totalPts} pts scored
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--muted)',
            fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1, padding: '0.25rem'
          }}>×</button>
        </div>

        {/* Content */}
        <div style={{ padding: '1rem 1.25rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner" /></div>
          ) : fixturesList.length === 0 ? (
            <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem 0' }}>No fixture predictions yet.</p>
          ) : (
            <>
              {/* Group by stage */}
              {STAGE_ORDER.filter(stage =>
                fixturesList.some(f => f.stage === stage)
              ).map(stage => {
                const stageFixtures = fixturesList.filter(f => f.stage === stage)
                if (!stageFixtures.length) return null
                return (
                  <div key={stage} style={{ marginBottom: '1.25rem' }}>
                    <div style={{
                      fontSize: '0.72rem', color: 'var(--muted)',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                      fontWeight: 600, marginBottom: '0.5rem'
                    }}>{stage}</div>
                    {stageFixtures.map(f => {
                      const pred = predictions[f.id]
                      if (!pred) return null
                      const pts = calcMatchPoints(f, pred)
                      const actH = f.score90Home, actA = f.score90Away
                      const predH = pred.score90Home, predA = pred.score90Away
                      const correct = f.completed && Number(predH) === Number(actH) && Number(predA) === Number(actA)
                      const correctResult = f.completed && !correct && (() => {
                        const pr = Number(predH) > Number(predA) ? 'h' : Number(predA) > Number(predH) ? 'a' : 'd'
                        const ar = Number(actH) > Number(actA) ? 'h' : Number(actA) > Number(actH) ? 'a' : 'd'
                        return pr === ar
                      })()

                      return (
                        <div key={f.id} style={{
                          display: 'flex', alignItems: 'center',
                          padding: '0.5rem 0.75rem',
                          marginBottom: '0.35rem',
                          borderRadius: 8,
                          background: correct ? 'rgba(72,199,116,0.08)' :
                                      correctResult ? 'rgba(245,200,66,0.06)' :
                                      'var(--panel)',
                          border: `1px solid ${correct ? 'rgba(72,199,116,0.25)' :
                                                correctResult ? 'rgba(245,200,66,0.15)' :
                                                'var(--border)'}`,
                          gap: '0.5rem',
                        }}>
                          {/* Teams */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {f.homeTeam === 'TBD' ? '?' : (f.homeTeamCode || f.homeTeam)} vs {f.awayTeam === 'TBD' ? '?' : (f.awayTeamCode || f.awayTeam)}
                            </div>
                          </div>

                         {/* Their prediction */}
                          <div style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '1rem',
                            color: correct ? 'var(--green)' : correctResult ? 'var(--gold)' : 'var(--white)',
                            minWidth: 36, textAlign: 'center'
                          }}>
                            <div>{predH}-{predA}</div>
                            {pred.scoreETHome !== undefined && pred.scoreETHome !== '' && (
                              <div style={{ fontSize: '0.65rem', color: 'var(--cyan)', marginTop: '0.1rem' }}>
                                ET {pred.scoreETHome}-{pred.scoreETAway}
                              </div>
                            )}
                            {pred.scorePenHome !== undefined && pred.scorePenHome !== '' && (
                              <div style={{ fontSize: '0.65rem', color: 'var(--red)', marginTop: '0.1rem' }}>
                                Pens {pred.scorePenHome}-{pred.scorePenAway}
                              </div>
                            )}
                          </div>

                          {/* Actual result */}
                          {f.completed ? (
                            <div style={{ fontSize: '0.72rem', color: 'var(--muted)', minWidth: 44, textAlign: 'center' }}>
                              <div>({actH}-{actA})</div>
                              {f.hasExtraTime && f.scoreAfterETHome !== null && (
                                <div style={{ color: 'var(--cyan)', marginTop: '0.1rem' }}>
                                  ET {f.scoreAfterETHome}-{f.scoreAfterETAway}
                                </div>
                              )}
                              {f.hasPenalties && f.scorePenHome !== null && (
                                <div style={{ color: 'var(--red)', marginTop: '0.1rem' }}>
                                  Pens {f.scorePenHome}-{f.scorePenAway}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.68rem', color: 'var(--muted)', minWidth: 44, textAlign: 'center' }}>
                              upcoming
                            </div>
                          )}

                          {/* Points */}
                          {f.completed && (
                            <div style={{
                              fontFamily: 'var(--font-display)',
                              fontSize: '0.82rem',
                              color: pts > 0 ? 'var(--gold)' : 'var(--muted)',
                              minWidth: 36, textAlign: 'right'
                            }}>
                              {pts > 0 ? `+${pts}` : '0'}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>
    </div>
  )
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

function PlayerCard({ pred, isMe, fixtures }) {
  const [expanded, setExpanded] = useState(false)
  const [showFixtures, setShowFixtures] = useState(false)

  return (
    <>
      {showFixtures && (
        <FixturePredictionsModal
          nickname={pred.nickname}
          playerId={pred.playerId}
          onClose={() => setShowFixtures(false)}
          fixtures={fixtures}
        />
      )}
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

            {/* View fixture predictions button */}
            <button
              className="btn btn-ghost w-full"
              style={{ marginBottom: '1.25rem', fontSize: '0.85rem' }}
              onClick={e => { e.stopPropagation(); setShowFixtures(true) }}
            >
              📋 View fixture predictions
            </button>

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

            <Section title="Assisters" points="2pts/assist • 10pts top assister">
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
    </>
  )
}

export default function Rivals({ playerId, initialPlayerId }) {
  const [predictions, setPredictions] = useState([])
  const [fixtures, setFixtures] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([
      getAllTournamentPredictions(),
      getDocs(collection(db, 'fixtures'))
    ]).then(([preds, fixturesSnap]) => {
      const fixturesMap = {}
      fixturesSnap.docs.forEach(d => { fixturesMap[d.id] = d.data() })
      setFixtures(fixturesMap)
      preds.sort((a, b) => {
        if (a.playerId === playerId) return -1
        if (b.playerId === playerId) return 1
        return b.totalPoints - a.totalPoints
      })
      setPredictions(preds)
      setLoading(false)
    })
  }, [playerId])

  useEffect(() => {
    if (initialPlayerId) {
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
            fixtures={fixtures}
          />
        </div>
      ))}
    </div>
  )
}
