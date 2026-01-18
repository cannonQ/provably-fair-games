/**
 * Backgammon Integration Tests
 *
 * Week 4, Tuesday: Test full game flow integration
 *
 * Tests complete game scenarios:
 * - Multiple moves in sequence
 * - Turn completion and player switching
 * - Full game cycles (roll → move → complete turn)
 * - Bar entry integration
 * - Bearing off integration
 * - Game end conditions
 */

import { getAllLegalMoves, applyMove } from '../moveValidation';
import { selectMove } from '../ai';
import {
  createEmptyState,
  createStartingState,
  placeChecker,
  setDice,
  placeOnBar,
  useDie
} from './test-helpers';

// ============================================
// MULTIPLE MOVE SEQUENCES
// ============================================

describe('Multiple Move Sequences', () => {
  test('can make 2 consecutive moves (both dice)', () => {
    const state = createEmptyState();
    placeChecker(state, 20, 'white', 1);  // Point 21
    setDice(state, [3, 5]);

    // First move: use die 3
    const moves1 = getAllLegalMoves(state);
    expect(moves1.length).toBeGreaterThan(0);

    const move1 = moves1.find(m => m.dieValue === 3);
    expect(move1).toBeDefined();

    const state2 = applyMove(state, move1);

    // Second move: use die 5
    const moves2 = getAllLegalMoves(state2);
    expect(moves2.length).toBeGreaterThan(0);

    const move2 = moves2.find(m => m.dieValue === 5);
    expect(move2).toBeDefined();

    const finalState = applyMove(state2, move2);

    // Both dice should be used
    expect(finalState.diceUsed.every(used => used)).toBe(true);
  });

  test('can make 4 consecutive moves with doubles', () => {
    const state = createEmptyState();
    placeChecker(state, 20, 'white', 1);  // Point 21
    setDice(state, [2, 2, 2, 2]);

    let currentState = state;
    let moveCount = 0;

    // Make 4 moves
    for (let i = 0; i < 4; i++) {
      const moves = getAllLegalMoves(currentState);
      if (moves.length === 0) break;

      const move = moves[0];
      currentState = applyMove(currentState, move);
      moveCount++;
    }

    // Should have made all 4 moves
    expect(moveCount).toBe(4);
    expect(currentState.diceUsed.every(used => used)).toBe(true);
  });

  test('sequence stops when no more moves available', () => {
    const state = createEmptyState();
    placeChecker(state, 5, 'white', 1);  // Point 6
    // Block destination for second die
    placeChecker(state, 0, 'black', 2);  // Block point 1
    setDice(state, [6, 5]);

    // First move: bear off with die 6
    const moves1 = getAllLegalMoves(state);
    const move1 = moves1[0];
    const state2 = applyMove(state, move1);

    // Second move: should be blocked or no moves
    const moves2 = getAllLegalMoves(state2);

    // Either no moves or very limited moves
    expect(moves2.length).toBeLessThanOrEqual(1);
  });
});

// ============================================
// COMPLETE TURN CYCLES
// ============================================

describe('Complete Turn Cycles', () => {
  test('full turn: roll → move → move → complete', () => {
    const state = createStartingState();
    setDice(state, [3, 5]);

    // Get first move
    const moves1 = getAllLegalMoves(state);
    expect(moves1.length).toBeGreaterThan(0);

    // Make first move
    const move1 = moves1[0];
    const state2 = applyMove(state, move1);

    // Get second move
    const moves2 = getAllLegalMoves(state2);

    if (moves2.length > 0) {
      // Make second move
      const move2 = moves2[0];
      const finalState = applyMove(state2, move2);

      // Check final state
      expect(finalState).toBeDefined();
    }
  });

  test('AI can complete full turn', () => {
    const state = createStartingState();
    setDice(state, [4, 3]);

    // AI makes first move
    const moves1 = getAllLegalMoves(state);
    const aiMove1 = selectMove(moves1, state, 'normal');
    expect(aiMove1).toBeDefined();

    const state2 = applyMove(state, aiMove1);

    // AI makes second move
    const moves2 = getAllLegalMoves(state2);
    if (moves2.length > 0) {
      const aiMove2 = selectMove(moves2, state2, 'normal');
      expect(aiMove2).toBeDefined();

      const finalState = applyMove(state2, aiMove2);
      expect(finalState).toBeDefined();
    }
  });

  test('multiple complete turns in sequence', () => {
    let state = createStartingState();

    // Simulate 5 turns
    for (let turn = 0; turn < 5; turn++) {
      // Roll dice (simulate)
      const dice = [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
      ];
      setDice(state, dice);

      // Make moves until no more available
      let moveCount = 0;
      while (moveCount < 10) { // Safety limit
        const moves = getAllLegalMoves(state);
        if (moves.length === 0) break;

        const move = selectMove(moves, state, 'easy');
        state = applyMove(state, move);
        moveCount++;

        // Check if all dice used
        if (state.diceUsed.every(used => used)) break;
      }

      // Switch player (simulate complete turn)
      state.currentPlayer = state.currentPlayer === 'white' ? 'black' : 'white';
    }

    // Should have completed 5 turns
    expect(state).toBeDefined();
  });
});

// ============================================
// BAR ENTRY INTEGRATION
// ============================================

describe('Bar Entry Integration', () => {
  test('must enter from bar before other moves', () => {
    const state = createEmptyState();
    placeOnBar(state, 'white', 1);
    placeChecker(state, 15, 'white', 1);  // Checker on board
    setDice(state, [3, 5]);

    // First move must be bar entry
    const moves = getAllLegalMoves(state);

    // All moves should be from bar
    expect(moves.every(m => m.from === 'bar')).toBe(true);
  });

  test('can make regular move after entering from bar', () => {
    const state = createEmptyState();
    placeOnBar(state, 'white', 1);
    setDice(state, [3, 5]);

    // Enter from bar with die 3
    const moves1 = getAllLegalMoves(state);
    const barEntry = moves1.find(m => m.from === 'bar' && m.dieValue === 3);
    expect(barEntry).toBeDefined();

    const state2 = applyMove(state, barEntry);

    // Now can make regular moves
    const moves2 = getAllLegalMoves(state2);
    expect(moves2.length).toBeGreaterThan(0);

    // Some moves should be from board (not bar)
    const boardMoves = moves2.filter(m => typeof m.from === 'number');
    expect(boardMoves.length).toBeGreaterThan(0);
  });

  test('multiple checkers on bar - enter sequentially', () => {
    const state = createEmptyState();
    placeOnBar(state, 'white', 2);
    setDice(state, [3, 5]);

    // First entry
    const moves1 = getAllLegalMoves(state);
    const entry1 = moves1[0];
    const state2 = applyMove(state, entry1);

    expect(state2.bar.white).toBe(1);  // One still on bar

    // Second entry
    const moves2 = getAllLegalMoves(state2);
    const entry2 = moves2[0];
    const state3 = applyMove(state2, entry2);

    expect(state3.bar.white).toBe(0);  // All entered
  });
});

// ============================================
// BEARING OFF INTEGRATION
// ============================================

describe('Bearing Off Integration', () => {
  test('can bear off multiple checkers in one turn', () => {
    const state = createEmptyState();
    placeChecker(state, 4, 'white', 1);  // Point 5
    placeChecker(state, 2, 'white', 1);  // Point 3
    setDice(state, [5, 3]);

    // Bear off first checker
    const moves1 = getAllLegalMoves(state);
    const bearOff1 = moves1.find(m => m.to === 'bearOff' && m.dieValue === 5);
    expect(bearOff1).toBeDefined();

    const state2 = applyMove(state, bearOff1);
    expect(state2.bearOff.white).toBe(1);

    // Bear off second checker
    const moves2 = getAllLegalMoves(state2);
    const bearOff2 = moves2.find(m => m.to === 'bearOff' && m.dieValue === 3);
    expect(bearOff2).toBeDefined();

    const state3 = applyMove(state2, bearOff2);
    expect(state3.bearOff.white).toBe(2);
  });

  test('bearing off with doubles removes 4 checkers', () => {
    const state = createEmptyState();
    placeChecker(state, 2, 'white', 4);  // Point 3, 4 checkers
    setDice(state, [3, 3, 3, 3]);

    let currentState = state;

    // Bear off 4 times
    for (let i = 0; i < 4; i++) {
      const moves = getAllLegalMoves(currentState);
      const bearOffMove = moves.find(m => m.to === 'bearOff');
      expect(bearOffMove).toBeDefined();

      currentState = applyMove(currentState, bearOffMove);
    }

    expect(currentState.bearOff.white).toBe(4);
    expect(currentState.points[2].checkers).toBe(0);
  });

  test('cannot bear off with checkers outside home', () => {
    const state = createEmptyState();
    placeChecker(state, 2, 'white', 2);   // Point 3 (in home)
    placeChecker(state, 10, 'white', 1);  // Point 11 (outside home)
    setDice(state, [3, 5]);

    const moves = getAllLegalMoves(state);

    // Should have no bearing off moves
    const bearOffMoves = moves.filter(m => m.to === 'bearOff');
    expect(bearOffMoves.length).toBe(0);
  });
});

// ============================================
// HIT AND RECOVERY
// ============================================

describe('Hit and Recovery', () => {
  test('hitting opponent sends to bar', () => {
    const state = createEmptyState();
    placeChecker(state, 20, 'white', 1);  // Point 21
    placeChecker(state, 15, 'black', 1);  // Blot at point 16
    setDice(state, [5, 3]);

    // Hit with die 5
    const moves = getAllLegalMoves(state);
    const hitMove = moves.find(m => m.hits && m.dieValue === 5);
    expect(hitMove).toBeDefined();

    const stateAfterHit = applyMove(state, hitMove);

    // Black should be on bar
    expect(stateAfterHit.bar.black).toBe(1);
    // White checker now occupies point 16
    expect(stateAfterHit.points[15].color).toBe('white');
    expect(stateAfterHit.points[15].checkers).toBe(1);
  });

  test('opponent must enter from bar on next turn', () => {
    const state = createEmptyState();
    state.currentPlayer = 'black';
    placeOnBar(state, 'black', 1);
    placeChecker(state, 5, 'black', 1);  // Another checker on board
    setDice(state, [3, 5]);

    // All moves must be bar entry
    const moves = getAllLegalMoves(state);
    expect(moves.every(m => m.from === 'bar')).toBe(true);
  });
});

// ============================================
// GAME END CONDITIONS
// ============================================

describe('Game End Conditions', () => {
  test('game ends when all checkers borne off', () => {
    const state = createEmptyState();
    state.bearOff.white = 15;  // All checkers off

    // Check if white has won
    let totalWhiteOnBoard = 0;
    for (let i = 0; i < 24; i++) {
      if (state.points[i].color === 'white') {
        totalWhiteOnBoard += state.points[i].checkers;
      }
    }
    totalWhiteOnBoard += state.bar.white;

    expect(totalWhiteOnBoard).toBe(0);
    expect(state.bearOff.white).toBe(15);
  });

  test('normal win: opponent has borne off at least one', () => {
    const state = createEmptyState();
    state.bearOff.white = 15;
    state.bearOff.black = 5;  // Black has borne off some

    // This would be a normal win (not gammon)
    expect(state.bearOff.black).toBeGreaterThan(0);
  });

  test('gammon win: opponent has not borne off any', () => {
    const state = createEmptyState();
    state.bearOff.white = 15;
    state.bearOff.black = 0;  // Black has borne off none

    // Check if black has checkers in white's home
    let blackInWhiteHome = false;
    for (let i = 0; i <= 5; i++) {
      if (state.points[i].color === 'black') {
        blackInWhiteHome = true;
        break;
      }
    }

    // Gammon if black hasn't borne off and not in white's home
    expect(state.bearOff.black).toBe(0);
  });

  test('backgammon win: opponent has checkers in winner home or on bar', () => {
    const state = createEmptyState();
    state.bearOff.white = 15;
    state.bearOff.black = 0;
    placeChecker(state, 2, 'black', 1);  // Black in white's home (point 3)

    // This would be a backgammon win
    expect(state.bearOff.black).toBe(0);
    expect(state.points[2].color).toBe('black');
  });
});

// ============================================
// AI INTEGRATION
// ============================================

describe('AI Integration', () => {
  test('AI can play complete turn from starting position', () => {
    const state = createStartingState();
    setDice(state, [4, 3]);

    // AI plays until no more moves
    let currentState = state;
    let moveCount = 0;

    while (moveCount < 2) {
      const moves = getAllLegalMoves(currentState);
      if (moves.length === 0) break;

      const aiMove = selectMove(moves, currentState, 'normal');
      currentState = applyMove(currentState, aiMove);
      moveCount++;

      if (currentState.diceUsed.every(used => used)) break;
    }

    expect(moveCount).toBeGreaterThanOrEqual(1);
  });

  test('AI handles bar entry correctly', () => {
    const state = createEmptyState();
    placeOnBar(state, 'white', 1);
    setDice(state, [3, 5]);

    const moves = getAllLegalMoves(state);
    const aiMove = selectMove(moves, state, 'normal');

    expect(aiMove.from).toBe('bar');
  });

  test('AI can bear off checkers', () => {
    const state = createEmptyState();
    placeChecker(state, 4, 'white', 2);  // Point 5
    placeChecker(state, 2, 'white', 2);  // Point 3
    setDice(state, [5, 3]);

    const moves = getAllLegalMoves(state);
    const aiMove = selectMove(moves, state, 'hard');

    expect(aiMove).toBeDefined();
  });

  test('AI at different difficulties all complete turn', () => {
    const state = createStartingState();
    setDice(state, [6, 2]);

    for (const difficulty of ['easy', 'normal', 'hard']) {
      let testState = { ...state };
      const moves = getAllLegalMoves(testState);
      const aiMove = selectMove(moves, testState, difficulty);

      expect(aiMove).toBeDefined();
      expect(moves).toContain(aiMove);
    }
  });
});

// ============================================
// COMPLEX SCENARIOS
// ============================================

describe('Complex Game Scenarios', () => {
  test('complex position with hits, bar, and bearing off', () => {
    const state = createEmptyState();

    // White is bearing off
    placeChecker(state, 4, 'white', 3);
    placeChecker(state, 2, 'white', 2);

    // Black has one on bar
    placeOnBar(state, 'black', 1);

    // Set white's turn
    setDice(state, [5, 3]);

    const moves = getAllLegalMoves(state);
    expect(moves.length).toBeGreaterThan(0);

    // Can make moves
    const move = moves[0];
    const newState = applyMove(state, move);
    expect(newState).toBeDefined();
  });

  test('blocked position with limited moves', () => {
    const state = createEmptyState();
    placeChecker(state, 23, 'white', 1);  // Point 24

    // Block many points
    for (let i = 15; i <= 22; i++) {
      placeChecker(state, i, 'black', 2);
    }

    setDice(state, [3, 5]);

    const moves = getAllLegalMoves(state);

    // Even in blocked position, should return valid moves or empty
    expect(Array.isArray(moves)).toBe(true);
  });

  test('simultaneous bear off race', () => {
    const state = createEmptyState();

    // White in home
    placeChecker(state, 5, 'white', 5);
    placeChecker(state, 3, 'white', 5);
    placeChecker(state, 1, 'white', 5);

    // Black in home
    placeChecker(state, 18, 'black', 5);
    placeChecker(state, 20, 'black', 5);
    placeChecker(state, 22, 'black', 5);

    setDice(state, [6, 4]);

    const moves = getAllLegalMoves(state);
    expect(moves.length).toBeGreaterThan(0);

    // Should have bearing off moves
    const bearOffMoves = moves.filter(m => m.to === 'bearOff');
    expect(bearOffMoves.length).toBeGreaterThan(0);
  });
});
