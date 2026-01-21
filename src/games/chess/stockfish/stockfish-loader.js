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
      // Using stockfish.wasm for better performance (WASM version)
      const workerCode = `
        let engine = null;

        // Set up message handler before loading
        onmessage = function(e) {
          if (e.data === 'ping') {
            postMessage({ type: 'pong' });
            return;
          }

          // Forward UCI commands to engine
          if (engine && engine.postMessage) {
            engine.postMessage(e.data);
          }
        };

        function setupEngine(sf) {
          engine = sf;
          engine.onmessage = function(event) {
            const msg = typeof event === 'string' ? event : (event.data || event);
            postMessage({ type: 'stockfish', data: msg });
          };
          postMessage({ type: 'ready' });
        }

        // Load Stockfish using importScripts (more reliable than fetch in workers)
        try {
          // Use cdnjs which serves with correct MIME type and CORS headers
          importScripts('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js');

          // stockfish.js 10.0.2 may create STOCKFISH, Stockfish, or Module
          if (typeof STOCKFISH === 'function') {
            setupEngine(STOCKFISH());
          } else if (typeof STOCKFISH === 'object' && STOCKFISH.postMessage) {
            setupEngine(STOCKFISH);
          } else if (typeof Stockfish === 'function') {
            setupEngine(Stockfish());
          } else if (typeof Module === 'object' && Module.postMessage) {
            // cdnjs version creates Module object directly
            setupEngine(Module);
          } else if (typeof Module === 'object') {
            // Module exists but may need onmessage setup
            // stockfish.js uses Module.print for output
            const sfEngine = {
              postMessage: function(cmd) {
                if (Module.ccall) {
                  Module.ccall('uci_command', 'number', ['string'], [cmd]);
                } else if (Module.postMessage) {
                  Module.postMessage(cmd);
                }
              },
              onmessage: null
            };
            // Capture output via Module.print
            Module.print = function(line) {
              if (sfEngine.onmessage) {
                sfEngine.onmessage(line);
              }
            };
            setupEngine(sfEngine);
          } else {
            const globals = Object.keys(self).filter(k =>
              k.toLowerCase().includes('stock') || k === 'Module'
            );
            postMessage({ type: 'error', error: 'Stockfish not found. Globals: ' + globals.join(', ') });
          }
        } catch (err) {
          postMessage({ type: 'error', error: 'Import failed: ' + err.message });
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
      }, 30000); // Increased to 30 seconds for slow connections

      worker.onmessage = (e) => {
        // Handle error from worker
        if (e.data && e.data.type === 'error') {
          clearTimeout(timeout);
          URL.revokeObjectURL(workerUrl);
          loadingPromise = null;
          reject(new Error(e.data.error));
          return;
        }

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
