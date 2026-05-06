// src/App.jsx
import { useState, useEffect } from 'react'
import Join from './pages/Join'
import Fixtures from './pages/Fixtures'
import Tournament from './pages/Tournament'
import Leaderboard from './pages/Leaderboard'
import Rivals from './pages/Rivals'
import Admin from './pages/Admin'

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
  rivals: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
}

const TABS = [
  { id: 'fixtures', label: 'Fixtures', icon: Icons.fixtures },
  { id: 'tournament', label: 'My Picks', icon: Icons.tournament },
  { id: 'rivals', label: 'Rivals', icon: Icons.rivals },
  { id: 'leaderboard', label: 'Standings', icon: Icons.leaderboard },
]

export default function App() {
  const [playerId, setPlayerId] = useState(null)
  const [nickname, setNickname] = useState('')
  const [tab, setTab] = useState('fixtures')
  const [showAdmin, setShowAdmin] = useState(false)
  const [rivalsPlayerId, setRivalsPlayerId] = useState(null)

  useEffect(() => {
    const id = localStorage.getItem('prediktor_player_id')
    const name = localStorage.getItem('prediktor_nickname')
    if (id && name) { setPlayerId(id); setNickname(name) }
  }, [])

  const [tapCount, setTapCount] = useState(0)
  function handleLogoTap() {
    const next = tapCount + 1
    setTapCount(next)
    if (next >= 5) { setShowAdmin(true); setTapCount(0) }
  }

  function handleViewRival(rivalId) {
    setRivalsPlayerId(rivalId)
    setTab('rivals')
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

      <main style={{ flex: 1 }}>
        {tab === 'fixtures' && <Fixtures playerId={playerId} />}
        {tab === 'tournament' && <Tournament playerId={playerId} />}
        {tab === 'rivals' && <Rivals playerId={playerId} initialPlayerId={rivalsPlayerId} />}
        {tab === 'leaderboard' && <Leaderboard playerId={playerId} onViewRival={handleViewRival} />}
      </main>

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
