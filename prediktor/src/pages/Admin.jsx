// src/pages/Admin.jsx
import { useState, useEffect } from 'react'
import { fetchFixtures, fetchFixtureEvents } from '../lib/footballApi'
import {
  saveFixtures, getFixtures, saveConfig, getTournamentOutcomes,
  saveTournamentOutcomes, getDocs, collection
} from '../lib/db'
import { db } from '../lib/firebase'
import { collection as col, getDocs as gd } from 'firebase/firestore'
import { scoreMatch, scoreTournamentBonuses, scorePlayerStats } from '../lib/scoring'
import { updatePlayerTotalPoints, savePlayerMatchScore } from '../lib/db'

const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS || 'prediktor2026'

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
    addLog('Fetching fixtures from API-Football...')
    try {
      const fixtures = await fetchFixtures()
      await saveFixtures(fixtures)
      addLog(`✓ Synced ${fixtures.length} fixtures`, 'success')
    } catch (err) {
      addLog(`✗ Error: ${err.message}`, 'error')
    }
    setLoading(false)
  }

  async function runScoring() {
    setLoading(true)
    addLog('Starting scoring run...')
    try {
      // Get all fixtures, predictions, tournament predictions, players
      const [fixturesSnap, predsSnap, tournSnap, playersSnap] = await Promise.all([
        gd(col(db, 'fixtures')),
        gd(col(db, 'predictions')),
        gd(col(db, 'tournamentPredictions')),
        gd(col(db, 'players'))
      ])

      const fixtures = fixturesSnap.docs.map(d => d.data())
      const predictions = predsSnap.docs.map(d => d.data())
      const tournPreds = tournSnap.docs.map(d => d.data())
      const players = playersSnap.docs.map(d => d.data())
      const tournamentOutcomes = await getTournamentOutcomes()

      addLog(`Found ${players.length} players, ${fixtures.length} fixtures`)

      for (const player of players) {
        let total = 0
        const playerPreds = predictions.filter(p => p.playerId === player.id)
        const tournPred = tournPreds.find(p => p.playerId === player.id)

        // Match predictions
        for (const pred of playerPreds) {
          const fixture = fixtures.find(f => f.id === pred.fixtureId)
          if (!fixture?.completed) continue
          const { points, breakdown } = scoreMatch(pred, fixture)
          if (points > 0) {
            await savePlayerMatchScore(player.id, fixture.id, points, breakdown)
            total += points
          }
        }

        // Tournament bonuses
        if (tournPred && tournamentOutcomes) {
          const { points, breakdown } = scoreTournamentBonuses(tournPred, tournamentOutcomes)
          total += points
          if (points > 0) addLog(`  ${player.nickname}: +${points} tournament bonus`)
        }

        await updatePlayerTotalPoints(player.id, total)
        addLog(`  ${player.nickname}: ${total} pts total`, 'success')
      }

      addLog('✓ Scoring complete!', 'success')
    } catch (err) {
      addLog(`✗ Error: ${err.message}`, 'error')
      console.error(err)
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
          <input
            type="password"
            placeholder="Admin passphrase"
            value={pass}
            onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && pass === ADMIN_PASS && setAuthed(true)}
            style={{ marginBottom: '1rem' }}
          />
          <button
            className="btn btn-primary w-full"
            onClick={() => pass === ADMIN_PASS ? setAuthed(true) : alert('Wrong passphrase')}
          >
            ENTER
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <h2 style={{ marginBottom: '1.5rem' }}>ADMIN PANEL</h2>

      {/* Deadline */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>📅 PREDICTION DEADLINE</h3>
        <input
          type="datetime-local"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
          style={{ marginBottom: '0.75rem' }}
        />
        <button className="btn btn-primary" onClick={saveDeadline}>Set Deadline</button>
      </div>

      {/* Sync fixtures */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>🔄 SYNC FIXTURES</h3>
        <p style={{ fontSize: '0.82rem', marginBottom: '1rem' }}>Fetches all WC 2026 fixtures + results from API-Football.</p>
        <button className="btn btn-primary" onClick={syncFixtures} disabled={loading}>
          {loading ? 'Working...' : 'Sync from API'}
        </button>
      </div>

      {/* Tournament outcomes */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>🏆 TOURNAMENT OUTCOMES</h3>
        <p style={{ fontSize: '0.82rem', marginBottom: '1rem' }}>Fill these in as the tournament progresses to unlock bonus scoring.</p>

        {[
          { key: 'winner', label: 'Tournament Winner' },
          { key: 'topScorer', label: 'Golden Boot (name or names comma-separated if joint)' },
          { key: 'topAssister', label: 'Most Assists (name or names comma-separated)' },
          { key: 'topCleanSheet', label: 'Most Clean Sheets GK (name or names comma-separated)' },
          { key: 'totalRedCards', label: 'Total Red Cards' },
          { key: 'mostRedCardTeam', label: 'Team with Most Red Cards' },
          { key: 'totalYellowCards', label: 'Total Yellow Cards' },
          { key: 'mostYellowCardTeam', label: 'Team with Most Yellow Cards' },
          { key: 'fewestYellowCardTeam', label: 'Team with Fewest Yellow Cards' }
        ].map(({ key, label }) => (
          <div key={key} style={{ marginBottom: '0.75rem' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '0.3rem' }}>{label}</label>
            <input
              type="text"
              value={outcomes[key] || ''}
              onChange={e => setOutcomes(o => ({ ...o, [key]: e.target.value }))}
            />
          </div>
        ))}
        <button className="btn btn-primary" style={{ marginTop: '0.5rem' }} onClick={saveOutcomes}>Save Outcomes</button>
      </div>

      {/* Run scoring */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>⚡ RUN SCORING</h3>
        <p style={{ fontSize: '0.82rem', marginBottom: '1rem' }}>Recalculates all player points based on completed fixtures and saved outcomes.</p>
        <button className="btn btn-primary" onClick={runScoring} disabled={loading}>
          {loading ? 'Scoring...' : 'Run Scoring'}
        </button>
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div className="card" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <strong>Log</strong>
            <button style={{ fontSize: '0.75rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setLog([])}>clear</button>
          </div>
          {log.map((entry, i) => (
            <div key={i} style={{
              color: entry.type === 'error' ? 'var(--red)' : entry.type === 'success' ? 'var(--green)' : 'var(--muted)',
              marginBottom: '0.2rem'
            }}>
              <span style={{ opacity: 0.5 }}>[{entry.t}] </span>{entry.msg}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
