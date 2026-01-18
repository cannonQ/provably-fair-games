/**
 * Solitaire Game Logic Tests
 *
 * Week 5, Monday-Tuesday: Test Solitaire (Klondike) game logic
 *
 * Tests:
 * - Card colors (red, black, opposite)
 * - Rank values and comparisons
 * - Tableau rules (descending, alternating colors)
 * - Foundation rules (ascending, same suit, Ace start)
 * - Stock/Waste operations
 * - Win conditions and auto-complete
 * - Valid move detection
 */

import {
  isRed,
  isBlack,
  isOppositeColor,
  getRankValue,
  isOneHigher,
  isOneLower,
  canPlaceOnTableau,
  getMovableSequence,
  canPlaceOnFoundation,
  canDrawFromStock,
  canRecycleStock,
  checkWinCondition,
  canAutoComplete,
  hasValidMoves
} from '../gameLogic';

// ============================================
// TEST HELPERS
// ============================================

function createCard(rank, suit, faceUp = true) {
  return { rank, suit, faceUp };
}

// ============================================
// COLOR HELPERS
// ============================================

describe('Card Colors', () => {
  test('hearts are red', () => {
    expect(isRed(createCard('A', 'hearts'))).toBe(true);
  });

  test('diamonds are red', () => {
    expect(isRed(createCard('K', 'diamonds'))).toBe(true);
  });

  test('clubs are black', () => {
    expect(isBlack(createCard('Q', 'clubs'))).toBe(true);
  });

  test('spades are black', () => {
    expect(isBlack(createCard('J', 'spades'))).toBe(true);
  });

  test('hearts are not black', () => {
    expect(isBlack(createCard('10', 'hearts'))).toBe(false);
  });

  test('clubs are not red', () => {
    expect(isRed(createCard('9', 'clubs'))).toBe(false);
  });

  test('red and black are opposite colors', () => {
    const red = createCard('5', 'hearts');
    const black = createCard('4', 'spades');
    expect(isOppositeColor(red, black)).toBe(true);
  });

  test('two reds are not opposite colors', () => {
    const red1 = createCard('5', 'hearts');
    const red2 = createCard('4', 'diamonds');
    expect(isOppositeColor(red1, red2)).toBe(false);
  });

  test('two blacks are not opposite colors', () => {
    const black1 = createCard('5', 'clubs');
    const black2 = createCard('4', 'spades');
    expect(isOppositeColor(black1, black2)).toBe(false);
  });
});

// ============================================
// RANK VALUES
// ============================================

describe('Rank Values', () => {
  test('Ace has value 1', () => {
    expect(getRankValue('A')).toBe(1);
  });

  test('number cards have their numeric values', () => {
    expect(getRankValue('2')).toBe(2);
    expect(getRankValue('3')).toBe(3);
    expect(getRankValue('4')).toBe(4);
    expect(getRankValue('5')).toBe(5);
    expect(getRankValue('6')).toBe(6);
    expect(getRankValue('7')).toBe(7);
    expect(getRankValue('8')).toBe(8);
    expect(getRankValue('9')).toBe(9);
    expect(getRankValue('10')).toBe(10);
  });

  test('face cards have correct values', () => {
    expect(getRankValue('J')).toBe(11);
    expect(getRankValue('Q')).toBe(12);
    expect(getRankValue('K')).toBe(13);
  });

  test('invalid rank returns 0', () => {
    expect(getRankValue('X')).toBe(0);
  });
});

// ============================================
// RANK COMPARISONS
// ============================================

describe('Rank Comparisons', () => {
  test('7 is one higher than 6', () => {
    const seven = createCard('7', 'hearts');
    const six = createCard('6', 'spades');
    expect(isOneHigher(seven, six)).toBe(true);
  });

  test('K is one higher than Q', () => {
    const king = createCard('K', 'hearts');
    const queen = createCard('Q', 'spades');
    expect(isOneHigher(king, queen)).toBe(true);
  });

  test('A is not one higher than K', () => {
    const ace = createCard('A', 'hearts');
    const king = createCard('K', 'spades');
    expect(isOneHigher(ace, king)).toBe(false);
  });

  test('6 is one lower than 7', () => {
    const six = createCard('6', 'hearts');
    const seven = createCard('7', 'spades');
    expect(isOneLower(six, seven)).toBe(true);
  });

  test('Q is one lower than K', () => {
    const queen = createCard('Q', 'hearts');
    const king = createCard('K', 'spades');
    expect(isOneLower(queen, king)).toBe(true);
  });

  test('2 is one higher than A', () => {
    const two = createCard('2', 'hearts');
    const ace = createCard('A', 'spades');
    expect(isOneHigher(two, ace)).toBe(true);
  });
});

// ============================================
// TABLEAU PLACEMENT
// ============================================

describe('Tableau Placement', () => {
  test('King can be placed on empty column', () => {
    const king = createCard('K', 'hearts');
    const emptyColumn = [];
    expect(canPlaceOnTableau(king, emptyColumn)).toBe(true);
  });

  test('Queen cannot be placed on empty column', () => {
    const queen = createCard('Q', 'hearts');
    const emptyColumn = [];
    expect(canPlaceOnTableau(queen, emptyColumn)).toBe(false);
  });

  test('Ace cannot be placed on empty column', () => {
    const ace = createCard('A', 'hearts');
    const emptyColumn = [];
    expect(canPlaceOnTableau(ace, emptyColumn)).toBe(false);
  });

  test('black 6 can be placed on red 7', () => {
    const six = createCard('6', 'spades');
    const column = [createCard('7', 'hearts')];
    expect(canPlaceOnTableau(six, column)).toBe(true);
  });

  test('red 6 can be placed on black 7', () => {
    const six = createCard('6', 'diamonds');
    const column = [createCard('7', 'clubs')];
    expect(canPlaceOnTableau(six, column)).toBe(true);
  });

  test('red 6 cannot be placed on red 7 (same color)', () => {
    const six = createCard('6', 'hearts');
    const column = [createCard('7', 'diamonds')];
    expect(canPlaceOnTableau(six, column)).toBe(false);
  });

  test('black 6 cannot be placed on black 7 (same color)', () => {
    const six = createCard('6', 'clubs');
    const column = [createCard('7', 'spades')];
    expect(canPlaceOnTableau(six, column)).toBe(false);
  });

  test('5 cannot be placed on 7 (not one lower)', () => {
    const five = createCard('5', 'spades');
    const column = [createCard('7', 'hearts')];
    expect(canPlaceOnTableau(five, column)).toBe(false);
  });

  test('7 cannot be placed on 6 (ascending not allowed)', () => {
    const seven = createCard('7', 'spades');
    const column = [createCard('6', 'hearts')];
    expect(canPlaceOnTableau(seven, column)).toBe(false);
  });

  test('card can be placed on multi-card column', () => {
    const six = createCard('6', 'spades');
    const column = [
      createCard('K', 'hearts'),
      createCard('Q', 'clubs'),
      createCard('J', 'diamonds'),
      createCard('10', 'spades'),
      createCard('9', 'hearts'),
      createCard('8', 'clubs'),
      createCard('7', 'diamonds')
    ];
    expect(canPlaceOnTableau(six, column)).toBe(true);
  });
});

// ============================================
// MOVABLE SEQUENCES
// ============================================

describe('Movable Sequences', () => {
  test('single face-up card is movable', () => {
    const column = [createCard('7', 'hearts')];
    const sequence = getMovableSequence(column, 0);
    expect(sequence).not.toBeNull();
    expect(sequence.length).toBe(1);
  });

  test('valid descending alternating sequence is movable', () => {
    const column = [
      createCard('9', 'hearts', true),
      createCard('8', 'clubs', true),
      createCard('7', 'diamonds', true)
    ];
    const sequence = getMovableSequence(column, 0);
    expect(sequence).not.toBeNull();
    expect(sequence.length).toBe(3);
  });

  test('partial sequence from middle is movable', () => {
    const column = [
      createCard('K', 'hearts', true),
      createCard('Q', 'clubs', true),
      createCard('J', 'diamonds', true),
      createCard('10', 'spades', true)
    ];
    const sequence = getMovableSequence(column, 2);
    expect(sequence).not.toBeNull();
    expect(sequence.length).toBe(2);
    expect(sequence[0].rank).toBe('J');
    expect(sequence[1].rank).toBe('10');
  });

  test('face-down card cannot be moved', () => {
    const column = [
      createCard('9', 'hearts', false),
      createCard('8', 'clubs', true)
    ];
    const sequence = getMovableSequence(column, 0);
    expect(sequence).toBeNull();
  });

  test('sequence with face-down card is invalid', () => {
    const column = [
      createCard('9', 'hearts', true),
      createCard('8', 'clubs', false),
      createCard('7', 'diamonds', true)
    ];
    const sequence = getMovableSequence(column, 0);
    expect(sequence).toBeNull();
  });

  test('same color sequence is invalid', () => {
    const column = [
      createCard('9', 'hearts', true),
      createCard('8', 'diamonds', true)  // Both red
    ];
    const sequence = getMovableSequence(column, 0);
    expect(sequence).toBeNull();
  });

  test('non-descending sequence is invalid', () => {
    const column = [
      createCard('9', 'hearts', true),
      createCard('7', 'clubs', true)  // Skip rank 8
    ];
    const sequence = getMovableSequence(column, 0);
    expect(sequence).toBeNull();
  });

  test('ascending sequence is invalid', () => {
    const column = [
      createCard('7', 'hearts', true),
      createCard('8', 'clubs', true)  // Ascending not descending
    ];
    const sequence = getMovableSequence(column, 0);
    expect(sequence).toBeNull();
  });

  test('invalid index returns null', () => {
    const column = [createCard('7', 'hearts', true)];
    expect(getMovableSequence(column, -1)).toBeNull();
    expect(getMovableSequence(column, 10)).toBeNull();
  });
});

// ============================================
// FOUNDATION PLACEMENT
// ============================================

describe('Foundation Placement', () => {
  test('Ace can start foundation pile', () => {
    const ace = createCard('A', 'hearts');
    const foundationPile = [];
    expect(canPlaceOnFoundation(ace, foundationPile, 'hearts')).toBe(true);
  });

  test('non-Ace cannot start foundation pile', () => {
    const two = createCard('2', 'hearts');
    const foundationPile = [];
    expect(canPlaceOnFoundation(two, foundationPile, 'hearts')).toBe(false);
  });

  test('2 can be placed on Ace (same suit)', () => {
    const two = createCard('2', 'hearts');
    const foundationPile = [createCard('A', 'hearts')];
    expect(canPlaceOnFoundation(two, foundationPile, 'hearts')).toBe(true);
  });

  test('3 cannot be placed on Ace (skip rank)', () => {
    const three = createCard('3', 'hearts');
    const foundationPile = [createCard('A', 'hearts')];
    expect(canPlaceOnFoundation(three, foundationPile, 'hearts')).toBe(false);
  });

  test('K can be placed on Q', () => {
    const king = createCard('K', 'hearts');
    const foundationPile = [
      createCard('A', 'hearts'),
      createCard('2', 'hearts'),
      createCard('3', 'hearts'),
      createCard('4', 'hearts'),
      createCard('5', 'hearts'),
      createCard('6', 'hearts'),
      createCard('7', 'hearts'),
      createCard('8', 'hearts'),
      createCard('9', 'hearts'),
      createCard('10', 'hearts'),
      createCard('J', 'hearts'),
      createCard('Q', 'hearts')
    ];
    expect(canPlaceOnFoundation(king, foundationPile, 'hearts')).toBe(true);
  });

  test('wrong suit cannot be placed', () => {
    const twoOfDiamonds = createCard('2', 'diamonds');
    const foundationPile = [createCard('A', 'hearts')];
    expect(canPlaceOnFoundation(twoOfDiamonds, foundationPile, 'hearts')).toBe(false);
  });

  test('cannot place Ace on existing foundation', () => {
    const ace = createCard('A', 'hearts');
    const foundationPile = [createCard('A', 'hearts')];
    expect(canPlaceOnFoundation(ace, foundationPile, 'hearts')).toBe(false);
  });
});

// ============================================
// STOCK AND WASTE
// ============================================

describe('Stock and Waste', () => {
  test('can draw from stock when not empty', () => {
    const stock = [createCard('A', 'hearts'), createCard('2', 'clubs')];
    expect(canDrawFromStock(stock)).toBe(true);
  });

  test('cannot draw from empty stock', () => {
    const stock = [];
    expect(canDrawFromStock(stock)).toBe(false);
  });

  test('can recycle when stock empty and waste not empty', () => {
    const stock = [];
    const waste = [createCard('A', 'hearts'), createCard('2', 'clubs')];
    expect(canRecycleStock(stock, waste)).toBe(true);
  });

  test('cannot recycle when stock not empty', () => {
    const stock = [createCard('A', 'hearts')];
    const waste = [createCard('2', 'clubs')];
    expect(canRecycleStock(stock, waste)).toBe(false);
  });

  test('cannot recycle when waste empty', () => {
    const stock = [];
    const waste = [];
    expect(canRecycleStock(stock, waste)).toBe(false);
  });
});

// ============================================
// WIN CONDITION
// ============================================

describe('Win Condition', () => {
  test('win when all foundations have 13 cards', () => {
    const fullPile = Array.from({ length: 13 }, (_, i) => createCard(`${i + 1}`, 'hearts'));
    const foundations = {
      hearts: fullPile,
      diamonds: fullPile,
      clubs: fullPile,
      spades: fullPile
    };
    expect(checkWinCondition(foundations)).toBe(true);
  });

  test('not win when one foundation incomplete', () => {
    const fullPile = Array.from({ length: 13 }, (_, i) => createCard(`${i + 1}`, 'hearts'));
    const incompletePile = Array.from({ length: 12 }, (_, i) => createCard(`${i + 1}`, 'hearts'));
    const foundations = {
      hearts: fullPile,
      diamonds: fullPile,
      clubs: fullPile,
      spades: incompletePile
    };
    expect(checkWinCondition(foundations)).toBe(false);
  });

  test('not win when all foundations empty', () => {
    const foundations = {
      hearts: [],
      diamonds: [],
      clubs: [],
      spades: []
    };
    expect(checkWinCondition(foundations)).toBe(false);
  });
});

// ============================================
// AUTO-COMPLETE
// ============================================

describe('Auto-Complete', () => {
  test('can auto-complete when all tableau cards face-up', () => {
    const state = {
      tableau: [
        [createCard('K', 'hearts', true), createCard('Q', 'clubs', true)],
        [createCard('J', 'diamonds', true)],
        [],
        [createCard('10', 'spades', true)],
        [],
        [],
        []
      ]
    };
    expect(canAutoComplete(state)).toBe(true);
  });

  test('cannot auto-complete with face-down cards', () => {
    const state = {
      tableau: [
        [createCard('K', 'hearts', false), createCard('Q', 'clubs', true)],
        [createCard('J', 'diamonds', true)],
        [],
        [createCard('10', 'spades', true)],
        [],
        [],
        []
      ]
    };
    expect(canAutoComplete(state)).toBe(false);
  });

  test('can auto-complete with empty tableau columns', () => {
    const state = {
      tableau: [
        [createCard('K', 'hearts', true)],
        [],
        [],
        [],
        [],
        [],
        []
      ]
    };
    expect(canAutoComplete(state)).toBe(true);
  });
});

// ============================================
// VALID MOVES DETECTION
// ============================================

describe('Valid Moves Detection', () => {
  test('has valid moves when stock not empty', () => {
    const state = {
      stock: [createCard('A', 'hearts')],
      waste: [],
      tableau: [[], [], [], [], [], [], []],
      foundations: { hearts: [], diamonds: [], clubs: [], spades: [] }
    };
    expect(hasValidMoves(state)).toBe(true);
  });

  test('has valid moves when can recycle', () => {
    const state = {
      stock: [],
      waste: [createCard('A', 'hearts')],
      tableau: [[], [], [], [], [], [], []],
      foundations: { hearts: [], diamonds: [], clubs: [], spades: [] }
    };
    expect(hasValidMoves(state)).toBe(true);
  });

  test('has valid moves when waste card can move to foundation', () => {
    const state = {
      stock: [],
      waste: [createCard('A', 'hearts')],
      tableau: [[], [], [], [], [], [], []],
      foundations: { hearts: [], diamonds: [], clubs: [], spades: [] }
    };
    expect(hasValidMoves(state)).toBe(true);
  });
});
