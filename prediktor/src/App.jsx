// src/App.jsx
import { useState, useEffect } from 'react'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
import { db } from './lib/firebase'
import Join from './pages/Join'
import Fixtures from './pages/Fixtures'
import Tournament from './pages/Tournament'
import Leaderboard from './pages/Leaderboard'
import Rivals from './pages/Rivals'
import ScoutReport from './pages/ScoutReport'
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
  rivals: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  leaderboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  scout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="8"/>
      <path d="M21 21l-4.35-4.35"/>
      <path d="M11 8v6M8 11h6"/>
    </svg>
  ),
}

const TABS = [
  { id: 'fixtures', label: 'Fixtures', icon: Icons.fixtures },
  { id: 'tournament', label: 'My Picks', icon: Icons.tournament },
  { id: 'rivals', label: 'Rivals', icon: Icons.rivals },
  { id: 'leaderboard', label: 'Standings', icon: Icons.leaderboard },
  { id: 'scout', label: 'Scout', icon: Icons.scout },
]

const GROUP_FIXTURE_IDS = [
  'Group A','Group B','Group C','Group D','Group E','Group F',
  'Group G','Group H','Group I','Group J','Group K','Group L'
].flatMap((_, i) => Array.from({ length: 6 }, (__, j) => `m${String(i * 6 + j + 1).padStart(3, '0')}`))

function CompletenessChecker({ playerId, deadline, onNavigate }) {
  const [issues, setIssues] = useState([])
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!playerId) return
    const dismissedKey = `prediktor_checker_dismissed_${playerId}`
    if (localStorage.getItem(dismissedKey)) { setDismissed(true); return }

    async function check() {
      const [predsSnap, tournSnap] = await Promise.all([
        getDocs(collection(db, 'predictions')),
        getDoc(doc(db, 'tournamentPredictions', playerId)),
      ])

      const myPreds = {}
      predsSnap.docs.forEach(d => {
        const p = d.data()
        if (p.playerId === playerId) myPreds[p.fixtureId] = p
      })

      const found = []

      // Check group fixtures
      const predictedGroup = GROUP_FIXTURE_IDS.filter(fid => {
        const p = myPreds[fid]
        return p && p.score90Home !== undefined && p.score90Home !== ''
      }).length
      if (predictedGroup < 72) {
        found.push({
          tab: 'fixtures',
          icon: '📋',
          text: `${72 - predictedGroup} group fixture${72 - predictedGroup !== 1 ? 's' : ''} not predicted`
        })
      }

      // Check tournament picks
      const tourn = tournSnap.exists() ? tournSnap.data() : {}
      if (!tourn.tournamentWinner) {
        found.push({ tab: 'tournament', icon: '🏆', text: 'No tournament winner picked' })
      }
      const scorers = (tourn.namedScorers || []).filter(Boolean).length
      if (scorers < 3) {
        found.push({ tab: 'tournament', icon: '⚽', text: `Only ${scorers}/3 goal scorers named` })
      }
      const assisters = (tourn.namedAssisters || []).filter(Boolean).length
      if (assisters < 3) {
        found.push({ tab: 'tournament', icon: '🎯', text: `Only ${assisters}/3 assisters named` })
      }
      const goalies = (tourn.namedGoalies || []).filter(Boolean).length
      if (goalies < 3) {
        found.push({ tab: 'tournament', icon: '🧤', text: `Only ${goalies}/3 goalkeepers named` })
      }
      if (!tourn.totalRedCards) {
        found.push({ tab: 'tournament', icon: '🟥', text: 'Total red cards not predicted' })
      }
      if (!tourn.totalYellowCards) {
        found.push({ tab: 'tournament', icon: '🟨', text: 'Total yellow cards not predicted' })
      }

      setIssues(found)
    }
    check()
  }, [playerId])

  if (dismissed || issues.length === 0) return null

  // Don't show after deadline
  if (deadline && new Date() > new Date(deadline)) return null

  const timeLeft = deadline ? (() => {
    const diff = new Date(deadline) - new Date()
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(hours / 24)
    if (days > 1) return `${days} days left`
    if (hours > 1) return `${hours} hours left`
    return 'less than 1 hour left!'
  })() : null

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(245,100,66,0.12) 0%, rgba(245,160,66,0.08) 100%)',
      border: '1px solid rgba(245,130,66,0.35)',
      borderRadius: 'var(--radius)',
      margin: '0.75rem 1rem 0',
      padding: '0.875rem 1rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.85rem',
            color: '#f59042',
            marginBottom: '0.4rem',
            display: 'flex', alignItems: 'center', gap: '0.4rem'
          }}>
            ⚠️ INCOMPLETE PREDICTIONS
            {timeLeft && (
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'var(--font-body)', fontWeight: 400 }}>
                · {timeLeft}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {issues.map((issue, i) => (
              <button
                key={i}
                onClick={() => onNavigate(issue.tab)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  fontSize: '0.82rem', color: 'rgba(240,244,255,0.85)',
                  padding: 0, textAlign: 'left',
                  textDecoration: 'underline', textDecorationColor: 'rgba(240,244,255,0.3)',
                }}
              >
                <span>{issue.icon}</span>
                <span>{issue.text}</span>
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => {
            localStorage.setItem(`prediktor_checker_dismissed_${playerId}`, '1')
            setDismissed(true)
          }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted)', fontSize: '1.2rem', lineHeight: 1,
            padding: '0 0 0 0.5rem', flexShrink: 0,
          }}
        >×</button>
      </div>
    </div>
  )
}

function BroadcastBanner({ playerId }) {
  const [message, setMessage] = useState(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    getDoc(doc(db, 'meta', 'broadcast')).then(snap => {
      if (!snap.exists()) return
      const data = snap.data()
      if (!data.message || !data.active) return
      const dismissedKey = `prediktor_broadcast_dismissed_${data.id || 'default'}`
      if (localStorage.getItem(dismissedKey)) { setDismissed(true); return }
      setMessage(data)
    })
  }, [])

  if (!message || dismissed) return null

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0.06) 100%)',
      border: '1px solid rgba(99,102,241,0.35)',
      borderRadius: 'var(--radius)',
      margin: '0.75rem 1rem 0',
      padding: '0.875rem 1rem',
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: '0.78rem',
          color: 'rgba(99,102,241,0.9)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.06em'
        }}>
          📣 {message.title || 'Message from the Admin'}
        </div>
        <div style={{ fontSize: '0.88rem', color: 'rgba(240,244,255,0.9)', lineHeight: 1.5 }}>
          {message.message}
        </div>
      </div>
      <button
        onClick={() => {
          localStorage.setItem(`prediktor_broadcast_dismissed_${message.id || 'default'}`, '1')
          setDismissed(true)
        }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--muted)', fontSize: '1.2rem', lineHeight: 1,
          padding: 0, flexShrink: 0,
        }}
      >×</button>
    </div>
  )
}

export default function App() {
  const [playerId, setPlayerId] = useState(null)
  const [nickname, setNickname] = useState('')
  const [tab, setTab] = useState('fixtures')
  const [showAdmin, setShowAdmin] = useState(false)
  const [rivalsPlayerId, setRivalsPlayerId] = useState(null)
  const [tapCount, setTapCount] = useState(0)
  const [deadline, setDeadline] = useState(null)

  useEffect(() => {
    const id = localStorage.getItem('prediktor_player_id')
    const name = localStorage.getItem('prediktor_nickname')
    if (id && name) { setPlayerId(id); setNickname(name) }
  }, [])

  useEffect(() => {
    getDoc(doc(db, 'meta', 'config')).then(snap => {
      if (snap.exists()) setDeadline(snap.data().deadline)
    })
  }, [])

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

  const isPastDeadline = deadline ? new Date() > new Date(deadline) : false

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav className="nav">
        <button className="nav-logo" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={handleLogoTap}>
          THE PREDIKTOR
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>⚽</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{nickname}</span>
        </div>
      </nav>

      {/* Broadcast message — always shown if active and not dismissed */}
      <BroadcastBanner playerId={playerId} />

      {/* Completeness checker — only shown before deadline */}
      {!isPastDeadline && (
        <CompletenessChecker
          playerId={playerId}
          deadline={deadline}
          onNavigate={tab => setTab(tab)}
        />
      )}

      <main style={{ flex: 1 }}>
        {tab === 'fixtures' && <Fixtures playerId={playerId} />}
        {tab === 'tournament' && <Tournament playerId={playerId} />}
        {tab === 'rivals' && <Rivals playerId={playerId} initialPlayerId={rivalsPlayerId} />}
        {tab === 'leaderboard' && <Leaderboard playerId={playerId} onViewRival={handleViewRival} />}
        {tab === 'scout' && <ScoutReport playerId={playerId} nickname={nickname} />}
      </main>

      <nav className="tab-bar">
        {TABS.map(t => (
          <button key={t.id} className={`tab-item ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.icon}
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
