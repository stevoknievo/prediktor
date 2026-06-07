// src/pages/ScoutReport.jsx
import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { db } from '../lib/firebase'

async function getAllPredictions() {
  const [playersSnap, matchPredsSnap, tournPredsSnap, fixturesSnap] = await Promise.all([
    getDocs(collection(db, 'players')),
    getDocs(collection(db, 'predictions')),
    getDocs(collection(db, 'tournamentPredictions')),
    getDocs(collection(db, 'fixtures')),
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
  const fixtures = {}
  fixturesSnap.docs.forEach(d => { fixtures[d.id] = d.data() })
  return { players, matchPreds, tournPreds, fixtures }
}

function buildPrompt(playerId, nickname, allData) {
  const { players, matchPreds, tournPreds, fixtures } = allData
  const myTournPred = tournPreds[playerId] || {}
  const myMatchPreds = matchPreds[playerId] || {}

  // ── Rivals summary ──────────────────────────────────────────────────────
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

  // ── Fixture analysis ────────────────────────────────────────────────────
  const allPredsList = Object.entries(myMatchPreds)
    .filter(([, p]) => p.score90Home !== undefined && p.score90Home !== '')
    .map(([fixtureId, p]) => {
      const fixture = fixtures[fixtureId] || {}
      const h = Number(p.score90Home)
      const a = Number(p.score90Away)
      return {
        fixtureId,
        home: h, away: a,
        homeTeam: fixture.homeTeam || fixtureId,
        awayTeam: fixture.awayTeam || fixtureId,
        stage: fixture.stage || 'Group',
        isKnockout: fixture.isKnockout || false,
        total: h + a,
        diff: Math.abs(h - a),
        result: h > a ? 'home' : a > h ? 'away' : 'draw',
      }
    })

  const totalPredicted = allPredsList.length
  const groupPreds = allPredsList.filter(p => !p.isKnockout)
  const knockoutPreds = allPredsList.filter(p => p.isKnockout)

  // Scoring tendencies
  const avgGoals = groupPreds.length
    ? (groupPreds.reduce((s, p) => s + p.total, 0) / groupPreds.length).toFixed(1)
    : 'n/a'
  const drawCount = groupPreds.filter(p => p.result === 'draw').length
  const drawPct = groupPreds.length ? Math.round((drawCount / groupPreds.length) * 100) : 0

  // Upsets — group stage big wins (diff >= 3)
  const bigWins = groupPreds
    .filter(p => p.diff >= 3)
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 3)
    .map(p => `${p.homeTeam} ${p.home}-${p.away} ${p.awayTeam}`)

  // High scoring predictions (total >= 5)
  const highScorers = groupPreds
    .filter(p => p.total >= 5)
    .sort((a, b) => b.total - a.total)
    .slice(0, 3)
    .map(p => `${p.homeTeam} ${p.home}-${p.away} ${p.awayTeam}`)

  // Boring predictions (0-0 or 1-0 or 0-1)
  const boringPreds = groupPreds
    .filter(p => p.total <= 1)
    .slice(0, 3)
    .map(p => `${p.homeTeam} ${p.home}-${p.away} ${p.awayTeam}`)

  // Knockout predictions
  const knockoutSummary = knockoutPreds
    .slice(0, 6)
    .map(p => `${p.homeTeam} ${p.home}-${p.away} ${p.awayTeam} (${p.stage})`)

  // Compare with rivals — are their group picks contrarian?
  const rivalMatchPreds = matchPreds
  const contrarianPicks = []
  for (const pred of groupPreds.slice(0, 20)) {
    const rivalResults = Object.entries(rivalMatchPreds)
      .filter(([pid]) => pid !== playerId)
      .map(([, preds]) => preds[pred.fixtureId])
      .filter(Boolean)
      .map(p => Number(p.score90Home) > Number(p.score90Away) ? 'home' : Number(p.score90Away) > Number(p.score90Home) ? 'away' : 'draw')
    if (rivalResults.length >= 2) {
      const rivalMajority = rivalResults.filter(r => r === rivalResults[0]).length / rivalResults.length
      if (rivalMajority >= 0.7 && pred.result !== rivalResults[0]) {
        contrarianPicks.push(`${pred.homeTeam} vs ${pred.awayTeam} (you picked ${pred.result === 'home' ? pred.homeTeam : pred.result === 'away' ? pred.awayTeam : 'a draw'}, most rivals disagree)`)
      }
    }
  }

  return `You are a witty, knowledgeable football pundit writing a personal "scout report" for a World Cup 2026 prediction game called The Prediktor. Your tone is like a funny, well-informed mate — gently teasing, warm, never cruel. Use British English. Keep the report to around 400 words.

The player you're writing about is: ${nickname}

THEIR TOURNAMENT PREDICTIONS (My Picks tab):
- Tournament winner: ${myTournPred.tournamentWinner || 'not submitted yet'}
- Named goal scorers: ${(myTournPred.namedScorers || []).filter(Boolean).join(', ') || 'none yet'}
- Named assisters: ${(myTournPred.namedAssisters || []).filter(Boolean).join(', ') || 'none yet'}
- Named goalkeepers: ${(myTournPred.namedGoalies || []).filter(Boolean).join(', ') || 'none yet'}
- Predicted total red cards: ${myTournPred.totalRedCards || 'not submitted'}
- Predicted total yellow cards: ${myTournPred.totalYellowCards || 'not submitted'}
- Most red card team: ${myTournPred.mostRedCardTeam || 'not submitted'}
- Most yellow card team: ${myTournPred.mostYellowCardTeam || 'not submitted'}
- Fewest yellow card team: ${myTournPred.fewestYellowCardTeam || 'not submitted'}

THEIR FIXTURE PREDICTIONS (scoring strategy):
- Total fixtures predicted: ${totalPredicted} of 104
- Group stage predictions: ${groupPreds.length} of 72
- Knockout predictions: ${knockoutPreds.length} of 32
- Average goals per group match predicted: ${avgGoals}
- Percentage of group games predicted as draws: ${drawPct}%
${highScorers.length > 0 ? `- High-scoring predictions (5+ goals): ${highScorers.join(' | ')}` : ''}
${bigWins.length > 0 ? `- Biggest predicted wins (3+ goal margins): ${bigWins.join(' | ')}` : ''}
${boringPreds.length > 0 ? `- Most conservative predictions: ${boringPreds.join(' | ')}` : ''}
${knockoutSummary.length > 0 ? `- Knockout predictions: ${knockoutSummary.join(' | ')}` : ''}
${contrarianPicks.length > 0 ? `- Going against the crowd: ${contrarianPicks.slice(0, 2).join(' | ')}` : ''}

HOW MANY OTHERS PICKED THE SAME WINNER:
${myTournPred.tournamentWinner ? `${winnerPickCounts[myTournPred.tournamentWinner] || 0} player(s) also picked ${myTournPred.tournamentWinner}` : 'No winner picked yet'}

RIVALS' WINNER PICKS:
${rivals.slice(0, 8).map(r => `${r.nickname}: ${r.tournamentWinner}`).join(', ')}

BOOKMAKER ODDS FOR TOURNAMENT WINNER (decimal):
To be provided by the server

Write a personalised scout report for ${nickname} covering:
1. A punchy opening line summing up their overall prediction style
2. Analysis of their tournament winner pick — crowd favourite or against the grain?
3. Comment on their fixture predictions — are they an attacking optimist (high scores), a pragmatist (draws and tight games), or a chaos merchant (huge margins)? Mention specific predictions if interesting
4. Comment on their named player picks — any gems, any eyebrow-raisers?
5. Note if they're going against their rivals on any picks — contrarian boldness or stubborn foolishness?
6. A "boldness rating" — give them a fun pundit nickname like "Safe Hands Steve", "The Dark Horse Hunter", "Captain Chaos", "The Spreadsheet Merchant" etc
7. A one-line prediction of where they'll finish in the leaderboard

If they haven't submitted many predictions yet, gently rib them about it while still being funny about what they HAVE submitted. Do not use markdown headers or bullet points — write it as flowing prose paragraphs.`
}

// ── Leaderboard prediction prompt ─────────────────────────────────────────

function buildLeaderboardPrompt(allData, odds) {
  const { players, matchPreds, tournPreds, fixtures } = allData

  // For each player, calculate expected points based on prediction patterns
  const playerSummaries = Object.values(players).map(player => {
    const pid = player.id
    const myMatchPreds = matchPreds[pid] || {}
    const myTournPred = tournPreds[pid] || {}

    const preds = Object.entries(myMatchPreds)
      .filter(([, p]) => p.score90Home !== undefined && p.score90Home !== '')
      .map(([fixtureId, p]) => {
        const fixture = fixtures[fixtureId] || {}
        return {
          homeTeam: fixture.homeTeam || fixtureId,
          awayTeam: fixture.awayTeam || fixtureId,
          home: Number(p.score90Home),
          away: Number(p.score90Away),
          stage: fixture.stage || 'Group',
          isKnockout: fixture.isKnockout || false,
        }
      })

    const avgGoals = preds.length
      ? (preds.reduce((s, p) => s + p.home + p.away, 0) / preds.length).toFixed(1)
      : 0
    const draws = preds.filter(p => p.home === p.away).length
    const bigWins = preds.filter(p => Math.abs(p.home - p.away) >= 3).length

    // Boldness score: high scoring + big margins = bold
    const boldness = preds.length > 0
      ? ((Number(avgGoals) - 2.5) * 10 + bigWins * 5 + (preds.length / 10)).toFixed(0)
      : 0

    return {
      nickname: player.nickname,
      totalCurrentPoints: player.totalPoints || 0,
      predictedCount: preds.length,
      winner: myTournPred.tournamentWinner || 'no pick',
      namedScorers: (myTournPred.namedScorers || []).filter(Boolean).join(', ') || 'none',
      avgGoals,
      draws,
      bigWins,
      boldness: Number(boldness),
    }
  }).sort((a, b) => b.totalCurrentPoints - a.totalCurrentPoints)

  const oddsText = odds || 'Use your general football knowledge for probabilities'
  const totalPlayers = playerSummaries.length

  return `You are a football statistics analyst and pundit for a World Cup 2026 prediction game called The Prediktor. The prediction deadline has now passed — all picks are locked in. Your job is to produce a probabilistic final leaderboard forecast.

CURRENT STANDINGS (before tournament starts):
${playerSummaries.map((p, i) => `${i + 1}. ${p.nickname} — ${p.totalCurrentPoints} pts`).join('\n')}

PLAYER PROFILES:
${playerSummaries.map(p => `
${p.nickname}:
- Tournament winner pick: ${p.winner}
- Named scorers: ${p.namedScorers}
- Fixtures predicted: ${p.predictedCount}/104
- Average goals predicted per match: ${p.avgGoals}
- Predicted draws: ${p.draws}
- Predicted 3+ goal margin wins: ${p.bigWins}
- Boldness index: ${p.boldness} (higher = more adventurous picks)`).join('\n')}

BOOKMAKER TOURNAMENT WINNER ODDS (decimal):
${oddsText}

SCORING SYSTEM REMINDER:
- Correct score: 6pts, Correct result: 3pts
- Named scorer goal: 2pts, Named assister assist: 2pt, Named GK clean sheet: 3pts
- Tournament winner: 15pts, Golden Boot: 15/10pts, Top assists: 15/10pts, Most clean sheets GK: 15/10pts
- Card predictions: various bonus points

TASK: Write a compelling 500-word probabilistic leaderboard forecast covering:

1. Open with a punchy paragraph about who looks strongest going into the tournament based on their picks aligning with bookmaker expectations

2. For each player, give a one-line probabilistic assessment of their chances — be specific about WHY (e.g. "backed Spain at 4.5 odds which gives them a 22% chance of the 15pt jackpot", or "named Erling Haaland as a scorer which gives them strong ongoing point potential")

3. Predict the final top 3 with reasoning — who has the best mix of safe points (likely correct results) and upside potential (bold picks that could pay off)?

4. Identify the biggest wildcard — who could rocket up the table if one of their bold picks comes true?

5. End with a verdict on who you'd put your house on to win

Use British English. Be analytical but entertaining — this is a pub quiz, not a boardroom presentation. Write in flowing prose, no bullet points or headers.`
}

export default function ScoutReport({ playerId, nickname }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cached, setCached] = useState(false)
  const [lastGenerated, setLastGenerated] = useState(null)
  const [leaderboardForecast, setLeaderboardForecast] = useState(null)
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)
  const [leaderboardError, setLeaderboardError] = useState('')
  const [deadline, setDeadline] = useState(null)

  useEffect(() => {
    Promise.all([
      getDoc(doc(db, 'meta', 'config')),
      getDoc(doc(db, 'meta', 'leaderboardForecast')),
    ]).then(([configSnap, forecastSnap]) => {
      if (configSnap.exists()) setDeadline(configSnap.data().deadline)
      if (forecastSnap.exists()) setLeaderboardForecast(forecastSnap.data().forecast)
    })
  }, [])

  const isPastDeadline = deadline ? new Date() > new Date(deadline) : false

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
      const generateScoutReportFn = httpsCallable(functions, 'generateScoutReport')

      const allData = await getAllPredictions()
      const prompt = buildPrompt(playerId, nickname, allData)

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

  async function handleLeaderboardForecast() {
    setLeaderboardLoading(true)
    setLeaderboardError('')
    try {
      const functions = getFunctions()
      const generateScoutReportFn = httpsCallable(functions, 'generateScoutReport')
      const allData = await getAllPredictions()

      // Get odds via cloud function
      const getTournamentOddsFn = httpsCallable(functions, 'getTournamentOdds')
      const oddsResult = await getTournamentOddsFn().catch(() => ({ data: { odds: null } }))
      const odds = oddsResult?.data?.odds
        ? Object.entries(oddsResult.data.odds).slice(0, 16).map(([t, o]) => `${t}: ${o}`).join(', ')
        : null

      const prompt = buildLeaderboardPrompt(allData, odds)
      const result = await generateScoutReportFn({ prompt })

      if (!result.data.success) throw new Error(result.data.error || 'Unknown error')

      const text = result.data.report
      setLeaderboardForecast(text)
      await setDoc(doc(db, 'meta', 'leaderboardForecast'), {
        forecast: text,
        generatedAt: serverTimestamp(),
      })
    } catch (err) {
      console.error('Leaderboard forecast error:', err)
      setLeaderboardError(`Could not generate forecast: ${err.message}`)
    }
    setLeaderboardLoading(false)
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

      {/* Leaderboard Forecast — only shown after deadline */}
      {isPastDeadline && (
        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🔮</span>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--gold)' }}>
              FINAL STANDINGS FORECAST
            </h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '1.25rem' }}>
            Predictions are locked. Our AI analyst has studied everyone's picks and the bookmaker odds to project where each player will finish.
          </p>

          {!leaderboardForecast && !leaderboardLoading && (
            <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
              <p style={{ fontSize: '0.88rem', marginBottom: '1rem' }}>
                Generate a probabilistic forecast of the final leaderboard based on all players' locked predictions and live bookmaker odds.
              </p>
              <button className="btn btn-primary" onClick={handleLeaderboardForecast}>
                🔮 Generate Forecast
              </button>
            </div>
          )}

          {leaderboardLoading && (
            <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="spinner" />
              <p style={{ marginTop: '1rem', fontSize: '0.88rem' }}>Crunching the numbers...</p>
            </div>
          )}

          {leaderboardError && (
            <div className="card" style={{ borderColor: 'var(--red)', marginBottom: '1rem' }}>
              <p style={{ color: 'var(--red)', fontSize: '0.88rem' }}>{leaderboardError}</p>
            </div>
          )}

          {leaderboardForecast && !leaderboardLoading && (
            <div>
              <div className="card" style={{
                marginBottom: '1rem',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, var(--panel) 100%)',
                borderColor: 'rgba(99,102,241,0.25)'
              }}>
                <div style={{ fontSize: '0.92rem', lineHeight: 1.75, color: 'rgba(240,244,255,0.9)' }}>
                  {leaderboardForecast.split('\n\n').map((para, i) => (
                    <p key={i} style={{ marginBottom: '1rem' }}>{para}</p>
                  ))}
                </div>
              </div>
              <button className="btn btn-ghost w-full" onClick={handleLeaderboardForecast} style={{ fontSize: '0.9rem' }}>
                🔄 Refresh Forecast
              </button>
              <p style={{ fontSize: '0.72rem', color: 'var(--muted)', textAlign: 'center', marginTop: '0.5rem' }}>
                Forecast updates as matches are played and points accumulate
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
