/**
 * Fraud Detection Utilities
 *
 * Statistical analysis and pattern detection for suspicious submissions
 */

// In-memory rate limiting (would use Redis in production)
const submissionTimestamps = new Map(); // playerName -> array of timestamps

/**
 * Check if player is submitting too frequently
 * @param {string} playerName - Player identifier
 * @param {number} maxSubmissions - Maximum submissions allowed
 * @param {number} timeWindowMs - Time window in milliseconds
 * @returns {{allowed: boolean, reason?: string, waitTime?: number}}
 */
export function checkRateLimit(playerName, maxSubmissions = 10, timeWindowMs = 60000) {
  const now = Date.now();
  const key = playerName || 'anonymous';

  // Get recent submissions for this player
  if (!submissionTimestamps.has(key)) {
    submissionTimestamps.set(key, []);
  }

  const timestamps = submissionTimestamps.get(key);

  // Remove old timestamps outside the window
  const recentTimestamps = timestamps.filter(ts => now - ts < timeWindowMs);
  submissionTimestamps.set(key, recentTimestamps);

  // Check if limit exceeded
  if (recentTimestamps.length >= maxSubmissions) {
    const oldestTimestamp = Math.min(...recentTimestamps);
    const waitTime = timeWindowMs - (now - oldestTimestamp);

    return {
      allowed: false,
      reason: `Rate limit exceeded: ${maxSubmissions} submissions per ${timeWindowMs/1000}s`,
      waitTime: Math.ceil(waitTime / 1000) // seconds
    };
  }

  // Add current timestamp
  recentTimestamps.push(now);
  submissionTimestamps.set(key, recentTimestamps);

  return { allowed: true };
}

/**
 * Analyze if score is suspiciously high/fast for the game type
 * @param {string} game - Game type
 * @param {number} score - Claimed score
 * @param {number} timeSeconds - Time taken
 * @param {number} moves - Number of moves
 * @returns {{suspicious: boolean, flags: string[], confidence: number}}
 */
export function detectSuspiciousScore(game, score, timeSeconds, moves) {
  const flags = [];
  let confidence = 0; // 0-100, how confident we are it's fraudulent

  // Game-specific thresholds
  const thresholds = {
    solitaire: {
      minTimePerCard: 0.5,  // seconds per card moved to foundation
      maxScore: 52
    },
    garbage: {
      minTimePerRound: 2,  // seconds per round
      maxScore: 10000  // arbitrary high value
    },
    yahtzee: {
      minTimePerTurn: 3,   // seconds per turn (13 turns)
      maxScore: 375,
      perfectScoreTime: 60 // suspicious if perfect score in < 1 min
    },
    blackjack: {
      minTimePerHand: 2,   // seconds per hand
      maxReasonableScore: 100000  // 1000 starting, 100x is suspicious
    },
    '2048': {
      minTimePerMove: 0.3, // seconds per move
      maxReasonableScore: 100000  // scores beyond this are rare
    },
    backgammon: {
      minTimePerMove: 1,   // seconds per move
      maxScore: 576        // 3 × 64 × 3 (winType × cube × difficulty)
    }
  };

  const threshold = thresholds[game];
  if (!threshold) return { suspicious: false, flags: [], confidence: 0 };

  // Check 1: Score out of bounds
  if (threshold.maxScore && score > threshold.maxScore) {
    flags.push(`Score ${score} exceeds maximum ${threshold.maxScore}`);
    confidence += 50;
  }

  // Check 2: Time too fast
  if (timeSeconds !== undefined && timeSeconds > 0) {
    if (game === 'solitaire' && score > 0) {
      const minTime = score * threshold.minTimePerCard;
      if (timeSeconds < minTime) {
        flags.push(`Completed ${score} cards in ${timeSeconds}s (min expected: ${minTime}s)`);
        confidence += 30;
      }
    } else if (game === 'yahtzee') {
      const minTime = 13 * threshold.minTimePerTurn;
      if (timeSeconds < minTime) {
        flags.push(`Completed game in ${timeSeconds}s (min expected: ${minTime}s)`);
        confidence += 25;
      }
      // Perfect score very quickly is suspicious
      if (score === 375 && timeSeconds < threshold.perfectScoreTime) {
        flags.push(`Perfect score (375) achieved in ${timeSeconds}s`);
        confidence += 40;
      }
    } else if (game === 'blackjack' && moves > 0) {
      const minTime = moves * threshold.minTimePerHand;
      if (timeSeconds < minTime) {
        flags.push(`Played ${moves} hands in ${timeSeconds}s (min expected: ${minTime}s)`);
        confidence += 25;
      }
    } else if (game === '2048' && moves > 0) {
      const minTime = moves * threshold.minTimePerMove;
      if (timeSeconds < minTime) {
        flags.push(`Made ${moves} moves in ${timeSeconds}s (min expected: ${minTime}s)`);
        confidence += 20;
      }
    } else if (game === 'backgammon' && moves > 0) {
      const minTime = moves * threshold.minTimePerMove;
      if (timeSeconds < minTime) {
        flags.push(`Made ${moves} moves in ${timeSeconds}s (min expected: ${minTime}s)`);
        confidence += 25;
      }
    }
  }

  // Check 3: Unreasonably high score
  if (game === 'blackjack' && score > threshold.maxReasonableScore) {
    flags.push(`Chip balance ${score} is suspiciously high`);
    confidence += 35;
  }

  if (game === '2048' && score > threshold.maxReasonableScore) {
    flags.push(`Score ${score} is suspiciously high for 2048`);
    confidence += 30;
  }

  // Check 4: Move count vs score consistency
  if (game === 'solitaire' && score > 0 && moves < score) {
    flags.push(`Impossible: ${score} cards moved with only ${moves} moves`);
    confidence += 40;
  }

  return {
    suspicious: confidence >= 50,  // Threshold for flagging
    flags,
    confidence
  };
}

/**
 * Analyze submission pattern for a player
 * @param {string} playerName - Player identifier
 * @param {Array} recentGames - Array of recent game submissions
 * @returns {{suspicious: boolean, flags: string[], confidence: number}}
 */
export function analyzeSubmissionPattern(playerName, recentGames) {
  const flags = [];
  let confidence = 0;

  if (!recentGames || recentGames.length === 0) {
    return { suspicious: false, flags: [], confidence: 0 };
  }

  // Check 1: Too many perfect/near-perfect scores
  const perfectScores = recentGames.filter(g => {
    if (g.game === 'solitaire') return g.score === 52;
    if (g.game === 'yahtzee') return g.score >= 350;
    if (g.game === 'backgammon') return g.score >= 500;
    return false;
  }).length;

  const perfectRatio = perfectScores / recentGames.length;
  if (perfectRatio > 0.5) {
    flags.push(`${perfectScores}/${recentGames.length} games are near-perfect (${(perfectRatio*100).toFixed(0)}%)`);
    confidence += 30;
  }

  // Check 2: Suspiciously consistent scores
  const scores = recentGames.map(g => g.score);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  // Very low variance suggests automation
  if (recentGames.length >= 5 && stdDev < avgScore * 0.05) {
    flags.push(`Scores are suspiciously consistent (std dev: ${stdDev.toFixed(2)})`);
    confidence += 25;
  }

  // Check 3: Rapid succession of submissions
  if (recentGames.length >= 3) {
    const timestamps = recentGames.map(g => new Date(g.created_at).getTime()).sort();
    const intervals = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i-1]);
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    // Average less than 30 seconds between submissions
    if (avgInterval < 30000) {
      flags.push(`Submissions averaged ${(avgInterval/1000).toFixed(1)}s apart`);
      confidence += 35;
    }
  }

  return {
    suspicious: confidence >= 50,
    flags,
    confidence
  };
}

/**
 * Calculate fraud risk score for a submission
 * Combines multiple signals into overall risk assessment
 * @param {Object} submission - Full submission data
 * @param {Array} playerHistory - Recent games from this player
 * @returns {{riskScore: number, flags: string[], recommendation: string}}
 */
export function calculateFraudRisk(submission, playerHistory = []) {
  const flags = [];
  let riskScore = 0;  // 0-100 scale

  // Signal 1: Suspicious score/time
  const scoreAnalysis = detectSuspiciousScore(
    submission.game,
    submission.score,
    submission.timeSeconds,
    submission.moves
  );

  if (scoreAnalysis.suspicious) {
    flags.push(...scoreAnalysis.flags);
    riskScore += scoreAnalysis.confidence * 0.5;  // Weight: 50%
  }

  // Signal 2: Player submission pattern
  const patternAnalysis = analyzeSubmissionPattern(submission.playerName, playerHistory);
  if (patternAnalysis.suspicious) {
    flags.push(...patternAnalysis.flags);
    riskScore += patternAnalysis.confidence * 0.3;  // Weight: 30%
  }

  // Signal 3: Missing or invalid blockchain data
  if (!submission.blockHash || !submission.blockHeight) {
    flags.push('Missing blockchain verification data');
    riskScore += 20;  // Weight: 20%
  }

  // Normalize to 0-100 range
  riskScore = Math.min(100, Math.max(0, riskScore));

  // Determine recommendation
  let recommendation;
  if (riskScore >= 75) {
    recommendation = 'REJECT';
  } else if (riskScore >= 50) {
    recommendation = 'MANUAL_REVIEW';
  } else if (riskScore >= 25) {
    recommendation = 'ACCEPT_WITH_FLAG';
  } else {
    recommendation = 'ACCEPT';
  }

  return {
    riskScore: Math.round(riskScore),
    flags,
    recommendation
  };
}

/**
 * Clear rate limit data (for testing or periodic cleanup)
 * @param {string} playerName - Optional specific player to clear
 */
export function clearRateLimits(playerName = null) {
  if (playerName) {
    submissionTimestamps.delete(playerName);
  } else {
    submissionTimestamps.clear();
  }
}

export default {
  checkRateLimit,
  detectSuspiciousScore,
  analyzeSubmissionPattern,
  calculateFraudRisk,
  clearRateLimits
};
