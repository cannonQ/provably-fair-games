/**
 * test-logic.js - Test Garbage Game Logic
 * 
 * Run with: node src/games/garbage/test-logic.js
 * 
 * Tests all game logic functions:
 * - Card parsing
 * - Placement rules
 * - Wild cards (Jacks)
 * - Garbage cards (Q/K)
 * - Win condition
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
} from './game-logic.js';

import { createDeck } from '../../blockchain/shuffle.js';

let passed = 0;
let failed = 0;

function test(name, condition) {
  if (condition) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name}`);
    failed++;
  }
}

function testParseCard() {
  console.log('\n📝 Test 1: Parse Card');
  
  const ace = parseCard('A♠');
  test('Ace of Spades: rank=A', ace.rank === 'A');
  test('Ace of Spades: suit=♠', ace.suit === '♠');
  test('Ace of Spades: value=1', ace.value === 1);
  
  const ten = parseCard('10♥');
  test('10 of Hearts: rank=10', ten.rank === '10');
  test('10 of Hearts: value=10', ten.value === 10);
  
  const jack = parseCard('J♣');
  test('Jack: value=11 (wild)', jack.value === 11);
  
  const queen = parseCard('Q♦');
  test('Queen: value=0 (garbage)', queen.value === 0);
}

function testCardTypes() {
  console.log('\n🃏 Test 2: Card Types');
  
  test('Queen is garbage', isGarbage('Q♠'));
  test('King is garbage', isGarbage('K♥'));
  test('5 is NOT garbage', !isGarbage('5♦'));
  test('Jack is NOT garbage', !isGarbage('J♣'));
  
  test('Jack is wild', isWild('J♠'));
  test('Jack of Hearts is wild', isWild('J♥'));
  test('King is NOT wild', !isWild('K♦'));
  test('Ace is NOT wild', !isWild('A♣'));
}

function testPlacement() {
  console.log('\n📍 Test 3: Card Placement');
  
  // Empty board
  const emptyBoard = new Array(10).fill(null);
  
  test('5 can go in position 5 (empty)', canPlaceCard('5♠', 5, emptyBoard));
  test('5 cannot go in position 3', !canPlaceCard('5♠', 3, emptyBoard));
  test('Ace can go in position 1', canPlaceCard('A♥', 1, emptyBoard));
  test('10 can go in position 10', canPlaceCard('10♦', 10, emptyBoard));
  
  // Jack (wild) placement
  test('Jack can go in position 1', canPlaceCard('J♣', 1, emptyBoard));
  test('Jack can go in position 7', canPlaceCard('J♣', 7, emptyBoard));
  test('Jack can go in position 10', canPlaceCard('J♣', 10, emptyBoard));
  
  // Garbage cannot be placed
  test('Queen cannot be placed anywhere', !canPlaceCard('Q♠', 5, emptyBoard));
  test('King cannot be placed anywhere', !canPlaceCard('K♥', 1, emptyBoard));
  
  // Filled position
  const partialBoard = [null, '2♠', null, null, null, null, null, null, null, null];
  test('Cannot place in filled position', !canPlaceCard('2♥', 2, partialBoard));
  test('Jack cannot go in filled position', !canPlaceCard('J♦', 2, partialBoard));
}

function testPositionFilled() {
  console.log('\n🔍 Test 4: Position Detection');
  
  const board = ['A♠', null, '3♦', null, null, '6♣', null, null, null, '10♥'];
  
  test('Position 1 is filled', isPositionFilled(board, 1));
  test('Position 2 is empty', !isPositionFilled(board, 2));
  test('Position 3 is filled', isPositionFilled(board, 3));
  test('Position 10 is filled', isPositionFilled(board, 10));
  test('Position 5 is empty', !isPositionFilled(board, 5));
  
  const count = countFilledPositions(board);
  test('Count filled = 4', count === 4);
}

function testValidPositions() {
  console.log('\n🎯 Test 5: Valid Positions');
  
  const board = ['A♠', null, null, '4♦', null, null, null, null, null, null];
  
  const pos5 = getValidPositions('5♥', board);
  test('5 has one valid position: [5]', pos5.length === 1 && pos5[0] === 5);
  
  const posJack = getValidPositions('J♠', board);
  test('Jack has 8 valid positions (2 filled)', posJack.length === 8);
  test('Jack positions exclude 1 and 4', !posJack.includes(1) && !posJack.includes(4));
  
  const posQueen = getValidPositions('Q♦', board);
  test('Queen has 0 valid positions', posQueen.length === 0);
  
  // Card that can't be placed (position already filled)
  const filledBoard = ['A♠', '2♥', '3♦', '4♣', '5♠', '6♥', '7♦', '8♣', '9♠', '10♥'];
  const pos3 = getValidPositions('3♣', filledBoard);
  test('3 has no valid position (slot filled)', pos3.length === 0);
}

function testWinCondition() {
  console.log('\n🏆 Test 6: Win Condition');
  
  const winningBoard = ['A♠', '2♥', '3♦', '4♣', '5♠', '6♥', '7♦', '8♣', '9♠', '10♥'];
  test('Full board = WIN', checkWin(winningBoard));
  
  const almostWin = ['A♠', '2♥', '3♦', '4♣', '5♠', '6♥', '7♦', '8♣', '9♠', null];
  test('One empty = NOT win', !checkWin(almostWin));
  
  const emptyBoard = new Array(10).fill(null);
  test('Empty board = NOT win', !checkWin(emptyBoard));
  
  const jackWin = ['J♠', 'J♥', 'J♦', 'J♣', '5♠', '6♥', '7♦', '8♣', '9♠', '10♥'];
  test('Board with Jacks = WIN', checkWin(jackWin));
}

function testDealCards() {
  console.log('\n🎴 Test 7: Deal Initial Cards');
  
  const deck = createDeck();
  const dealt = dealInitialCards(deck);
  
  test('Player cards array length = 10', dealt.playerCards.length === 10);
  test('AI cards array length = 10', dealt.aiCards.length === 10);
  test('Player hidden length = 10', dealt.playerHidden.length === 10);
  test('AI hidden length = 10', dealt.aiHidden.length === 10);
  test('Draw pile has 32 cards', dealt.drawPile.length === 32);
  test('Discard pile is empty', dealt.discardPile.length === 0);
  
  test('Player cards start null (face-down)', dealt.playerCards.every(c => c === null));
  test('Hidden cards are actual cards', dealt.playerHidden.every(c => c !== null));
}

// Run all tests
console.log('🎮 Testing Garbage Game Logic...');
console.log('═'.repeat(50));

testParseCard();
testCardTypes();
testPlacement();
testPositionFilled();
testValidPositions();
testWinCondition();
testDealCards();

// Summary
console.log('\n' + '═'.repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('═'.repeat(50));

if (failed === 0) {
  console.log('\n✅ All game logic tests passed!\n');
} else {
  console.log('\n❌ Some tests failed. Check output above.\n');
  process.exit(1);
}
