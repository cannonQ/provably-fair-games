/**
 * Lazy loader for Stockfish WASM (browser-compatible version)
 * Loads the engine from CDN using Web Worker
 *
 * Fetches stockfish.js and creates a blob worker to avoid CORS issues
 */

let stockfishWorker = null;
let loadingPromise = null;

// CDN URL for stockfish.js
const STOCKFISH_CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js';

/**
 * Loads Stockfish engine from CDN (singleton pattern)
 * Fetches the script and creates a blob worker to avoid CORS restrictions
 */
export async function loadStockfish() {
  // Return existing instance if already loaded
  if (stockfishWorker) {
    return stockfishWorker;
  }

  // Return existing promise if currently loading
  if (loadingPromise) {
    return loadingPromise;
  }

  // Start loading
  loadingPromise = (async () => {
    try {
      // Fetch stockfish.js content
      console.log('[Stockfish] Fetching from CDN...');
      const response = await fetch(STOCKFISH_CDN_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch stockfish.js: ${response.status}`);
      }
      const stockfishCode = await response.text();
      console.log('[Stockfish] Script loaded, size:', stockfishCode.length);

      // Create blob worker from the fetched code
      const blob = new Blob([stockfishCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);

      return new Promise((resolve, reject) => {
        const worker = new Worker(workerUrl);
        let isReady = false;

        const timeout = setTimeout(() => {
          if (!isReady) {
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
            loadingPromise = null;
            reject(new Error('Stockfish loading timeout'));
          }
        }, 30000);

        worker.onmessage = (e) => {
          const msg = typeof e.data === 'string' ? e.data : String(e.data);

          // Check for UCI ready response
          if (msg.includes('uciok') || msg.includes('Stockfish')) {
            if (!isReady) {
              isReady = true;
              clearTimeout(timeout);
              URL.revokeObjectURL(workerUrl);
              stockfishWorker = worker;
              loadingPromise = null;
              console.log('[Stockfish] Engine ready');
              resolve(worker);
            }
          }
        };

        worker.onerror = (error) => {
          clearTimeout(timeout);
          URL.revokeObjectURL(workerUrl);
          loadingPromise = null;
          console.error('[Stockfish] Worker error:', error);
          reject(new Error('Failed to load Stockfish: ' + (error.message || 'Worker error')));
        };

        // Send UCI command to initialize
        setTimeout(() => {
          try {
            worker.postMessage('uci');
          } catch (e) {
            console.error('[Stockfish] Error sending uci command:', e);
          }
        }, 100);
      });

    } catch (error) {
      console.error('[Stockfish] Load error:', error);
      loadingPromise = null;
      throw error;
    }
  })();

  return loadingPromise;
}

/**
 * Unloads Stockfish engine to free memory
 */
export function unloadStockfish() {
  if (stockfishWorker) {
    stockfishWorker.terminate();
    stockfishWorker = null;
  }
  loadingPromise = null;
}

/**
 * Checks if Stockfish is currently loaded
 */
export function isStockfishLoaded() {
  return stockfishWorker !== null;
}
