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

        // Forward messages between Stockfish and main thread
        onmessage = function(e) {
          if (typeof STOCKFISH !== 'undefined' && STOCKFISH.postMessage) {
            STOCKFISH.postMessage(e.data);
          } else {
            postMessage('Stockfish not loaded');
          }
        };

        // Listen to Stockfish output
        if (typeof STOCKFISH !== 'undefined') {
          STOCKFISH.onmessage = function(e) {
            postMessage(e.data || e);
          };
        }
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);

      const worker = new Worker(workerUrl);

      // Wait for worker to be ready
      const timeout = setTimeout(() => {
        reject(new Error('Stockfish loading timeout'));
      }, 10000);

      worker.onmessage = (e) => {
        clearTimeout(timeout);
        stockfishWorker = worker;
        resolve(worker);
      };

      worker.onerror = (error) => {
        clearTimeout(timeout);
        console.error('Worker error:', error);
        reject(new Error('Failed to load Stockfish worker'));
      };

      // Send initial message to trigger worker
      worker.postMessage('uci');
    } catch (error) {
      console.error('Error creating Stockfish worker:', error);
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
