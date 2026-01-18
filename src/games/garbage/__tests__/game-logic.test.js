/**
 * Garbage Card Game Logic Tests
 *
 * Week 5: Test Garbage game logic
 *
 * Tests:
 * - Card parsing (rank, suit, value extraction)
 * - Card values (1-10, Jack=11/wild, Q/K=0/garbage)
 * - Garbage detection (Queens and Kings)
 * - Wild card detection (Jacks)
 * - Position filling checks
 * - Card placement rules (match position, wild anywhere, garbage nowhere)
 * - Win condition (all 10 positions filled)
 * - Initial card dealing
 * - Valid position detection
 * - Filled position counting
 */

import {
  parseCard,
  getCardValue,
  isGarbage,
  isWild,
  isPositionFilled,
  canPlaceCard,
  checkWin,
  dealInitialCards,
  getValidPositions,
  countFilledPositions
} from '../game-logic';

// ============================================
// CARD PARSING
// ============================================

describe('Card Parsing', () => {
  test('parses Ace correctly', () => {
    const card = parseCard('A♠');
    expect(card.rank).toBe('A');
    expect(card.suit).toBe('♠');
    expect(card.value).toBe(1);
  });

  test('parses number cards correctly', () => {
    const two = parseCard('2♥');
    expect(two.rank).toBe('2');
    expect(two.suit).toBe('♥');
    expect(two.value).toBe(2);

    const nine = parseCard('9♦');
    expect(nine.rank).toBe('9');
    expect(nine.suit).toBe('♦');
    expect(nine.value).toBe(9);
  });

  test('parses 10 correctly (two-character rank)', () => {
    const ten = parseCard('10♣');
    expect(ten.rank).toBe('10');
    expect(ten.suit).toBe('♣');
    expect(ten.value).toBe(10);
  });

  test('parses Jack as wild (value 11)', () => {
    const jack = parseCard('J♠');
    expect(jack.rank).toBe('J');
    expect(jack.suit).toBe('♠');
    expect(jack.value).toBe(11);
  });

  test('parses Queen as garbage (value 0)', () => {
    const queen = parseCard('Q♥');
    expect(queen.rank).toBe('Q');
    expect(queen.suit).toBe('♥');
    expect(queen.value).toBe(0);
  });

  test('parses King as garbage (value 0)', () => {
    const king = parseCard('K♦');
    expect(king.rank).toBe('K');
    expect(king.suit).toBe('♦');
    expect(king.value).toBe(0);
  });

  test('handles null input', () => {
    expect(parseCard(null)).toBe(null);
  });

  test('handles undefined input', () => {
    expect(parseCard(undefined)).toBe(null);
  });

  test('handles non-string input', () => {
    expect(parseCard(123)).toBe(null);
  });
});

// ============================================
// CARD VALUES
// ============================================

describe('Card Values', () => {
  test('Ace has value 1', () => {
    expect(getCardValue('A♠')).toBe(1);
  });

  test('number cards have their numeric values', () => {
    expect(getCardValue('2♥')).toBe(2);
    expect(getCardValue('3♦')).toBe(3);
    expect(getCardValue('4♣')).toBe(4);
    expect(getCardValue('5♠')).toBe(5);
    expect(getCardValue('6♥')).toBe(6);
    expect(getCardValue('7♦')).toBe(7);
    expect(getCardValue('8♣')).toBe(8);
    expect(getCardValue('9♠')).toBe(9);
    expect(getCardValue('10♥')).toBe(10);
  });

  test('Jack has value 11 (wild)', () => {
    expect(getCardValue('J♦')).toBe(11);
  });

  test('Queen has value 0 (garbage)', () => {
    expect(getCardValue('Q♣')).toBe(0);
  });

  test('King has value 0 (garbage)', () => {
    expect(getCardValue('K♠')).toBe(0);
  });

  test('works with parsed card objects', () => {
    const card = { rank: '5', suit: '♥', value: 5 };
    expect(getCardValue(card)).toBe(5);
  });

  test('returns 0 for null', () => {
    expect(getCardValue(null)).toBe(0);
  });

  test('returns 0 for undefined', () => {
    expect(getCardValue(undefined)).toBe(0);
  });
});

// ============================================
// GARBAGE DETECTION
// ============================================

describe('Garbage Detection', () => {
  test('Queen is garbage', () => {
    expect(isGarbage('Q♠')).toBe(true);
    expect(isGarbage('Q♥')).toBe(true);
    expect(isGarbage('Q♦')).toBe(true);
    expect(isGarbage('Q♣')).toBe(true);
  });

  test('King is garbage', () => {
    expect(isGarbage('K♠')).toBe(true);
    expect(isGarbage('K♥')).toBe(true);
    expect(isGarbage('K♦')).toBe(true);
    expect(isGarbage('K♣')).toBe(true);
  });

  test('regular cards are not garbage', () => {
    expect(isGarbage('A♠')).toBe(false);
    expect(isGarbage('5♥')).toBe(false);
    expect(isGarbage('10♦')).toBe(false);
  });

  test('Jack is not garbage (it is wild)', () => {
    expect(isGarbage('J♣')).toBe(false);
  });

  test('works with parsed card objects', () => {
    const queen = { rank: 'Q', suit: '♥', value: 0 };
    expect(isGarbage(queen)).toBe(true);

    const ace = { rank: 'A', suit: '♠', value: 1 };
    expect(isGarbage(ace)).toBe(false);
  });
});

// ============================================
// WILD DETECTION
// ============================================

describe('Wild Detection', () => {
  test('Jack is wild', () => {
    expect(isWild('J♠')).toBe(true);
    expect(isWild('J♥')).toBe(true);
    expect(isWild('J♦')).toBe(true);
    expect(isWild('J♣')).toBe(true);
  });

  test('regular cards are not wild', () => {
    expect(isWild('A♠')).toBe(false);
    expect(isWild('5♥')).toBe(false);
    expect(isWild('10♦')).toBe(false);
  });

  test('Queen and King are not wild', () => {
    expect(isWild('Q♣')).toBe(false);
    expect(isWild('K♠')).toBe(false);
  });

  test('works with parsed card objects', () => {
    const jack = { rank: 'J', suit: '♥', value: 11 };
    expect(isWild(jack)).toBe(true);

    const king = { rank: 'K', suit: '♠', value: 0 };
    expect(isWild(king)).toBe(false);
  });
});

// ============================================
// POSITION FILLING
// ============================================

describe('Position Filling', () => {
  test('position is filled when card present', () => {
    const cards = [null, '2♠', null, null, null, null, null, null, null, null];
    expect(isPositionFilled(cards, 2)).toBe(true);
  });

  test('position is not filled when null', () => {
    const cards = [null, null, null, null, null, null, null, null, null, null];
    expect(isPositionFilled(cards, 1)).toBe(false);
    expect(isPositionFilled(cards, 5)).toBe(false);
    expect(isPositionFilled(cards, 10)).toBe(false);
  });

  test('position is not filled when undefined', () => {
    const cards = [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined];
    expect(isPositionFilled(cards, 1)).toBe(false);
  });

  test('all positions can be checked', () => {
    const cards = ['A♠', '2♥', '3♦', '4♣', '5♠', '6♥', '7♦', '8♣', '9♠', '10♥'];
    for (let i = 1; i <= 10; i++) {
      expect(isPositionFilled(cards, i)).toBe(true);
    }
  });

  test('mixed filled/empty positions', () => {
    const cards = ['A♠', null, '3♦', null, '5♠', null, null, '8♣', null, '10♥'];
    expect(isPositionFilled(cards, 1)).toBe(true);
    expect(isPositionFilled(cards, 2)).toBe(false);
    expect(isPositionFilled(cards, 3)).toBe(true);
    expect(isPositionFilled(cards, 4)).toBe(false);
    expect(isPositionFilled(cards, 5)).toBe(true);
  });
});

// ============================================
// CARD PLACEMENT RULES
// ============================================

describe('Card Placement', () => {
  test('card can be placed in matching empty position', () => {
    const cards = new Array(10).fill(null);
    expect(canPlaceCard('5♠', 5, cards)).toBe(true);
    expect(canPlaceCard('A♥', 1, cards)).toBe(true);
    expect(canPlaceCard('10♦', 10, cards)).toBe(true);
  });

  test('card cannot be placed in non-matching position', () => {
    const cards = new Array(10).fill(null);
    expect(canPlaceCard('5♠', 3, cards)).toBe(false);
    expect(canPlaceCard('A♥', 10, cards)).toBe(false);
  });

  test('card cannot be placed in filled position', () => {
    const cards = [null, null, null, null, '5♦', null, null, null, null, null];
    expect(canPlaceCard('5♠', 5, cards)).toBe(false);
  });

  test('Jack (wild) can be placed in any empty position', () => {
    const cards = new Array(10).fill(null);
    expect(canPlaceCard('J♠', 1, cards)).toBe(true);
    expect(canPlaceCard('J♥', 5, cards)).toBe(true);
    expect(canPlaceCard('J♦', 10, cards)).toBe(true);
  });

  test('Jack cannot be placed in filled position', () => {
    const cards = [null, null, null, null, '5♦', null, null, null, null, null];
    expect(canPlaceCard('J♠', 5, cards)).toBe(false);
  });

  test('garbage cards (Q/K) cannot be placed anywhere', () => {
    const cards = new Array(10).fill(null);
    expect(canPlaceCard('Q♠', 1, cards)).toBe(false);
    expect(canPlaceCard('Q♥', 5, cards)).toBe(false);
    expect(canPlaceCard('K♦', 1, cards)).toBe(false);
    expect(canPlaceCard('K♣', 10, cards)).toBe(false);
  });

  test('invalid position returns false', () => {
    const cards = new Array(10).fill(null);
    expect(canPlaceCard('5♠', 0, cards)).toBe(false);
    expect(canPlaceCard('5♠', 11, cards)).toBe(false);
    expect(canPlaceCard('5♠', -1, cards)).toBe(false);
  });

  test('all number cards in correct positions', () => {
    const cards = new Array(10).fill(null);
    expect(canPlaceCard('A♠', 1, cards)).toBe(true);
    expect(canPlaceCard('2♥', 2, cards)).toBe(true);
    expect(canPlaceCard('3♦', 3, cards)).toBe(true);
    expect(canPlaceCard('4♣', 4, cards)).toBe(true);
    expect(canPlaceCard('5♠', 5, cards)).toBe(true);
    expect(canPlaceCard('6♥', 6, cards)).toBe(true);
    expect(canPlaceCard('7♦', 7, cards)).toBe(true);
    expect(canPlaceCard('8♣', 8, cards)).toBe(true);
    expect(canPlaceCard('9♠', 9, cards)).toBe(true);
    expect(canPlaceCard('10♥', 10, cards)).toBe(true);
  });
});

// ============================================
// WIN CONDITION
// ============================================

describe('Win Condition', () => {
  test('wins when all 10 positions filled', () => {
    const cards = ['A♠', '2♥', '3♦', '4♣', '5♠', '6♥', '7♦', '8♣', '9♠', '10♥'];
    expect(checkWin(cards)).toBe(true);
  });

  test('does not win with empty positions', () => {
    const cards = ['A♠', null, '3♦', null, '5♠', null, null, '8♣', null, '10♥'];
    expect(checkWin(cards)).toBe(false);
  });

  test('does not win with one empty position', () => {
    const cards = ['A♠', '2♥', '3♦', '4♣', '5♠', '6♥', '7♦', '8♣', '9♠', null];
    expect(checkWin(cards)).toBe(false);
  });

  test('does not win with all empty positions', () => {
    const cards = new Array(10).fill(null);
    expect(checkWin(cards)).toBe(false);
  });

  test('does not win with invalid array length', () => {
    const cards = ['A♠', '2♥', '3♦'];  // Only 3 cards
    expect(checkWin(cards)).toBe(false);
  });

  test('does not win with non-array input', () => {
    expect(checkWin(null)).toBe(false);
    expect(checkWin(undefined)).toBe(false);
    expect(checkWin('not an array')).toBe(false);
  });
});

// ============================================
// INITIAL DEALING
// ============================================

describe('Initial Card Dealing', () => {
  test('deals correct number of cards', () => {
    const deck = Array.from({ length: 52 }, (_, i) => `${i + 1}♠`);
    const result = dealInitialCards(deck);

    expect(result.playerCards.length).toBe(10);
    expect(result.aiCards.length).toBe(10);
    expect(result.playerHidden.length).toBe(10);
    expect(result.aiHidden.length).toBe(10);
  });

  test('cards start face-down (null)', () => {
    const deck = Array.from({ length: 52 }, (_, i) => `${i + 1}♠`);
    const result = dealInitialCards(deck);

    expect(result.playerCards.every(c => c === null)).toBe(true);
    expect(result.aiCards.every(c => c === null)).toBe(true);
  });

  test('draw pile has remaining cards', () => {
    const deck = Array.from({ length: 52 }, (_, i) => `${i + 1}♠`);
    const result = dealInitialCards(deck);

    expect(result.drawPile.length).toBe(32);  // 52 - 10 - 10 = 32
  });

  test('discard pile starts empty', () => {
    const deck = Array.from({ length: 52 }, (_, i) => `${i + 1}♠`);
    const result = dealInitialCards(deck);

    expect(result.discardPile.length).toBe(0);
  });

  test('throws error with insufficient cards', () => {
    const shortDeck = Array.from({ length: 15 }, (_, i) => `${i + 1}♠`);
    expect(() => dealInitialCards(shortDeck)).toThrow('Invalid deck');
  });

  test('throws error with null deck', () => {
    expect(() => dealInitialCards(null)).toThrow('Invalid deck');
  });

  test('deals different cards to each player', () => {
    const deck = ['A♠', '2♥', '3♦', '4♣', '5♠', '6♥', '7♦', '8♣', '9♠', '10♥',
                  'J♠', 'Q♥', 'K♦', 'A♣', '2♠', '3♥', '4♦', '5♣', '6♠', '7♥',
                  '8♦', '9♣', '10♠'];
    const result = dealInitialCards(deck);

    expect(result.playerHidden[0]).toBe('A♠');
    expect(result.playerHidden[9]).toBe('10♥');
    expect(result.aiHidden[0]).toBe('J♠');
    expect(result.aiHidden[9]).toBe('7♥');
  });
});

// ============================================
// VALID POSITIONS
// ============================================

describe('Valid Positions', () => {
  test('regular card has one valid position (if empty)', () => {
    const cards = new Array(10).fill(null);
    expect(getValidPositions('5♠', cards)).toEqual([5]);
    expect(getValidPositions('A♥', cards)).toEqual([1]);
    expect(getValidPositions('10♦', cards)).toEqual([10]);
  });

  test('regular card has no valid positions if position filled', () => {
    const cards = [null, null, null, null, '5♦', null, null, null, null, null];
    expect(getValidPositions('5♠', cards)).toEqual([]);
  });

  test('Jack can go in all empty positions', () => {
    const cards = new Array(10).fill(null);
    const positions = getValidPositions('J♠', cards);
    expect(positions).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  test('Jack can only go in unfilled positions', () => {
    const cards = ['A♠', null, '3♦', null, null, null, null, null, null, '10♥'];
    const positions = getValidPositions('J♠', cards);
    expect(positions).toEqual([2, 4, 5, 6, 7, 8, 9]);
  });

  test('garbage cards have no valid positions', () => {
    const cards = new Array(10).fill(null);
    expect(getValidPositions('Q♠', cards)).toEqual([]);
    expect(getValidPositions('K♥', cards)).toEqual([]);
  });

  test('partially filled board', () => {
    const cards = ['A♠', '2♥', null, '4♣', null, null, '7♦', null, null, null];
    expect(getValidPositions('3♠', cards)).toEqual([3]);
    expect(getValidPositions('5♥', cards)).toEqual([5]);
    expect(getValidPositions('J♦', cards)).toEqual([3, 5, 6, 8, 9, 10]);
    expect(getValidPositions('2♠', cards)).toEqual([]);  // Position 2 filled
  });
});

// ============================================
// FILLED POSITION COUNTING
// ============================================

describe('Filled Position Counting', () => {
  test('counts zero filled positions', () => {
    const cards = new Array(10).fill(null);
    expect(countFilledPositions(cards)).toBe(0);
  });

  test('counts all filled positions', () => {
    const cards = ['A♠', '2♥', '3♦', '4♣', '5♠', '6♥', '7♦', '8♣', '9♠', '10♥'];
    expect(countFilledPositions(cards)).toBe(10);
  });

  test('counts partially filled positions', () => {
    const cards = ['A♠', null, '3♦', null, '5♠', null, null, '8♣', null, '10♥'];
    expect(countFilledPositions(cards)).toBe(5);
  });

  test('counts one filled position', () => {
    const cards = [null, null, null, null, '5♠', null, null, null, null, null];
    expect(countFilledPositions(cards)).toBe(1);
  });

  test('counts nine filled positions', () => {
    const cards = ['A♠', '2♥', '3♦', '4♣', '5♠', '6♥', '7♦', '8♣', '9♠', null];
    expect(countFilledPositions(cards)).toBe(9);
  });

  test('handles undefined values', () => {
    const cards = ['A♠', undefined, '3♦', undefined, '5♠', undefined, undefined, '8♣', undefined, '10♥'];
    expect(countFilledPositions(cards)).toBe(5);
  });
});
