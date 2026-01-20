// Stub file for GNU Backgammon WASM
// This is a placeholder - the actual gnubg.js file should be obtained from:
// https://github.com/hwatheod/gnubg-web

console.warn('[gnubg] Using stub file - real WASM files not available');
console.warn('[gnubg] Download real files from: https://github.com/hwatheod/gnubg-web');

// Minimal Emscripten-like structure to prevent immediate errors
(function() {
  'use strict';

  var Module = typeof Module !== 'undefined' ? Module : {};

  // Stub functions
  Module.onRuntimeInitialized = function() {
    console.log('[gnubg-stub] Runtime initialized (stub)');
  };

  Module.ccall = function() {
    throw new Error('GNU Backgammon WASM not loaded - please install real files');
  };

  Module.print = function(text) {
    console.log('[gnubg-stub]', text);
  };

  Module.printErr = function(text) {
    console.error('[gnubg-stub]', text);
  };

  // Simulate filesystem
  Module.FS = {
    mkdir: function() {},
    writeFile: function() {}
  };

  // Mark as stub
  Module._isStub = true;
  Module.calledRun = false;

  // Simulate async initialization delay for testing loading UI
  setTimeout(function() {
    Module.calledRun = true;
    if (Module.onRuntimeInitialized) {
      Module.onRuntimeInitialized();
    }
  }, 2000); // 2 second delay to show progress bar

  // Export
  if (typeof window !== 'undefined') {
    window.Module = Module;
  }

  return Module;
})();
