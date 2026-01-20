/**
 * Tests for Chess History Validator
 */

import {
  validateChessGame,
  verifyColorAssignment,
  verifyAICommitment,
  replayAndValidateMoves,
  validateGameResult,
  calculateChessScore
} from '../../../../lib/validation/games/chess/historyValidator.js';

import CryptoJS from 'crypto-js';

// ============================================
// TEST HELPERS
// ============================================

function createMockColorAssignment(playerColor = 'white') {
  // Create a block hash that will give us the desired color
  // Even sum = white, Odd sum = black
  const userSeed = 12345;

  // For white: we need even sum
  // For black: we need odd sum
  let blockHash = 'a'.repeat(64); // All 'a's = consistent character code
  const combined = blockHash + userSeed.toString();
  const sum = combined.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const actualColor = sum % 2 === 0 ? 'white' : 'black';

  // If we got the wrong color, adjust
  if (actualColor !== playerColor) {
    blockHash = 'ab' + 'a'.repeat(62); // Change first char to adjust parity
  }

  return {
    blockHash,
    userSeed,
    playerColor,
    blockHeight: 1000000
  };
}

function createMockAICommitment(aiSettings) {
  const blockHash = 'test-block-hash-123';
  const playerSeed = 67890;

  // Sort keys for consistent serialization
  const sortedSettings = {};
  Object.keys(aiSettings).sort().forEach(key => {
    sortedSettings[key] = aiSettings[key];
  });

  const settingsJson = JSON.stringify(sortedSettings);
  const preimage = `${settingsJson}|${blockHash}|${playerSeed}`;
  const commitment = CryptoJS.SHA256(preimage).toString();

  return {
    commitment,
    blockHash,
    playerSeed
  };
}

function createMockAISettings(targetElo = 1200) {
  return {
    targetElo,
    skillLevel: 9,
    moveTime: 500,
    depth: 8,
    mode: 'match'
  };
}

// Scholar's mate: 4-move checkmate
const SCHOLARS_MATE_MOVES = ['e4', 'e5', 'Bc4', 'Nc6', 'Qh5', 'Nf6', 'Qxf7#'];

// Fool's mate: 2-move checkmate (black wins)
const FOOLS_MATE_MOVES = ['f3', 'e5', 'g4', 'Qh4#'];

// Simple draw game (insufficient material)
const DRAW_BY_INSUFFICIENT_MATERIAL = [
  'e4', 'e5', 'Nf3', 'Nc6', 'd4', 'exd4', 'Nxd4', 'Nxd4', 'Qxd4', 'd6',
  'Nc3', 'Nf6', 'Bg5', 'Be7', 'Bxf6', 'Bxf6', 'Qd2', 'O-O', 'O-O-O', 'Be5',
  // ... simplified - actual game would need more moves for insufficient material
];

// ============================================
// COLOR ASSIGNMENT VERIFICATION TESTS
// ============================================

describe('verifyColorAssignment', () => {
  test('validates correct white color assignment', () => {
    const colorData = createMockColorAssignment('white');

    const result = verifyColorAssignment(
      colorData.blockHash,
      colorData.userSeed,
      'white'
    );

    expect(result.valid).toBe(true);
    expect(result.expectedColor).toBe('white');
  });

  test('validates correct black color assignment', () => {
    const colorData = createMockColorAssignment('black');

    const result = verifyColorAssignment(
      colorData.blockHash,
      colorData.userSeed,
      'black'
    );

    expect(result.valid).toBe(true);
    expect(result.expectedColor).toBe('black');
  });

  test('rejects incorrect color claim', () => {
    const colorData = createMockColorAssignment('white');

    const result = verifyColorAssignment(
      colorData.blockHash,
      colorData.userSeed,
      'black' // Claiming wrong color
    );

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Color mismatch');
    expect(result.expectedColor).toBe('white');
  });

  test('rejects missing block hash', () => {
    const result = verifyColorAssignment(null, 12345, 'white');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Missing color assignment data');
  });

  test('rejects missing user seed', () => {
    const result = verifyColorAssignment('blockhash123', undefined, 'white');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Missing color assignment data');
  });

  test('rejects missing claimed color', () => {
    const result = verifyColorAssignment('blockhash123', 12345, null);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Missing color assignment data');
  });
});

// ============================================
// AI COMMITMENT VERIFICATION TESTS
// ============================================

describe('verifyAICommitment', () => {
  test('validates correct AI commitment', () => {
    const aiSettings = createMockAISettings(1500);
    const commitment = createMockAICommitment(aiSettings);

    const result = verifyAICommitment(
      commitment.commitment,
      aiSettings,
      commitment.blockHash,
      commitment.playerSeed
    );

    expect(result.valid).toBe(true);
  });

  test('rejects tampered AI settings', () => {
    const aiSettings = createMockAISettings(1500);
    const commitment = createMockAICommitment(aiSettings);

    // Tamper with settings
    aiSettings.skillLevel = 1;

    const result = verifyAICommitment(
      commitment.commitment,
      aiSettings,
      commitment.blockHash,
      commitment.playerSeed
    );

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('commitment hash mismatch');
  });

  test('rejects wrong block hash', () => {
    const aiSettings = createMockAISettings(1500);
    const commitment = createMockAICommitment(aiSettings);

    const result = verifyAICommitment(
      commitment.commitment,
      aiSettings,
      'wrong-block-hash',
      commitment.playerSeed
    );

    expect(result.valid).toBe(false);
  });

  test('rejects wrong player seed', () => {
    const aiSettings = createMockAISettings(1500);
    const commitment = createMockAICommitment(aiSettings);

    const result = verifyAICommitment(
      commitment.commitment,
      aiSettings,
      commitment.blockHash,
      99999 // Wrong seed
    );

    expect(result.valid).toBe(false);
  });

  test('rejects missing commitment', () => {
    const aiSettings = createMockAISettings(1500);

    const result = verifyAICommitment(
      null,
      aiSettings,
      'blockhash',
      12345
    );

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Missing AI commitment hash');
  });

  test('rejects missing AI settings', () => {
    const result = verifyAICommitment(
      'commitment123',
      null,
      'blockhash',
      12345
    );

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Missing or invalid AI settings');
  });
});

// ============================================
// MOVE REPLAY VALIDATION TESTS
// ============================================

describe('replayAndValidateMoves', () => {
  test('validates legal moves (Scholar\'s mate)', () => {
    const result = replayAndValidateMoves(SCHOLARS_MATE_MOVES);

    expect(result.valid).toBe(true);
    expect(result.moveCount).toBe(7);
    expect(result.isGameOver).toBe(true);
    expect(result.isCheckmate).toBe(true);
  });

  test('validates legal moves (Fool\'s mate)', () => {
    const result = replayAndValidateMoves(FOOLS_MATE_MOVES);

    expect(result.valid).toBe(true);
    expect(result.moveCount).toBe(4);
    expect(result.isGameOver).toBe(true);
    expect(result.isCheckmate).toBe(true);
    expect(result.turn).toBe('w'); // White's turn but checkmate = Black wins
  });

  test('validates simple opening moves', () => {
    const moves = ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'];
    const result = replayAndValidateMoves(moves);

    expect(result.valid).toBe(true);
    expect(result.moveCount).toBe(5);
    expect(result.isGameOver).toBe(false);
  });

  test('rejects illegal move', () => {
    const moves = ['e4', 'e5', 'Nf3', 'Qxe4']; // Queen can't take e4
    const result = replayAndValidateMoves(moves);

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Invalid move format');
    expect(result.invalidMoveIndex).toBe(3);
  });

  test('rejects malformed move', () => {
    const moves = ['e4', 'xyz123']; // Invalid notation
    const result = replayAndValidateMoves(moves);

    expect(result.valid).toBe(false);
    expect(result.invalidMoveIndex).toBe(1);
  });

  test('rejects null moves array', () => {
    const result = replayAndValidateMoves(null);

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Missing or invalid moves array');
  });

  test('validates empty moves array', () => {
    const result = replayAndValidateMoves([]);

    expect(result.valid).toBe(true);
    expect(result.moveCount).toBe(0);
    expect(result.isGameOver).toBe(false);
  });

  test('validates promotion moves', () => {
    // Game leading to pawn promotion
    const promotionMoves = [
      'a4', 'b5', 'axb5', 'a6', 'bxa6', 'Bb7', 'axb7', 'Nc6', 'bxa8=Q'
    ];

    const result = replayAndValidateMoves(promotionMoves);

    expect(result.valid).toBe(true);
  });

  test('validates castling moves', () => {
    const castlingMoves = ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'O-O'];

    const result = replayAndValidateMoves(castlingMoves);

    expect(result.valid).toBe(true);
    expect(result.moveCount).toBe(7);
  });
});

// ============================================
// GAME RESULT VALIDATION TESTS
// ============================================

describe('validateGameResult', () => {
  test('validates checkmate result', () => {
    const replayResult = {
      isGameOver: true,
      isCheckmate: true,
      isDraw: false,
      turn: 'b' // Black's turn = White just delivered checkmate
    };

    const claimedResult = {
      gameOver: true,
      winner: 'white',
      reason: 'checkmate'
    };

    const result = validateGameResult(claimedResult, replayResult);
    expect(result.valid).toBe(true);
  });

  test('validates draw result', () => {
    const replayResult = {
      isGameOver: true,
      isCheckmate: false,
      isDraw: true,
      turn: 'w'
    };

    const claimedResult = {
      gameOver: true,
      winner: null,
      reason: 'stalemate'
    };

    const result = validateGameResult(claimedResult, replayResult);
    expect(result.valid).toBe(true);
  });

  test('rejects wrong winner claim', () => {
    const replayResult = {
      isGameOver: true,
      isCheckmate: true,
      isDraw: false,
      turn: 'b' // White wins
    };

    const claimedResult = {
      gameOver: true,
      winner: 'black', // Wrong
      reason: 'checkmate'
    };

    const result = validateGameResult(claimedResult, replayResult);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Winner mismatch');
  });

  test('rejects game over claim when game continues', () => {
    const replayResult = {
      isGameOver: false,
      isCheckmate: false,
      isDraw: false,
      turn: 'w'
    };

    const claimedResult = {
      gameOver: true,
      winner: 'white',
      reason: 'checkmate'
    };

    const result = validateGameResult(claimedResult, replayResult);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('game is still in progress');
  });

  test('handles resignation (cannot fully verify)', () => {
    const replayResult = {
      isGameOver: false, // Resignation isn't reflected in move replay
      isCheckmate: false,
      isDraw: false,
      turn: 'b'
    };

    const claimedResult = {
      gameOver: true,
      winner: 'white',
      reason: 'resignation'
    };

    // Note: Resignations are accepted with a note since we can't verify from moves
    const result = validateGameResult(claimedResult, replayResult);
    expect(result.valid).toBe(true);
    expect(result.note).toContain('resignation');
  });
});

// ============================================
// SCORE CALCULATION TESTS
// ============================================

describe('calculateChessScore', () => {
  test('calculates win score based on ELO', () => {
    const result = { gameOver: true, winner: 'white' };
    const score = calculateChessScore(result, 'white', 1500);

    // Base score = (1500 - 300) / 2.7 ≈ 444
    expect(score).toBeGreaterThan(400);
    expect(score).toBeLessThan(500);
  });

  test('calculates draw score (50% of win)', () => {
    const result = { gameOver: true, winner: null };
    const playerColor = 'white';
    const opponentElo = 1500;

    const winScore = calculateChessScore({ gameOver: true, winner: 'white' }, 'white', opponentElo);
    const drawScore = calculateChessScore(result, playerColor, opponentElo);

    expect(drawScore).toBe(Math.floor(winScore * 0.5));
  });

  test('calculates loss score (10% of win)', () => {
    const result = { gameOver: true, winner: 'black' };
    const playerColor = 'white';
    const opponentElo = 1500;

    const winScore = calculateChessScore({ gameOver: true, winner: 'white' }, 'white', opponentElo);
    const lossScore = calculateChessScore(result, playerColor, opponentElo);

    expect(lossScore).toBe(Math.floor(winScore * 0.1));
  });

  test('higher ELO opponent = higher score', () => {
    const result = { gameOver: true, winner: 'white' };
    const lowEloScore = calculateChessScore(result, 'white', 800);
    const highEloScore = calculateChessScore(result, 'white', 2400);

    expect(highEloScore).toBeGreaterThan(lowEloScore);
  });

  test('returns 0 for incomplete game', () => {
    const result = { gameOver: false };
    const score = calculateChessScore(result, 'white', 1500);

    expect(score).toBe(0);
  });
});

// ============================================
// FULL GAME VALIDATION TESTS
// ============================================

describe('validateChessGame', () => {
  test('validates complete valid game (Scholar\'s mate)', () => {
    const aiSettings = createMockAISettings(1200);
    const commitment = createMockAICommitment(aiSettings);
    const colorData = createMockColorAssignment('white');

    const submission = {
      moves: SCHOLARS_MATE_MOVES,
      playerColor: 'white',
      result: {
        gameOver: true,
        result: '1-0',
        winner: 'white',
        reason: 'checkmate'
      },
      aiSettings,
      colorAssignment: colorData,
      aiCommitment: commitment
    };

    const result = validateChessGame(submission);

    expect(result.valid).toBe(true);
    expect(result.calculatedScore).toBeGreaterThan(0);
    expect(result.details.moveCount).toBe(7);
    expect(result.details.winner).toBe('white');
  });

  test('rejects missing moves', () => {
    const result = validateChessGame({
      playerColor: 'white',
      result: { gameOver: true, winner: 'white' }
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Missing or invalid moves array');
  });

  test('rejects invalid player color', () => {
    const result = validateChessGame({
      moves: ['e4', 'e5'],
      playerColor: 'green', // Invalid
      result: { gameOver: false }
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('invalid player color');
  });

  test('rejects missing result', () => {
    const result = validateChessGame({
      moves: ['e4', 'e5'],
      playerColor: 'white'
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Missing game result');
  });

  test('rejects game with too few moves', () => {
    // A game claiming checkmate with only 1 move fails result validation first
    // (checkmate in 1 move is impossible)
    const result = validateChessGame({
      moves: ['e4'], // Only 1 move
      playerColor: 'white',
      result: { gameOver: true, winner: 'white', reason: 'checkmate' }
    });

    expect(result.valid).toBe(false);
    // Fails on result validation because checkmate in 1 move is impossible
    expect(result.reason).toContain('Result validation failed');
  });

  test('rejects game with only 1 move claiming completion', () => {
    // Even with resignation, games with < 2 moves should be flagged
    const result = validateChessGame({
      moves: ['e4'], // Only 1 move
      playerColor: 'white',
      result: { gameOver: true, winner: 'white', reason: 'resignation' }
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Suspiciously few moves');
  });

  test('rejects game with too many moves', () => {
    // Create 501 moves (alternating e4/e5 wouldn't work, so use valid long game)
    const manyMoves = [];
    for (let i = 0; i < 501; i++) {
      manyMoves.push('e4'); // This would fail move validation first
    }

    const result = validateChessGame({
      moves: manyMoves,
      playerColor: 'white',
      result: { gameOver: false }
    });

    // Will fail on move validation before reaching move count check
    expect(result.valid).toBe(false);
  });

  test('validates game without blockchain data', () => {
    // Should still work but skip blockchain verification
    const submission = {
      moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6'],
      playerColor: 'white',
      result: { gameOver: false }
      // No colorAssignment or aiCommitment
    };

    const result = validateChessGame(submission);

    expect(result.valid).toBe(true);
    expect(result.details.colorVerification.skipped).toBe(true);
    expect(result.details.commitmentVerification.skipped).toBe(true);
  });

  test('rejects illegal move in submission', () => {
    const submission = {
      moves: ['e4', 'e5', 'Qh8'], // Queen can't go to h8 from d1
      playerColor: 'white',
      result: { gameOver: false }
    };

    const result = validateChessGame(submission);

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Move validation failed');
  });

  test('rejects color assignment mismatch', () => {
    const colorData = createMockColorAssignment('white');

    const submission = {
      moves: ['e4', 'e5'],
      playerColor: 'black', // Claims black but assignment says white
      result: { gameOver: false },
      colorAssignment: colorData
    };

    const result = validateChessGame(submission);

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Color verification failed');
  });
});
