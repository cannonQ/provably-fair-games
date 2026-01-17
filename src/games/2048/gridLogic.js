/**
 * 2048 Grid Logic - Core grid manipulation functions
 * @module gridLogic
 */

const GRID_SIZE = 4;
const WIN_VALUE = 2048;

/**
 * Create an empty 4x4 grid
 * @returns {Array<Array<null>>} Empty grid
 */
export const createEmptyGrid = () => {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => null)
  );
};

/**
 * Clone a grid (deep copy)
 * @param {Array<Array<Object|null>>} grid - Grid to clone
 * @returns {Array<Array<Object|null>>} Cloned grid
 */
export const cloneGrid = (grid) => {
  return grid.map(row => row.map(cell => cell ? { ...cell } : null));
};

/**
 * Get all empty cells in the grid
 * @param {Array<Array<Object|null>>} grid - Game grid
 * @returns {Array<{row: number, col: number}>} Array of empty cell positions
 */
export const getEmptyCells = (grid) => {
  const emptyCells = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === null) {
        emptyCells.push({ row, col });
      }
    }
  }
  return emptyCells;
};

/**
 * Check if the grid contains a 2048 tile
 * @param {Array<Array<Object|null>>} grid - Game grid
 * @returns {boolean} True if 2048 tile exists
 */
export const hasWon = (grid) => {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] && grid[row][col].value >= WIN_VALUE) {
        return true;
      }
    }
  }
  return false;
};

/**
 * Slide and merge a single row to the left
 * @param {Array<Object|null>} row - Row to slide
 * @returns {{row: Array<Object|null>, score: number}} New row and score gained
 */
const slideRowLeft = (row) => {
  // Filter out null cells
  let tiles = row.filter(cell => cell !== null);
  let score = 0;

  // Merge adjacent tiles with same value
  const merged = [];
  let i = 0;
  while (i < tiles.length) {
    if (i + 1 < tiles.length && tiles[i].value === tiles[i + 1].value) {
      // Merge tiles
      const newValue = tiles[i].value * 2;
      merged.push({
        ...tiles[i],
        value: newValue,
        isMerged: true
      });
      score += newValue;
      i += 2;
    } else {
      merged.push({ ...tiles[i], isMerged: false });
      i++;
    }
  }

  // Pad with nulls to maintain row length
  const newRow = [...merged];
  while (newRow.length < GRID_SIZE) {
    newRow.push(null);
  }

  return { row: newRow, score };
};

/**
 * Rotate grid 90 degrees clockwise
 * @param {Array<Array<Object|null>>} grid - Grid to rotate
 * @returns {Array<Array<Object|null>>} Rotated grid
 */
const rotateClockwise = (grid) => {
  const newGrid = createEmptyGrid();
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      newGrid[col][GRID_SIZE - 1 - row] = grid[row][col];
    }
  }
  return newGrid;
};

/**
 * Rotate grid 90 degrees counter-clockwise
 * @param {Array<Array<Object|null>>} grid - Grid to rotate
 * @returns {Array<Array<Object|null>>} Rotated grid
 */
const rotateCounterClockwise = (grid) => {
  const newGrid = createEmptyGrid();
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      newGrid[GRID_SIZE - 1 - col][row] = grid[row][col];
    }
  }
  return newGrid;
};

/**
 * Rotate grid 180 degrees
 * @param {Array<Array<Object|null>>} grid - Grid to rotate
 * @returns {Array<Array<Object|null>>} Rotated grid
 */
const rotate180 = (grid) => {
  return rotateClockwise(rotateClockwise(grid));
};

/**
 * Check if two grids are equal
 * @param {Array<Array<Object|null>>} grid1 - First grid
 * @param {Array<Array<Object|null>>} grid2 - Second grid
 * @returns {boolean} True if grids are equal
 */
const gridsEqual = (grid1, grid2) => {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const cell1 = grid1[row][col];
      const cell2 = grid2[row][col];
      if (cell1 === null && cell2 === null) continue;
      if (cell1 === null || cell2 === null) return false;
      if (cell1.value !== cell2.value) return false;
    }
  }
  return true;
};

/**
 * Slide the entire grid in a direction
 * @param {Array<Array<Object|null>>} grid - Game grid
 * @param {'up'|'down'|'left'|'right'} direction - Slide direction
 * @returns {{grid: Array<Array<Object|null>>, score: number, moved: boolean}} Result
 */
export const slideGrid = (grid, direction) => {
  let workingGrid = cloneGrid(grid);
  let totalScore = 0;

  // Rotate grid so we can always slide left
  switch (direction) {
    case 'right':
      workingGrid = rotate180(workingGrid);
      break;
    case 'up':
      workingGrid = rotateCounterClockwise(workingGrid);
      break;
    case 'down':
      workingGrid = rotateClockwise(workingGrid);
      break;
    default:
      break;
  }

  // Slide all rows left
  const newGrid = workingGrid.map((row, rowIndex) => {
    const result = slideRowLeft(row);
    totalScore += result.score;
    // Update row and column positions
    return result.row.map((cell, colIndex) => {
      if (cell) {
        return { ...cell, row: rowIndex, col: colIndex };
      }
      return null;
    });
  });

  // Rotate back
  let finalGrid;
  switch (direction) {
    case 'right':
      finalGrid = rotate180(newGrid);
      break;
    case 'up':
      finalGrid = rotateClockwise(newGrid);
      break;
    case 'down':
      finalGrid = rotateCounterClockwise(newGrid);
      break;
    default:
      finalGrid = newGrid;
      break;
  }

  // Update positions after rotation
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (finalGrid[row][col]) {
        finalGrid[row][col].row = row;
        finalGrid[row][col].col = col;
      }
    }
  }

  const moved = !gridsEqual(grid, finalGrid);

  return { grid: finalGrid, score: totalScore, moved };
};

/**
 * Check if any move is possible
 * @param {Array<Array<Object|null>>} grid - Game grid
 * @returns {boolean} True if at least one move is possible
 */
export const canMove = (grid) => {
  // Check for empty cells
  const emptyCells = getEmptyCells(grid);
  if (emptyCells.length > 0) return true;

  // Check for adjacent equal tiles
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const current = grid[row][col];
      if (!current) continue;

      // Check right neighbor
      if (col < GRID_SIZE - 1) {
        const right = grid[row][col + 1];
        if (right && right.value === current.value) return true;
      }

      // Check bottom neighbor
      if (row < GRID_SIZE - 1) {
        const bottom = grid[row + 1][col];
        if (bottom && bottom.value === current.value) return true;
      }
    }
  }

  return false;
};

/**
 * Get the highest tile value in the grid
 * @param {Array<Array<Object|null>>} grid - Game grid
 * @returns {number} Highest tile value
 */
export const getMaxTile = (grid) => {
  let max = 0;
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] && grid[row][col].value > max) {
        max = grid[row][col].value;
      }
    }
  }
  return max;
};
