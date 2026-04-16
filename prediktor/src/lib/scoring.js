// src/lib/scoring.js
// Complete scoring engine for The Prediktor - World Cup 2026

/**
 * Score a single match prediction against the actual result.
 * @param {object} prediction - player's prediction
 * @param {object} result - actual match result
 * @returns {{ points: number, breakdown: string[] }}
 */
export function scoreMatch(prediction, result) {
  let points = 0
  const breakdown = []

  if (!result || !result.completed) return { points: 0, breakdown: [] }

  const pred90Home = parseInt(prediction.score90Home ?? -1)
  const pred90Away = parseInt(prediction.score90Away ?? -1)
  const act90Home = result.score90Home
  const act90Away = result.score90Away

  // --- 90-minute result ---
  const predResult90 = getResult(pred90Home, pred90Away)
  const actResult90 = getResult(act90Home, act90Away)

  if (predResult90 && predResult90 === actResult90) {
    points += 3
    breakdown.push('+3 correct 90min result')
  }
  if (pred90Home === act90Home && pred90Away === act90Away) {
    points += 3 // bonus on top of result (total 6)
    breakdown.push('+3 correct 90min score (total 6)')
  }

  // --- Extra time ---
  if (result.hasExtraTime) {
    const predETHome = parseInt(prediction.scoreETHome ?? -1)
    const predETAway = parseInt(prediction.scoreETAway ?? -1)
    const actETHome = result.scoreETHome
    const actETAway = result.scoreETAway

    const predResultET = getResult(predETHome, predETAway)
    const actResultET = getResult(actETHome, actETAway)

    if (predResultET && predResultET === actResultET) {
      points += 2
      breakdown.push('+2 correct ET result')
    }
    if (predETHome === actETHome && predETAway === actETAway) {
      points += 2 // bonus on top (total 4)
      breakdown.push('+2 correct ET score (total 4)')
    }

    // After ET (cumulative) - if ET ended, the after-ET score
    const predAftETHome = parseInt(prediction.scoreAfterETHome ?? -1)
    const predAftETAway = parseInt(prediction.scoreAfterETAway ?? -1)
    const actAftETHome = result.scoreAfterETHome
    const actAftETAway = result.scoreAfterETAway

    if (predAftETHome === actAftETHome && predAftETAway === actAftETAway) {
      points += 6
      breakdown.push('+6 correct after-ET score')
    } else {
      const predResAftET = getResult(predAftETHome, predAftETAway)
      const actResAftET = getResult(actAftETHome, actAftETAway)
      if (predResAftET && predResAftET === actResAftET) {
        points += 3
        breakdown.push('+3 correct after-ET result')
      }
    }
  }

  // --- Penalty shootout ---
  if (result.hasPenalties) {
    const predPenHome = parseInt(prediction.scorePenHome ?? -1)
    const predPenAway = parseInt(prediction.scorePenAway ?? -1)
    const actPenHome = result.scorePenHome
    const actPenAway = result.scorePenAway

    const predPenWinner = predPenHome > predPenAway ? 'home' : 'away'
    const actPenWinner = actPenHome > actPenAway ? 'home' : 'away'

    if (predPenWinner === actPenWinner) {
      points += 3
      breakdown.push('+3 correct shootout result')
    }
    if (predPenHome === actPenHome && predPenAway === actPenAway) {
      points += 3 // bonus (total 6)
      breakdown.push('+3 correct shootout score (total 6)')
    }
  }

  return { points, breakdown }
}

/**
 * Score knockout fixture predictions.
 * @param {object[]} fixturePredictions - array of { stage, homeTeam, awayTeam }
 * @param {object[]} actualFixtures - array of { stage, homeTeam, awayTeam }
 * @returns {{ points: number, breakdown: string[] }}
 */
export function scoreKnockoutFixtures(fixturePredictions, actualFixtures) {
  let points = 0
  const breakdown = []

  for (const pred of fixturePredictions) {
    const match = actualFixtures.find(f =>
      f.stage === pred.stage &&
      ((f.homeTeam === pred.homeTeam && f.awayTeam === pred.awayTeam) ||
       (f.homeTeam === pred.awayTeam && f.awayTeam === pred.homeTeam))
    )
    if (match) {
      points += 3
      breakdown.push(`+3 correct fixture: ${pred.homeTeam} v ${pred.awayTeam} in ${pred.stage}`)
    }
  }

  return { points, breakdown }
}

/**
 * Score tournament-wide bonuses.
 * @param {object} prediction - player's tournament predictions
 * @param {object} tournament - actual tournament outcomes
 * @returns {{ points: number, breakdown: string[] }}
 */
export function scoreTournamentBonuses(prediction, tournament) {
  let points = 0
  const breakdown = []

  // Tournament winner
  if (prediction.tournamentWinner && prediction.tournamentWinner === tournament.winner) {
    points += 15
    breakdown.push('+15 correct tournament winner')
  }

  // Golden Boot - scorers
  if (tournament.topScorer) {
    const namedScorers = prediction.namedScorers || []
    const outright = !Array.isArray(tournament.topScorer)
    const topScorers = Array.isArray(tournament.topScorer) ? tournament.topScorer : [tournament.topScorer]

    for (const scorer of namedScorers) {
      if (topScorers.includes(scorer)) {
        if (outright) {
          points += 15
          breakdown.push(`+15 Golden Boot (outright): ${scorer}`)
        } else {
          points += 10
          breakdown.push(`+10 Golden Boot (joint): ${scorer}`)
        }
      }
    }
  }

  // Most assists
  if (tournament.topAssister) {
    const namedAssisters = prediction.namedAssisters || []
    const outright = !Array.isArray(tournament.topAssister)
    const topAssisters = Array.isArray(tournament.topAssister) ? tournament.topAssister : [tournament.topAssister]

    for (const assister of namedAssisters) {
      if (topAssisters.includes(assister)) {
        if (outright) {
          points += 10
          breakdown.push(`+10 Most assists (outright): ${assister}`)
        } else {
          points += 5
          breakdown.push(`+5 Most assists (joint): ${assister}`)
        }
      }
    }
  }

  // Most clean sheets (goalies)
  if (tournament.topCleanSheet) {
    const namedGoalies = prediction.namedGoalies || []
    const outright = !Array.isArray(tournament.topCleanSheet)
    const topGoalies = Array.isArray(tournament.topCleanSheet) ? tournament.topCleanSheet : [tournament.topCleanSheet]

    for (const goalie of namedGoalies) {
      if (topGoalies.includes(goalie)) {
        if (outright) {
          points += 15
          breakdown.push(`+15 Most clean sheets (outright): ${goalie}`)
        } else {
          points += 10
          breakdown.push(`+10 Most clean sheets (joint): ${goalie}`)
        }
      }
    }
  }

  // Named player clean sheets per game (scored separately in scorePlayerStats)

  // Red cards - total (within 1)
  if (tournament.totalRedCards !== undefined && prediction.totalRedCards !== undefined) {
    const diff = Math.abs(parseInt(prediction.totalRedCards) - tournament.totalRedCards)
    if (diff <= 1) {
      points += 15
      breakdown.push(`+15 total red cards (predicted ${prediction.totalRedCards}, actual ${tournament.totalRedCards})`)
    }
  }

  // Team with most red cards
  if (tournament.mostRedCardTeam && prediction.mostRedCardTeam) {
    if (prediction.mostRedCardTeam === tournament.mostRedCardTeam) {
      points += 20
      breakdown.push(`+20 team with most red cards: ${prediction.mostRedCardTeam}`)
    }
  }

  // Yellow cards - total (within 10)
  if (tournament.totalYellowCards !== undefined && prediction.totalYellowCards !== undefined) {
    const diff = Math.abs(parseInt(prediction.totalYellowCards) - tournament.totalYellowCards)
    if (diff <= 10) {
      points += 25
      breakdown.push(`+25 total yellow cards (predicted ${prediction.totalYellowCards}, actual ${tournament.totalYellowCards})`)
    }
  }

  // Team with most yellow cards
  if (tournament.mostYellowCardTeam && prediction.mostYellowCardTeam) {
    if (prediction.mostYellowCardTeam === tournament.mostYellowCardTeam) {
      points += 20
      breakdown.push(`+20 team with most yellow cards: ${prediction.mostYellowCardTeam}`)
    }
  }

  // Team with fewest yellow cards
  if (tournament.fewestYellowCardTeam && prediction.fewestYellowCardTeam) {
    if (prediction.fewestYellowCardTeam === tournament.fewestYellowCardTeam) {
      points += 30
      breakdown.push(`+30 team with fewest yellow cards: ${prediction.fewestYellowCardTeam}`)
    }
  }

  return { points, breakdown }
}

/**
 * Score named player stats per match.
 * @param {object} prediction - { namedScorers, namedAssisters, namedGoalies }
 * @param {object[]} matchStats - array of { scorer, assists[], cleanSheetTeams[] }
 */
export function scorePlayerStats(prediction, matchStats) {
  let points = 0
  const breakdown = []

  const namedScorers = prediction.namedScorers || []
  const namedAssisters = prediction.namedAssisters || []
  const namedGoalies = prediction.namedGoalies || []

  for (const match of matchStats) {
    // Goals
    for (const scorer of match.goalScorers || []) {
      if (namedScorers.includes(scorer)) {
        points += 2
        breakdown.push(`+2 goal by named scorer: ${scorer}`)
      }
    }
    // Assists
    for (const assister of match.assisters || []) {
      if (namedAssisters.includes(assister)) {
        points += 1
        breakdown.push(`+1 assist by named assister: ${assister}`)
      }
    }
    // Clean sheets (at 90 min, not penalties)
    for (const goalie of namedGoalies) {
      if ((match.cleanSheetGoalies || []).includes(goalie)) {
        points += 3
        breakdown.push(`+3 clean sheet by named goalie: ${goalie}`)
      }
    }
  }

  return { points, breakdown }
}

// Helper
function getResult(home, away) {
  if (home === -1 || away === -1 || isNaN(home) || isNaN(away)) return null
  if (home > away) return 'home'
  if (away > home) return 'away'
  return 'draw'
}
