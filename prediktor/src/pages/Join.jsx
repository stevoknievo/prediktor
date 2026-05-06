// src/pages/Join.jsx
import { useState } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'

function makePlayerId(nickname, pin) {
  return `${nickname.trim().toLowerCase().replace(/\s+/g, '_')}_${pin}`
}

export default function Join({ onJoin }) {
  const [mode, setMode] = useState('choice') // 'choice' | 'new' | 'returning'
  const [nickname, setNickname] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleNew(e) {
    e.preventDefault()
    const name = nickname.trim()
    if (!name || name.length < 2) { setError('Enter a nickname (2+ characters)'); return }
    if (name.length > 20) { setError('Nickname too long (max 20 chars)'); return }
    if (!/^\d{4}$/.test(pin)) { setError('PIN must be exactly 4 digits'); return }

    setLoading(true)
    setError('')
    const id = makePlayerId(name, pin)
    try {
      const existing = await getDoc(doc(db, 'players', id))
      if (existing.exists()) {
        setError('That nickname + PIN is already taken. Choose a different PIN.')
        setLoading(false)
        return
      }
      await setDoc(doc(db, 'players', id), {
        id,
        nickname: name,
        totalPoints: 0,
        createdAt: serverTimestamp()
      })
      localStorage.setItem('prediktor_player_id', id)
      localStorage.setItem('prediktor_nickname', name)
      onJoin(id, name)
    } catch (err) {
      setError('Could not join. Try again.')
      console.error(err)
    }
    setLoading(false)
  }

  async function handleReturn(e) {
    e.preventDefault()
    const name = nickname.trim()
    if (!name) { setError('Enter your nickname'); return }
    if (!/^\d{4}$/.test(pin)) { setError('PIN must be exactly 4 digits'); return }

    setLoading(true)
    setError('')
    const id = makePlayerId(name, pin)
    try {
      const existing = await getDoc(doc(db, 'players', id))
      if (!existing.exists()) {
        setError('No player found with that nickname and PIN. Check your details or join as new.')
        setLoading(false)
        return
      }
      localStorage.setItem('prediktor_player_id', id)
      localStorage.setItem('prediktor_nickname', existing.data().nickname)
      onJoin(id, existing.data().nickname)
    } catch (err) {
      setError('Could not sign in. Try again.')
      console.error(err)
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', background: 'var(--dark)' }}>
      <div style={{
        position: 'fixed', inset: 0, opacity: 0.04,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(255,255,255,0.5) 60px, rgba(255,255,255,0.5) 61px)',
        pointerEvents: 'none'
      }} />

      <div style={{ textAlign: 'center', maxWidth: 440, width: '100%', position: 'relative' }}>
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

        {mode === 'choice' && (
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>WELCOME</h3>
            <button className="btn btn-primary w-full" style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }} onClick={() => setMode('new')}>
              JOIN THE GAME
            </button>
            <button className="btn btn-ghost w-full" style={{ fontSize: '1.1rem' }} onClick={() => setMode('returning')}>
              I'VE PLAYED BEFORE
            </button>
          </div>
        )}

        {mode === 'new' && (
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>CREATE YOUR ACCOUNT</h3>
            <p style={{ fontSize: '0.82rem', marginBottom: '1.25rem' }}>
              Choose a nickname and a 4-digit PIN. You'll use these to log back in on any device.
            </p>
            <form onSubmit={handleNew}>
              <input
                type="text"
                placeholder="Nickname (e.g. BigMatch Steve)"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                maxLength={20}
                autoFocus
                style={{ marginBottom: '0.75rem' }}
              />
              <input
                type="password"
                inputMode="numeric"
                placeholder="4-digit PIN"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
                style={{ marginBottom: '0.75rem', letterSpacing: '0.3em', fontSize: '1.3rem', textAlign: 'center' }}
              />
              {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>}
              <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ fontSize: '1.2rem' }}>
                {loading ? 'Joining...' : 'JOIN'}
              </button>
            </form>
            <button onClick={() => { setMode('choice'); setError('') }} style={{ marginTop: '1rem', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.85rem' }}>
              ← Back
            </button>
          </div>
        )}

        {mode === 'returning' && (
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>WELCOME BACK</h3>
            <p style={{ fontSize: '0.82rem', marginBottom: '1.25rem' }}>
              Enter the nickname and PIN you used when you joined.
            </p>
            <form onSubmit={handleReturn}>
              <input
                type="text"
                placeholder="Your nickname"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                maxLength={20}
                autoFocus
                style={{ marginBottom: '0.75rem' }}
              />
              <input
                type="password"
                inputMode="numeric"
                placeholder="Your 4-digit PIN"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
                style={{ marginBottom: '0.75rem', letterSpacing: '0.3em', fontSize: '1.3rem', textAlign: 'center' }}
              />
              {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>}
              <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ fontSize: '1.2rem' }}>
                {loading ? 'Signing in...' : 'SIGN IN'}
              </button>
            </form>
            <button onClick={() => { setMode('choice'); setError('') }} style={{ marginTop: '1rem', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.85rem' }}>
              ← Back
            </button>
          </div>
        )}

        <p style={{ marginTop: '1.25rem', fontSize: '0.8rem' }}>
          {mode === 'new' ? 'Remember your PIN — you\'ll need it to log back in on any device.' : ''}
        </p>
      </div>
    </div>
  )
}