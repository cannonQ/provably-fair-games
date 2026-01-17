/**
 * 2048 Spawn Logic - Blockchain-based verifiable tile spawning
 * @module spawnLogic
 */

import CryptoJS from 'crypto-js';
import { cloneGrid, getEmptyCells } from './gridLogic';

/**
 * Generate master seed from blockchain data
 * @param {string} blockHash - Ergo block hash
 * @param {string} gameId - Unique game identifier
 * @param {number} moveNumber - Current move number
 * @returns {string} Master seed hash
 */
export const generateMasterSeed = (blockHash, gameId, moveNumber) => {
  const input = `${blockHash}${gameId}${moveNumber}`;
  return CryptoJS.SHA256(input).toString();
};

/**
 * Calculate spawn position from seed
 * @param {string} seed - Master seed
 * @param {Array<{row: number, col: number}>} emptyCells - Available positions
 * @returns {{row: number, col: number}|null} Selected position or null if no empty cells
 */
export const calculateSpawnPosition = (seed, emptyCells) => {
  if (emptyCells.length === 0) return null;
  
  const positionSeed = CryptoJS.SHA256(seed + 'position').toString();
  // Use first 8 hex chars (32 bits) for position calculation
  const positionValue = parseInt(positionSeed.substring(0, 8), 16);
  const index = positionValue % emptyCells.length;
  
  return emptyCells[index];
};

/**
 * Calculate spawn value from seed (90% = 2, 10% = 4)
 * @param {string} seed - Master seed
 * @returns {number} Tile value (2 or 4)
 */
export const calculateSpawnValue = (seed) => {
  const valueSeed = CryptoJS.SHA256(seed + 'value').toString();
  // Use first 8 hex chars (32 bits) for value calculation
  const valueResult = parseInt(valueSeed.substring(0, 8), 16) % 100;
  
  return valueResult < 90 ? 2 : 4;
};

/**
 * Spawn a new tile on the grid using blockchain randomness
 * @param {Array<Array<Object>>} grid - Current game grid
 * @param {string} blockHash - Ergo block hash for randomness
 * @param {string} gameId - Unique game identifier
 * @param {number} moveNumber - Current move number
 * @returns {{grid: Array<Array<Object>>, spawnedTile: {row: number, col: number, value: number}|null, seed: string}}
 */
export const spawnTile = (grid, blockHash, gameId, moveNumber) => {
  const emptyCells = getEmptyCells(grid);
  const seed = generateMasterSeed(blockHash, gameId, moveNumber);
  
  if (emptyCells.length === 0) {
    return { grid, spawnedTile: null, seed };
  }
  
  const position = calculateSpawnPosition(seed, emptyCells);
  const value = calculateSpawnValue(seed);
  
  const newGrid = cloneGrid(grid);
  newGrid[position.row][position.col] = {
    row: position.row,
    col: position.col,
    value,
    id: Date.now() + Math.random(), // Unique ID for animation
    isNew: true // Flag for spawn animation
  };
  
  return {
    grid: newGrid,
    spawnedTile: { row: position.row, col: position.col, value },
    seed
  };
};

/**
 * Verify a spawn was calculated correctly (for audit/verification)
 * @param {string} blockHash - Block hash used for spawn
 * @param {string} gameId - Game identifier
 * @param {number} moveNumber - Move number when spawn occurred
 * @param {number} expectedRow - Expected spawn row
 * @param {number} expectedCol - Expected spawn column
 * @param {number} expectedValue - Expected tile value (2 or 4)
 * @param {Array<{row: number, col: number}>} emptyCells - Empty cells at time of spawn
 * @returns {{valid: boolean, calculated: {row: number, col: number, value: number}, seed: string}}
 */
export const verifySpawn = (blockHash, gameId, moveNumber, expectedRow, expectedCol, expectedValue, emptyCells) => {
  const seed = generateMasterSeed(blockHash, gameId, moveNumber);
  const position = calculateSpawnPosition(seed, emptyCells);
  const value = calculateSpawnValue(seed);
  
  const valid = position !== null &&
    position.row === expectedRow &&
    position.col === expectedCol &&
    value === expectedValue;
  
  return {
    valid,
    calculated: position ? { row: position.row, col: position.col, value } : null,
    seed
  };
};

/**
 * Create a spawn history record
 * @param {number} moveNumber - Move number
 * @param {number} blockHeight - Ergo block height
 * @param {string} blockHash - Ergo block hash
 * @param {string} seed - Master seed used
 * @param {number} row - Spawn row
 * @param {number} col - Spawn column
 * @param {number} value - Tile value (2 or 4)
 * @param {Array<{row: number, col: number}>} emptyCells - Empty cells at spawn time
 * @returns {Object} Spawn history record
 */
export const createSpawnRecord = (moveNumber, blockHeight, blockHash, seed, row, col, value, emptyCells) => ({
  moveNumber,
  blockHeight,
  blockHash,
  seed,
  row,
  col,
  value,
  emptyCellCount: emptyCells.length,
  emptyCells: [...emptyCells], // Copy for verification
  timestamp: Date.now()
});
