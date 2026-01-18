/**
 * Backgammon Move Validation
 * 
 * Handles all legal move calculations including:
 * - Bar entry (forced priority)
 * - Regular movement
 * - Bearing off
 * - Doubles (4 moves)
 * - Forced use of larger die when can't use both
 */

import {
  getDirection,
  calculateDestination,
  getHomeRange,
  getBarEntryPoint,
  hasCheckersOnBar,
  allCheckersInHome,
  isPointBlocked,
  isBlot,
  getAvailableDice,
  getFurthestChecker
} from './gameLogic';

// ============================================
// BAR ENTRY
// ============================================

/**
 * Check if player must enter checkers from bar before any other move
 * @param {object} state - Game state
 * @param {string} player - 'white' or 'black'
 * @returns {boolean}
 */
export function mustEnterFromBar(state, player) {
  return hasCheckersOnBar(state, player);
}

/**
 * Get all legal bar entry moves for a player
 * @param {object} state - Game state
 * @param {string} player - 'white' or 'black'
 * @returns {Array<{from: 'bar', to: number, dieValue: number, hits: boolean}>}
 */
export function getLegalBarEntries(state, player) {
  if (!hasCheckersOnBar(state, player)) return [];
  
  const availableDice = getAvailableDice(state.dice, state.diceUsed);
  const moves = [];
  const seenMoves = new Set();
  
  for (const dieValue of availableDice) {
    const entryPoint = getBarEntryPoint(dieValue, player);
    const moveKey = `bar-${entryPoint}-${dieValue}`;
    
    // Skip duplicate moves (same entry point with same die value)
    if (seenMoves.has(moveKey)) continue;
    seenMoves.add(moveKey);
    
    // Check if entry point is not blocked
    if (!isPointBlocked(state, entryPoint, player)) {
      const hits = isBlot(state, entryPoint, player);
      moves.push({
        from: 'bar',
        to: entryPoint,
        dieValue,
        hits
      });
    }
  }
  
  return moves;
}

// ============================================
// BEARING OFF
// ============================================

/**
 * Check if player can bear off (all checkers in home board)
 * @param {object} state - Game state
 * @param {string} player - 'white' or 'black'
 * @returns {boolean}
 */
export function canBearOff(state, player) {
  return allCheckersInHome(state, player);
}

/**
 * Get all legal bearing off moves for a player
 * Rules:
 * - Can bear off with exact die value
 * - Can bear off with higher die if no checkers on higher points
 * @param {object} state - Game state
 * @param {string} player - 'white' or 'black'
 * @returns {Array<{from: number, to: 'bearOff', dieValue: number, hits: false}>}
 */
export function getLegalBearOffMoves(state, player) {
  if (!canBearOff(state, player)) return [];
  
  const availableDice = getAvailableDice(state.dice, state.diceUsed);
  const moves = [];
  const homeRange = getHomeRange(player);
  const seenMoves = new Set();
  
  for (const dieValue of availableDice) {
    // Find the point that would bear off with this die
    let bearOffPoint;
    
    if (player === 'white') {
      // White bears off from points 1-6 (indices 0-5)
      // Die value directly corresponds to point number
      bearOffPoint = dieValue - 1; // Convert to index
    } else {
      // Black bears off from points 19-24 (indices 18-23)
      // Die 1 = point 24 (index 23), Die 6 = point 19 (index 18)
      bearOffPoint = 24 - dieValue; // Convert to index
    }
    
    // Check exact bear off
    if (bearOffPoint >= homeRange.start && bearOffPoint <= homeRange.end) {
      if (state.points[bearOffPoint].color === player && 
          state.points[bearOffPoint].checkers > 0) {
        const moveKey = `${bearOffPoint}-bearOff-${dieValue}`;
        if (!seenMoves.has(moveKey)) {
          seenMoves.add(moveKey);
          moves.push({
            from: bearOffPoint,
            to: 'bearOff',
            dieValue,
            hits: false
          });
        }
      }
    }
    
    // Check bearing off with higher die (when no checkers on exact point)
    // Can only do this if no checkers are further from bearing off
    const furthestChecker = getFurthestChecker(state, player);
    
    if (furthestChecker !== null) {
      // Calculate the die value needed to bear off the furthest checker
      let distanceToOff;
      if (player === 'white') {
        distanceToOff = furthestChecker + 1; // Point number = index + 1
      } else {
        distanceToOff = 24 - furthestChecker; // Distance from point 24
      }
      
      // If die is higher than needed for furthest checker, can bear it off
      if (dieValue > distanceToOff) {
        const moveKey = `${furthestChecker}-bearOff-${dieValue}`;
        if (!seenMoves.has(moveKey)) {
          seenMoves.add(moveKey);
          moves.push({
            from: furthestChecker,
            to: 'bearOff',
            dieValue,
            hits: false
          });
        }
      }
    }
  }
  
  return moves;
}

// ============================================
// REGULAR MOVEMENT
// ============================================

/**
 * Check if player can move a checker from a specific point
 * @param {object} state - Game state
 * @param {number} pointIndex - Point index (0-23)
 * @param {string} player - 'white' or 'black'
 * @returns {boolean}
 */
export function canMoveFrom(state, pointIndex, player) {
  // Must have checker on this point
  const point = state.points[pointIndex];
  if (!point || point.color !== player || point.checkers === 0) {
    return false;
  }
  
  // If on bar, can't move from board
  if (hasCheckersOnBar(state, player)) {
    return false;
  }
  
  return true;
}

/**
 * Check if player can move to a specific point with given die value
 * @param {object} state - Game state
 * @param {number} pointIndex - Destination point index (0-23)
 * @param {string} player - 'white' or 'black'
 * @param {number} dieValue - Die value being used
 * @returns {boolean}
 */
export function canMoveTo(state, pointIndex, player, dieValue) {
  // Out of bounds
  if (pointIndex < 0 || pointIndex > 23) {
    return false;
  }
  
  // Check if blocked
  if (isPointBlocked(state, pointIndex, player)) {
    return false;
  }
  
  return true;
}

/**
 * Get all legal moves from a specific point
 * @param {object} state - Game state
 * @param {number} fromIndex - Source point index
 * @param {string} player - 'white' or 'black'
 * @returns {Array<{from: number, to: number|'bearOff', dieValue: number, hits: boolean}>}
 */
export function getMovesFromPoint(state, fromIndex, player) {
  if (!canMoveFrom(state, fromIndex, player)) return [];
  
  const availableDice = getAvailableDice(state.dice, state.diceUsed);
  const moves = [];
  const canBearingOff = canBearOff(state, player);
  const seenMoves = new Set();
  
  for (const dieValue of availableDice) {
    const destination = calculateDestination(fromIndex, dieValue, player);
    
    // Check for bearing off
    if (canBearingOff) {
      const homeRange = getHomeRange(player);
      
      if (player === 'white' && destination < 0) {
        // White bearing off (moving past point 1)
        // Can only bear off if this is exact or no higher checkers
        const exactBearOff = fromIndex + 1 === dieValue;
        const furthest = getFurthestChecker(state, player);
        const canUseHigherDie = furthest === fromIndex;
        
        if (exactBearOff || canUseHigherDie) {
          const moveKey = `${fromIndex}-bearOff-${dieValue}`;
          if (!seenMoves.has(moveKey)) {
            seenMoves.add(moveKey);
            moves.push({
              from: fromIndex,
              to: 'bearOff',
              dieValue,
              hits: false
            });
          }
        }
        continue;
      } else if (player === 'black' && destination > 23) {
        // Black bearing off (moving past point 24)
        const exactBearOff = (24 - fromIndex) === dieValue;
        const furthest = getFurthestChecker(state, player);
        const canUseHigherDie = furthest === fromIndex;
        
        if (exactBearOff || canUseHigherDie) {
          const moveKey = `${fromIndex}-bearOff-${dieValue}`;
          if (!seenMoves.has(moveKey)) {
            seenMoves.add(moveKey);
            moves.push({
              from: fromIndex,
              to: 'bearOff',
              dieValue,
              hits: false
            });
          }
        }
        continue;
      }
    }
    
    // Regular move
    if (destination >= 0 && destination <= 23) {
      if (canMoveTo(state, destination, player, dieValue)) {
        const moveKey = `${fromIndex}-${destination}-${dieValue}`;
        if (!seenMoves.has(moveKey)) {
          seenMoves.add(moveKey);
          moves.push({
            from: fromIndex,
            to: destination,
            dieValue,
            hits: isBlot(state, destination, player)
          });
        }
      }
    }
  }
  
  return moves;
}

// ============================================
// MAIN VALIDATION FUNCTIONS
// ============================================

/**
 * Get all legal moves for current player
 * Handles priority: bar entry > regular moves
 * @param {object} state - Game state
 * @returns {Array<{from: number|'bar', to: number|'bearOff', dieValue: number, hits: boolean}>}
 */
export function getAllLegalMoves(state) {
  const player = state.currentPlayer;
  const availableDice = getAvailableDice(state.dice, state.diceUsed);
  
  // No dice available
  if (availableDice.length === 0) return [];
  
  // Priority 1: Must enter from bar
  if (mustEnterFromBar(state, player)) {
    return getLegalBarEntries(state, player);
  }
  
  // Collect all possible moves
  let allMoves = [];
  
  // Check each point for possible moves
  for (let i = 0; i < 24; i++) {
    const point = state.points[i];
    if (point.color === player && point.checkers > 0) {
      const movesFromHere = getMovesFromPoint(state, i, player);
      allMoves = allMoves.concat(movesFromHere);
    }
  }
  
  // If we can bear off, add those moves too (may have been missed)
  if (canBearOff(state, player)) {
    const bearOffMoves = getLegalBearOffMoves(state, player);
    // Add any bear off moves not already included
    for (const move of bearOffMoves) {
      const exists = allMoves.some(m => 
        m.from === move.from && m.to === move.to && m.dieValue === move.dieValue
      );
      if (!exists) {
        allMoves.push(move);
      }
    }
  }
  
  // Handle forced larger die rule
  const filteredMoves = applyForcedDieRule(state, allMoves);
  
  return filteredMoves;
}

/**
 * Check if a specific move is legal
 * @param {object} state - Game state
 * @param {number|'bar'} from - Source point
 * @param {number|'bearOff'} to - Destination
 * @returns {boolean}
 */
export function isLegalMove(state, from, to) {
  const legalMoves = getAllLegalMoves(state);
  return legalMoves.some(move => move.from === from && move.to === to);
}

/**
 * Get legal moves from a specific source
 * @param {object} state - Game state
 * @param {number|'bar'} from - Source point or 'bar'
 * @returns {Array} Legal moves from this source
 */
export function getLegalMovesFrom(state, from) {
  const allMoves = getAllLegalMoves(state);
  return allMoves.filter(move => move.from === from);
}

// ============================================
// FORCED DIE RULES
// ============================================

/**
 * Apply the forced die rule:
 * - If you can use only one die, you must use the larger one
 * - If you can use both, you must use both
 * @param {object} state - Game state
 * @param {Array} moves - All possible moves
 * @returns {Array} Filtered moves respecting forced die rule
 */
function applyForcedDieRule(state, moves) {
  if (moves.length === 0) return moves;

  const availableDice = getAvailableDice(state.dice, state.diceUsed);

  // If only one die left, no filtering needed
  if (availableDice.length <= 1) return moves;

  // Check if it's doubles (all same value)
  const isDoubles = availableDice.every(d => d === availableDice[0]);

  if (isDoubles) {
    // For doubles, must use as many dice as possible
    // Filter moves to only those that allow maximum dice usage
    return filterMovesForMaximumDiceUsage(state, moves, availableDice.length);
  }

  // We have two different dice - check if both can be used
  const canUseBoth = checkCanUseBothDice(state, moves);

  if (canUseBoth) {
    // Player must use both dice - filter to only moves that lead to using both
    return filterMovesForBothDice(state, moves);
  }

  // Can only use one die - must use the larger one
  const largerDie = Math.max(...availableDice);
  const smallerDie = Math.min(...availableDice);

  // Check if larger die can be used
  const movesWithLarger = moves.filter(m => m.dieValue === largerDie);
  if (movesWithLarger.length > 0) {
    return movesWithLarger;
  }

  // Larger die can't be used, use smaller
  return moves.filter(m => m.dieValue === smallerDie);
}

/**
 * Filter moves to only those that allow using maximum number of dice
 * Used for doubles - returns moves that lead to using 4, 3, 2, or 1 dice
 * @param {object} state - Game state
 * @param {Array} moves - Available first moves
 * @param {number} totalDice - Total number of dice available (2 or 4 for doubles)
 * @returns {Array} Filtered moves
 */
function filterMovesForMaximumDiceUsage(state, moves, totalDice) {
  if (moves.length === 0) return moves;

  // For each first move, count how many total dice can be used
  const movesWithCount = moves.map(move => {
    const count = countMaxDiceUsable(state, move, totalDice);
    return { move, count };
  });

  // Find the maximum number of dice that can be used
  const maxCount = Math.max(...movesWithCount.map(mc => mc.count));

  // Return only moves that allow using the maximum number
  return movesWithCount
    .filter(mc => mc.count === maxCount)
    .map(mc => mc.move);
}

/**
 * Count maximum number of dice that can be used starting with a given move
 * @param {object} state - Game state
 * @param {object} firstMove - The first move to make
 * @param {number} totalDice - Total available dice
 * @returns {number} Max dice usable
 */
function countMaxDiceUsable(state, firstMove, totalDice) {
  let count = 1; // We're using one die for the first move
  let currentState = applyMove(state, firstMove);

  // Try to use remaining dice
  for (let i = 1; i < totalDice; i++) {
    const nextMoves = getAllLegalMovesForState(currentState);
    if (nextMoves.length === 0) break;

    // Use the first available move (any move will do for counting)
    currentState = applyMove(currentState, nextMoves[0]);
    count++;
  }

  return count;
}

/**
 * Filter moves to only those that allow using both dice
 * Used when both dice CAN be used - filters to moves that actually lead to using both
 * @param {object} state - Game state
 * @param {Array} moves - Available first moves
 * @returns {Array} Filtered moves
 */
function filterMovesForBothDice(state, moves) {
  if (moves.length === 0) return moves;

  const availableDice = getAvailableDice(state.dice, state.diceUsed);
  const uniqueDice = [...new Set(availableDice)];

  // Filter to moves that allow using the other die value afterward
  return moves.filter(move => {
    const stateAfterMove = applyMove(state, move);
    const remainingMoves = getAllLegalMovesForState(stateAfterMove);

    // Check if we can use a different die value
    const usedDie = move.dieValue;
    const otherDie = uniqueDice.find(d => d !== usedDie);

    return remainingMoves.some(m => m.dieValue === otherDie);
  });
}

/**
 * Check if player can use both dice in some sequence
 * @param {object} state - Game state
 * @param {Array} moves - Available moves
 * @returns {boolean}
 */
function checkCanUseBothDice(state, moves) {
  const availableDice = getAvailableDice(state.dice, state.diceUsed);
  if (availableDice.length < 2) return false;
  
  // Get unique die values
  const uniqueDice = [...new Set(availableDice)];
  if (uniqueDice.length < 2) return true; // Doubles - can always use if have moves
  
  // Try each first move and see if second die can be used after
  for (const move of moves) {
    const stateAfterMove = applyMove(state, move);
    const remainingMoves = getAllLegalMovesForState(stateAfterMove);
    
    // Check if any remaining move uses a different die value
    const usedDie = move.dieValue;
    const otherDie = uniqueDice.find(d => d !== usedDie);
    
    if (remainingMoves.some(m => m.dieValue === otherDie)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Internal function to get legal moves without recursion protection
 * Used by checkCanUseBothDice
 * @param {object} state - Game state
 * @returns {Array} Legal moves
 */
function getAllLegalMovesForState(state) {
  const player = state.currentPlayer;
  const availableDice = getAvailableDice(state.dice, state.diceUsed);
  
  if (availableDice.length === 0) return [];
  
  if (mustEnterFromBar(state, player)) {
    return getLegalBarEntries(state, player);
  }
  
  let allMoves = [];
  
  for (let i = 0; i < 24; i++) {
    const point = state.points[i];
    if (point.color === player && point.checkers > 0) {
      const movesFromHere = getMovesFromPoint(state, i, player);
      allMoves = allMoves.concat(movesFromHere);
    }
  }
  
  if (canBearOff(state, player)) {
    const bearOffMoves = getLegalBearOffMoves(state, player);
    for (const move of bearOffMoves) {
      const exists = allMoves.some(m => 
        m.from === move.from && m.to === move.to && m.dieValue === move.dieValue
      );
      if (!exists) {
        allMoves.push(move);
      }
    }
  }
  
  return allMoves;
}

/**
 * Check if larger die must be used
 * @param {object} state - Game state
 * @param {string} player - Current player
 * @param {number[]} availableDice - Available dice values
 * @returns {boolean}
 */
export function mustUseLargerDie(state, player, availableDice) {
  if (availableDice.length !== 2) return false;
  if (availableDice[0] === availableDice[1]) return false; // Doubles
  
  const allMoves = getAllLegalMoves(state);
  if (allMoves.length === 0) return false;
  
  const canUseBoth = checkCanUseBothDice(state, allMoves);
  if (canUseBoth) return false;
  
  // Can only use one - check if it must be larger
  const largerDie = Math.max(...availableDice);
  return allMoves.some(m => m.dieValue === largerDie);
}

/**
 * Check if both dice can be used in some sequence
 * @param {object} state - Game state
 * @param {string} player - Current player
 * @returns {boolean}
 */
export function canUseBothDice(state, player) {
  const allMoves = getAllLegalMoves(state);
  return checkCanUseBothDice(state, allMoves);
}

// ============================================
// STATE MANIPULATION (PURE FUNCTIONS)
// ============================================

/**
 * Apply a move to state and return new state (pure function)
 * Does not modify original state
 * @param {object} state - Current game state
 * @param {object} move - Move to apply {from, to, dieValue, hits}
 * @returns {object} New game state after move
 */
export function applyMove(state, move) {
  const { from, to, dieValue } = move;
  const player = state.currentPlayer;
  const opponent = player === 'white' ? 'black' : 'white';
  
  // Deep copy relevant parts of state
  const newPoints = state.points.map(p => ({ ...p }));
  const newBar = { ...state.bar };
  const newBearOff = { ...state.bearOff };
  const newDice = [...state.dice];
  const newDiceUsed = [...state.diceUsed];
  
  // Mark die as used
  let dieIndex = -1;
  for (let i = 0; i < newDice.length; i++) {
    if (!newDiceUsed[i] && newDice[i] === dieValue) {
      dieIndex = i;
      break;
    }
  }
  
  // For bearing off with higher die, find any unused die >= dieValue
  if (dieIndex === -1 && to === 'bearOff') {
    for (let i = 0; i < newDice.length; i++) {
      if (!newDiceUsed[i] && newDice[i] >= dieValue) {
        dieIndex = i;
        break;
      }
    }
  }
  
  if (dieIndex !== -1) {
    newDiceUsed[dieIndex] = true;
  }
  
  // Remove checker from source
  if (from === 'bar') {
    newBar[player]--;
  } else {
    newPoints[from].checkers--;
    if (newPoints[from].checkers === 0) {
      newPoints[from].color = null;
    }
  }
  
  // Place checker at destination
  if (to === 'bearOff') {
    newBearOff[player]++;
  } else {
    // Check for hit
    if (newPoints[to].color === opponent && newPoints[to].checkers === 1) {
      newPoints[to].checkers = 0;
      newPoints[to].color = null;
      newBar[opponent]++;
    }
    
    newPoints[to].checkers++;
    newPoints[to].color = player;
  }
  
  return {
    ...state,
    points: newPoints,
    bar: newBar,
    bearOff: newBearOff,
    dice: newDice,
    diceUsed: newDiceUsed
  };
}

/**
 * Get available dice values for making a move
 * @param {object} state - Game state
 * @returns {number[]} Available dice values
 */
export function getAvailableDiceForMove(state) {
  return getAvailableDice(state.dice, state.diceUsed);
}

/**
 * Check if turn is complete (no more moves possible or all dice used)
 * @param {object} state - Game state
 * @returns {boolean}
 */
export function isTurnComplete(state) {
  const availableDice = getAvailableDice(state.dice, state.diceUsed);
  if (availableDice.length === 0) return true;
  
  const legalMoves = getAllLegalMoves(state);
  return legalMoves.length === 0;
}

/**
 * Get move description for display/history
 * @param {object} move - Move object
 * @returns {string} Human-readable move description
 */
export function getMoveDescription(move) {
  const from = move.from === 'bar' ? 'Bar' : `Point ${move.from + 1}`;
  const to = move.to === 'bearOff' ? 'Off' : `Point ${move.to + 1}`;
  const hit = move.hits ? '*' : '';
  return `${from} → ${to}${hit} (${move.dieValue})`;
}

/**
 * Validate move sequence - ensure moves use dice correctly
 * @param {object} initialState - Starting state
 * @param {Array} moves - Sequence of moves
 * @returns {{valid: boolean, error: string|null}}
 */
export function validateMoveSequence(initialState, moves) {
  let currentState = initialState;
  
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    const legalMoves = getAllLegalMoves(currentState);
    
    const isLegal = legalMoves.some(m => 
      m.from === move.from && m.to === move.to
    );
    
    if (!isLegal) {
      return {
        valid: false,
        error: `Move ${i + 1} is not legal: ${getMoveDescription(move)}`
      };
    }
    
    currentState = applyMove(currentState, move);
  }
  
  return { valid: true, error: null };
}

export default {
  // Bar entry
  mustEnterFromBar,
  getLegalBarEntries,
  
  // Bearing off
  canBearOff,
  getLegalBearOffMoves,
  
  // Movement queries
  canMoveFrom,
  canMoveTo,
  getMovesFromPoint,
  
  // Main validation
  getAllLegalMoves,
  isLegalMove,
  getLegalMovesFrom,
  
  // Forced die rules
  mustUseLargerDie,
  canUseBothDice,
  
  // State manipulation
  applyMove,
  getAvailableDiceForMove,
  isTurnComplete,
  
  // Utilities
  getMoveDescription,
  validateMoveSequence
};
