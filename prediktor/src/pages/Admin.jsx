// src/pages/Admin.jsx
import { useState, useEffect } from 'react'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { saveConfig, getTournamentOutcomes, saveTournamentOutcomes } from '../lib/db'
import { db } from '../lib/firebase'
import { collection, getDocs, deleteDoc, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'

const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS || 'prediktor2026'

function PlayerManager({ addLog }) {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(false)

  async function loadPlayers() {
    setLoading(true)
    const snap = await getDocs(collection(db, 'players'))
    setPlayers(snap.docs.map(d => d.data()).sort((a, b) => b.totalPoints - a.totalPoints))
    setLoading(false)
  }

  async function deletePlayer(player) {
    if (!confirm(`Delete ${player.nickname}? This cannot be undone.`)) return
    try {
      await deleteDoc(doc(db, 'players', player.id))
      setPlayers(prev => prev.filter(p => p.id !== player.id))
      addLog(`✓ Deleted player: ${player.nickname}`, 'success')
    } catch (err) {
      addLog(`✗ Error deleting player: ${err.message}`, 'error')
    }
  }

  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3>👥 PLAYERS</h3>
        <button className="btn btn-ghost" style={{ fontSize: '0.85rem', padding: '0.35rem 0.9rem' }} onClick={loadPlayers} disabled={loading}>
          {loading ? 'Loading...' : 'Load Players'}
        </button>
      </div>
      {players.length === 0 && (
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Click "Load Players" to see all participants.</p>
      )}
      {players.map(player => (
        <div key={player.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>{player.nickname}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{player.id}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--gold)' }}>{player.totalPoints} pts</div>
            <button className="btn btn-danger" style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem' }} onClick={() => deletePlayer(player)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}


function BroadcastComposer({ addLog }) {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [current, setCurrent] = useState(null)

  useEffect(() => {
    getDoc(doc(db, 'meta', 'broadcast')).then(snap => {
      if (snap.exists() && snap.data().active) setCurrent(snap.data())
    })
  }, [])

  async function handlePost() {
    if (!message.trim()) return
    setSaving(true)
    const id = Date.now().toString()
    await setDoc(doc(db, 'meta', 'broadcast'), {
      id, title: title.trim() || 'Message from the Admin',
      message: message.trim(), active: true,
      postedAt: serverTimestamp(),
    })
    setCurrent({ id, title, message, active: true })
    addLog('✓ Broadcast message posted', 'success')
    setSaving(false)
  }

  async function handleClear() {
    await setDoc(doc(db, 'meta', 'broadcast'), { active: false })
    setCurrent(null)
    addLog('✓ Broadcast message cleared', 'success')
  }

  return (
    <div>
      {current && (
        <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, padding: '0.75rem', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
          <div style={{ color: 'rgba(99,102,241,0.9)', fontWeight: 600, marginBottom: '0.25rem' }}>Active: {current.title}</div>
          <div style={{ color: 'var(--muted)' }}>{current.message}</div>
          <button className="btn btn-danger" style={{ marginTop: '0.5rem', fontSize: '0.78rem', padding: '0.3rem 0.75rem' }} onClick={handleClear}>
            Clear Message
          </button>
        </div>
      )}
      <input
        type="text"
        placeholder="Title (optional, e.g. 'Deadline reminder')"
        value={title}
        onChange={e => setTitle(e.target.value)}
        style={{ marginBottom: '0.5rem' }}
      />
      <textarea
        placeholder="Your message to all players..."
        value={message}
        onChange={e => setMessage(e.target.value)}
        rows={3}
        style={{ width: '100%', resize: 'vertical', marginBottom: '0.75rem', padding: '0.6rem', background: 'var(--panel2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--white)', fontSize: '0.88rem' }}
      />
      <button className="btn btn-primary" onClick={handlePost} disabled={saving || !message.trim()}>
        {saving ? 'Posting...' : '📣 Post to All Players'}
      </button>
    </div>
  )
}

export default function Admin() {
  const [authed, setAuthed] = useState(false)
  const [pass, setPass] = useState('')
  const [log, setLog] = useState([])
  const [loading, setLoading] = useState(false)
  const [deadline, setDeadline] = useState('')
  const [outcomes, setOutcomes] = useState({
    winner: '', topScorer: '', topAssister: '', topCleanSheet: '',
    totalRedCards: '', mostRedCardTeam: '', totalYellowCards: '',
    mostYellowCardTeam: '', fewestYellowCardTeam: ''
  })

  useEffect(() => {
    if (authed) {
      getTournamentOutcomes().then(o => {
        if (o) setOutcomes(prev => ({ ...prev, ...o }))
      })
    }
  }, [authed])

  function addLog(msg, type = 'info') {
    setLog(prev => [...prev, { msg, type, t: new Date().toLocaleTimeString() }])
  }

  async function syncFixtures() {
    setLoading(true)
    addLog('Syncing fixtures and match events...')
    try {
      const functions = getFunctions()
      const syncFn = httpsCallable(functions, 'syncFixtures')
      const result = await syncFn()
      if (result.data.success) {
        addLog(`✓ ${result.data.message}`, 'success')
      } else {
        addLog(`✗ ${result.data.message}`, 'error')
      }
    } catch (err) {
      addLog(`✗ Error: ${err.message}`, 'error')
    }
    setLoading(false)
  }

  async function runScoring() {
    setLoading(true)
    addLog('Running scoring via Cloud Function...')
    try {
      const functions = getFunctions()
      const scoreFn = httpsCallable(functions, 'scoreAllPlayers')
      const result = await scoreFn()
      if (result.data.success) {
        for (const r of result.data.results) {
          addLog(`  ${r.nickname}: ${r.total} pts`, 'success')
        }
        addLog('✓ Scoring complete!', 'success')
      } else {
        addLog(`✗ ${result.data.error}`, 'error')
      }
    } catch (err) {
      addLog(`✗ Error: ${err.message}`, 'error')
    }
    setLoading(false)
  }

  async function saveDeadline() {
    if (!deadline) return
    await saveConfig({ deadline: new Date(deadline).toISOString() })
    addLog(`✓ Deadline set to ${deadline}`, 'success')
  }

  async function saveOutcomes() {
    await saveTournamentOutcomes(outcomes)
    addLog('✓ Tournament outcomes saved', 'success')
  }

  if (!authed) {
    return (
      <div className="page" style={{ maxWidth: 400 }}>
        <h2 style={{ marginBottom: '1.5rem' }}>ADMIN</h2>
        <div className="card">
          <input type="password" placeholder="Admin passphrase" value={pass}
            onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && pass === ADMIN_PASS && setAuthed(true)}
            style={{ marginBottom: '1rem' }} />
          <button className="btn btn-primary w-full"
            onClick={() => pass === ADMIN_PASS ? setAuthed(true) : alert('Wrong passphrase')}>
            ENTER
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <h2 style={{ marginBottom: '1.5rem' }}>ADMIN PANEL</h2>

      <PlayerManager addLog={addLog} />

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>📅 PREDICTION DEADLINE</h3>
        <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} style={{ marginBottom: '0.75rem' }} />
        <button className="btn btn-primary" onClick={saveDeadline}>Set Deadline</button>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>🔄 SYNC FIXTURES & EVENTS</h3>
        <p style={{ fontSize: '0.82rem', marginBottom: '1rem' }}>
          Fetches all WC 2026 fixtures + results + goal scorers + assisters + cards from API-Football.
          Run this after each match day.
        </p>
        <button className="btn btn-primary" onClick={syncFixtures} disabled={loading}>
          {loading ? 'Working...' : 'Sync from API'}
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>⚡ RUN SCORING</h3>
        <p style={{ fontSize: '0.82rem', marginBottom: '1rem' }}>
          Recalculates all player points including named player goals, assists and clean sheets.
          Run after syncing.
        </p>
        <button className="btn btn-primary" onClick={runScoring} disabled={loading}>
          {loading ? 'Scoring...' : 'Run Scoring'}
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>🏆 TOURNAMENT OUTCOMES</h3>
        <p style={{ fontSize: '0.82rem', marginBottom: '1rem' }}>Fill these in as the tournament progresses to unlock bonus scoring.</p>
        {[
          { key: 'winner', label: 'Tournament Winner' },
          { key: 'topScorer', label: 'Golden Boot (comma-separated if joint)' },
          { key: 'topAssister', label: 'Most Assists (comma-separated if joint)' },
          { key: 'topCleanSheet', label: 'Most Clean Sheets GK (comma-separated if joint)' },
          { key: 'totalRedCards', label: 'Total Red Cards' },
          { key: 'mostRedCardTeam', label: 'Team with Most Red Cards' },
          { key: 'totalYellowCards', label: 'Total Yellow Cards' },
          { key: 'mostYellowCardTeam', label: 'Team with Most Yellow Cards' },
          { key: 'fewestYellowCardTeam', label: 'Team with Fewest Yellow Cards' }
        ].map(({ key, label }) => (
          <div key={key} style={{ marginBottom: '0.75rem' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '0.3rem' }}>{label}</label>
            <input type="text" value={outcomes[key] || ''} onChange={e => setOutcomes(o => ({ ...o, [key]: e.target.value }))} />
          </div>
        ))}
        <button className="btn btn-primary" style={{ marginTop: '0.5rem' }} onClick={saveOutcomes}>Save Outcomes</button>
      </div>


      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>📣 BROADCAST MESSAGE</h3>
        <p style={{ fontSize: '0.82rem', marginBottom: '1rem' }}>
          Post a message that appears as a banner for all players. Tap × to dismiss on their end.
        </p>
        <BroadcastComposer addLog={addLog} />
      </div>

      {log.length > 0 && (
        <div className="card" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <strong>Log</strong>
            <button style={{ fontSize: '0.75rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setLog([])}>clear</button>
          </div>
          {log.map((entry, i) => (
            <div key={i} style={{ color: entry.type === 'error' ? 'var(--red)' : entry.type === 'success' ? 'var(--green)' : 'var(--muted)', marginBottom: '0.2rem' }}>
              <span style={{ opacity: 0.5 }}>[{entry.t}] </span>{entry.msg}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}