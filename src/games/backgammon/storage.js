/**
 * LocalStorage Helper for Backgammon
 *
 * Saves game state to browser storage so users don't lose progress on refresh.
 *
 * How it works:
 * - When a move is made → save state to localStorage
 * - When page loads → check if saved game exists → restore it
 * - When game ends → clear saved state
 */

const STORAGE_KEY_PREFIX = 'backgammon_game_';

/**
 * Save game state to localStorage
 * @param {string} gameId - Unique game identifier
 * @param {object} gameState - Current game state
 */
export function saveGameState(gameId, gameState) {
  if (!gameId || !gameState) return;

  try {
    const key = `${STORAGE_KEY_PREFIX}${gameId}`;
    const data = {
      state: gameState,
      savedAt: Date.now(),
      version: '1.0'
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    // LocalStorage might be full or disabled
    console.warn('Failed to save game state:', error);
  }
}

/**
 * Load saved game state from localStorage
 * @param {string} gameId - Game identifier
 * @returns {object|null} Saved state or null if not found
 */
export function loadGameState(gameId) {
  if (!gameId) return null;

  try {
    const key = `${STORAGE_KEY_PREFIX}${gameId}`;
    const saved = localStorage.getItem(key);

    if (!saved) return null;

    const data = JSON.parse(saved);

    // Check if save is less than 24 hours old (prevent ancient saves)
    const age = Date.now() - data.savedAt;
    const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

    if (age > MAX_AGE) {
      clearGameState(gameId);
      return null;
    }

    return data.state;
  } catch (error) {
    console.warn('Failed to load game state:', error);
    return null;
  }
}

/**
 * Clear saved game state
 * @param {string} gameId - Game identifier
 */
export function clearGameState(gameId) {
  if (!gameId) return;

  try {
    const key = `${STORAGE_KEY_PREFIX}${gameId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to clear game state:', error);
  }
}

/**
 * Check if a saved game exists
 * @param {string} gameId - Game identifier
 * @returns {boolean}
 */
export function hasSavedGame(gameId) {
  if (!gameId) return false;

  try {
    const key = `${STORAGE_KEY_PREFIX}${gameId}`;
    return localStorage.getItem(key) !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Clear all old saved games (cleanup utility)
 */
export function clearOldSavedGames() {
  try {
    const keys = Object.keys(localStorage);
    const gameKeys = keys.filter(k => k.startsWith(STORAGE_KEY_PREFIX));

    gameKeys.forEach(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        const age = Date.now() - data.savedAt;
        const MAX_AGE = 24 * 60 * 60 * 1000;

        if (age > MAX_AGE) {
          localStorage.removeItem(key);
        }
      } catch (e) {
        // Invalid data, remove it
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Failed to clear old games:', error);
  }
}

export default {
  saveGameState,
  loadGameState,
  clearGameState,
  hasSavedGame,
  clearOldSavedGames
};
