/**
 * Lazy loader for Stockfish WASM (browser-compatible version)
 * Loads the engine from CDN using Web Worker
 *
 * Uses stockfish.js directly as Worker script for proper initialization
 */

let stockfishWorker = null;
let loadingPromise = null;

// CDN URL for stockfish.js - this version works as a direct Worker script
const STOCKFISH_CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js';

/**
 * Loads Stockfish engine from CDN (singleton pattern)
 * stockfish.js is designed to be loaded directly as a Worker script
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
  loadingPromise = new Promise((resolve, reject) => {
    try {
      // Load stockfish.js directly as Worker script
      // This is the recommended way per stockfish.js documentation
      const worker = new Worker(STOCKFISH_CDN_URL);

      let isReady = false;

      // Wait for worker to be ready
      const timeout = setTimeout(() => {
        if (!isReady) {
          worker.terminate();
          loadingPromise = null;
          reject(new Error('Stockfish loading timeout'));
        }
      }, 30000);

      worker.onmessage = (e) => {
        // stockfish.js sends string messages directly
        const msg = typeof e.data === 'string' ? e.data : (e.data?.data || String(e.data));

        // Check for UCI ready response
        if (msg.includes('uciok') || msg.includes('Stockfish')) {
          if (!isReady) {
            isReady = true;
            clearTimeout(timeout);
            stockfishWorker = worker;
            loadingPromise = null;
            resolve(worker);
          }
        }
      };

      worker.onerror = (error) => {
        clearTimeout(timeout);
        loadingPromise = null;
        console.error('Stockfish worker error:', error);
        reject(new Error('Failed to load Stockfish: ' + (error.message || 'Worker error')));
      };

      // Send UCI command to trigger initialization response
      // stockfish.js will respond with engine info including "uciok"
      setTimeout(() => {
        try {
          worker.postMessage('uci');
        } catch (e) {
          console.error('Error sending uci command:', e);
        }
      }, 100);

    } catch (error) {
      console.error('Error creating Stockfish worker:', error);
      loadingPromise = null;
      reject(error);
    }
  });

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
