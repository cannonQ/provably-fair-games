/**
 * Lazy loader for Stockfish WASM (browser-compatible version)
 * Loads the engine from CDN using Web Worker
 */

let stockfishWorker = null;
let loadingPromise = null;

/**
 * Loads Stockfish engine from CDN (singleton pattern)
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
      // Create a worker that loads Stockfish from CDN
      const workerCode = `
        // Load Stockfish from CDN
        importScripts('https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js');

        // Notify that Stockfish is loaded
        postMessage({ type: 'ready' });

        // Forward messages between Stockfish and main thread
        onmessage = function(e) {
          if (e.data === 'ping') {
            postMessage({ type: 'pong' });
            return;
          }

          if (typeof STOCKFISH !== 'undefined' && STOCKFISH.postMessage) {
            STOCKFISH.postMessage(e.data);
          }
        };

        // Listen to Stockfish output
        if (typeof STOCKFISH !== 'undefined') {
          STOCKFISH.onmessage = function(e) {
            postMessage({ type: 'stockfish', data: e.data || e });
          };
        }
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);

      const worker = new Worker(workerUrl);

      // Wait for worker to be ready
      const timeout = setTimeout(() => {
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
        loadingPromise = null;
        reject(new Error('Stockfish loading timeout'));
      }, 15000);

      worker.onmessage = (e) => {
        // Only resolve when we get the 'ready' message
        if (e.data && e.data.type === 'ready') {
          clearTimeout(timeout);
          URL.revokeObjectURL(workerUrl);
          stockfishWorker = worker;
          loadingPromise = null;
          resolve(worker);
        }
      };

      worker.onerror = (error) => {
        clearTimeout(timeout);
        URL.revokeObjectURL(workerUrl);
        loadingPromise = null;
        console.error('Worker error:', error);
        reject(new Error('Failed to load Stockfish worker'));
      };

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
