/**
 * Garbage Score Validator
 *
 * Validates Garbage card game score
 */

/**
 * Validate Garbage game submission
 * @param {Object} submission - Game submission data
 * @param {number} submission.score - Final score (points accumulated)
 * @param {number} submission.rounds - Rounds completed
 * @param {number} submission.timeSeconds - Time taken
 * @param {string} submission.difficulty - AI difficulty
 * @returns {{valid: boolean, reason?: string, details?: Object}}
 */
export function validateGarbageGame(submission) {
  const { score, rounds, timeSeconds, difficulty } = submission;

  // Validation 1: Basic data present
  if (score === undefined || score === null) {
    return { valid: false, reason: 'Missing score' };
  }

  // Validation 2: Score must be non-negative
  if (score < 0) {
    return {
      valid: false,
      reason: `Score cannot be negative: ${score}`
    };
  }

  // Validation 3: Validate difficulty if provided
  if (difficulty) {
    const validDifficulties = ['easy', 'normal', 'hard'];
    if (!validDifficulties.includes(difficulty)) {
      return {
        valid: false,
        reason: `Invalid difficulty: ${difficulty} (must be easy/normal/hard)`
      };
    }
  }

  // Validation 4: Rounds should be reasonable
  if (rounds !== undefined) {
    if (rounds < 1 || rounds > 50) {
      return {
        valid: false,
        reason: `Invalid round count: ${rounds} (expected 1-50)`
      };
    }

    // Score should increase with rounds
    // Each round gives some points, rough estimate: 10-1000 per round
    const minExpectedScore = rounds * 5;
    const maxExpectedScore = rounds * 2000;

    if (score < minExpectedScore) {
      return {
        valid: false,
        reason: `Score ${score} too low for ${rounds} rounds (min: ${minExpectedScore})`
      };
    }

    if (score > maxExpectedScore) {
      return {
        valid: false,
        reason: `Score ${score} too high for ${rounds} rounds (max: ${maxExpectedScore})`
      };
    }
  }

  // Validation 5: Time should be reasonable
  if (timeSeconds && rounds) {
    const avgTimePerRound = timeSeconds / rounds;

    // Each round should take at least 2 seconds (drawing cards, placing)
    if (avgTimePerRound < 2) {
      return {
        valid: false,
        reason: `Average ${avgTimePerRound.toFixed(1)}s per round is too fast (min: 2s)`
      };
    }

    // But not more than 5 minutes per round
    if (avgTimePerRound > 300) {
      return {
        valid: false,
        reason: `Average ${avgTimePerRound.toFixed(1)}s per round is too slow (max: 300s)`
      };
    }
  }

  return {
    valid: true,
    calculatedScore: score,
    details: {
      score,
      rounds,
      timeSeconds,
      difficulty,
      avgTimePerRound: timeSeconds && rounds ? (timeSeconds / rounds).toFixed(1) : null
    }
  };
}

/**
 * Calculate scoring for Garbage game
 * Garbage scores based on speed and completion
 * @param {number} rounds - Rounds played
 * @param {boolean} playerWon - Did player win
 * @param {number} timeSeconds - Time taken
 * @returns {number} Estimated score
 */
export function calculateGarbageScore(rounds, playerWon, timeSeconds) {
  let score = 0;

  // Base points per round
  score += rounds * 100;

  // Bonus for winning
  if (playerWon) {
    score += 500;
  }

  // Time bonus (faster = more points)
  if (timeSeconds) {
    const avgTimePerRound = timeSeconds / rounds;
    if (avgTimePerRound < 30) {
      score += 200; // Fast play bonus
    }
  }

  return score;
}

/**
 * Validate round count is reasonable
 * @param {number} rounds - Rounds played
 * @returns {{valid: boolean, reason?: string}}
 */
export function validateRoundCount(rounds) {
  if (rounds < 1) {
    return {
      valid: false,
      reason: 'Must play at least 1 round'
    };
  }

  if (rounds > 50) {
    return {
      valid: false,
      reason: `${rounds} rounds is excessive (max: 50)`
    };
  }

  return { valid: true };
}

/**
 * Estimate expected score range for game
 * @param {number} rounds - Rounds played
 * @returns {{min: number, max: number}}
 */
export function estimateScoreRange(rounds) {
  return {
    min: rounds * 5,
    max: rounds * 2000
  };
}

export default {
  validateGarbageGame,
  calculateGarbageScore,
  validateRoundCount,
  estimateScoreRange
};
