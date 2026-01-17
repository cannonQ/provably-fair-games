/**
 * 2048 Game State - State management with useReducer pattern
 * @module gameState
 */

import { useReducer, useCallback, useEffect } from 'react';
import { createEmptyGrid, slideGrid, canMove, hasWon, getEmptyCells, cloneGrid } from './gridLogic';
import { spawnTile, createSpawnRecord } from './spawnLogic';

/**
 * Generate a UUID for game identification
 * @returns {string} UUID string
 */
const generateGameId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
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
  moveCount: 0,
  gameStatus: 'playing', // 'playing' | 'won' | 'lost'
  canContinue: false,
  moveHistory: [],
  spawnHistory: [],
  lastMove: null,
  pendingSpawn: false
};

/**
 * Action types
 */
export const ACTIONS = {
  INIT_GAME: 'INIT_GAME',
  MOVE: 'MOVE',
  SPAWN_TILE: 'SPAWN_TILE',
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
      const gameId = generateGameId();
      let grid = createEmptyGrid();
      const spawnHistory = [];
      
      // Spawn first tile
      if (action.blockData) {
        const emptyCells1 = getEmptyCells(grid);
        const spawn1 = spawnTile(grid, action.blockData.blockHash, gameId, 0);
        grid = spawn1.grid;
        
        if (spawn1.spawnedTile) {
          spawnHistory.push(createSpawnRecord(
            0,
            action.blockData.blockHeight,
            action.blockData.blockHash,
            spawn1.seed,
            spawn1.spawnedTile.row,
            spawn1.spawnedTile.col,
            spawn1.spawnedTile.value,
            emptyCells1
          ));
        }
        
        // Spawn second tile
        const emptyCells2 = getEmptyCells(grid);
        const spawn2 = spawnTile(grid, action.blockData.blockHash, gameId, 1);
        grid = spawn2.grid;
        
        if (spawn2.spawnedTile) {
          spawnHistory.push(createSpawnRecord(
            1,
            action.blockData.blockHeight,
            action.blockData.blockHash,
            spawn2.seed,
            spawn2.spawnedTile.row,
            spawn2.spawnedTile.col,
            spawn2.spawnedTile.value,
            emptyCells2
          ));
        }
      }
      
      return {
        ...state,
        gameId,
        grid,
        score: 0,
        moveCount: 2, // 2 initial spawns
        gameStatus: 'playing',
        canContinue: false,
        moveHistory: [],
        spawnHistory,
        lastMove: null,
        pendingSpawn: false
      };
    }

    case ACTIONS.MOVE: {
      // Don't allow moves if game is over (lost, or won without continuing)
      if (state.gameStatus === 'lost') return state;
      if (state.gameStatus === 'won' && !state.canContinue) return state;
      if (state.pendingSpawn) return state;
      
      const { direction } = action;
      const gridBefore = cloneGrid(state.grid);
      
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
      
      // Record move in history
      const moveRecord = {
        moveNumber: state.moveHistory.length + 1,
        direction,
        gridBefore,
        gridAfter: cloneGrid(newGrid),
        scoreGained,
        timestamp: Date.now()
      };
      
      // Check for win condition (first time reaching 2048)
      let newStatus = state.gameStatus;
      if (hasWon(newGrid) && state.gameStatus === 'playing') {
        newStatus = 'won';
      }
      
      return {
        ...state,
        grid: newGrid,
        score: newScore,
        highScore: newHighScore,
        moveHistory: [...state.moveHistory, moveRecord],
        lastMove: { direction, timestamp: Date.now() },
        gameStatus: newStatus,
        pendingSpawn: true
      };
    }

    case ACTIONS.SPAWN_TILE: {
      if (!state.pendingSpawn) return state;
      
      const { blockData } = action;
      const emptyCells = getEmptyCells(state.grid);
      
      const spawn = spawnTile(
        state.grid,
        blockData.blockHash,
        state.gameId,
        state.moveCount
      );
      
      const newMoveCount = state.moveCount + 1;
      let newSpawnHistory = state.spawnHistory;
      
      if (spawn.spawnedTile) {
        newSpawnHistory = [...state.spawnHistory, createSpawnRecord(
          newMoveCount,
          blockData.blockHeight,
          blockData.blockHash,
          spawn.seed,
          spawn.spawnedTile.row,
          spawn.spawnedTile.col,
          spawn.spawnedTile.value,
          emptyCells
        )];
      }
      
      // Check if game is lost after spawn
      let newStatus = state.gameStatus;
      if (!canMove(spawn.grid)) {
        newStatus = 'lost';
      }
      
      return {
        ...state,
        grid: spawn.grid,
        moveCount: newMoveCount,
        spawnHistory: newSpawnHistory,
        gameStatus: newStatus,
        pendingSpawn: false
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
   * Initialize a new game with blockchain data
   * @param {Object} blockData - { blockHeight, blockHash, timestamp }
   */
  const initGame = useCallback((blockData) => {
    dispatch({ type: ACTIONS.INIT_GAME, blockData });
  }, []);
  
  /**
   * Make a move in the specified direction
   * @param {'up'|'down'|'left'|'right'} direction - Move direction
   */
  const move = useCallback((direction) => {
    dispatch({ type: ACTIONS.MOVE, direction });
  }, []);
  
  /**
   * Spawn a new tile after a valid move
   * @param {Object} blockData - { blockHeight, blockHash, timestamp }
   */
  const spawnNewTile = useCallback((blockData) => {
    dispatch({ type: ACTIONS.SPAWN_TILE, blockData });
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
    spawnNewTile,
    continueAfterWin,
    newGame
  };
};

/**
 * Get initial grid with starting tiles (for testing/preview)
 * @param {Object} blockData - Blockchain data for randomness
 * @param {string} gameId - Game identifier
 * @returns {Array<Array<Object>>} Grid with 2 starting tiles
 */
export const getInitialGrid = (blockData, gameId) => {
  let grid = createEmptyGrid();
  
  const spawn1 = spawnTile(grid, blockData.blockHash, gameId, 0);
  grid = spawn1.grid;
  
  const spawn2 = spawnTile(grid, blockData.blockHash, gameId, 1);
  grid = spawn2.grid;
  
  return grid;
};
