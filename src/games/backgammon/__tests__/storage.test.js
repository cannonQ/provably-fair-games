/**
 * LocalStorage Tests
 *
 * Tests the save/load/clear functionality for game state persistence
 */

import {
  saveGameState,
  loadGameState,
  clearGameState,
  hasSavedGame
} from '../storage';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};

  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('LocalStorage Persistence', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  test('saves game state to localStorage', () => {
    const gameId = 'test-game-123';
    const gameState = {
      currentPlayer: 'white',
      phase: 'moving',
      dice: [3, 5]
    };

    saveGameState(gameId, gameState);

    const saved = localStorage.getItem(`backgammon_game_${gameId}`);
    expect(saved).toBeTruthy();

    const parsed = JSON.parse(saved);
    expect(parsed.state).toEqual(gameState);
    expect(parsed.savedAt).toBeDefined();
    expect(parsed.version).toBe('1.0');
  });

  test('loads saved game state', () => {
    const gameId = 'test-game-456';
    const gameState = {
      currentPlayer: 'black',
      phase: 'rolling',
      dice: [6, 6]
    };

    saveGameState(gameId, gameState);
    const loaded = loadGameState(gameId);

    expect(loaded).toEqual(gameState);
  });

  test('returns null when no saved game exists', () => {
    const loaded = loadGameState('nonexistent-game');
    expect(loaded).toBeNull();
  });

  test('clears saved game state', () => {
    const gameId = 'test-game-789';
    const gameState = { currentPlayer: 'white' };

    saveGameState(gameId, gameState);
    expect(hasSavedGame(gameId)).toBe(true);

    clearGameState(gameId);
    expect(hasSavedGame(gameId)).toBe(false);
  });

  test('checks if saved game exists', () => {
    const gameId = 'test-game-check';

    expect(hasSavedGame(gameId)).toBe(false);

    saveGameState(gameId, { test: true });
    expect(hasSavedGame(gameId)).toBe(true);
  });

  test('handles invalid gameId gracefully', () => {
    expect(() => saveGameState(null, {})).not.toThrow();
    expect(() => loadGameState(null)).not.toThrow();
    expect(() => clearGameState(null)).not.toThrow();
    expect(hasSavedGame(null)).toBe(false);
  });
});
