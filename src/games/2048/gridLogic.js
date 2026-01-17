/**
 * 2048 Grid Logic - Core game mechanics for tile movement and merging
 * @module gridLogic
 */

let cellIdCounter = 0;

/**
 * Generate a unique cell ID
 * @returns {number} Unique identifier
 */
const generateId = () => ++cellIdCounter;

/**
 * Create a cell object
 * @param {number} row - Row position (0-3)
 * @param {number} col - Column position (0-3)
 * @param {number} value - Cell value (0, 2, 4, 8, ..., 2048+)
 * @returns {{row: number, col: number, value: number, id: number}}
 */
const createCell = (row, col, value = 0) => ({
  row,
  col,
  value,
  id: value > 0 ? generateId() : 0
});

/**
 * Create an empty 4x4 grid with all cells having value 0
 * @returns {Array<Array<{row: number, col: number, value: number, id: number}>>}
 */
export const createEmptyGrid = () => {
  return Array.from({ length: 4 }, (_, row) =>
    Array.from({ length: 4 }, (_, col) => createCell(row, col, 0))
  );
};

/**
 * Deep clone a grid to avoid mutations
 * @param {Array<Array<Object>>} grid - Grid to clone
 * @returns {Array<Array<Object>>} Cloned grid
 */
export const cloneGrid = (grid) => {
  return grid.map(row => row.map(cell => ({ ...cell })));
};

/**
 * Get all empty cells (value === 0) from grid
 * @param {Array<Array<Object>>} grid - Game grid
 * @returns {Array<{row: number, col: number}>} Array of empty cell positions
 */
export const getEmptyCells = (grid) => {
  const empty = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (grid[row][col].value === 0) {
        empty.push({ row, col });
      }
    }
  }
  return empty;
};

/**
 * Check if two grids are equal (same values in same positions)
 * @param {Array<Array<Object>>} grid1 - First grid
 * @param {Array<Array<Object>>} grid2 - Second grid
 * @returns {boolean} True if grids have identical values
 */
export const gridsEqual = (grid1, grid2) => {
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (grid1[row][col].value !== grid2[row][col].value) {
        return false;
      }
    }
  }
  return true;
};

/**
 * Rotate grid 90° clockwise (used for up/down movement via left slide)
 * @param {Array<Array<Object>>} grid - Grid to rotate
 * @param {number} times - Number of 90° rotations (1-3)
 * @returns {Array<Array<Object>>} Rotated grid
 */
export const rotateGrid = (grid, times = 1) => {
  let result = cloneGrid(grid);
  for (let t = 0; t < times; t++) {
    const rotated = createEmptyGrid();
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        rotated[col][3 - row] = { ...result[row][col], row: col, col: 3 - row };
      }
    }
    result = rotated;
  }
  return result;
};

/**
 * Slide and merge a single row to the left
 * Merge rules: tiles merge ONLY once per move
 * Example: [2,2,4,4] → [4,8,0,0] (score: 12)
 * Example: [2,2,2,2] → [4,4,0,0] (score: 8, NOT [8,0,0,0])
 * @param {Array<Object>} row - Row of cells
 * @returns {{row: Array<Object>, score: number}} Slid row and score gained
 */
const slideRow = (row) => {
  // Extract non-zero values
  const values = row.filter(cell => cell.value > 0).map(cell => ({
    value: cell.value,
    id: cell.id
  }));
  
  const merged = [];
  let score = 0;
  let i = 0;
  
  // Merge adjacent matching values (each tile merges only once)
  while (i < values.length) {
    if (i + 1 < values.length && values[i].value === values[i + 1].value) {
      const newValue = values[i].value * 2;
      merged.push({ value: newValue, id: generateId(), merged: true });
      score += newValue;
      i += 2; // Skip both merged tiles
    } else {
      merged.push({ value: values[i].value, id: values[i].id, merged: false });
      i++;
    }
  }
  
  // Pad with zeros to length 4
  while (merged.length < 4) {
    merged.push({ value: 0, id: 0, merged: false });
  }
  
  // Create new row with updated positions
  const newRow = merged.map((item, col) => ({
    row: row[0].row,
    col,
    value: item.value,
    id: item.id,
    merged: item.merged
  }));
  
  return { row: newRow, score };
};

/**
 * Slide entire grid in specified direction, merging matching tiles
 * @param {Array<Array<Object>>} grid - Game grid
 * @param {'up'|'down'|'left'|'right'} direction - Movement direction
 * @returns {{grid: Array<Array<Object>>, score: number, moved: boolean}} New grid, score, and whether anything moved
 */
export const slideGrid = (grid, direction) => {
  let workingGrid = cloneGrid(grid);
  let totalScore = 0;
  
  // Rotate grid so we always slide left, then rotate back
  const rotations = { left: 0, up: 1, right: 2, down: 3 };
  const rotation = rotations[direction];
  
  if (rotation > 0) {
    workingGrid = rotateGrid(workingGrid, rotation);
  }
  
  // Slide each row left
  const newRows = [];
  for (let row = 0; row < 4; row++) {
    const { row: slidRow, score } = slideRow(workingGrid[row]);
    newRows.push(slidRow);
    totalScore += score;
  }
  workingGrid = newRows;
  
  // Rotate back
  if (rotation > 0) {
    workingGrid = rotateGrid(workingGrid, 4 - rotation);
  }
  
  // Update row/col positions after rotation
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      workingGrid[row][col].row = row;
      workingGrid[row][col].col = col;
    }
  }
  
  const moved = !gridsEqual(grid, workingGrid);
  
  return { grid: workingGrid, score: totalScore, moved };
};

/**
 * Check if any move is possible (game not over)
 * @param {Array<Array<Object>>} grid - Game grid
 * @returns {boolean} True if at least one move is possible
 */
export const canMove = (grid) => {
  // Check for empty cells
  if (getEmptyCells(grid).length > 0) return true;
  
  // Check for adjacent horizontal matches
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 3; col++) {
      if (grid[row][col].value === grid[row][col + 1].value) return true;
    }
  }
  
  // Check for adjacent vertical matches
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      if (grid[row][col].value === grid[row + 1][col].value) return true;
    }
  }
  
  return false;
};

/**
 * Check if player has won (reached 2048 tile)
 * @param {Array<Array<Object>>} grid - Game grid
 * @returns {boolean} True if any cell has value >= 2048
 */
export const hasWon = (grid) => {
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (grid[row][col].value >= 2048) return true;
    }
  }
  return false;
};

/**
 * Assign unique IDs to all non-zero cells (for animation tracking)
 * @param {Array<Array<Object>>} grid - Game grid
 * @returns {Array<Array<Object>>} Grid with assigned IDs
 */
export const assignCellIds = (grid) => {
  const newGrid = cloneGrid(grid);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (newGrid[row][col].value > 0 && !newGrid[row][col].id) {
        newGrid[row][col].id = generateId();
      }
    }
  }
  return newGrid;
};

/**
 * Reset the cell ID counter (for testing)
 */
export const resetIdCounter = () => {
  cellIdCounter = 0;
};
