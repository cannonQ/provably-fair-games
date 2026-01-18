/**
 * API Logging Middleware
 *
 * Tracks API performance metrics WITHOUT collecting personal data
 *
 * NO IP tracking, NO user identification, NO Google Analytics
 *
 * Only logs:
 * - Endpoint path
 * - HTTP method
 * - Response time (ms)
 * - Status code
 * - Timestamp
 */

/**
 * Wraps an API handler to log performance metrics
 *
 * @param {Function} handler - The API route handler
 * @returns {Function} Wrapped handler with logging
 */
export function withLogging(handler) {
  return async (req, res) => {
    const startTime = Date.now();

    // Store original res.status and res.json methods
    const originalStatus = res.status.bind(res);
    const originalJson = res.json.bind(res);

    let statusCode = 200;

    // Override res.status to capture status code
    res.status = function(code) {
      statusCode = code;
      return originalStatus(code);
    };

    // Override res.json to log after response is sent
    res.json = function(data) {
      const duration = Date.now() - startTime;

      // Log performance metrics (NO personal data)
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.url?.split('?')[0] || 'unknown', // Remove query params
        status: statusCode,
        duration_ms: duration,
        // NO IP address
        // NO user agent
        // NO query parameters (may contain sensitive data)
        // NO request body (may contain personal data)
      }));

      return originalJson(data);
    };

    try {
      // Call the original handler
      return await handler(req, res);
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error (NO sensitive data)
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.url?.split('?')[0] || 'unknown',
        status: 500,
        duration_ms: duration,
        error: error.message // Only error message, not stack trace
      }));

      // Re-throw to let Vercel handle error response
      throw error;
    }
  };
}

/**
 * Example usage:
 *
 * import { withLogging } from '../lib/api-logger.js';
 *
 * async function handler(req, res) {
 *   return res.status(200).json({ success: true });
 * }
 *
 * export default withLogging(handler);
 */
