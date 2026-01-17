/**
 * 2048 Game State - Anchor/Fanning pattern for provably fair spawns
 * @module gameState
 *
 * Uses a single "anchor" block fetched at game start.
 * All spawns derive from: SHA256(anchorBlockHash + gameId + spawnIndex)
 */

import { useReducer, useCallback, useEffect } from 'react';
import CryptoJS from 'crypto-js';
import { createEmptyGrid, slideGrid, canMove, hasWon, getEmptyCells, cloneGrid } from './gridLogic';
import { spawnTile, createSpawnRecord } from './spawnLogic';

/**
 * Generate a secure game ID using anchor block data
 * Formula: SHA256(clientSecret + blockHash + timestamp)
 * @param {string} blockHash - Anchor block hash
 * @param {number} timestamp - Current timestamp
 * @returns {string} Secure game ID
 */
const generateSecureGameId = (blockHash, timestamp) => {
  // Client secret - in production this would come from server
  const clientSecret = CryptoJS.lib.WordArray.random(16).toString();
  const input = `${clientSecret}${blockHash}${timestamp}`;
  const hash = CryptoJS.SHA256(input).toString();
  // Return format: 2048-{first 8 chars}-{timestamp}-{random 4 chars}
  return `2048-${hash.slice(0, 8)}-${timestamp}-${hash.slice(8, 12)}`;
};

/**
 * Load high score from localStorage
 * @returns {number} High score or 0
 */
const loadHighScore = () => {
  try {
    const saved = localStorage.getItem('2048_highScore');
    return saved ? parseInt(saved, 10) : 0;
  } catch {
    return 0;
  }
};

/**
 * Save high score to localStorage
 * @param {number} score - Score to save
 */
const saveHighScore = (score) => {
  try {
    localStorage.setItem('2048_highScore', score.toString());
  } catch {
    // localStorage not available
  }
};

/**
 * Initial game state
 * @type {Object}
 */
export const initialState = {
  gameId: '',
  grid: createEmptyGrid(),
  score: 0,
  highScore: 0,
  gameStatus: 'playing', // 'playing' | 'won' | 'lost'
  canContinue: false,
  moveHistory: [],       // Array of move directions ['up', 'left', ...]
  spawnHistory: [],      // Array of spawn records for verification
  spawnIndex: 0,         // Current spawn index for anchor/fanning
  // Anchor block data - stored once at game start
  anchorBlock: {
    blockHeight: 0,
    blockHash: '',
    timestamp: 0
  }
};

/**
 * Action types
 */
export const ACTIONS = {
  INIT_GAME: 'INIT_GAME',
  MOVE: 'MOVE',
  CONTINUE_AFTER_WIN: 'CONTINUE_AFTER_WIN',
  NEW_GAME: 'NEW_GAME',
  LOAD_HIGH_SCORE: 'LOAD_HIGH_SCORE'
};

/**
 * Game reducer - handles all state transitions
 * @param {Object} state - Current state
 * @param {Object} action - Action to dispatch
 * @returns {Object} New state
 */
export const gameReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.LOAD_HIGH_SCORE: {
      return {
        ...state,
        highScore: action.highScore
      };
    }

    case ACTIONS.INIT_GAME: {
      const { blockData } = action;
      const timestamp = Date.now();
      const gameId = generateSecureGameId(blockData.blockHash, timestamp);

      let grid = createEmptyGrid();
      const spawnHistory = [];
      let spawnIndex = 0;

      // Spawn first tile using anchor block
      const emptyCells1 = getEmptyCells(grid);
      const spawn1 = spawnTile(grid, blockData.blockHash, gameId, spawnIndex);
      grid = spawn1.grid;

      if (spawn1.spawnedTile) {
        spawnHistory.push(createSpawnRecord(
          spawnIndex,
          blockData.blockHeight,
          blockData.blockHash,
          spawn1.seed,
          spawn1.spawnedTile.row,
          spawn1.spawnedTile.col,
          spawn1.spawnedTile.value,
          emptyCells1
        ));
      }
      spawnIndex++;

      // Spawn second tile using same anchor block
      const emptyCells2 = getEmptyCells(grid);
      const spawn2 = spawnTile(grid, blockData.blockHash, gameId, spawnIndex);
      grid = spawn2.grid;

      if (spawn2.spawnedTile) {
        spawnHistory.push(createSpawnRecord(
          spawnIndex,
          blockData.blockHeight,
          blockData.blockHash,
          spawn2.seed,
          spawn2.spawnedTile.row,
          spawn2.spawnedTile.col,
          spawn2.spawnedTile.value,
          emptyCells2
        ));
      }
      spawnIndex++;

      return {
        ...state,
        gameId,
        grid,
        score: 0,
        gameStatus: 'playing',
        canContinue: false,
        moveHistory: [],
        spawnHistory,
        spawnIndex,
        anchorBlock: {
          blockHeight: blockData.blockHeight,
          blockHash: blockData.blockHash,
          timestamp: blockData.timestamp
        }
      };
    }

    case ACTIONS.MOVE: {
      // Don't allow moves if game is over
      if (state.gameStatus === 'lost') return state;
      if (state.gameStatus === 'won' && !state.canContinue) return state;

      const { direction } = action;

      // Attempt to slide grid
      const { grid: newGrid, score: scoreGained, moved } = slideGrid(state.grid, direction);

      // If nothing moved, ignore this move
      if (!moved) {
        return state;
      }

      const newScore = state.score + scoreGained;
      const newHighScore = Math.max(state.highScore, newScore);

      // Save high score if it changed
      if (newHighScore > state.highScore) {
        saveHighScore(newHighScore);
      }

      // Record move in history (just the direction for compact storage)
      const newMoveHistory = [...state.moveHistory, direction];

      // Spawn new tile using ANCHOR block (no new API call!)
      const emptyCells = getEmptyCells(newGrid);
      const spawn = spawnTile(
        newGrid,
        state.anchorBlock.blockHash,
        state.gameId,
        state.spawnIndex
      );

      const newSpawnHistory = [...state.spawnHistory];
      if (spawn.spawnedTile) {
        newSpawnHistory.push(createSpawnRecord(
          state.spawnIndex,
          state.anchorBlock.blockHeight,
          state.anchorBlock.blockHash,
          spawn.seed,
          spawn.spawnedTile.row,
          spawn.spawnedTile.col,
          spawn.spawnedTile.value,
          emptyCells
        ));
      }

      // Check game status
      let newStatus = state.gameStatus;

      // Check for win condition (first time reaching 2048)
      if (hasWon(spawn.grid) && state.gameStatus === 'playing') {
        newStatus = 'won';
      }

      // Check if game is lost after spawn
      if (!canMove(spawn.grid)) {
        newStatus = 'lost';
      }

      return {
        ...state,
        grid: spawn.grid,
        score: newScore,
        highScore: newHighScore,
        moveHistory: newMoveHistory,
        spawnHistory: newSpawnHistory,
        spawnIndex: state.spawnIndex + 1,
        gameStatus: newStatus
      };
    }

    case ACTIONS.CONTINUE_AFTER_WIN: {
      if (state.gameStatus !== 'won') return state;

      return {
        ...state,
        canContinue: true
      };
    }

    case ACTIONS.NEW_GAME: {
      return {
        ...initialState,
        highScore: state.highScore
      };
    }

    default:
      return state;
  }
};

/**
 * Custom hook for 2048 game state management
 * @returns {Object} Game state and dispatch functions
 */
export const useGameState = () => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Load high score on mount
  useEffect(() => {
    const highScore = loadHighScore();
    dispatch({ type: ACTIONS.LOAD_HIGH_SCORE, highScore });
  }, []);

  /**
   * Initialize a new game with blockchain data (called ONCE at game start)
   * @param {Object} blockData - { blockHeight, blockHash, timestamp }
   */
  const initGame = useCallback((blockData) => {
    dispatch({ type: ACTIONS.INIT_GAME, blockData });
  }, []);

  /**
   * Make a move in the specified direction
   * Spawns are handled automatically using anchor block - no API call needed!
   * @param {'up'|'down'|'left'|'right'} direction - Move direction
   */
  const move = useCallback((direction) => {
    dispatch({ type: ACTIONS.MOVE, direction });
  }, []);

  /**
   * Continue playing after reaching 2048
   */
  const continueAfterWin = useCallback(() => {
    dispatch({ type: ACTIONS.CONTINUE_AFTER_WIN });
  }, []);

  /**
   * Start a new game
   */
  const newGame = useCallback(() => {
    dispatch({ type: ACTIONS.NEW_GAME });
  }, []);

  return {
    state,
    dispatch,
    initGame,
    move,
    continueAfterWin,
    newGame
  };
};

/**
 * Encode move history as compact string for leaderboard storage
 * @param {Array<string>} moveHistory - Array of directions
 * @returns {string} Encoded moves (e.g., "UDLRULDR...")
 */
export const encodeMoveHistory = (moveHistory) => {
  const dirMap = { up: 'U', down: 'D', left: 'L', right: 'R' };
  return moveHistory.map(d => dirMap[d] || '?').join('');
};

/**
 * Decode move history from compact string
 * @param {string} encoded - Encoded moves string
 * @returns {Array<string>} Array of directions
 */
export const decodeMoveHistory = (encoded) => {
  const dirMap = { U: 'up', D: 'down', L: 'left', R: 'right' };
  return encoded.split('').map(c => dirMap[c] || 'up');
};
