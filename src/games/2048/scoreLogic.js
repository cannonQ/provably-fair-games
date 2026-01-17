/**
 * 2048 Score Logic - Score calculation, persistence, and ranking
 * @module scoreLogic
 */

const STORAGE_KEY = '2048-high-score';

/**
 * Calculate score from a tile merge
 * Score increases by the NEW merged value (2+2=4 gives 4 points)
 * @param {number} mergedValue - The value of the merged tile
 * @returns {number} Score gained from merge
 */
export const calculateMergeScore = (mergedValue) => {
  if (!mergedValue || mergedValue < 0 || isNaN(mergedValue)) return 0;
  return mergedValue;
};

/**
 * Update high score if current score is higher
 * @param {number} currentScore - Current game score
 * @param {number} previousHighScore - Previous high score
 * @returns {number} The higher of the two scores
 */
export const updateHighScore = (currentScore, previousHighScore) => {
  const current = isNaN(currentScore) ? 0 : Math.max(0, currentScore);
  const previous = isNaN(previousHighScore) ? 0 : Math.max(0, previousHighScore);
  return Math.max(current, previous);
};

/**
 * Save high score to localStorage
 * @param {number} score - Score to save
 * @returns {boolean} True if save succeeded
 */
export const saveHighScore = (score) => {
  try {
    const validScore = isNaN(score) ? 0 : Math.max(0, Math.floor(score));
    localStorage.setItem(STORAGE_KEY, validScore.toString());
    return true;
  } catch {
    return false;
  }
};

/**
 * Load high score from localStorage
 * @returns {number} Saved high score or 0 if not found/error
 */
export const loadHighScore = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return 0;
    const parsed = parseInt(saved, 10);
    return isNaN(parsed) ? 0 : Math.max(0, parsed);
  } catch {
    return 0;
  }
};

/**
 * Format score with comma separators
 * @param {number} score - Score to format
 * @returns {string} Formatted score string (e.g., "1,000")
 */
export const formatScore = (score) => {
  if (score === null || score === undefined || isNaN(score)) return '0';
  return Math.max(0, Math.floor(score)).toLocaleString('en-US');
};

/**
 * Get rank description based on score
 * @param {number} score - Player's score
 * @returns {string} Rank title
 */
export const getScoreRank = (score) => {
  const validScore = isNaN(score) ? 0 : Math.max(0, score);
  
  if (validScore < 1000) return 'Beginner';
  if (validScore < 5000) return 'Intermediate';
  if (validScore < 10000) return 'Advanced';
  if (validScore < 20000) return 'Expert';
  return 'Master';
};
