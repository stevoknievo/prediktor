// src/pages/Leaderboard.jsx
import { useState, useEffect } from 'react'
import { subscribeLeaderboard } from '../lib/db'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

const MEDALS = ['🥇', '🥈', '🥉']

export default function Leaderboard({ playerId, onViewRival }) {
  const [players, setPlayers] = useState([])
  const [seeds, setSeeds] = useState({}) // nickname -> { seed, reason }
  const [showSeeds, setShowSeeds] = useState(false)
  const [loading, setLoading] = useState(true)

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

  if (loading) return <div className="page"><div className="spinner" /></div>

  const myRank = players.findIndex(p => p.id === playerId) + 1
  const hasSeedData = Object.keys(seeds).length > 0

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h2 style={{ margin: 0 }}>LEADERBOARD</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {hasSeedData && (
            <button
              className="btn btn-ghost"
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.7rem' }}
              onClick={() => setShowSeeds(s => !s)}
            >
              {showSeeds ? 'Hide seeds' : '🔮 Show seeds'}
            </button>
          )}
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
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
            <div style={{ fontSize: '0.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Your position</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--gold)', lineHeight: 1.1 }}>
              #{myRank} <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>of {players.length}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Points</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--gold)', lineHeight: 1.1 }}>
              {players[myRank - 1]?.totalPoints || 0}
            </div>
          </div>
          {hasSeedData && seeds[players[myRank - 1]?.nickname] && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>AI seed</div>
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

            return (
              <div
                key={player.id}
                className="card"
                style={{
                  marginBottom: '0.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.6rem 0.875rem',
                  ...(isMe ? { borderColor: 'rgba(245,200,66,0.4)', background: 'rgba(245,200,66,0.06)' } : {})
                }}
              >
                {/* Rank */}
                <div style={{
                  width: 28, textAlign: 'center', flexShrink: 0,
                  fontFamily: 'var(--font-display)',
                  fontSize: rank <= 3 ? '1.2rem' : '0.95rem',
                  color: rank === 1 ? 'var(--gold)' : rank === 2 ? '#c0c0c0' : rank === 3 ? '#cd7f32' : 'var(--muted)'
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
                      <span style={{ fontSize: '0.65rem', color: 'var(--gold)', fontFamily: 'var(--font-body)' }}>YOU</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.1rem' }}>
                    <button
                      onClick={() => onViewRival && onViewRival(player.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--cyan)', fontSize: '0.68rem', padding: 0,
                        textDecoration: 'underline'
                      }}
                    >
                      View picks
                    </button>
                    {showSeeds && seedData?.reason && (
                      <span style={{ fontSize: '0.65rem', color: 'var(--muted)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {seedData.reason}
                      </span>
                    )}
                  </div>
                </div>

                {/* AI Seed badge */}
                {hasSeedData && seedNum && (
                  <div style={{
                    flexShrink: 0,
                    fontSize: '0.7rem',
                    fontFamily: 'var(--font-display)',
                    color: showSeeds ? 'rgba(99,102,241,0.9)' : 'var(--muted)',
                    minWidth: 32, textAlign: 'center',
                    opacity: showSeeds ? 1 : 0.5,
                  }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>seed</div>
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
                  <div style={{ fontSize: '0.6rem', color: 'var(--muted)', textTransform: 'uppercase' }}>pts</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {hasSeedData && (
        <p style={{ fontSize: '0.68rem', color: 'var(--muted)', textAlign: 'center', marginTop: '0.75rem' }}>
          🔮 AI seeds generated before tournament based on predicted final standings
        </p>
      )}
    </div>
  )
}
