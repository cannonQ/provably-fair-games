/**
 * 2048 Grid Logic Tests
 *
 * Week 5: Test 2048 game logic
 *
 * Tests:
 * - Grid creation and cloning
 * - Empty cell detection
 * - Grid equality comparison
 * - Grid rotation (for movement)
 * - Tile sliding and merging
 * - Movement in all 4 directions
 * - Move detection (game over check)
 * - Win condition (2048 tile)
 */

import {
  createEmptyGrid,
  cloneGrid,
  getEmptyCells,
  gridsEqual,
  rotateGrid,
  slideGrid,
  canMove,
  hasWon
} from '../gridLogic';

// ============================================
// TEST HELPERS
// ============================================

function setCell(grid, row, col, value) {
  grid[row][col].value = value;
  if (value > 0) grid[row][col].id = 1; // Simple ID for testing
  return grid;
}

function createTestGrid(values) {
  const grid = createEmptyGrid();
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (values[row] && values[row][col]) {
        setCell(grid, row, col, values[row][col]);
      }
    }
  }
  return grid;
}

// ============================================
// GRID CREATION
// ============================================

describe('Grid Creation', () => {
  test('creates 4x4 grid', () => {
    const grid = createEmptyGrid();
    expect(grid.length).toBe(4);
    expect(grid[0].length).toBe(4);
  });

  test('all cells start with value 0', () => {
    const grid = createEmptyGrid();
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        expect(grid[row][col].value).toBe(0);
      }
    }
  });

  test('cells have row and col properties', () => {
    const grid = createEmptyGrid();
    expect(grid[0][0]).toHaveProperty('row', 0);
    expect(grid[0][0]).toHaveProperty('col', 0);
    expect(grid[3][3]).toHaveProperty('row', 3);
    expect(grid[3][3]).toHaveProperty('col', 3);
  });
});

// ============================================
// GRID CLONING
// ============================================

describe('Grid Cloning', () => {
  test('clones grid with same values', () => {
    const grid = createTestGrid([
      [2, 4, 0, 0],
      [0, 0, 2, 0],
      [0, 0, 0, 4],
      [0, 0, 0, 0]
    ]);
    const cloned = cloneGrid(grid);
    expect(gridsEqual(grid, cloned)).toBe(true);
  });

  test('cloned grid is independent (no mutation)', () => {
    const grid = createTestGrid([[2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    const cloned = cloneGrid(grid);
    cloned[0][0].value = 4;
    expect(grid[0][0].value).toBe(2);  // Original unchanged
  });
});

// ============================================
// EMPTY CELLS
// ============================================

describe('Empty Cells', () => {
  test('all cells empty returns 16 positions', () => {
    const grid = createEmptyGrid();
    const empty = getEmptyCells(grid);
    expect(empty.length).toBe(16);
  });

  test('full grid returns 0 empty cells', () => {
    const grid = createTestGrid([
      [2, 4, 8, 16],
      [32, 64, 128, 256],
      [512, 1024, 2048, 4],
      [2, 2, 4, 8]
    ]);
    const empty = getEmptyCells(grid);
    expect(empty.length).toBe(0);
  });

  test('partially filled grid returns correct empty cells', () => {
    const grid = createTestGrid([
      [2, 0, 0, 0],
      [0, 4, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]);
    const empty = getEmptyCells(grid);
    expect(empty.length).toBe(14);
  });

  test('empty cells have correct coordinates', () => {
    const grid = createTestGrid([
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]);
    const empty = getEmptyCells(grid);
    expect(empty).toContainEqual({ row: 0, col: 1 });
    expect(empty).toContainEqual({ row: 0, col: 2 });
    expect(empty).toContainEqual({ row: 3, col: 3 });
  });
});

// ============================================
// GRID EQUALITY
// ============================================

describe('Grid Equality', () => {
  test('identical grids are equal', () => {
    const grid1 = createTestGrid([[2, 4, 0, 0], [0, 0, 2, 0], [0, 0, 0, 4], [0, 0, 0, 0]]);
    const grid2 = createTestGrid([[2, 4, 0, 0], [0, 0, 2, 0], [0, 0, 0, 4], [0, 0, 0, 0]]);
    expect(gridsEqual(grid1, grid2)).toBe(true);
  });

  test('different grids are not equal', () => {
    const grid1 = createTestGrid([[2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    const grid2 = createTestGrid([[4, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    expect(gridsEqual(grid1, grid2)).toBe(false);
  });

  test('empty grids are equal', () => {
    const grid1 = createEmptyGrid();
    const grid2 = createEmptyGrid();
    expect(gridsEqual(grid1, grid2)).toBe(true);
  });
});

// ============================================
// GRID ROTATION
// ============================================

describe('Grid Rotation', () => {
  test('rotates 90° clockwise once', () => {
    const grid = createTestGrid([
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 10, 11, 12],
      [13, 14, 15, 16]
    ]);
    const rotated = rotateGrid(grid, 1);
    expect(rotated[0][0].value).toBe(13);  // Bottom-left becomes top-left
    expect(rotated[0][3].value).toBe(1);   // Top-left becomes top-right
    expect(rotated[3][3].value).toBe(4);   // Top-right becomes bottom-right
  });

  test('rotate 4 times returns to original', () => {
    const grid = createTestGrid([[2, 4, 8, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    const rotated = rotateGrid(grid, 4);
    expect(gridsEqual(grid, rotated)).toBe(true);
  });

  test('rotate twice is 180°', () => {
    const grid = createTestGrid([
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 4]
    ]);
    const rotated = rotateGrid(grid, 2);
    expect(rotated[0][0].value).toBe(4);  // Bottom-right becomes top-left (180°)
    expect(rotated[3][3].value).toBe(2);  // Top-left becomes bottom-right (180°)
  });
});

// ============================================
// SLIDING - LEFT
// ============================================

describe('Sliding Left', () => {
  test('slides tiles left into empty spaces', () => {
    const grid = createTestGrid([
      [0, 2, 0, 4],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]);
    const result = slideGrid(grid, 'left');
    expect(result.grid[0][0].value).toBe(2);
    expect(result.grid[0][1].value).toBe(4);
    expect(result.grid[0][2].value).toBe(0);
    expect(result.moved).toBe(true);
  });

  test('merges matching tiles [2, 2] → [4, 0]', () => {
    const grid = createTestGrid([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]);
    const result = slideGrid(grid, 'left');
    expect(result.grid[0][0].value).toBe(4);
    expect(result.grid[0][1].value).toBe(0);
    expect(result.score).toBe(4);
    expect(result.moved).toBe(true);
  });

  test('merges twice [2, 2, 4, 4] → [4, 8, 0, 0]', () => {
    const grid = createTestGrid([
      [2, 2, 4, 4],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]);
    const result = slideGrid(grid, 'left');
    expect(result.grid[0][0].value).toBe(4);
    expect(result.grid[0][1].value).toBe(8);
    expect(result.grid[0][2].value).toBe(0);
    expect(result.grid[0][3].value).toBe(0);
    expect(result.score).toBe(12);  // 4 + 8
  });

  test('each tile merges only once [2, 2, 2, 2] → [4, 4, 0, 0]', () => {
    const grid = createTestGrid([
      [2, 2, 2, 2],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]);
    const result = slideGrid(grid, 'left');
    expect(result.grid[0][0].value).toBe(4);
    expect(result.grid[0][1].value).toBe(4);
    expect(result.grid[0][2].value).toBe(0);
    expect(result.grid[0][3].value).toBe(0);
    expect(result.score).toBe(8);  // 4 + 4, NOT 8 + 0
  });

  test('no move when already at left', () => {
    const grid = createTestGrid([
      [2, 4, 8, 16],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]);
    const result = slideGrid(grid, 'left');
    expect(result.moved).toBe(false);
    expect(result.score).toBe(0);
  });
});

// ============================================
// SLIDING - RIGHT
// ============================================

describe('Sliding Right', () => {
  test('slides tiles right into empty spaces', () => {
    const grid = createTestGrid([
      [2, 0, 4, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]);
    const result = slideGrid(grid, 'right');
    expect(result.grid[0][2].value).toBe(2);
    expect(result.grid[0][3].value).toBe(4);
    expect(result.moved).toBe(true);
  });

  test('merges matching tiles [2, 2] → [0, 4]', () => {
    const grid = createTestGrid([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]);
    const result = slideGrid(grid, 'right');
    expect(result.grid[0][2].value).toBe(0);
    expect(result.grid[0][3].value).toBe(4);
    expect(result.score).toBe(4);
  });
});

// ============================================
// SLIDING - UP
// ============================================

describe('Sliding Up', () => {
  test('slides tiles up into empty spaces', () => {
    const grid = createTestGrid([
      [0, 0, 0, 0],
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [4, 0, 0, 0]
    ]);
    const result = slideGrid(grid, 'up');
    expect(result.grid[0][0].value).toBe(2);
    expect(result.grid[1][0].value).toBe(4);
    expect(result.moved).toBe(true);
  });

  test('merges matching tiles vertically', () => {
    const grid = createTestGrid([
      [2, 0, 0, 0],
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]);
    const result = slideGrid(grid, 'up');
    expect(result.grid[0][0].value).toBe(4);
    expect(result.grid[1][0].value).toBe(0);
    expect(result.score).toBe(4);
  });
});

// ============================================
// SLIDING - DOWN
// ============================================

describe('Sliding Down', () => {
  test('slides tiles down into empty spaces', () => {
    const grid = createTestGrid([
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [4, 0, 0, 0],
      [0, 0, 0, 0]
    ]);
    const result = slideGrid(grid, 'down');
    expect(result.grid[2][0].value).toBe(2);
    expect(result.grid[3][0].value).toBe(4);
    expect(result.moved).toBe(true);
  });

  test('merges matching tiles vertically', () => {
    const grid = createTestGrid([
      [2, 0, 0, 0],
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]);
    const result = slideGrid(grid, 'down');
    expect(result.grid[2][0].value).toBe(0);
    expect(result.grid[3][0].value).toBe(4);
    expect(result.score).toBe(4);
  });
});

// ============================================
// CAN MOVE (GAME OVER CHECK)
// ============================================

describe('Can Move', () => {
  test('can move with empty cells', () => {
    const grid = createTestGrid([
      [2, 4, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]);
    expect(canMove(grid)).toBe(true);
  });

  test('can move with matching horizontal tiles', () => {
    const grid = createTestGrid([
      [2, 2, 4, 8],
      [16, 32, 64, 128],
      [256, 512, 1024, 2048],
      [4, 8, 16, 32]
    ]);
    expect(canMove(grid)).toBe(true);  // 2, 2 match
  });

  test('can move with matching vertical tiles', () => {
    const grid = createTestGrid([
      [2, 4, 8, 16],
      [2, 32, 64, 128],
      [256, 512, 1024, 2048],
      [4, 8, 16, 32]
    ]);
    expect(canMove(grid)).toBe(true);  // 2, 2 match vertically
  });

  test('cannot move when grid full with no matches', () => {
    const grid = createTestGrid([
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2]
    ]);
    expect(canMove(grid)).toBe(false);
  });

  test('can move with match in middle', () => {
    const grid = createTestGrid([
      [2, 4, 8, 16],
      [32, 64, 64, 128],
      [256, 512, 1024, 2048],
      [4, 8, 16, 32]
    ]);
    expect(canMove(grid)).toBe(true);  // 64, 64 match
  });

  test('can move with match in last row', () => {
    const grid = createTestGrid([
      [2, 4, 8, 16],
      [32, 64, 128, 256],
      [512, 1024, 2048, 4],
      [8, 16, 16, 2]
    ]);
    expect(canMove(grid)).toBe(true);  // 16, 16 match
  });
});

// ============================================
// WIN CONDITION
// ============================================

describe('Win Condition', () => {
  test('wins with 2048 tile', () => {
    const grid = createTestGrid([
      [2048, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]);
    expect(hasWon(grid)).toBe(true);
  });

  test('wins with tile higher than 2048', () => {
    const grid = createTestGrid([
      [4096, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]);
    expect(hasWon(grid)).toBe(true);
  });

  test('does not win with tiles below 2048', () => {
    const grid = createTestGrid([
      [1024, 1024, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]);
    expect(hasWon(grid)).toBe(false);
  });

  test('does not win with empty grid', () => {
    const grid = createEmptyGrid();
    expect(hasWon(grid)).toBe(false);
  });

  test('wins with 2048 in any position', () => {
    const grid = createTestGrid([
      [2, 4, 8, 16],
      [32, 64, 128, 256],
      [512, 1024, 2048, 4],
      [8, 16, 32, 64]
    ]);
    expect(hasWon(grid)).toBe(true);
  });
});

// ============================================
// COMPLEX SCENARIOS
// ============================================

describe('Complex Scenarios', () => {
  test('multiple rows slide and merge independently', () => {
    const grid = createTestGrid([
      [2, 2, 0, 0],
      [4, 4, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]);
    const result = slideGrid(grid, 'left');
    expect(result.grid[0][0].value).toBe(4);
    expect(result.grid[1][0].value).toBe(8);
    expect(result.score).toBe(12);  // 4 + 8
  });

  test('slide with gaps [0, 2, 0, 2] → [4, 0, 0, 0]', () => {
    const grid = createTestGrid([
      [0, 2, 0, 2],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]);
    const result = slideGrid(grid, 'left');
    expect(result.grid[0][0].value).toBe(4);
    expect(result.grid[0][1].value).toBe(0);
    expect(result.score).toBe(4);
  });

  test('no merge for three in a row [2, 2, 2] → [4, 2, 0]', () => {
    const grid = createTestGrid([
      [2, 2, 2, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]);
    const result = slideGrid(grid, 'left');
    expect(result.grid[0][0].value).toBe(4);
    expect(result.grid[0][1].value).toBe(2);
    expect(result.grid[0][2].value).toBe(0);
    expect(result.score).toBe(4);
  });

  test('large values merge correctly [1024, 1024] → [2048]', () => {
    const grid = createTestGrid([
      [1024, 1024, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]);
    const result = slideGrid(grid, 'left');
    expect(result.grid[0][0].value).toBe(2048);
    expect(result.score).toBe(2048);
    expect(hasWon(result.grid)).toBe(true);
  });

  test('full column slides down correctly', () => {
    const grid = createTestGrid([
      [2, 0, 0, 0],
      [4, 0, 0, 0],
      [8, 0, 0, 0],
      [16, 0, 0, 0]
    ]);
    const result = slideGrid(grid, 'down');
    expect(result.grid[0][0].value).toBe(2);
    expect(result.grid[1][0].value).toBe(4);
    expect(result.grid[2][0].value).toBe(8);
    expect(result.grid[3][0].value).toBe(16);
    expect(result.moved).toBe(false);  // Already at bottom
  });
});
