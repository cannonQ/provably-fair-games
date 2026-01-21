/**
 * GNU Backgammon WASM Loader
 *
 * Handles lazy loading of gnubg WASM files with progress tracking.
 * Files are loaded from /assets/gnubg/ directory.
 *
 * Required files (~15MB total):
 * - gnubg.js       (~2MB)  - Emscripten glue code
 * - gnubg.wasm     (~3MB)  - Core engine
 * - gnubg.wd       (~5MB)  - One-sided bearoff database
 * - gnubg_os0.bd   (~5MB)  - Opening book database
 */

import { initializeGnubg } from './gnubg-interface.js';

// Loader state
let gnubgModule = null;
let loadingPromise = null;
let loadProgress = 0;
let progressCallback = null;

/**
 * File sizes for progress calculation (approximate)
 */
const FILE_SIZES = {
  'gnubg.js': 2 * 1024 * 1024,
  'gnubg.wasm': 3 * 1024 * 1024,
  'gnubg.wd': 5 * 1024 * 1024,
  'gnubg_os0.bd': 5 * 1024 * 1024,
};

const TOTAL_SIZE = Object.values(FILE_SIZES).reduce((a, b) => a + b, 0);

/**
 * Load a file with progress tracking
 *
 * @param {string} url - File URL
 * @param {string} filename - Filename for progress tracking
 * @returns {Promise<ArrayBuffer|string>} Loaded file data
 */
async function loadFileWithProgress(url, filename) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load ${filename}: ${response.statusText}`);
  }

  const contentLength = parseInt(response.headers.get('content-length') || FILE_SIZES[filename]);
  const reader = response.body.getReader();

  let receivedLength = 0;
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    chunks.push(value);
    receivedLength += value.length;

    // Update progress
    const fileProgress = (receivedLength / contentLength) * FILE_SIZES[filename];
    updateProgress(fileProgress, filename);
  }

  // Concatenate chunks
  const allChunks = new Uint8Array(receivedLength);
  let position = 0;
  for (const chunk of chunks) {
    allChunks.set(chunk, position);
    position += chunk.length;
  }

  return allChunks.buffer;
}

/**
 * Update loading progress
 */
function updateProgress(increment, filename) {
  loadProgress += increment;
  const percentage = Math.min(100, (loadProgress / TOTAL_SIZE) * 100);

  if (progressCallback) {
    progressCallback({
      percentage,
      filename,
      loaded: loadProgress,
      total: TOTAL_SIZE,
    });
  }
}

/**
 * Load gnubg WASM module
 *
 * @param {Function} onProgress - Progress callback (optional)
 * @param {number} timeout - Timeout in milliseconds (default 60s)
 * @returns {Promise<Object>} Loaded gnubg interface
 */
export async function loadGnubg(onProgress = null, timeout = 60000) {
  // Return cached module if already loaded
  if (gnubgModule) {
    console.log('[gnubg] Using cached module');
    return gnubgModule;
  }

  // Return existing loading promise if already loading
  if (loadingPromise) {
    console.log('[gnubg] Already loading, waiting...');
    return loadingPromise;
  }

  // Start loading
  progressCallback = onProgress;
  loadProgress = 0;

  loadingPromise = Promise.race([
    loadGnubgInternal(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('gnubg load timeout')), timeout)
    ),
  ]);

  try {
    gnubgModule = await loadingPromise;
    console.log('[gnubg] Module loaded successfully');
    return gnubgModule;
  } catch (error) {
    console.error('[gnubg] Load failed:', error);
    loadingPromise = null;
    throw error;
  }
}

/**
 * Internal loading logic
 */
async function loadGnubgInternal() {
  const basePath = '/assets/gnubg/';

  try {
    // Step 1: Check if gnubg files exist first
    console.log('[gnubg] Checking for gnubg files...');
    const jsUrl = basePath + 'gnubg.js';

    // Quick HEAD request to check if files exist
    const checkResponse = await fetch(jsUrl, { method: 'HEAD' });
    if (!checkResponse.ok) {
      throw new Error(
        'GNU Backgammon AI files not found. The "Hardest" difficulty requires additional files (~15MB) that are not currently installed. Please use Hard difficulty instead.'
      );
    }

    // Load JS file as text
    console.log('[gnubg] Loading gnubg.js...');
    const jsResponse = await fetch(jsUrl);
    if (!jsResponse.ok) {
      throw new Error(`Failed to load gnubg.js: ${jsResponse.statusText} (${jsResponse.status})`);
    }
    const jsCode = await jsResponse.text();

    // Check if we got HTML instead of JS (indicates 404 or missing file)
    if (jsCode.trim().startsWith('<')) {
      throw new Error('gnubg.js not found - received HTML instead of JavaScript. Please install WASM files from https://github.com/hwatheod/gnubg-web');
    }

    updateProgress(FILE_SIZES['gnubg.js'], 'gnubg.js');

    // Step 2: Setup Emscripten module configuration
    // Store data buffers in closure for preRun access
    let wdBuffer = null;
    let bdBuffer = null;

    const Module = {
      // Configure file system paths
      locateFile: (path) => {
        console.log('[gnubg] Locating file:', path);
        if (path.endsWith('.wasm')) {
          return basePath + 'gnubg.wasm';
        }
        if (path.endsWith('.wd')) {
          return basePath + 'gnubg.wd';
        }
        if (path.endsWith('.bd')) {
          return basePath + 'gnubg_os0.bd';
        }
        return basePath + path;
      },

      // Progress tracking
      setStatus: (text) => {
        console.log('[gnubg] Status:', text);
      },

      // Print output capture
      print: (text) => {
        console.log('[gnubg]', text);
      },

      printErr: (text) => {
        console.warn('[gnubg]', text);
      },

      // Download progress for WASM and data files
      monitorRunDependencies: (left) => {
        console.log('[gnubg] Dependencies remaining:', left);
      },

      // PreRun will be set up after we load the data files
      preRun: [],
    };

    // Step 3: Load WASM file with progress
    console.log('[gnubg] Loading gnubg.wasm...');
    const wasmBuffer = await loadFileWithProgress(
      basePath + 'gnubg.wasm',
      'gnubg.wasm'
    );
    Module.wasmBinary = wasmBuffer;

    // Step 4: Preload data files
    console.log('[gnubg] Loading databases...');

    // Load bearoff database
    wdBuffer = await loadFileWithProgress(
      basePath + 'gnubg.wd',
      'gnubg.wd'
    );

    // Load opening book
    bdBuffer = await loadFileWithProgress(
      basePath + 'gnubg_os0.bd',
      'gnubg_os0.bd'
    );

    // Setup preloaded files in Emscripten virtual filesystem
    // The preRun function receives the Module as 'this' context with FS attached
    Module.preRun.push(function() {
      console.log('[gnubg] Setting up virtual filesystem...');
      // Access FS from the module's this context or global
      const FS = this.FS || Module.FS || (typeof window !== 'undefined' && window.FS);

      if (!FS) {
        console.error('[gnubg] Emscripten FS not available');
        return;
      }

      try {
        // Create directories
        FS.mkdir('/gnubg');
        FS.mkdir('/gnubg/data');

        // Write database files
        FS.writeFile('/gnubg/data/gnubg.wd', new Uint8Array(wdBuffer));
        FS.writeFile('/gnubg/data/gnubg_os0.bd', new Uint8Array(bdBuffer));

        console.log('[gnubg] Databases installed');
      } catch (fsError) {
        console.error('[gnubg] FS setup error:', fsError);
      }
    });

    // Step 5: Execute the Emscripten code
    console.log('[gnubg] Initializing Emscripten module...');

    // Create a function to execute the gnubg code
    const initGnubgModule = new Function('Module', jsCode + '\nreturn Module;');
    const gnubg = await initGnubgModule(Module);

    // Wait for module to be ready
    await new Promise((resolve, reject) => {
      const initTimeout = setTimeout(() => {
        reject(new Error('Emscripten module initialization timeout'));
      }, 30000);

      if (gnubg.calledRun) {
        clearTimeout(initTimeout);
        resolve();
      } else {
        gnubg.onRuntimeInitialized = () => {
          clearTimeout(initTimeout);
          resolve();
        };
      }
    });

    console.log('[gnubg] Module initialized');

    // Step 6: Initialize interface
    const gnubgInterface = await initializeGnubg(gnubg);

    // Update progress to 100%
    if (progressCallback) {
      progressCallback({
        percentage: 100,
        filename: 'complete',
        loaded: TOTAL_SIZE,
        total: TOTAL_SIZE,
      });
    }

    return gnubgInterface;
  } catch (error) {
    console.error('[gnubg] Load error:', error);
    throw error;
  }
}

/**
 * Check if gnubg is loaded
 *
 * @returns {boolean} True if loaded
 */
export function isGnubgLoaded() {
  return gnubgModule !== null;
}

/**
 * Get loaded gnubg module (if available)
 *
 * @returns {Object|null} Gnubg interface or null
 */
export function getLoadedGnubg() {
  return gnubgModule;
}

/**
 * Unload gnubg and free memory
 */
export function unloadGnubg() {
  if (gnubgModule) {
    try {
      gnubgModule.cleanup();
    } catch (error) {
      console.error('[gnubg] Cleanup error:', error);
    }
    gnubgModule = null;
  }
  loadingPromise = null;
  loadProgress = 0;
  progressCallback = null;
  console.log('[gnubg] Module unloaded');
}

/**
 * Preload gnubg in background (optional optimization)
 *
 * @param {Function} onProgress - Progress callback
 * @returns {Promise} Loading promise
 */
export function preloadGnubg(onProgress = null) {
  if (isGnubgLoaded()) {
    return Promise.resolve(gnubgModule);
  }

  return loadGnubg(onProgress).catch((error) => {
    console.warn('[gnubg] Preload failed:', error);
  });
}
