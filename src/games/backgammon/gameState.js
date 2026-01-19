/**
 * Backgammon Game State Management
 *
 * Board representation:
 * - Points 1-6: White home board (bearing off zone)
 * - Points 7-12: White outer board
 * - Points 13-18: Black outer board
 * - Points 19-24: Black home board
 * - White moves from 24 → 1, Black moves from 1 → 24
 */

import CryptoJS from 'crypto-js';
import { getAllLegalMoves } from './moveValidation';

// ============================================
// HELPERS
// ============================================

/**
 * Generate unique game ID using blockchain hash for randomness
 * Format: BGM-{timestamp}-{random9chars}
 */
export function generateGameId(blockHash) {
  const timestamp = Date.now();
  const seed = `${blockHash}-${timestamp}`;
  const hash = CryptoJS.SHA256(seed).toString(CryptoJS.enc.Hex);
  const random = hash.substring(0, 9);
  return `BGM-${timestamp}-${random}`;
}

/**
 * Calculate final score for leaderboard
 * Score = winTypeMultiplier × cubeValue × difficultyBonus
 */
export function calculateFinalScore(winType, cubeValue, difficulty) {
  const winTypeMultipliers = {
    normal: 1,
    gammon: 2,
    backgammon: 3
  };
  
  const difficultyBonuses = {
    easy: 1,
    normal: 2,
    hard: 3
  };
  
  const winMult = winTypeMultipliers[winType] || 1;
  const diffBonus = difficultyBonuses[difficulty] || 1;
  
  return winMult * cubeValue * diffBonus;
}

/**
 * Create empty point
 */
function createPoint(checkers = 0, color = null) {
  return { checkers, color };
}

/**
 * Create initial board setup
 * Standard backgammon starting position
 * White moves from 24 → 1, Black moves from 1 → 24
 */
function createInitialBoard() {
  const points = Array(24).fill(null).map(() => createPoint());

  // White checkers (moves from 24 → 1, bears off at 1-6)
  points[23] = createPoint(2, 'white');  // Point 24: 2 white
  points[12] = createPoint(5, 'white');  // Point 13: 5 white
  points[7] = createPoint(3, 'white');   // Point 8: 3 white
  points[5] = createPoint(5, 'white');   // Point 6: 5 white

  // Black checkers (moves from 1 → 24, bears off at 19-24)
  points[0] = createPoint(2, 'black');   // Point 1: 2 black
  points[11] = createPoint(5, 'black');  // Point 12: 5 black
  points[16] = createPoint(3, 'black');  // Point 17: 3 black
  points[18] = createPoint(5, 'black');  // Point 19: 5 black

  return points;
}

/**
 * Create initial doubling cube state
 */
function createInitialDoublingCube() {
  return {
    value: 1,
    owner: null,  // null means either player can double
    canDouble: { white: true, black: true }
  };
}

// ============================================
// INITIAL STATE
// ============================================

export const initialState = {
  gameId: null,
  points: createInitialBoard(),
  bar: { white: 0, black: 0 },
  bearOff: { white: 0, black: 0 },
  dice: null,
  diceUsed: [false, false],
  currentPlayer: 'white',
  selectedPoint: null,
  validMoves: [],
  doublingCube: createInitialDoublingCube(),
  phase: 'rolling',  // 'rolling' | 'moving' | 'doubleOffered' | 'gameOver'
  rollHistory: [],
  moveHistory: [],
  winner: null,
  winType: null,  // 'normal' | 'gammon' | 'backgammon'
  aiDifficulty: 'normal',
  gameStartTime: null,
  gameEndTime: null,
  finalScore: 0,
  blockchainData: null  // { blockHeight, blockHash, txHash, timestamp }
};

// ============================================
// ACTION TYPES
// ============================================

export const ActionTypes = {
  INIT_GAME: 'INIT_GAME',
  ROLL_DICE: 'ROLL_DICE',
  SELECT_POINT: 'SELECT_POINT',
  MOVE_CHECKER: 'MOVE_CHECKER',
  COMPLETE_TURN: 'COMPLETE_TURN',
  OFFER_DOUBLE: 'OFFER_DOUBLE',
  ACCEPT_DOUBLE: 'ACCEPT_DOUBLE',
  DECLINE_DOUBLE: 'DECLINE_DOUBLE',
  END_GAME: 'END_GAME',
  NEW_GAME: 'NEW_GAME',
  SET_VALID_MOVES: 'SET_VALID_MOVES',
  CLEAR_SELECTION: 'CLEAR_SELECTION',
  RESTORE_STATE: 'RESTORE_STATE'
};

// ============================================
// ACTION CREATORS
// ============================================

export const actions = {
  initGame: (aiDifficulty, blockchainData) => ({
    type: ActionTypes.INIT_GAME,
    payload: { aiDifficulty, blockchainData }
  }),
  
  rollDice: (dice, blockHash) => ({
    type: ActionTypes.ROLL_DICE,
    payload: { dice, blockHash }
  }),
  
  selectPoint: (pointIndex) => ({
    type: ActionTypes.SELECT_POINT,
    payload: { pointIndex }
  }),
  
  moveChecker: (from, to) => ({
    type: ActionTypes.MOVE_CHECKER,
    payload: { from, to }
  }),
  
  completeTurn: () => ({
    type: ActionTypes.COMPLETE_TURN
  }),
  
  offerDouble: () => ({
    type: ActionTypes.OFFER_DOUBLE
  }),
  
  acceptDouble: () => ({
    type: ActionTypes.ACCEPT_DOUBLE
  }),
  
  declineDouble: () => ({
    type: ActionTypes.DECLINE_DOUBLE
  }),
  
  endGame: (winner, winType) => ({
    type: ActionTypes.END_GAME,
    payload: { winner, winType }
  }),
  
  newGame: () => ({
    type: ActionTypes.NEW_GAME
  }),
  
  setValidMoves: (moves) => ({
    type: ActionTypes.SET_VALID_MOVES,
    payload: { moves }
  }),
  
  clearSelection: () => ({
    type: ActionTypes.CLEAR_SELECTION
  })
};

// ============================================
// REDUCER
// ============================================

export function gameReducer(state, action) {
  switch (action.type) {
    case ActionTypes.INIT_GAME: {
      const { aiDifficulty, blockchainData } = action.payload;
      return {
        ...initialState,
        gameId: generateGameId(blockchainData.blockHash),
        points: createInitialBoard(),
        aiDifficulty: aiDifficulty || 'normal',
        blockchainData,
        gameStartTime: Date.now(),
        phase: 'rolling'
      };
    }
    
    case ActionTypes.ROLL_DICE: {
      const { dice, blockHash } = action.payload;
      const isDoubles = dice[0] === dice[1];
      
      // For doubles, player gets 4 moves (represented by 4 dice values)
      const expandedDice = isDoubles 
        ? [dice[0], dice[0], dice[0], dice[0]] 
        : dice;
      const diceUsed = isDoubles 
        ? [false, false, false, false] 
        : [false, false];
      
      const rollRecord = {
        player: state.currentPlayer,
        dice: [...dice],
        blockHash,
        timestamp: Date.now()
      };
      
      return {
        ...state,
        dice: expandedDice,
        diceUsed,
        phase: 'moving',
        rollHistory: [...state.rollHistory, rollRecord],
        selectedPoint: null,
        validMoves: []
      };
    }
    
    case ActionTypes.SELECT_POINT: {
      const { pointIndex } = action.payload;
      
      // Deselect if clicking same point
      if (state.selectedPoint === pointIndex) {
        return {
          ...state,
          selectedPoint: null,
          validMoves: []
        };
      }
      
      return {
        ...state,
        selectedPoint: pointIndex
      };
    }
    
    case ActionTypes.SET_VALID_MOVES: {
      return {
        ...state,
        validMoves: action.payload.moves
      };
    }
    
    case ActionTypes.CLEAR_SELECTION: {
      return {
        ...state,
        selectedPoint: null,
        validMoves: []
      };
    }
    
    case ActionTypes.MOVE_CHECKER: {
      const { from, to } = action.payload;

      // Validate move is legal before applying
      const legalMoves = getAllLegalMoves(state);
      const isLegal = legalMoves.some(m => m.from === from && m.to === to);

      if (!isLegal) {
        console.error('Illegal move rejected:', { from, to, legalMoves });
        return state; // Don't apply illegal moves
      }

      const newPoints = state.points.map(p => ({ ...p }));
      const newBar = { ...state.bar };
      const newBearOff = { ...state.bearOff };
      const player = state.currentPlayer;
      const opponent = player === 'white' ? 'black' : 'white';
      
      // Calculate which die was used
      let dieValue;
      if (from === 'bar') {
        // Moving from bar
        dieValue = player === 'white' ? (24 - to) : (to + 1);
      } else if (to === 'bearOff') {
        // Bearing off
        dieValue = player === 'white' ? from + 1 : 24 - from;
      } else {
        // Normal move
        dieValue = player === 'white' ? (from - to) : (to - from);
      }
      
      // Find and mark the die as used
      const newDice = [...state.dice];
      const newDiceUsed = [...state.diceUsed];
      let dieIndex = -1;
      
      // Find exact match first
      for (let i = 0; i < newDice.length; i++) {
        if (!newDiceUsed[i] && newDice[i] === dieValue) {
          dieIndex = i;
          break;
        }
      }
      
      // For bearing off, might use higher die
      if (dieIndex === -1 && to === 'bearOff') {
        for (let i = 0; i < newDice.length; i++) {
          if (!newDiceUsed[i] && newDice[i] > dieValue) {
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
      
      // Handle destination
      if (to === 'bearOff') {
        newBearOff[player]++;
      } else {
        // Check for hit (blot)
        if (newPoints[to].color === opponent && newPoints[to].checkers === 1) {
          newPoints[to].checkers = 0;
          newPoints[to].color = null;
          newBar[opponent]++;
        }
        
        // Place checker
        newPoints[to].checkers++;
        newPoints[to].color = player;
      }
      
      // Record move
      const moveRecord = {
        player,
        from,
        to,
        dieUsed: dieValue,
        wasHit: to !== 'bearOff' && state.points[to]?.color === opponent,
        timestamp: Date.now()
      };
      
      return {
        ...state,
        points: newPoints,
        bar: newBar,
        bearOff: newBearOff,
        dice: newDice,
        diceUsed: newDiceUsed,
        moveHistory: [...state.moveHistory, moveRecord],
        selectedPoint: null,
        validMoves: []
      };
    }
    
    case ActionTypes.COMPLETE_TURN: {
      const nextPlayer = state.currentPlayer === 'white' ? 'black' : 'white';
      
      return {
        ...state,
        currentPlayer: nextPlayer,
        dice: null,
        diceUsed: [false, false],
        phase: 'rolling',
        selectedPoint: null,
        validMoves: []
      };
    }
    
    case ActionTypes.OFFER_DOUBLE: {
      return {
        ...state,
        phase: 'doubleOffered'
      };
    }
    
    case ActionTypes.ACCEPT_DOUBLE: {
      const newValue = Math.min(state.doublingCube.value * 2, 64);
      const opponent = state.currentPlayer === 'white' ? 'black' : 'white';
      
      return {
        ...state,
        doublingCube: {
          value: newValue,
          owner: opponent,  // Opponent now owns the cube
          canDouble: {
            white: opponent === 'white',
            black: opponent === 'black'
          }
        },
        phase: 'rolling'
      };
    }
    
    case ActionTypes.DECLINE_DOUBLE: {
      // Declining a double means the opponent wins
      const winner = state.currentPlayer;
      const endTime = Date.now();
      const finalScore = calculateFinalScore(
        'normal',
        state.doublingCube.value,
        state.aiDifficulty
      );
      
      return {
        ...state,
        winner,
        winType: 'normal',
        phase: 'gameOver',
        gameEndTime: endTime,
        finalScore
      };
    }
    
    case ActionTypes.END_GAME: {
      const { winner, winType } = action.payload;
      const endTime = Date.now();
      const finalScore = calculateFinalScore(
        winType,
        state.doublingCube.value,
        state.aiDifficulty
      );
      
      return {
        ...state,
        winner,
        winType,
        phase: 'gameOver',
        gameEndTime: endTime,
        finalScore
      };
    }
    
    case ActionTypes.NEW_GAME: {
      return {
        ...initialState,
        aiDifficulty: state.aiDifficulty
      };
    }

    case ActionTypes.RESTORE_STATE: {
      // Restore saved game state from localStorage
      return {
        ...action.payload,
        // Reset UI-only state
        selectedPoint: null,
        validMoves: []
      };
    }

    default:
      return state;
  }
}

// ============================================
// STATE SELECTORS
// ============================================

export const selectors = {
  /**
   * Get remaining dice values that haven't been used
   */
  getRemainingDice: (state) => {
    if (!state.dice) return [];
    return state.dice.filter((_, i) => !state.diceUsed[i]);
  },
  
  /**
   * Check if all dice have been used
   */
  allDiceUsed: (state) => {
    if (!state.dice) return true;
    return state.diceUsed.every(used => used);
  },
  
  /**
   * Check if a player can offer a double
   */
  canOfferDouble: (state, player) => {
    if (state.phase !== 'rolling') return false;
    if (state.doublingCube.value >= 64) return false;
    if (state.doublingCube.owner === null) return true;
    return state.doublingCube.owner === player;
  },
  
  /**
   * Get checker count for a player on the board
   */
  getCheckersOnBoard: (state, player) => {
    let count = 0;
    state.points.forEach(point => {
      if (point.color === player) {
        count += point.checkers;
      }
    });
    count += state.bar[player];
    return count;
  },
  
  /**
   * Check if player has all checkers in home board
   */
  canBearOff: (state, player) => {
    if (state.bar[player] > 0) return false;
    
    // White home: points 0-5 (points 1-6)
    // Black home: points 18-23 (points 19-24)
    const homeStart = player === 'white' ? 0 : 18;
    const homeEnd = player === 'white' ? 5 : 23;
    
    for (let i = 0; i < 24; i++) {
      if (state.points[i].color === player) {
        if (i < homeStart || i > homeEnd) {
          return false;
        }
      }
    }
    return true;
  },
  
  /**
   * Get game duration in milliseconds
   */
  getGameDuration: (state) => {
    if (!state.gameStartTime) return 0;
    const endTime = state.gameEndTime || Date.now();
    return endTime - state.gameStartTime;
  },
  
  /**
   * Format game duration as string
   */
  getFormattedDuration: (state) => {
    const ms = selectors.getGameDuration(state);
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
};

export default {
  initialState,
  gameReducer,
  actions,
  ActionTypes,
  selectors,
  generateGameId,
  calculateFinalScore
};
