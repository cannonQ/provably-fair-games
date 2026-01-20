/**
 * Chess History Validator
 *
 * Validates chess game submissions by:
 * 1. Verifying color assignment was blockchain-derived
 * 2. Verifying AI commitment hash matches settings
 * 3. Replaying all moves to ensure legality
 * 4. Validating final game result
 * 5. Calculating and validating score
 */

import { Chess } from 'chess.js';
import CryptoJS from 'crypto-js';

/**
 * Verify color assignment was correctly derived from blockchain
 * @param {string} blockHash - Block hash used for color
 * @param {number|string} userSeed - User seed for color
 * @param {string} claimedColor - Claimed player color
 * @returns {{valid: boolean, reason?: string, expectedColor?: string}}
 */
export function verifyColorAssignment(blockHash, userSeed, claimedColor) {
  if (!blockHash || userSeed === undefined || !claimedColor) {
    return {
      valid: false,
      reason: 'Missing color assignment data (blockHash, userSeed, or claimedColor)'
    };
  }

  // Replicate client-side color determination
  const combined = blockHash + userSeed.toString();
  const sum = combined.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const expectedColor = sum % 2 === 0 ? 'white' : 'black';

  if (expectedColor !== claimedColor) {
    return {
      valid: false,
      reason: `Color mismatch: expected ${expectedColor}, claimed ${claimedColor}`,
      expectedColor
    };
  }

  return { valid: true, expectedColor };
}

/**
 * Verify AI commitment hash matches the revealed settings
 * @param {string} commitment - Original commitment hash
 * @param {Object} aiSettings - Revealed AI settings
 * @param {string} blockHash - Block hash used in commitment
 * @param {number|string} playerSeed - Player seed used in commitment
 * @returns {{valid: boolean, reason?: string}}
 */
export function verifyAICommitment(commitment, aiSettings, blockHash, playerSeed) {
  if (!commitment) {
    return { valid: false, reason: 'Missing AI commitment hash' };
  }

  if (!aiSettings || typeof aiSettings !== 'object') {
    return { valid: false, reason: 'Missing or invalid AI settings' };
  }

  if (!blockHash) {
    return { valid: false, reason: 'Missing block hash for commitment verification' };
  }

  if (playerSeed === undefined) {
    return { valid: false, reason: 'Missing player seed for commitment verification' };
  }

  try {
    // Sort keys for consistent JSON serialization (must match client)
    const sortedSettings = {};
    Object.keys(aiSettings).sort().forEach(key => {
      sortedSettings[key] = aiSettings[key];
    });

    const settingsJson = JSON.stringify(sortedSettings);
    const preimage = `${settingsJson}|${blockHash}|${playerSeed}`;

    // Calculate hash
    const calculatedCommitment = CryptoJS.SHA256(preimage).toString();

    if (calculatedCommitment !== commitment) {
      return {
        valid: false,
        reason: 'AI commitment hash mismatch - settings may have been tampered with',
        calculatedCommitment,
        providedCommitment: commitment
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      reason: `Commitment verification error: ${error.message}`
    };
  }
}

/**
 * Replay moves and validate they are all legal
 * @param {Array<string>} moves - Array of moves in SAN notation
 * @returns {{valid: boolean, reason?: string, finalFen?: string, moveCount?: number}}
 */
export function replayAndValidateMoves(moves) {
  if (!moves || !Array.isArray(moves)) {
    return { valid: false, reason: 'Missing or invalid moves array' };
  }

  const game = new Chess();

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];

    try {
      const result = game.move(move);
      if (!result) {
        return {
          valid: false,
          reason: `Illegal move at index ${i}: "${move}"`,
          invalidMoveIndex: i
        };
      }
    } catch (error) {
      return {
        valid: false,
        reason: `Invalid move format at index ${i}: "${move}" - ${error.message}`,
        invalidMoveIndex: i
      };
    }
  }

  return {
    valid: true,
    finalFen: game.fen(),
    moveCount: moves.length,
    isGameOver: game.isGameOver(),
    isCheckmate: game.isCheckmate(),
    isDraw: game.isDraw(),
    turn: game.turn()
  };
}

/**
 * Validate game result matches the replayed game state
 * @param {Object} claimedResult - Claimed game result
 * @param {Object} replayResult - Result from replaying moves
 * @returns {{valid: boolean, reason?: string}}
 */
export function validateGameResult(claimedResult, replayResult) {
  if (!claimedResult) {
    return { valid: false, reason: 'Missing claimed game result' };
  }

  // If game claims to be over, verify via replay
  if (claimedResult.gameOver) {
    // Check for resignation - game wouldn't be over in replay
    if (!replayResult.isGameOver && claimedResult.reason === 'resignation') {
      // Resignation is acceptable - we can't verify from moves alone
      return {
        valid: true,
        note: 'Game ended by resignation (cannot fully verify from moves)'
      };
    }

    if (!replayResult.isGameOver) {
      return {
        valid: false,
        reason: 'Game claims to be over but replay shows game is still in progress'
      };
    }

    // Verify win/draw status
    if (claimedResult.winner) {
      if (!replayResult.isCheckmate) {
        // Could be resignation - we can't verify resignations from moves alone
        // Allow it but note it
        return {
          valid: true,
          note: 'Game ended by resignation (cannot fully verify from moves)'
        };
      }

      // Checkmate: verify winner is correct
      // In chess.js, after checkmate the turn is the player who LOST
      const expectedWinner = replayResult.turn === 'w' ? 'black' : 'white';
      if (claimedResult.winner !== expectedWinner) {
        return {
          valid: false,
          reason: `Winner mismatch: expected ${expectedWinner}, claimed ${claimedResult.winner}`
        };
      }
    } else {
      // Draw claimed
      if (!replayResult.isDraw) {
        return {
          valid: false,
          reason: 'Draw claimed but replay does not show a draw'
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Calculate chess score based on game outcome and opponent ELO
 * @param {Object} result - Game result
 * @param {string} playerColor - Player's color
 * @param {number} opponentElo - Opponent (AI) ELO rating
 * @returns {number} Calculated score
 */
export function calculateChessScore(result, playerColor, opponentElo) {
  if (!result || !result.gameOver) {
    return 0;
  }

  // Base score from opponent ELO (higher ELO = more points)
  // Scale: 400 ELO = 100 base points, 3000 ELO = 1000 base points
  const baseScore = Math.floor((opponentElo - 300) / 2.7);

  if (result.winner === playerColor) {
    // Win: Full base score
    return baseScore;
  } else if (result.winner === null) {
    // Draw: 50% of base score
    return Math.floor(baseScore * 0.5);
  } else {
    // Loss: 10% of base score (as per commit message)
    return Math.floor(baseScore * 0.1);
  }
}

/**
 * Main chess game validator
 * @param {Object} submission - Game submission data
 * @returns {{valid: boolean, reason?: string, calculatedScore?: number, details?: Object}}
 */
export function validateChessGame(submission) {
  const {
    moves,
    playerColor,
    result,
    aiSettings,
    colorAssignment,
    aiCommitment,
    score
  } = submission;

  const validationDetails = {
    colorVerification: null,
    commitmentVerification: null,
    moveValidation: null,
    resultValidation: null,
    scoreValidation: null
  };

  // Validation 1: Basic data present
  if (!moves || !Array.isArray(moves)) {
    return { valid: false, reason: 'Missing or invalid moves array' };
  }

  if (!playerColor || !['white', 'black'].includes(playerColor)) {
    return { valid: false, reason: 'Missing or invalid player color' };
  }

  if (!result) {
    return { valid: false, reason: 'Missing game result' };
  }

  // Validation 2: Verify color assignment (if data provided)
  if (colorAssignment) {
    const colorVerification = verifyColorAssignment(
      colorAssignment.blockHash,
      colorAssignment.userSeed,
      playerColor
    );
    validationDetails.colorVerification = colorVerification;

    if (!colorVerification.valid) {
      return {
        valid: false,
        reason: `Color verification failed: ${colorVerification.reason}`,
        details: validationDetails
      };
    }
  } else {
    validationDetails.colorVerification = { skipped: true, reason: 'No color assignment data provided' };
  }

  // Validation 3: Verify AI commitment (if data provided)
  if (aiCommitment && aiSettings) {
    const commitmentVerification = verifyAICommitment(
      aiCommitment.commitment,
      aiSettings,
      aiCommitment.blockHash,
      aiCommitment.playerSeed
    );
    validationDetails.commitmentVerification = commitmentVerification;

    if (!commitmentVerification.valid) {
      return {
        valid: false,
        reason: `AI commitment verification failed: ${commitmentVerification.reason}`,
        details: validationDetails
      };
    }
  } else {
    validationDetails.commitmentVerification = { skipped: true, reason: 'No AI commitment data provided' };
  }

  // Validation 4: Replay all moves
  const moveValidation = replayAndValidateMoves(moves);
  validationDetails.moveValidation = moveValidation;

  if (!moveValidation.valid) {
    return {
      valid: false,
      reason: `Move validation failed: ${moveValidation.reason}`,
      details: validationDetails
    };
  }

  // Validation 5: Validate game result
  const resultValidation = validateGameResult(result, moveValidation);
  validationDetails.resultValidation = resultValidation;

  if (!resultValidation.valid) {
    return {
      valid: false,
      reason: `Result validation failed: ${resultValidation.reason}`,
      details: validationDetails
    };
  }

  // Validation 6: Calculate and verify score
  const opponentElo = aiSettings?.targetElo || aiSettings?.originalElo || 1200;
  const calculatedScore = calculateChessScore(result, playerColor, opponentElo);
  validationDetails.scoreValidation = {
    calculatedScore,
    claimedScore: score,
    opponentElo
  };

  // Allow some flexibility in score (client may calculate slightly differently)
  if (score !== undefined && Math.abs(score - calculatedScore) > calculatedScore * 0.1) {
    return {
      valid: false,
      reason: `Score mismatch: expected ~${calculatedScore}, got ${score}`,
      calculatedScore,
      details: validationDetails
    };
  }

  // Validation 7: Sanity checks
  // Games should have a reasonable number of moves (not too few, not impossibly many)
  if (moves.length < 2) {
    return {
      valid: false,
      reason: `Suspiciously few moves: ${moves.length}`,
      details: validationDetails
    };
  }

  if (moves.length > 500) {
    return {
      valid: false,
      reason: `Suspiciously many moves: ${moves.length} (max 500)`,
      details: validationDetails
    };
  }

  // All validations passed
  return {
    valid: true,
    calculatedScore,
    details: {
      ...validationDetails,
      moveCount: moves.length,
      playerColor,
      result: result.result,
      winner: result.winner,
      reason: result.reason,
      opponentElo
    }
  };
}

export default {
  validateChessGame,
  verifyColorAssignment,
  verifyAICommitment,
  replayAndValidateMoves,
  validateGameResult,
  calculateChessScore
};
