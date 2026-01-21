/**
 * Master Game Validator
 *
 * Dispatches validation to game-specific validators
 */

// Import game-specific validators
import { validateBackgammonGame } from './games/backgammon/historyValidator.js';
import { validateYahtzeeGame } from './games/yahtzee/historyValidator.js';
import { validateBlackjackGame } from './games/blackjack/historyValidator.js';
import { validate2048Game } from './games/2048/scoreValidator.js';
import { validateSolitaireGame } from './games/solitaire/scoreValidator.js';
import { validateGarbageGame } from './games/garbage/scoreValidator.js';
import { validateChessGame } from './games/chess/historyValidator.js';

// Import shared utilities
import {
  verifyBlock,
  verifySeed,
  validateGameIdFormat
} from './shared/blockchainUtils.js';

import {
  calculateFraudRisk,
  checkRateLimit
} from './shared/fraudDetection.js';

/**
 * Validate complete game submission
 * Performs all validation checks: blockchain, game logic, fraud detection
 * @param {Object} submission - Full game submission
 * @param {Object} options - Validation options
 * @param {boolean} options.skipBlockchain - Skip blockchain verification (for testing)
 * @param {boolean} options.skipFraud - Skip fraud detection
 * @param {Array} options.playerHistory - Recent games from player (for fraud detection)
 * @returns {Promise<{valid: boolean, reason?: string, details?: Object, riskScore?: number}>}
 */
export async function validateGameSubmission(submission, options = {}) {
  const {
    skipBlockchain = false,
    skipFraud = false,
    playerHistory = []
  } = options;

  const validationResults = {
    blockchain: null,
    gameLogic: null,
    fraudDetection: null
  };

  // Step 1: Validate game type
  const validGameTypes = ['backgammon', 'yahtzee', 'blackjack', '2048', 'solitaire', 'garbage', 'chess'];
  if (!validGameTypes.includes(submission.game)) {
    return {
      valid: false,
      reason: `Invalid game type: ${submission.game}`,
      validationResults
    };
  }

  // Step 2: Validate game ID format
  if (!validateGameIdFormat(submission.gameId, submission.game)) {
    return {
      valid: false,
      reason: `Invalid game ID format for ${submission.game}`,
      validationResults
    };
  }

  // Step 3: Blockchain verification (optional)
  if (!skipBlockchain && submission.blockHash && submission.blockHeight) {
    const blockVerification = await verifyBlock(
      submission.blockHash,
      submission.blockHeight
    );

    validationResults.blockchain = blockVerification;

    if (!blockVerification.valid) {
      return {
        valid: false,
        reason: `Blockchain verification failed: ${blockVerification.reason}`,
        validationResults
      };
    }

    // Verify seed if provided
    if (submission.seed) {
      const blockData = {
        blockHash: submission.blockHash,
        txHash: submission.txHash,
        timestamp: submission.blockTimestamp,
        txIndex: submission.txIndex || 0
      };

      const seedValid = verifySeed(submission.seed, blockData, submission.gameId);
      if (!seedValid) {
        validationResults.blockchain.seedMismatch = true;
        // Warning but not failure - could be timing/format issue
      }
    }
  }

  // Step 4: Game-specific validation
  let gameValidation;

  switch (submission.game) {
    case 'backgammon':
      gameValidation = validateBackgammonGame(submission);
      break;

    case 'yahtzee':
      gameValidation = validateYahtzeeGame(submission);
      break;

    case 'blackjack':
      gameValidation = validateBlackjackGame(submission);
      break;

    case '2048':
      gameValidation = validate2048Game(submission);
      break;

    case 'solitaire':
      gameValidation = validateSolitaireGame(submission);
      break;

    case 'garbage':
      gameValidation = validateGarbageGame(submission);
      break;

    case 'chess':
      gameValidation = validateChessGame(submission);
      break;

    default:
      return {
        valid: false,
        reason: `No validator for game: ${submission.game}`,
        validationResults
      };
  }

  validationResults.gameLogic = gameValidation;

  if (!gameValidation.valid) {
    return {
      valid: false,
      reason: `Game validation failed: ${gameValidation.reason}`,
      validationResults
    };
  }

  // Step 5: Fraud detection (optional)
  if (!skipFraud) {
    const fraudAnalysis = calculateFraudRisk(submission, playerHistory);
    validationResults.fraudDetection = fraudAnalysis;

    // If high risk, reject or flag
    if (fraudAnalysis.recommendation === 'REJECT') {
      return {
        valid: false,
        reason: `Fraud detection: ${fraudAnalysis.flags.join(', ')}`,
        riskScore: fraudAnalysis.riskScore,
        validationResults
      };
    }

    // For MANUAL_REVIEW, still accept but flag
    if (fraudAnalysis.recommendation === 'MANUAL_REVIEW') {
      validationResults.needsReview = true;
    }
  }

  // All validations passed
  return {
    valid: true,
    validationResults,
    calculatedScore: gameValidation.calculatedScore,
    details: gameValidation.details
  };
}

/**
 * Quick validation (game logic only, no blockchain/fraud)
 * Useful for testing or pre-submission validation
 * @param {Object} submission - Game submission
 * @returns {{valid: boolean, reason?: string}}
 */
export function validateGameLogicOnly(submission) {
  return validateGameSubmission(submission, {
    skipBlockchain: true,
    skipFraud: true
  });
}

/**
 * Validate with rate limiting
 * @param {Object} submission - Game submission
 * @param {Object} options - Validation options
 * @returns {Promise<{valid: boolean, reason?: string}>}
 */
export async function validateWithRateLimit(submission, options = {}) {
  // Check rate limit first
  const rateLimit = checkRateLimit(submission.playerName || 'anonymous');
  if (!rateLimit.allowed) {
    return {
      valid: false,
      reason: rateLimit.reason,
      waitTime: rateLimit.waitTime
    };
  }

  // Proceed with full validation
  return validateGameSubmission(submission, options);
}

/**
 * Validation severity levels
 */
export const ValidationLevel = {
  BASIC: 'basic',           // Game ID format only
  LOGIC: 'logic',           // + Game logic validation
  BLOCKCHAIN: 'blockchain', // + Blockchain verification
  FULL: 'full'             // + Fraud detection
};

/**
 * Validate at specific level
 * @param {Object} submission - Game submission
 * @param {string} level - Validation level
 * @param {Object} options - Additional options
 * @returns {Promise<{valid: boolean, reason?: string}>}
 */
export async function validateAtLevel(submission, level, options = {}) {
  switch (level) {
    case ValidationLevel.BASIC:
      return {
        valid: validateGameIdFormat(submission.gameId, submission.game),
        reason: validateGameIdFormat(submission.gameId, submission.game)
          ? null
          : 'Invalid game ID format'
      };

    case ValidationLevel.LOGIC:
      return validateGameLogicOnly(submission);

    case ValidationLevel.BLOCKCHAIN:
      return validateGameSubmission(submission, {
        skipFraud: true,
        ...options
      });

    case ValidationLevel.FULL:
      return validateGameSubmission(submission, options);

    default:
      return { valid: false, reason: `Unknown validation level: ${level}` };
  }
}

export default {
  validateGameSubmission,
  validateGameLogicOnly,
  validateWithRateLimit,
  validateAtLevel,
  ValidationLevel
};
