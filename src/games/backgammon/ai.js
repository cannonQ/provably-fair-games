/**
 * Backgammon AI
 * 
 * Three difficulty levels with different evaluation strategies:
 * - Easy: Random moves, occasional doubling
 * - Normal: Basic evaluation, prefers hits and safe moves
 * - Hard: Full evaluation with lookahead
 */

import { 
  getPipCount, 
  hasCheckersOnBar,
  getHomeRange,
  allCheckersInHome
} from './gameLogic';
import { applyMove, getAllLegalMoves } from './moveValidation';

// ============================================
// POSITION EVALUATION
// ============================================

/**
 * Count blots (single checkers vulnerable to being hit)
 * @param {object} state - Game state
 * @param {string} player - 'white' or 'black'
 * @returns {number} Number of blots
 */
function countBlots(state, player) {
  let blots = 0;
  for (let i = 0; i < 24; i++) {
    if (state.points[i].color === player && state.points[i].checkers === 1) {
      blots++;
    }
  }
  return blots;
}

/**
 * Count exposed blots (blots that opponent could potentially hit)
 * More dangerous the further from home
 * @param {object} state - Game state
 * @param {string} player - 'white' or 'black'
 * @returns {number} Weighted blot exposure score
 */
function countExposedBlots(state, player) {
  const opponent = player === 'white' ? 'black' : 'white';
  const homeRange = getHomeRange(player);
  let exposure = 0;
  
  for (let i = 0; i < 24; i++) {
    if (state.points[i].color === player && state.points[i].checkers === 1) {
      // Calculate distance from home (more dangerous if far)
      let distanceFromHome;
      if (player === 'white') {
        distanceFromHome = i - homeRange.end;
      } else {
        distanceFromHome = homeRange.start - i;
      }
      
      if (distanceFromHome > 0) {
        // Check if opponent has any checkers that could reach this point
        const canBeHit = checkIfCanBeHit(state, i, opponent);
        if (canBeHit) {
          exposure += 1 + (distanceFromHome * 0.2);
        }
      } else {
        // In home board, less dangerous but still a blot
        exposure += 0.5;
      }
    }
  }
  
  return exposure;
}

/**
 * Check if a point could potentially be hit by opponent
 * @param {object} state - Game state
 * @param {number} pointIndex - Point to check
 * @param {string} opponent - Opponent color
 * @returns {boolean}
 */
function checkIfCanBeHit(state, pointIndex, opponent) {
  // Check if opponent has checkers within 6 points (direct hit range)
  // or on the bar
  if (state.bar[opponent] > 0) {
    // Opponent could enter and hit
    const entryRange = opponent === 'white' ? [18, 23] : [0, 5];
    if (pointIndex >= entryRange[0] && pointIndex <= entryRange[1]) {
      return true;
    }
  }
  
  // Check points within direct hit range
  for (let dist = 1; dist <= 6; dist++) {
    const fromPoint = opponent === 'white' 
      ? pointIndex + dist 
      : pointIndex - dist;
    
    if (fromPoint >= 0 && fromPoint <= 23) {
      if (state.points[fromPoint].color === opponent && 
          state.points[fromPoint].checkers > 0) {
        return true;
      }
    }
  }
  
  // Check for possible combination hits (within 12 points for two-dice combos)
  for (let dist = 7; dist <= 12; dist++) {
    const fromPoint = opponent === 'white' 
      ? pointIndex + dist 
      : pointIndex - dist;
    
    if (fromPoint >= 0 && fromPoint <= 23) {
      if (state.points[fromPoint].color === opponent && 
          state.points[fromPoint].checkers > 0) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Calculate prime strength (consecutive blocked points)
 * @param {object} state - Game state
 * @param {string} player - 'white' or 'black'
 * @returns {number} Prime score
 */
function calculatePrimeStrength(state, player) {
  let maxPrime = 0;
  let currentPrime = 0;
  let totalPrimePoints = 0;
  
  for (let i = 0; i < 24; i++) {
    if (state.points[i].color === player && state.points[i].checkers >= 2) {
      currentPrime++;
      totalPrimePoints++;
      maxPrime = Math.max(maxPrime, currentPrime);
    } else {
      currentPrime = 0;
    }
  }
  
  // Score based on max consecutive + total made points
  let score = maxPrime * 3 + totalPrimePoints;
  
  // Bonus for 6-prime (complete block)
  if (maxPrime >= 6) {
    score += 20;
  } else if (maxPrime >= 5) {
    score += 10;
  } else if (maxPrime >= 4) {
    score += 5;
  }
  
  return score;
}

/**
 * Calculate home board control score
 * @param {object} state - Game state
 * @param {string} player - 'white' or 'black'
 * @returns {number} Home board score
 */
function calculateHomeControl(state, player) {
  const homeRange = getHomeRange(player);
  let score = 0;
  let madePoints = 0;
  
  for (let i = homeRange.start; i <= homeRange.end; i++) {
    if (state.points[i].color === player) {
      if (state.points[i].checkers >= 2) {
        madePoints++;
        // Higher home points more valuable (block entry)
        const pointValue = player === 'white' ? (6 - i) : (i - 17);
        score += 2 + pointValue;
      } else {
        score += 0.5; // Blot in home board
      }
    }
  }
  
  // Bonus for multiple made points
  if (madePoints >= 5) score += 10;
  else if (madePoints >= 4) score += 5;
  else if (madePoints >= 3) score += 2;
  
  return score;
}

/**
 * Calculate bearing off progress score
 * @param {object} state - Game state
 * @param {string} player - 'white' or 'black'
 * @returns {number} Bearing off score
 */
function calculateBearOffProgress(state, player) {
  // Direct points for checkers already borne off
  let score = state.bearOff[player] * 10;
  
  // Bonus if all checkers in home and can start bearing off
  if (allCheckersInHome(state, player)) {
    score += 15;
    
    // Extra bonus for being close to winning
    if (state.bearOff[player] >= 10) {
      score += 20;
    } else if (state.bearOff[player] >= 5) {
      score += 10;
    }
  }
  
  return score;
}

/**
 * Full position evaluation
 * @param {object} state - Game state
 * @param {string} player - 'white' or 'black'
 * @param {string} difficulty - 'easy' | 'normal' | 'hard'
 * @returns {number} Position score (higher = better for player)
 */
export function evaluatePosition(state, player, difficulty = 'normal') {
  const opponent = player === 'white' ? 'black' : 'white';
  
  // Basic factors
  const myPips = getPipCount(state, player);
  const oppPips = getPipCount(state, opponent);
  const pipAdvantage = oppPips - myPips;
  
  const myBar = state.bar[player];
  const oppBar = state.bar[opponent];
  
  const myBearOff = state.bearOff[player];
  const oppBearOff = state.bearOff[opponent];
  
  // Easy: Just pip count
  if (difficulty === 'easy') {
    return pipAdvantage + (oppBar * 10) - (myBar * 10) + (myBearOff * 5);
  }
  
  // Normal: Add blot and prime considerations
  const myBlots = countBlots(state, player);
  const oppBlots = countBlots(state, opponent);
  
  const myPrime = calculatePrimeStrength(state, player);
  const oppPrime = calculatePrimeStrength(state, opponent);
  
  if (difficulty === 'normal') {
    return (
      pipAdvantage * 1.0 +
      (oppBar - myBar) * 15 +
      (oppBlots - myBlots) * 3 +
      (myPrime - oppPrime) * 2 +
      (myBearOff - oppBearOff) * 8
    );
  }
  
  // Hard: Full evaluation
  const myExposure = countExposedBlots(state, player);
  const oppExposure = countExposedBlots(state, opponent);
  
  const myHome = calculateHomeControl(state, player);
  const oppHome = calculateHomeControl(state, opponent);
  
  const myBearOffProgress = calculateBearOffProgress(state, player);
  const oppBearOffProgress = calculateBearOffProgress(state, opponent);
  
  return (
    pipAdvantage * 1.5 +
    (oppBar - myBar) * 20 +
    (oppExposure - myExposure) * 5 +
    (myPrime - oppPrime) * 3 +
    (myHome - oppHome) * 2 +
    (myBearOffProgress - oppBearOffProgress) * 1.5
  );
}

// ============================================
// MOVE EVALUATION
// ============================================

/**
 * Evaluate a single move
 * @param {object} state - Current state
 * @param {object} move - Move to evaluate
 * @param {string} player - Player making move
 * @param {string} difficulty - AI difficulty
 * @returns {number} Move score
 */
function evaluateSingleMove(state, move, player, difficulty) {
  let score = 0;
  
  // Hitting is usually good
  if (move.hits) {
    score += difficulty === 'hard' ? 15 : 10;
  }
  
  // Bearing off is great
  if (move.to === 'bearOff') {
    score += difficulty === 'hard' ? 12 : 8;
  }
  
  // Making a point (landing on own checker) is good
  if (move.to !== 'bearOff' && typeof move.to === 'number') {
    const destPoint = state.points[move.to];
    if (destPoint.color === player && destPoint.checkers === 1) {
      score += 8; // Making a point
    }
  }
  
  // Leaving a blot is bad
  if (move.from !== 'bar' && typeof move.from === 'number') {
    const sourcePoint = state.points[move.from];
    if (sourcePoint.checkers === 2) {
      // We're breaking a point
      score -= 3;
    }
  }
  
  // Entering from bar is necessary and good
  if (move.from === 'bar') {
    score += 5;
  }
  
  return score;
}

/**
 * Evaluate a complete move sequence (for hard AI)
 * @param {object} state - Starting state
 * @param {Array} moves - Sequence of moves
 * @param {string} player - Player color
 * @returns {number} Final position score
 */
function evaluateMoveSequence(state, moves, player) {
  let currentState = state;
  let moveBonus = 0;
  
  for (const move of moves) {
    moveBonus += evaluateSingleMove(currentState, move, player, 'hard');
    currentState = applyMove(currentState, move);
  }
  
  // Final position evaluation
  const positionScore = evaluatePosition(currentState, player, 'hard');
  
  return positionScore + moveBonus;
}

// ============================================
// MOVE SELECTION
// ============================================

/**
 * Select best move(s) for AI
 * @param {Array} legalMoves - Available legal moves
 * @param {object} state - Current game state
 * @param {string} difficulty - 'easy' | 'normal' | 'hard'
 * @returns {object|null} Selected move or null if no moves
 */
export function selectMove(legalMoves, state, difficulty = 'normal') {
  if (!legalMoves || legalMoves.length === 0) {
    return null;
  }
  
  const player = state.currentPlayer;
  
  switch (difficulty) {
    case 'easy':
      return selectMoveEasy(legalMoves);
    case 'normal':
      return selectMoveNormal(legalMoves, state, player);
    case 'hard':
      return selectMoveHard(legalMoves, state, player);
    default:
      return selectMoveNormal(legalMoves, state, player);
  }
}

/**
 * Easy AI: Random move selection
 */
function selectMoveEasy(legalMoves) {
  const index = Math.floor(Math.random() * legalMoves.length);
  return legalMoves[index];
}

/**
 * Normal AI: Basic evaluation
 */
function selectMoveNormal(legalMoves, state, player) {
  let bestMove = legalMoves[0];
  let bestScore = -Infinity;
  
  for (const move of legalMoves) {
    let score = evaluateSingleMove(state, move, player, 'normal');
    
    // Apply move and evaluate resulting position
    const newState = applyMove(state, move);
    score += evaluatePosition(newState, player, 'normal') * 0.5;
    
    // Add small random factor to avoid predictability
    score += Math.random() * 2;
    
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  
  return bestMove;
}

/**
 * Hard AI: Full evaluation with lookahead
 */
function selectMoveHard(legalMoves, state, player) {
  let bestMove = legalMoves[0];
  let bestScore = -Infinity;
  
  // Try each move and look ahead
  for (const move of legalMoves) {
    const stateAfterMove = applyMove(state, move);
    
    // Get subsequent moves
    const subsequentMoves = getAllLegalMoves(stateAfterMove);
    
    let totalScore;
    
    if (subsequentMoves.length > 0) {
      // Evaluate best sequence from this move
      let bestSubsequentScore = -Infinity;
      
      for (const subMove of subsequentMoves) {
        const finalState = applyMove(stateAfterMove, subMove);
        const seqScore = evaluateMoveSequence(state, [move, subMove], player);
        bestSubsequentScore = Math.max(bestSubsequentScore, seqScore);
      }
      
      totalScore = bestSubsequentScore;
    } else {
      // No follow-up moves, evaluate single move
      totalScore = evaluateMoveSequence(state, [move], player);
    }
    
    // Very small random factor for variety
    totalScore += Math.random() * 0.5;
    
    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestMove = move;
    }
  }
  
  return bestMove;
}

/**
 * Select complete turn sequence (multiple moves using all dice)
 * @param {object} state - Current game state
 * @param {string} difficulty - AI difficulty
 * @returns {Array} Sequence of moves to execute
 */
export function selectTurnSequence(state, difficulty = 'normal') {
  const moves = [];
  let currentState = { ...state };
  
  // Keep selecting moves until no more legal moves
  while (true) {
    const legalMoves = getAllLegalMoves(currentState);
    if (legalMoves.length === 0) break;
    
    const selectedMove = selectMove(legalMoves, currentState, difficulty);
    if (!selectedMove) break;
    
    moves.push(selectedMove);
    currentState = applyMove(currentState, selectedMove);
  }
  
  return moves;
}

// ============================================
// DOUBLING DECISIONS
// ============================================

/**
 * Estimate win probability based on position
 * @param {object} state - Game state
 * @param {string} player - Player to evaluate for
 * @returns {number} Estimated win probability (0-1)
 */
function estimateWinProbability(state, player) {
  const opponent = player === 'white' ? 'black' : 'white';
  
  const myPips = getPipCount(state, player);
  const oppPips = getPipCount(state, opponent);
  
  const myBearOff = state.bearOff[player];
  const oppBearOff = state.bearOff[opponent];
  
  const myBar = state.bar[player];
  const oppBar = state.bar[opponent];
  
  // Simple probability estimation
  // Based on pip count difference and progress
  
  let score = 0.5; // Start at even
  
  // Pip advantage
  const pipDiff = oppPips - myPips;
  score += pipDiff * 0.002; // Each pip ~0.2% advantage
  
  // Bear off progress
  score += (myBearOff - oppBearOff) * 0.03;
  
  // Bar penalty
  score += (oppBar - myBar) * 0.05;
  
  // Clamp to valid probability
  return Math.max(0.05, Math.min(0.95, score));
}

/**
 * Decide whether AI should offer a double
 * @param {object} state - Game state
 * @param {string} player - Player considering doubling
 * @param {string} difficulty - AI difficulty
 * @returns {boolean} Whether to offer double
 */
export function shouldDouble(state, player, difficulty = 'normal') {
  // Can't double if not owner or at max
  if (state.doublingCube.value >= 64) return false;
  if (state.doublingCube.owner !== null && state.doublingCube.owner !== player) {
    return false;
  }
  
  // Can only double before rolling
  if (state.phase !== 'rolling') return false;
  
  const opponent = player === 'white' ? 'black' : 'white';
  
  switch (difficulty) {
    case 'easy':
      return shouldDoubleEasy(state, player);
    case 'normal':
      return shouldDoubleNormal(state, player, opponent);
    case 'hard':
      return shouldDoubleHard(state, player, opponent);
    default:
      return false;
  }
}

/**
 * Easy AI doubling: 25% chance if ahead
 */
function shouldDoubleEasy(state, player) {
  const opponent = player === 'white' ? 'black' : 'white';
  const myPips = getPipCount(state, player);
  const oppPips = getPipCount(state, opponent);
  
  // Only consider if ahead in pip count
  if (myPips >= oppPips) return false;
  
  // 25% chance
  return Math.random() < 0.25;
}

/**
 * Normal AI doubling: If pip advantage > 20
 */
function shouldDoubleNormal(state, player, opponent) {
  const myPips = getPipCount(state, player);
  const oppPips = getPipCount(state, opponent);
  const pipAdvantage = oppPips - myPips;
  
  // Need significant advantage
  if (pipAdvantage < 20) return false;
  
  // Also check bar situation
  const barAdvantage = state.bar[opponent] - state.bar[player];
  
  return pipAdvantage >= 20 || (pipAdvantage >= 10 && barAdvantage >= 1);
}

/**
 * Hard AI doubling: Based on win probability threshold
 */
function shouldDoubleHard(state, player, opponent) {
  const winProb = estimateWinProbability(state, player);
  
  // Standard doubling window: double when win prob is 70-90%
  // (Too high and opponent won't accept, too low and it's risky)
  if (winProb < 0.70 || winProb > 0.90) {
    return false;
  }
  
  // Additional checks
  const myPips = getPipCount(state, player);
  const oppPips = getPipCount(state, opponent);
  
  // Don't double in a pure race with small lead
  if (allCheckersInHome(state, player) && allCheckersInHome(state, opponent)) {
    // In bearing off race, need bigger advantage
    return (oppPips - myPips) > 15;
  }
  
  return true;
}

/**
 * Decide whether AI should accept a double
 * @param {object} state - Game state
 * @param {string} player - Player deciding (receiver of double)
 * @param {string} difficulty - AI difficulty
 * @returns {boolean} Whether to accept
 */
export function shouldAcceptDouble(state, player, difficulty = 'normal') {
  const winProb = estimateWinProbability(state, player);
  
  switch (difficulty) {
    case 'easy':
      // Easy AI accepts most doubles (75% threshold)
      return winProb > 0.20 || Math.random() < 0.3;
    
    case 'normal':
      // Normal AI: Accept if at least 25% chance to win
      // (Standard theory: need 25% equity to accept)
      return winProb >= 0.25;
    
    case 'hard':
      // Hard AI: More nuanced
      // Consider cube ownership value (having cube is worth ~15% in equity)
      // Accept if adjusted equity >= 22%
      const adjustedProb = winProb + 0.03; // Cube ownership bonus
      return adjustedProb >= 0.22;
    
    default:
      return winProb >= 0.25;
  }
}

// ============================================
// AI DELAY (for natural feel)
// ============================================

/**
 * Get thinking delay based on difficulty and move complexity
 * @param {string} difficulty - AI difficulty
 * @param {number} numMoves - Number of available moves
 * @returns {number} Delay in milliseconds
 */
export function getThinkingDelay(difficulty, numMoves = 1) {
  const baseDelay = {
    easy: 300,
    normal: 500,
    hard: 800
  };
  
  const base = baseDelay[difficulty] || 500;
  const complexity = Math.min(numMoves * 50, 300);
  const variance = Math.random() * 200;
  
  return base + complexity + variance;
}

export default {
  // Move selection
  selectMove,
  selectTurnSequence,
  
  // Position evaluation
  evaluatePosition,
  
  // Doubling decisions
  shouldDouble,
  shouldAcceptDouble,
  
  // Utilities
  getThinkingDelay
};
