// src/pages/Join.jsx
import { useState } from 'react'
import { createPlayer, getPlayer } from '../lib/db'

export default function Join({ onJoin }) {
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleJoin(e) {
    e.preventDefault()
    const name = nickname.trim()
    if (!name || name.length < 2) { setError('Enter a nickname (2+ characters)'); return }
    if (name.length > 20) { setError('Nickname too long (max 20 chars)'); return }

    setLoading(true)
    setError('')
    try {
      const id = await createPlayer(name)
      localStorage.setItem('prediktor_player_id', id)
      localStorage.setItem('prediktor_nickname', name)
      onJoin(id, name)
    } catch (err) {
      setError('Could not join. Try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', background: 'var(--dark)' }}>

      {/* Background pitch lines */}
      <div style={{
        position: 'fixed', inset: 0, opacity: 0.04,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(255,255,255,0.5) 60px, rgba(255,255,255,0.5) 61px)',
        pointerEvents: 'none'
      }} />

      <div style={{ textAlign: 'center', maxWidth: 440, width: '100%', position: 'relative' }}>

        {/* Logo mark */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--gold) 0%, #e8a500 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
          boxShadow: '0 0 40px rgba(245,200,66,0.4)'
        }}>
          <span style={{ fontSize: '2rem' }}>⚽</span>
        </div>

        <h1 style={{ marginBottom: '0.25rem', lineHeight: 1 }}>
          <span style={{ color: 'var(--white)' }}>THE </span>
          <span style={{ color: 'var(--gold)' }}>PREDIKTOR</span>
        </h1>
        <p style={{ marginBottom: '2.5rem', fontSize: '1rem' }}>
          World Cup 2026 — Pick your scores. Prove your instincts.
        </p>

        <div className="card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.25rem', textAlign: 'left' }}>ENTER YOUR NAME</h3>

          <form onSubmit={handleJoin}>
            <input
              type="text"
              placeholder="e.g. BigMatch Steve"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              maxLength={20}
              autoFocus
              style={{ marginBottom: '1rem', fontSize: '1.1rem', padding: '0.85rem 1rem' }}
            />
            {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>}
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
              style={{ fontSize: '1.3rem', padding: '0.9rem' }}
            >
              {loading ? 'Joining...' : 'JOIN THE GAME'}
            </button>
          </form>
        </div>

        <p style={{ marginTop: '1.25rem', fontSize: '0.8rem' }}>
          No account needed. Your progress is saved to this device.
        </p>
      </div>
    </div>
  )
}
