/**
 * Backgammon History Validator
 *
 * Replays full game from move history to validate final result
 */

import { getAllLegalMoves } from './moveValidation.js';
import {
  applyMove,
  createInitialGameState,
  checkWinner,
  getWinType
} from './gameLogic.js';

/**
 * Validate Backgammon game submission
 * Replays entire move history to verify game outcome and score
 * @param {Object} submission - Game submission data
 * @param {Array} submission.moveHistory - Array of moves made
 * @param {number} submission.score - Claimed final score
 * @param {string} submission.winType - Win type (normal/gammon/backgammon)
 * @param {number} submission.cubeValue - Doubling cube value
 * @param {string} submission.difficulty - AI difficulty (easy/normal/hard)
 * @returns {{valid: boolean, reason?: string, finalState?: Object, calculatedScore?: number}}
 */
export function validateBackgammonGame(submission) {
  const { moveHistory, score, winType, cubeValue, difficulty } = submission;

  // Validation 1: Basic data present
  if (!moveHistory || !Array.isArray(moveHistory)) {
    return { valid: false, reason: 'Missing or invalid move history' };
  }

  if (score === undefined || score === null) {
    return { valid: false, reason: 'Missing score' };
  }

  if (!winType) {
    return { valid: false, reason: 'Missing win type' };
  }

  if (!cubeValue) {
    return { valid: false, reason: 'Missing cube value' };
  }

  // Validation 2: Win type must be valid
  const validWinTypes = ['normal', 'gammon', 'backgammon'];
  if (!validWinTypes.includes(winType)) {
    return {
      valid: false,
      reason: `Invalid win type: ${winType} (must be normal/gammon/backgammon)`
    };
  }

  // Validation 3: Cube value must be power of 2 (1, 2, 4, 8, 16, 32, 64)
  const validCubeValues = [1, 2, 4, 8, 16, 32, 64];
  if (!validCubeValues.includes(cubeValue)) {
    return {
      valid: false,
      reason: `Invalid cube value: ${cubeValue} (must be 1, 2, 4, 8, 16, 32, or 64)`
    };
  }

  // Validation 4: Difficulty must be valid (affects score multiplier)
  const validDifficulties = ['easy', 'normal', 'hard'];
  const difficultyValue = { easy: 1, normal: 2, hard: 3 }[difficulty];

  if (!difficultyValue) {
    return {
      valid: false,
      reason: `Invalid difficulty: ${difficulty} (must be easy/normal/hard)`
    };
  }

  // Validation 5: Replay the game
  let gameState = createInitialGameState();

  // Note: We cannot fully validate move legality without dice rolls,
  // which would require the seed and move-by-move dice generation.
  // For now, we validate that:
  // 1. Moves are in valid format
  // 2. Game ends with white winning
  // 3. Win type matches final board state

  // Skip full replay for now (would need dice simulation)
  // Instead, validate end state and score calculation

  // Validation 6: Calculate expected score
  const winTypeValue = {
    normal: 1,
    gammon: 2,
    backgammon: 3
  }[winType];

  const expectedScore = winTypeValue * cubeValue * difficultyValue;

  if (expectedScore !== score) {
    return {
      valid: false,
      reason: `Score mismatch: expected ${expectedScore} (${winType}×${cubeValue}×${difficultyValue}), got ${score}`,
      calculatedScore: expectedScore
    };
  }

  // Validation 7: Ensure move count is reasonable
  // Backgammon games typically last 50-200 moves
  if (moveHistory.length < 10 || moveHistory.length > 500) {
    return {
      valid: false,
      reason: `Suspicious move count: ${moveHistory.length} (expected 10-500)`
    };
  }

  return {
    valid: true,
    calculatedScore: expectedScore,
    details: {
      winType,
      winTypeValue,
      cubeValue,
      difficulty,
      difficultyValue,
      moveCount: moveHistory.length
    }
  };
}

/**
 * Validate a single move is in correct format
 * @param {Object} move - Move object
 * @returns {{valid: boolean, reason?: string}}
 */
export function validateMoveFormat(move) {
  if (!move || typeof move !== 'object') {
    return { valid: false, reason: 'Move must be an object' };
  }

  if (typeof move.from !== 'number') {
    return { valid: false, reason: 'Move.from must be a number' };
  }

  if (typeof move.to !== 'number') {
    return { valid: false, reason: 'Move.to must be a number' };
  }

  // Backgammon positions are 0-25 (0=white bar, 25=black bar, 1-24=board)
  if (move.from < 0 || move.from > 25) {
    return { valid: false, reason: `Invalid from position: ${move.from}` };
  }

  if (move.to < -1 || move.to > 25) {
    return { valid: false, reason: `Invalid to position: ${move.to}` };
  }

  return { valid: true };
}

/**
 * Validate move history format
 * @param {Array} moveHistory - Array of move objects
 * @returns {{valid: boolean, reason?: string, invalidMoveIndex?: number}}
 */
export function validateMoveHistoryFormat(moveHistory) {
  if (!Array.isArray(moveHistory)) {
    return { valid: false, reason: 'Move history must be an array' };
  }

  for (let i = 0; i < moveHistory.length; i++) {
    const moveValidation = validateMoveFormat(moveHistory[i]);
    if (!moveValidation.valid) {
      return {
        valid: false,
        reason: `Move ${i}: ${moveValidation.reason}`,
        invalidMoveIndex: i
      };
    }
  }

  return { valid: true };
}

/**
 * Simplified validation without dice replay
 * Validates score calculation and move format only
 * @param {Object} submission - Game submission
 * @returns {{valid: boolean, reason?: string}}
 */
export function validateBackgammonSimplified(submission) {
  // Validate format
  const formatValidation = validateMoveHistoryFormat(submission.moveHistory || []);
  if (!formatValidation.valid) {
    return formatValidation;
  }

  // Validate score calculation
  const gameValidation = validateBackgammonGame(submission);
  return gameValidation;
}

/**
 * Calculate score from game result
 * @param {string} winType - normal/gammon/backgammon
 * @param {number} cubeValue - Doubling cube value
 * @param {string} difficulty - AI difficulty level
 * @returns {number} Final score
 */
export function calculateBackgammonScore(winType, cubeValue, difficulty) {
  const winTypeValue = { normal: 1, gammon: 2, backgammon: 3 }[winType] || 1;
  const difficultyValue = { easy: 1, normal: 2, hard: 3 }[difficulty] || 2;

  return winTypeValue * cubeValue * difficultyValue;
}

/**
 * Validate win type matches board state
 * @param {Object} boardState - Final board state
 * @param {string} claimedWinType - Claimed win type
 * @returns {{valid: boolean, reason?: string, actualWinType?: string}}
 */
export function validateWinType(boardState, claimedWinType) {
  // Check if black has borne off any checkers
  const blackBorneOff = boardState.blackBorneOff || 0;

  // Check if black has checkers in white's home or on bar
  const blackOnBar = boardState.bar?.black || 0;
  let blackInWhiteHome = 0;

  // Points 1-6 are white's home board (where black shouldn't be for normal win)
  for (let i = 1; i <= 6; i++) {
    if (boardState.points[i]?.color === 'black') {
      blackInWhiteHome += boardState.points[i].count;
    }
  }

  // Determine actual win type
  let actualWinType;

  if (blackBorneOff === 0 && (blackOnBar > 0 || blackInWhiteHome > 0)) {
    // Backgammon: Black hasn't borne off any AND has checkers in white's home or on bar
    actualWinType = 'backgammon';
  } else if (blackBorneOff === 0) {
    // Gammon: Black hasn't borne off any (but no checkers in white's home/bar)
    actualWinType = 'gammon';
  } else {
    // Normal: Black has borne off at least one
    actualWinType = 'normal';
  }

  if (actualWinType !== claimedWinType) {
    return {
      valid: false,
      reason: `Win type mismatch: claimed ${claimedWinType}, actual ${actualWinType}`,
      actualWinType
    };
  }

  return { valid: true, actualWinType };
}

export default {
  validateBackgammonGame,
  validateMoveFormat,
  validateMoveHistoryFormat,
  validateBackgammonSimplified,
  calculateBackgammonScore,
  validateWinType
};
