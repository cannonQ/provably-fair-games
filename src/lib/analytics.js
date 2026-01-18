/**
 * Privacy-Focused Analytics
 *
 * Tracks game usage WITHOUT collecting personal data
 *
 * NO IP tracking, NO user identification, NO Google Analytics, NO external services
 *
 * Only logs to console:
 * - Event type (game_start, game_complete, etc.)
 * - Game name
 * - Timestamp
 *
 * All data stays in the browser console - never sent to servers
 */

/**
 * Log an analytics event (console only)
 *
 * @param {string} event - Event name (e.g., 'game_start', 'game_complete')
 * @param {Object} data - Event data (e.g., { game: 'yahtzee', score: 248 })
 */
function logEvent(event, data = {}) {
  // Only log in development or if explicitly enabled
  if (process.env.NODE_ENV === 'development' || window.localStorage.getItem('enable_analytics') === 'true') {
    console.log('[Analytics]', {
      event,
      timestamp: new Date().toISOString(),
      ...data
      // NO user ID
      // NO IP address
      // NO session tracking
      // NO cookies
    });
  }
}

/**
 * Track game start
 *
 * @param {string} game - Game name (e.g., 'yahtzee', 'solitaire')
 */
export function trackGameStart(game) {
  logEvent('game_start', { game });
}

/**
 * Track game completion
 *
 * @param {string} game - Game name
 * @param {number} score - Final score
 * @param {number} timeSeconds - Time taken in seconds
 */
export function trackGameComplete(game, score, timeSeconds) {
  logEvent('game_complete', { game, score, timeSeconds });
}

/**
 * Track score submission
 *
 * @param {string} game - Game name
 * @param {number} score - Submitted score
 * @param {boolean} success - Whether submission succeeded
 */
export function trackScoreSubmission(game, score, success) {
  logEvent('score_submission', { game, score, success });
}

/**
 * Track verification check
 *
 * @param {string} game - Game name
 * @param {string} gameId - Game ID being verified
 */
export function trackVerification(game, gameId) {
  logEvent('verification', { game, gameId });
}

/**
 * Track page view
 *
 * @param {string} page - Page name (e.g., 'home', 'leaderboard')
 */
export function trackPageView(page) {
  logEvent('page_view', { page });
}

/**
 * Enable analytics in console
 * Users can call this in DevTools: window.enableAnalytics()
 */
if (typeof window !== 'undefined') {
  window.enableAnalytics = () => {
    window.localStorage.setItem('enable_analytics', 'true');
    console.log('[Analytics] Analytics enabled. Events will appear in console.');
    console.log('[Analytics] To disable, run: window.disableAnalytics()');
  };

  window.disableAnalytics = () => {
    window.localStorage.removeItem('enable_analytics');
    console.log('[Analytics] Analytics disabled.');
  };
}

/**
 * Example usage:
 *
 * import { trackGameStart, trackGameComplete } from '../lib/analytics';
 *
 * // When game starts
 * trackGameStart('yahtzee');
 *
 * // When game completes
 * trackGameComplete('yahtzee', 248, 180);
 *
 * // Enable in console (optional)
 * window.enableAnalytics();
 */
