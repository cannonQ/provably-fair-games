/**
 * Test Helpers for Backgammon Tests
 *
 * Reusable functions to create test states and scenarios.
 * Makes tests cleaner and easier to write.
 */

/**
 * Create an empty board state (all points empty)
 * @returns {object} Empty game state
 */
export function createEmptyState() {
  return {
    points: Array(24).fill(null).map(() => ({
      color: null,
      checkers: 0
    })),
    bar: { white: 0, black: 0 },
    bearOff: { white: 0, black: 0 },
    currentPlayer: 'white',
    dice: [3, 5],
    diceUsed: [false, false],
    phase: 'moving'
  };
}

/**
 * Place checker(s) on a specific point
 * @param {object} state - Game state to modify
 * @param {number} pointIndex - Point index (0-23)
 * @param {string} player - 'white' or 'black'
 * @param {number} count - Number of checkers (default 1)
 * @returns {object} Modified state
 */
export function placeChecker(state, pointIndex, player, count = 1) {
  state.points[pointIndex] = {
    color: player,
    checkers: count
  };
  return state;
}

/**
 * Place checker on bar
 * @param {object} state - Game state
 * @param {string} player - 'white' or 'black'
 * @param {number} count - Number of checkers (default 1)
 * @returns {object} Modified state
 */
export function placeOnBar(state, player, count = 1) {
  state.bar[player] = count;
  return state;
}

/**
 * Set dice values
 * @param {object} state - Game state
 * @param {number[]} dice - Dice values
 * @returns {object} Modified state
 */
export function setDice(state, dice) {
  state.dice = dice;
  state.diceUsed = dice.map(() => false);
  return state;
}

/**
 * Mark a die as used
 * @param {object} state - Game state
 * @param {number} index - Die index to mark as used
 * @returns {object} Modified state
 */
export function useDie(state, index) {
  state.diceUsed[index] = true;
  return state;
}

/**
 * Create standard starting position
 * @returns {object} Game state with standard Backgammon starting position
 */
export function createStartingState() {
  const state = createEmptyState();

  // White starting position
  placeChecker(state, 23, 'white', 2);  // Point 24: 2 white
  placeChecker(state, 12, 'white', 5);  // Point 13: 5 white
  placeChecker(state, 7, 'white', 3);   // Point 8: 3 white
  placeChecker(state, 5, 'white', 5);   // Point 6: 5 white

  // Black starting position
  placeChecker(state, 0, 'black', 2);   // Point 1: 2 black
  placeChecker(state, 11, 'black', 5);  // Point 12: 5 black
  placeChecker(state, 16, 'black', 3);  // Point 17: 3 black
  placeChecker(state, 18, 'black', 5);  // Point 19: 5 black

  return state;
}

/**
 * Create state with all checkers in home board (for bearing off tests)
 * @param {string} player - 'white' or 'black'
 * @returns {object} Game state
 */
export function createBearingOffState(player) {
  const state = createEmptyState();
  state.currentPlayer = player;

  if (player === 'white') {
    // White home: points 1-6 (indices 0-5)
    placeChecker(state, 0, 'white', 2);  // Point 1
    placeChecker(state, 1, 'white', 3);  // Point 2
    placeChecker(state, 2, 'white', 2);  // Point 3
    placeChecker(state, 3, 'white', 3);  // Point 4
    placeChecker(state, 4, 'white', 3);  // Point 5
    placeChecker(state, 5, 'white', 2);  // Point 6
  } else {
    // Black home: points 19-24 (indices 18-23)
    placeChecker(state, 18, 'black', 2); // Point 19
    placeChecker(state, 19, 'black', 3); // Point 20
    placeChecker(state, 20, 'black', 2); // Point 21
    placeChecker(state, 21, 'black', 3); // Point 22
    placeChecker(state, 22, 'black', 3); // Point 23
    placeChecker(state, 23, 'black', 2); // Point 24
  }

  return state;
}

/**
 * Create simple movement scenario for testing
 * @param {string} player - 'white' or 'black'
 * @param {number} from - Source point
 * @param {number[]} dice - Dice values
 * @returns {object} Game state
 */
export function createMoveScenario(player, from, dice) {
  const state = createEmptyState();
  state.currentPlayer = player;
  placeChecker(state, from, player, 1);
  setDice(state, dice);
  return state;
}

/**
 * Create blocking scenario (opponent has 2+ checkers blocking)
 * @param {string} player - Player trying to move
 * @param {number} blockedPoint - Point that's blocked
 * @returns {object} Game state
 */
export function createBlockedScenario(player, blockedPoint) {
  const state = createEmptyState();
  state.currentPlayer = player;
  const opponent = player === 'white' ? 'black' : 'white';

  // Place blocking checkers
  placeChecker(state, blockedPoint, opponent, 2);

  return state;
}

/**
 * Create blot scenario (single opponent checker that can be hit)
 * @param {string} player - Player making the move
 * @param {number} blotPoint - Point with blot
 * @returns {object} Game state
 */
export function createBlotScenario(player, blotPoint) {
  const state = createEmptyState();
  state.currentPlayer = player;
  const opponent = player === 'white' ? 'black' : 'white';

  // Place single opponent checker (blot)
  placeChecker(state, blotPoint, opponent, 1);

  return state;
}

export default {
  createEmptyState,
  placeChecker,
  placeOnBar,
  setDice,
  useDie,
  createStartingState,
  createBearingOffState,
  createMoveScenario,
  createBlockedScenario,
  createBlotScenario
};
