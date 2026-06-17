// src/pages/Leaderboard.jsx
import { useState, useEffect } from 'react'
import { subscribeLeaderboard } from '../lib/db'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'

const MEDALS = ['🥇', '🥈', '🥉']

function isToday(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
}

export default function Leaderboard({ playerId, onViewRival }) {
  const [players, setPlayers] = useState([])
  const [seeds, setSeeds] = useState({})
  const [showSeeds, setShowSeeds] = useState(false)
  const [loading, setLoading] = useState(true)
  const [todayFixtures, setTodayFixtures] = useState([])
  const [allPredictions, setAllPredictions] = useState({}) // playerId -> { fixtureId -> pred }

  useEffect(() => {
    const unsub = subscribeLeaderboard(data => {
      setPlayers(data)
      setLoading(false)
    })
    return unsub
  }, [])

  useEffect(() => {
    getDoc(doc(db, 'meta', 'leaderboardSeeds')).then(snap => {
      if (!snap.exists()) return
      const seedMap = {}
      for (const entry of (snap.data().seeds || [])) {
        seedMap[entry.nickname] = entry
      }
      setSeeds(seedMap)
    })
  }, [])

  // Load today's fixtures and everyone's predictions for them
  useEffect(() => {
    Promise.all([
      getDocs(collection(db, 'fixtures')),
      getDocs(collection(db, 'predictions')),
    ]).then(([fixturesSnap, predsSnap]) => {
      const today = fixturesSnap.docs
        .map(d => d.data())
        .filter(f => isToday(f.date))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
      setTodayFixtures(today)

      const todayIds = new Set(today.map(f => f.id))
      const predsByPlayer = {}
      predsSnap.docs.forEach(d => {
        const p = d.data()
        if (!todayIds.has(p.fixtureId)) return
        if (!predsByPlayer[p.playerId]) predsByPlayer[p.playerId] = {}
        predsByPlayer[p.playerId][p.fixtureId] = p
      })
      setAllPredictions(predsByPlayer)
    })
  }, [])

  if (loading) return <div className="page"><div className="spinner" /></div>

  const myRank = players.findIndex(p => p.id === playerId) + 1
  const hasSeedData = Object.keys(seeds).length > 0
  const hasTodayFixtures = todayFixtures.length > 0

  function renderTodayRow(player) {
    const preds = allPredictions[player.id]
    if (!preds || Object.keys(preds).length === 0) return null

    const items = todayFixtures
      .filter(f => preds[f.id])
      .map(f => {
        const pred = preds[f.id]
        const homeCode = f.homeTeamCode || f.homeTeam?.slice(0, 3).toUpperCase()
        const awayCode = f.awayTeamCode || f.awayTeam?.slice(0, 3).toUpperCase()

        if (f.completed) {
          const predH = Number(pred.score90Home), predA = Number(pred.score90Away)
          const actH = Number(f.score90Home), actA = Number(f.score90Away)
          const correctScore = predH === actH && predA === actA
          const predResult = predH > predA ? 'h' : predA > predH ? 'a' : 'd'
          const actResult = actH > actA ? 'h' : actA > actH ? 'a' : 'd'
          const correctResult = !correctScore && predResult === actResult
          const color = correctScore ? 'var(--green)' : correctResult ? 'var(--gold)' : 'rgba(255,255,255,0.45)'
          return (
            <span key={f.id} style={{ color }}>
              {homeCode} {actH}-{actA} {awayCode}
            </span>
          )
        }
        // Not played yet — show their prediction
        return (
          <span key={f.id} style={{ color: 'rgba(255,255,255,0.5)' }}>
            {homeCode} {pred.score90Home}-{pred.score90Away} {awayCode}
          </span>
        )
      })

    if (items.length === 0) return null

    return (
      <div style={{
        marginTop: '0.5rem', paddingTop: '0.5rem',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        fontSize: '0.78rem', fontFamily: 'var(--font-display)',
        display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'baseline',
      }}>
        <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-body)' }}>
          Today
        </span>
        {items}
      </div>
    )
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h2 style={{ margin: 0 }}>LEADERBOARD</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {hasSeedData && (
            <button
              className="btn btn-ghost"
              style={{ fontSize: '0.85rem', padding: '0.35rem 0.9rem', color: 'rgba(255,255,255,0.85)', borderColor: 'rgba(255,255,255,0.25)' }}
              onClick={() => setShowSeeds(s => !s)}
            >
              {showSeeds ? 'Hide seeds' : '🔮 Show seeds'}
            </button>
          )}
          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
            {players.length} player{players.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {myRank > 0 && (
        <div className="card" style={{
          marginBottom: '1rem',
          padding: '0.75rem 1rem',
          background: 'rgba(245,200,66,0.08)',
          borderColor: 'rgba(245,200,66,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Your position</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--gold)', lineHeight: 1.1 }}>
              #{myRank} <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.55)' }}>of {players.length}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Points</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--gold)', lineHeight: 1.1 }}>
              {players[myRank - 1]?.totalPoints || 0}
            </div>
          </div>
          {hasSeedData && seeds[players[myRank - 1]?.nickname] && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>AI seed</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'rgba(99,102,241,0.9)', lineHeight: 1.1 }}>
                #{seeds[players[myRank - 1]?.nickname]?.seed}
              </div>
            </div>
          )}
        </div>
      )}

      {players.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>No players yet. Share the link and get your mates in!</p>
        </div>
      ) : (
        <div>
          {players.map((player, i) => {
            const isMe = player.id === playerId
            const rank = i + 1
            const seedData = seeds[player.nickname]
            const seedNum = seedData?.seed
            const todayRow = hasTodayFixtures ? renderTodayRow(player) : null

            return (
              <div
                key={player.id}
                className="card"
                style={{
                  marginBottom: '0.35rem',
                  padding: '0.6rem 0.875rem',
                  ...(isMe ? { borderColor: 'rgba(245,200,66,0.4)', background: 'rgba(245,200,66,0.06)' } : {})
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {/* Rank */}
                  <div style={{
                    width: 28, textAlign: 'center', flexShrink: 0,
                    fontFamily: 'var(--font-display)',
                    fontSize: rank <= 3 ? '1.2rem' : '0.95rem',
                    color: rank === 1 ? 'var(--gold)' : rank === 2 ? '#c0c0c0' : rank === 3 ? '#cd7f32' : 'rgba(255,255,255,0.5)'
                  }}>
                    {rank <= 3 ? MEDALS[rank - 1] : rank}
                  </div>

                  {/* Name + view picks */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '0.95rem',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        color: isMe ? 'var(--gold)' : 'var(--white)'
                      }}>
                        {player.nickname}
                      </span>
                      {isMe && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--gold)', fontFamily: 'var(--font-body)' }}>YOU</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.1rem' }}>
                      <button
                        onClick={() => onViewRival && onViewRival(player.id)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--cyan)', fontSize: '0.72rem', padding: 0,
                          textDecoration: 'underline'
                        }}
                      >
                        View picks
                      </button>
                      {showSeeds && seedData?.reason && (
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {seedData.reason}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* AI Seed badge */}
                  {hasSeedData && seedNum && (
                    <div style={{
                      flexShrink: 0,
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-display)',
                      color: showSeeds ? 'rgba(99,102,241,0.9)' : 'rgba(255,255,255,0.4)',
                      minWidth: 32, textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>seed</div>
                      <div>#{seedNum}</div>
                    </div>
                  )}

                  {/* Points */}
                  <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 40 }}>
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.2rem',
                      color: isMe ? 'var(--gold)' : 'var(--white)',
                      lineHeight: 1
                    }}>
                      {player.totalPoints || 0}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>pts</div>
                  </div>
                </div>

                {todayRow}
              </div>
            )
          })}
        </div>
      )}

      {hasSeedData && (
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: '0.75rem' }}>
          🔮 AI seeds generated before tournament based on predicted final standings
        </p>
      )}
    </div>
  )
}
