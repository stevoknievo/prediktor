// src/App.jsx
import { useState, useEffect } from 'react'
import Join from './pages/Join'
import Fixtures from './pages/Fixtures'
import Tournament from './pages/Tournament'
import Leaderboard from './pages/Leaderboard'
import Admin from './pages/Admin'

// Tab bar icons
const Icons = {
  fixtures: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  tournament: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M8 21h8M12 17v4M12 3a4 4 0 100 8 4 4 0 000-8z"/>
      <path d="M6 7H4a2 2 0 00-2 2v1a4 4 0 004 4M18 7h2a2 2 0 012 2v1a4 4 0 01-4 4"/>
    </svg>
  ),
  leaderboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
}

const TABS = [
  { id: 'fixtures', label: 'Fixtures', icon: Icons.fixtures },
  { id: 'tournament', label: 'Tournament', icon: Icons.tournament },
  { id: 'leaderboard', label: 'Standings', icon: Icons.leaderboard },
]

export default function App() {
  const [playerId, setPlayerId] = useState(null)
  const [nickname, setNickname] = useState('')
  const [tab, setTab] = useState('fixtures')
  const [showAdmin, setShowAdmin] = useState(false)

  useEffect(() => {
    const id = localStorage.getItem('prediktor_player_id')
    const name = localStorage.getItem('prediktor_nickname')
    if (id && name) {
      setPlayerId(id)
      setNickname(name)
    }
  }, [])

  // Secret admin access: tap logo 5 times
  const [tapCount, setTapCount] = useState(0)
  function handleLogoTap() {
    const next = tapCount + 1
    setTapCount(next)
    if (next >= 5) { setShowAdmin(true); setTapCount(0) }
  }

  if (!playerId) {
    return <Join onJoin={(id, name) => { setPlayerId(id); setNickname(name) }} />
  }

  if (showAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <nav className="nav">
          <button className="nav-logo" onClick={() => setShowAdmin(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            ← PREDIKTOR
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>ADMIN</span>
        </nav>
        <Admin />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <nav className="nav">
        <button
          className="nav-logo"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={handleLogoTap}
        >
          THE PREDIKTOR
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>⚽</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{nickname}</span>
        </div>
      </nav>

      {/* Page content */}
      <main style={{ flex: 1 }}>
        {tab === 'fixtures' && <Fixtures playerId={playerId} />}
        {tab === 'tournament' && <Tournament playerId={playerId} />}
        {tab === 'leaderboard' && <Leaderboard playerId={playerId} />}
      </main>

      {/* Tab bar */}
      <nav className="tab-bar">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab-item ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
