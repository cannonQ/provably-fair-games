/**
 * Leaderboard API Service
 * 
 * Client-side functions to interact with leaderboard API.
 */

const API_BASE = '/api';

/**
 * Submit a score to the leaderboard
 * @param {Object} scoreData - Score submission data
 * @returns {Promise<{success: boolean, rank: number, entry: Object}>}
 */
export async function submitScore(scoreData) {
  const {
    game,
    gameId,
    playerName,
    score,
    timeSeconds,
    moves,
    blockHeight,
    blockHash,
    txHash,
    blockTimestamp
  } = scoreData;

  const response = await fetch(`${API_BASE}/submit-score`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      game,
      gameId,
      playerName: playerName || 'Anonymous',
      score,
      timeSeconds,
      moves,
      blockHeight,
      blockHash,
      txHash,
      blockTimestamp
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to submit score');
  }

  return data;
}

/**
 * Get leaderboard entries for a game
 * @param {string} game - Game name ('solitaire' | 'garbage')
 * @param {number} limit - Max entries to return
 * @returns {Promise<{game: string, entries: Array, total: number}>}
 */
export async function getLeaderboard(game, limit = 20) {
  const response = await fetch(`${API_BASE}/leaderboard?game=${game}&limit=${limit}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch leaderboard');
  }

  return data;
}

/**
 * Check if a game has already been submitted
 * @param {string} gameId - Game ID to check
 * @returns {Promise<boolean>}
 */
export async function isGameSubmitted(gameId) {
  try {
    const response = await fetch(`${API_BASE}/leaderboard?game=solitaire&limit=100`);
    const data = await response.json();
    
    if (data.entries) {
      return data.entries.some(e => e.game_id === gameId);
    }
    return false;
  } catch {
    return false;
  }
}
