/**
 * 2048 Score Validator
 *
 * Validates 2048 game score and move history
 */

/**
 * Validate 2048 game submission
 * Checks score reasonability and move sequence
 * @param {Object} submission - Game submission data
 * @param {number} submission.score - Final score
 * @param {string} submission.moveHistory - Move sequence (e.g., "UDLRLLUD...")
 * @param {number} submission.highestTile - Highest tile achieved
 * @returns {{valid: boolean, reason?: string, details?: Object}}
 */
export function validate2048Game(submission) {
  const { score, moveHistory, highestTile } = submission;

  // Validation 1: Basic data present
  if (score === undefined || score === null) {
    return { valid: false, reason: 'Missing score' };
  }

  // Validation 2: Score must be non-negative
  if (score < 0) {
    return { valid: false, reason: 'Score cannot be negative' };
  }

  // Validation 3: Highest tile must be power of 2
  if (highestTile) {
    if (highestTile < 2 || !isPowerOfTwo(highestTile)) {
      return {
        valid: false,
        reason: `Invalid highest tile: ${highestTile} (must be power of 2)`
      };
    }

    // Score should be reasonable for highest tile achieved
    const minScoreForTile = estimateMinScoreForTile(highestTile);
    if (score < minScoreForTile) {
      return {
        valid: false,
        reason: `Score ${score} too low for highest tile ${highestTile} (min expected: ${minScoreForTile})`
      };
    }
  }

  // Validation 4: Move history format (if provided)
  if (moveHistory) {
    if (typeof moveHistory !== 'string') {
      return { valid: false, reason: 'Move history must be a string' };
    }

    // All moves should be U, D, L, or R
    const validMoves = /^[UDLR]*$/;
    if (!validMoves.test(moveHistory)) {
      return {
        valid: false,
        reason: 'Move history contains invalid characters (must be UDLR only)'
      };
    }

    // Move count should be reasonable (typically 100-10000 moves)
    if (moveHistory.length < 10) {
      return {
        valid: false,
        reason: `Too few moves: ${moveHistory.length} (suspicious)`
      };
    }

    if (moveHistory.length > 50000) {
      return {
        valid: false,
        reason: `Too many moves: ${moveHistory.length} (suspicious)`
      };
    }
  }

  // Validation 5: Score should be reasonable
  const maxReasonableScore = 100000; // Scores beyond this are rare but possible
  if (score > maxReasonableScore) {
    // This is a warning, not a hard failure
    return {
      valid: true,
      calculatedScore: score,
      warning: `Score ${score} is unusually high`,
      details: {
        score,
        highestTile,
        moveCount: moveHistory ? moveHistory.length : 0
      }
    };
  }

  return {
    valid: true,
    calculatedScore: score,
    details: {
      score,
      highestTile,
      moveCount: moveHistory ? moveHistory.length : 0
    }
  };
}

/**
 * Check if number is power of 2
 * @param {number} n - Number to check
 * @returns {boolean} True if power of 2
 */
function isPowerOfTwo(n) {
  return n > 0 && (n & (n - 1)) === 0;
}

/**
 * Estimate minimum score needed to achieve a tile
 * Based on doubling: 2→4 gives 4 points, 4→8 gives 8 points, etc.
 * @param {number} tile - Target tile value
 * @returns {number} Estimated minimum score
 */
function estimateMinScoreForTile(tile) {
  let score = 0;
  let current = 4; // First merge (2+2=4) gives 4 points

  while (current <= tile) {
    score += current;
    current *= 2;
  }

  // Account for needing multiple tiles
  // To get one 2048 tile, you need to merge many smaller tiles
  // This is a rough estimate - actual scores are usually higher
  return Math.floor(score * 0.5);
}

/**
 * Calculate theoretical maximum tile for given move count
 * Rough heuristic: every ~10-15 moves can produce next tier tile
 * @param {number} moveCount - Number of moves made
 * @returns {number} Estimated max tile possible
 */
export function estimateMaxTileForMoves(moveCount) {
  if (moveCount < 10) return 16;
  if (moveCount < 50) return 128;
  if (moveCount < 100) return 256;
  if (moveCount < 200) return 512;
  if (moveCount < 500) return 1024;
  if (moveCount < 1000) return 2048;
  if (moveCount < 2000) return 4096;
  return 8192; // Beyond this is very rare
}

/**
 * Validate move history consistency with final state
 * @param {string} moveHistory - Move sequence
 * @param {number} score - Final score
 * @param {number} highestTile - Highest tile
 * @returns {{valid: boolean, reason?: string}}
 */
export function validateMoveConsistency(moveHistory, score, highestTile) {
  const moveCount = moveHistory.length;

  // Check if highest tile is achievable with move count
  const maxExpectedTile = estimateMaxTileForMoves(moveCount);
  if (highestTile > maxExpectedTile * 2) {
    return {
      valid: false,
      reason: `Highest tile ${highestTile} unlikely with only ${moveCount} moves (max expected: ${maxExpectedTile})`
    };
  }

  // Check if score matches roughly with tile progression
  const minExpectedScore = estimateMinScoreForTile(highestTile);
  if (score < minExpectedScore * 0.3) {
    return {
      valid: false,
      reason: `Score ${score} too low for tile ${highestTile}`
    };
  }

  return { valid: true };
}

export default {
  validate2048Game,
  estimateMaxTileForMoves,
  validateMoveConsistency
};
