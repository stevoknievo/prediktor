// src/pages/Leaderboard.jsx
import { useState, useEffect } from 'react'
import { subscribeLeaderboard } from '../lib/db'

const MEDALS = ['🥇', '🥈', '🥉']

export default function Leaderboard({ playerId }) {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeLeaderboard(data => {
      setPlayers(data)
      setLoading(false)
    })
    return unsub
  }, [])

  if (loading) return <div className="page"><div className="spinner" /></div>

  const myRank = players.findIndex(p => p.id === playerId) + 1

  return (
    <div className="page">
      <h2 style={{ marginBottom: '0.25rem' }}>LEADERBOARD</h2>
      <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        {players.length} player{players.length !== 1 ? 's' : ''} in the game
      </p>

      {myRank > 0 && (
        <div className="card" style={{ marginBottom: '1.25rem', background: 'rgba(245,200,66,0.08)', borderColor: 'rgba(245,200,66,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>Your position</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--gold)' }}>
                #{myRank} of {players.length}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>Points</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--gold)' }}>
                {players[myRank - 1]?.totalPoints || 0}
              </div>
            </div>
          </div>
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
            return (
              <div
                key={player.id}
                className="card"
                style={{
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.9rem 1rem',
                  ...(isMe ? { borderColor: 'rgba(245,200,66,0.4)', background: 'rgba(245,200,66,0.06)' } : {})
                }}
              >
                {/* Rank */}
                <div style={{
                  width: 32, textAlign: 'center', flexShrink: 0,
                  fontFamily: 'var(--font-display)',
                  fontSize: rank <= 3 ? '1.4rem' : '1.1rem',
                  color: rank === 1 ? 'var(--gold)' : rank === 2 ? '#c0c0c0' : rank === 3 ? '#cd7f32' : 'var(--muted)'
                }}>
                  {rank <= 3 ? MEDALS[rank - 1] : rank}
                </div>

                {/* Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.1rem',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    color: isMe ? 'var(--gold)' : 'var(--white)'
                  }}>
                    {player.nickname}
                    {isMe && <span style={{ fontSize: '0.7rem', color: 'var(--gold)', marginLeft: '0.5rem', fontFamily: 'var(--font-body)' }}>YOU</span>}
                  </div>
                </div>

                {/* Points */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: isMe ? 'var(--gold)' : 'var(--white)' }}>
                    {player.totalPoints || 0}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase' }}>pts</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
