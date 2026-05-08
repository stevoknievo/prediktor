// src/pages/ScoutReport.jsx
import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { db } from '../lib/firebase'

async function getAllPredictions() {
  const [playersSnap, matchPredsSnap, tournPredsSnap] = await Promise.all([
    getDocs(collection(db, 'players')),
    getDocs(collection(db, 'predictions')),
    getDocs(collection(db, 'tournamentPredictions')),
  ])
  const players = {}
  playersSnap.docs.forEach(d => { players[d.id] = d.data() })
  const matchPreds = {}
  matchPredsSnap.docs.forEach(d => {
    const p = d.data()
    if (!matchPreds[p.playerId]) matchPreds[p.playerId] = {}
    matchPreds[p.playerId][p.fixtureId] = p
  })
  const tournPreds = {}
  tournPredsSnap.docs.forEach(d => { tournPreds[d.id] = d.data() })
  return { players, matchPreds, tournPreds }
}

function buildPrompt(playerId, nickname, allData, odds) {
  const { players, matchPreds, tournPreds } = allData
  const myTournPred = tournPreds[playerId] || {}
  const myMatchPreds = matchPreds[playerId] || {}

  const rivals = Object.values(players)
    .filter(p => p.id !== playerId)
    .map(p => ({
      nickname: p.nickname,
      tournamentWinner: tournPreds[p.id]?.tournamentWinner || 'no pick',
    }))

  const winnerPickCounts = {}
  Object.values(tournPreds).forEach(p => {
    if (p.tournamentWinner) {
      winnerPickCounts[p.tournamentWinner] = (winnerPickCounts[p.tournamentWinner] || 0) + 1
    }
  })

  const boldPicks = Object.values(myMatchPreds)
    .filter(p => p.score90Home !== undefined && p.score90Away !== undefined)
    .map(p => ({
      fixtureId: p.fixtureId,
      home: p.score90Home,
      away: p.score90Away,
      total: Number(p.score90Home) + Number(p.score90Away),
      diff: Math.abs(Number(p.score90Home) - Number(p.score90Away))
    }))
    .sort((a, b) => (b.total + b.diff) - (a.total + a.diff))
    .slice(0, 5)

  const totalPredicted = Object.keys(myMatchPreds).length

  return `You are a witty, knowledgeable football pundit writing a personal "scout report" for a World Cup 2026 prediction game called The Prediktor. Your tone is like a funny, well-informed mate — gently teasing, warm, never cruel. Use British English. Keep the report to around 350-400 words.

The player you're writing about is: ${nickname}

THEIR TOURNAMENT PREDICTIONS:
- Tournament winner pick: ${myTournPred.tournamentWinner || 'not submitted yet'}
- Named goal scorers: ${(myTournPred.namedScorers || []).filter(Boolean).join(', ') || 'none yet'}
- Named assisters: ${(myTournPred.namedAssisters || []).filter(Boolean).join(', ') || 'none yet'}
- Named goalkeepers: ${(myTournPred.namedGoalies || []).filter(Boolean).join(', ') || 'none yet'}
- Predicted total red cards: ${myTournPred.totalRedCards || 'not submitted'}
- Predicted total yellow cards: ${myTournPred.totalYellowCards || 'not submitted'}
- Most red card team: ${myTournPred.mostRedCardTeam || 'not submitted'}
- Most yellow card team: ${myTournPred.mostYellowCardTeam || 'not submitted'}
- Fewest yellow card team: ${myTournPred.fewestYellowCardTeam || 'not submitted'}

MATCH PREDICTIONS SUBMITTED: ${totalPredicted} out of 104 total fixtures

THEIR BOLDEST MATCH PREDICTIONS (highest scoring/most decisive):
${boldPicks.map(p => `Fixture ${p.fixtureId}: ${p.home}-${p.away}`).join('\n') || 'None yet'}

BOOKMAKER ODDS FOR TOURNAMENT WINNER (decimal):
${odds ? Object.entries(odds).slice(0, 15).map(([t, o]) => `${t}: ${o}`).join(', ') : 'Odds unavailable — use general football knowledge'}

HOW MANY OTHERS PICKED THE SAME WINNER:
${myTournPred.tournamentWinner ? `${winnerPickCounts[myTournPred.tournamentWinner] || 0} player(s) also picked ${myTournPred.tournamentWinner}` : 'No winner picked yet'}

RIVALS' WINNER PICKS:
${rivals.slice(0, 8).map(r => `${r.nickname}: ${r.tournamentWinner}`).join(', ')}

Write a personalised scout report for ${nickname} covering:
1. A punchy opening line summing up their overall approach
2. Analysis of their tournament winner pick — are they with the crowd, against the grain, or just plain brave/mad?
3. Comment on their named player picks — any gems, any eyebrow-raisers?
4. If they have bold match predictions, mention one or two specifically
5. A "boldness rating" at the end — give them a fun nickname like "Safe Hands Steve", "The Dark Horse Hunter", "Captain Chaos" etc based on how bold or conservative their picks are overall
6. A one-line prediction of where they'll finish in the leaderboard

If they haven't submitted many predictions yet, gently encourage them to get on with it while still being funny about what they HAVE submitted.

Do not use markdown headers or bullet points — write it as flowing prose paragraphs.`
}

export default function ScoutReport({ playerId, nickname }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cached, setCached] = useState(false)
  const [lastGenerated, setLastGenerated] = useState(null)

  useEffect(() => {
    if (!playerId) return
    getDoc(doc(db, 'scoutReports', playerId)).then(snap => {
      if (snap.exists()) {
        setReport(snap.data().report)
        setCached(true)
        setLastGenerated(snap.data().generatedAt?.toDate?.())
      }
    })
  }, [playerId])

  async function handleGenerate() {
    setLoading(true)
    setError('')
    try {
      const functions = getFunctions()
      const getTournamentOdds = httpsCallable(functions, 'getTournamentOdds')
      const generateScoutReportFn = httpsCallable(functions, 'generateScoutReport')

      // Fetch data in parallel
      const [allData, oddsResult] = await Promise.all([
        getAllPredictions(),
        getTournamentOdds().catch(() => ({ data: { odds: null } }))
      ])

      const odds = oddsResult?.data?.odds || null
      const prompt = buildPrompt(playerId, nickname, allData, odds)

      const result = await generateScoutReportFn({ prompt })

      if (!result.data.success) {
        throw new Error(result.data.error || 'Unknown error')
      }

      const text = result.data.report
      setReport(text)
      setCached(false)
      setLastGenerated(new Date())

      await setDoc(doc(db, 'scoutReports', playerId), {
        report: text,
        generatedAt: serverTimestamp(),
        playerId,
        nickname
      })
    } catch (err) {
      console.error('Scout report error:', err)
      setError(`Could not generate report: ${err.message}`)
    }
    setLoading(false)
  }

  return (
    <div className="page">
      <h2 style={{ marginBottom: '0.25rem' }}>SCOUT REPORT</h2>
      <p style={{ fontSize: '0.88rem', marginBottom: '1.5rem' }}>
        Your personal AI prediction analysis — how bold are your picks? Where will you finish?
      </p>

      {!report && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h3 style={{ marginBottom: '0.75rem' }}>Get Your Scout Report</h3>
          <p style={{ fontSize: '0.88rem', marginBottom: '1.5rem' }}>
            Our AI pundit will analyse your predictions, compare them against the bookies and your rivals, and give you an honest (but kind) assessment of your chances.
          </p>
          <button className="btn btn-primary" onClick={handleGenerate} style={{ fontSize: '1.1rem' }}>
            GENERATE MY REPORT
          </button>
        </div>
      )}

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner" />
          <p style={{ marginTop: '1rem', fontSize: '0.88rem' }}>Our pundit is studying your picks...</p>
        </div>
      )}

      {error && (
        <div className="card" style={{ borderColor: 'var(--red)', marginBottom: '1rem' }}>
          <p style={{ color: 'var(--red)', fontSize: '0.88rem' }}>{error}</p>
        </div>
      )}

      {report && !loading && (
        <div>
          <div className="card" style={{ marginBottom: '1rem', background: 'linear-gradient(135deg, rgba(245,200,66,0.06) 0%, var(--panel) 100%)', borderColor: 'rgba(245,200,66,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(245,200,66,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>🎙️</div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--gold)' }}>
                  {nickname}'s Scout Report
                </div>
                {lastGenerated && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                    {cached ? 'Cached · ' : ''}{lastGenerated.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            </div>
            <div style={{ fontSize: '0.92rem', lineHeight: 1.75, color: 'rgba(240,244,255,0.9)' }}>
              {report.split('\n\n').map((para, i) => (
                <p key={i} style={{ marginBottom: '1rem' }}>{para}</p>
              ))}
            </div>
          </div>
          <button className="btn btn-ghost w-full" onClick={handleGenerate} style={{ fontSize: '0.9rem' }}>
            🔄 Regenerate Report
          </button>
          <p style={{ fontSize: '0.72rem', color: 'var(--muted)', textAlign: 'center', marginTop: '0.5rem' }}>
            Regenerating fetches fresh odds and latest predictions from all players
          </p>
        </div>
      )}
    </div>
  )
}
