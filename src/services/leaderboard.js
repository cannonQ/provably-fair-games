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
  const response = await fetch(`${API_BASE}/submit-score`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      game: scoreData.game,
      gameId: scoreData.gameId,
      playerName: scoreData.playerName || 'Anonymous',
      score: scoreData.score,
      timeSeconds: scoreData.timeSeconds,
      moves: scoreData.moves,
      blockHeight: scoreData.blockHeight,
      blockHash: scoreData.blockHash,
      txHash: scoreData.txHash,
      blockTimestamp: scoreData.blockTimestamp,
      // Game-specific fields
      moveHistory: scoreData.moveHistory,      // 2048
      highestTile: scoreData.highestTile,      // 2048
      rollHistory: scoreData.rollHistory,      // Yahtzee
      roundHistory: scoreData.roundHistory,    // Blackjack
      winType: scoreData.winType,              // Backgammon
      difficulty: scoreData.difficulty,        // Backgammon/Garbage
      cubeValue: scoreData.cubeValue           // Backgammon
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
