/**
 * Solitaire Score Validator
 *
 * Validates Solitaire game score and move count
 */

/**
 * Validate Solitaire game submission
 * @param {Object} submission - Game submission data
 * @param {number} submission.score - Cards moved to foundation (0-52)
 * @param {number} submission.moves - Total moves made
 * @param {number} submission.timeSeconds - Time taken
 * @returns {{valid: boolean, reason?: string, details?: Object}}
 */
export function validateSolitaireGame(submission) {
  const { score, moves, timeSeconds } = submission;

  // Validation 1: Basic data present
  if (score === undefined || score === null) {
    return { valid: false, reason: 'Missing score' };
  }

  // Validation 2: Score must be 0-52
  if (score < 0 || score > 52) {
    return {
      valid: false,
      reason: `Invalid score: ${score} (must be 0-52 cards)`
    };
  }

  // Validation 3: If score > 0, must have made moves
  if (score > 0 && moves !== undefined && moves < score) {
    return {
      valid: false,
      reason: `Impossible: ${score} cards to foundation with only ${moves} moves`
    };
  }

  // Validation 4: Perfect game (52 cards) should have reasonable move count
  if (score === 52) {
    // Perfect game typically requires 80-200 moves (varies by shuffle)
    if (moves && (moves < 52 || moves > 500)) {
      return {
        valid: false,
        reason: `Perfect game with ${moves} moves is suspicious (expected 52-500)`
      };
    }

    // Perfect game should take at least 30 seconds
    if (timeSeconds && timeSeconds < 30) {
      return {
        valid: false,
        reason: `Perfect game in ${timeSeconds}s is too fast (min expected: 30s)`
      };
    }
  }

  // Validation 5: Time should be reasonable for move count
  if (timeSeconds && moves) {
    const avgTimePerMove = timeSeconds / moves;

    // Each move should take at least 0.3 seconds (human speed limit)
    if (avgTimePerMove < 0.3) {
      return {
        valid: false,
        reason: `Average ${avgTimePerMove.toFixed(2)}s per move is too fast (min: 0.3s)`
      };
    }
  }

  return {
    valid: true,
    calculatedScore: score,
    details: {
      score,
      moves,
      timeSeconds,
      avgTimePerMove: timeSeconds && moves ? (timeSeconds / moves).toFixed(2) : null
    }
  };
}

/**
 * Estimate minimum moves needed for a score
 * @param {number} score - Cards in foundation
 * @returns {number} Minimum moves
 */
export function estimateMinMovesForScore(score) {
  // At minimum, each card to foundation is one move
  // But you often need to reveal cards, move to tableau, etc.
  // Rough estimate: 1.5x the score for casual play
  return score;
}

/**
 * Check if move count is reasonable for score
 * @param {number} score - Cards in foundation
 * @param {number} moves - Moves made
 * @returns {{valid: boolean, reason?: string}}
 */
export function validateMoveCount(score, moves) {
  const minMoves = estimateMinMovesForScore(score);

  if (moves < minMoves) {
    return {
      valid: false,
      reason: `${moves} moves insufficient for ${score} cards (min: ${minMoves})`
    };
  }

  // Max moves should be reasonable (not 10,000 moves for 10 cards)
  const maxReasonableMoves = score * 50;
  if (moves > maxReasonableMoves) {
    return {
      valid: false,
      reason: `${moves} moves excessive for ${score} cards (max expected: ${maxReasonableMoves})`
    };
  }

  return { valid: true };
}

export default {
  validateSolitaireGame,
  estimateMinMovesForScore,
  validateMoveCount
};
