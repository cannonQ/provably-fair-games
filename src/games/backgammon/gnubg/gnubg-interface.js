/**
 * GNU Backgammon Interface
 *
 * Provides interface to the gnubg-web WASM module.
 *
 * NOTE: gnubg-web is designed for interactive game play, not position analysis.
 * It does NOT support CLI commands like 'hint', 'set board', 'set dice'.
 * The "Hardest" difficulty falls back to JavaScript-based AI.
 */

import { boardToPositionId, parseGnubgMove, formatDiceForGnubg } from './position-converter.js';

/**
 * GnubgInterface class - singleton wrapper around gnubg WASM module
 */
class GnubgInterface {
  constructor() {
    this.module = null;
    this.initialized = false;
    this.commandQueue = [];
    this.outputBuffer = [];
    this.cliSupported = false; // gnubg-web doesn't support CLI analysis commands
  }

  /**
   * Initialize the interface with loaded gnubg module
   *
   * @param {Object} gnubgModule - Loaded Emscripten module
   */
  async initialize(gnubgModule) {
    this.module = gnubgModule;

    // Check if this is a stub module
    if (this.module._isStub) {
      console.warn('[gnubg] Detected stub module - real WASM not available');
      throw new Error('GNU Backgammon stub detected - please install real WASM files from https://github.com/hwatheod/gnubg-web');
    }

    // Configure output capture
    this.module.print = (text) => {
      this.outputBuffer.push(text);
    };

    this.module.printErr = (text) => {
      console.warn('[gnubg]', text);
    };

    // Test if CLI commands are supported (they aren't in gnubg-web)
    await this.testCliSupport();

    this.initialized = true;

    if (this.cliSupported) {
      console.log('[gnubg] Interface initialized with full CLI support');
    } else {
      console.log('[gnubg] Interface initialized (gnubg-web mode - position analysis not supported)');
    }
  }

  /**
   * Test if the gnubg build supports CLI analysis commands
   * gnubg-web does NOT support: hint, set board, set dice, show evaluation
   */
  async testCliSupport() {
    try {
      // Try a simple command that should work in full gnubg but not gnubg-web
      const output = await this.executeCommand('help hint');
      // If we get help output (not "Unknown"), CLI is supported
      this.cliSupported = !output.toLowerCase().includes('unknown') && output.length > 10;
    } catch (e) {
      this.cliSupported = false;
    }

    if (!this.cliSupported) {
      console.warn('[gnubg] CLI analysis commands not supported in this build (gnubg-web)');
      console.warn('[gnubg] Position analysis will fall back to JavaScript AI');
    }
  }

  /**
   * Execute a gnubg command and return output
   *
   * @param {string} command - Command to execute
   * @returns {Promise<string>} Command output
   */
  async executeCommand(command) {
    if (!this.module) {
      throw new Error('gnubg interface not initialized');
    }

    // Clear output buffer
    this.outputBuffer = [];

    try {
      // Execute command through Emscripten
      // gnubg exports _HandleCommand or _run_command instead of _ExecuteCommand

      // Helper to allocate string on WASM heap (gnubg-web pattern)
      const allocString = (str) => {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(str + '\0'); // null-terminated
        const ptr = this.module._malloc(bytes.length);
        const heap = new Uint8Array(this.module.HEAPU8.buffer, ptr, bytes.length);
        heap.set(bytes);
        return ptr;
      };

      // gnubg-web uses _run_command (preferred) or _HandleCommand
      if (typeof this.module._run_command === 'function') {
        const cmdPtr = allocString(command);
        this.module._run_command(cmdPtr);
        this.module._free(cmdPtr);
      } else if (typeof this.module._HandleCommand === 'function') {
        const cmdPtr = allocString(command);
        this.module._HandleCommand(cmdPtr);
        this.module._free(cmdPtr);
      } else {
        throw new Error('No command function available');
      }

      // Call _doNextTurn to process the command result (gnubg-web pattern)
      if (typeof this.module._doNextTurn === 'function') {
        this.module._doNextTurn();
      }

      // Wait for output to be captured
      await new Promise(resolve => setTimeout(resolve, 50));

      // Return captured output
      return this.outputBuffer.join('\n');
    } catch (error) {
      console.error(`[gnubg] Command failed: ${command}`, error);
      throw error;
    }
  }

  /**
   * Set the board position
   *
   * @param {Object} state - Game state
   * @param {string} player - Player on roll ('white' or 'black')
   */
  async setPosition(state, player) {
    const positionId = boardToPositionId(state, player);

    // Set position using gnubg's "set board" command
    // Note: gnubg expects Position ID in specific format
    await this.executeCommand(`set board ${positionId}`);
  }

  /**
   * Set dice for current position
   *
   * @param {Array} dice - [die1, die2]
   */
  async setDice(dice) {
    const diceStr = formatDiceForGnubg(dice);
    await this.executeCommand(`set dice ${diceStr}`);
  }

  /**
   * Get best move for current position
   *
   * @param {Object} state - Game state
   * @param {Array} dice - Dice roll
   * @param {string} player - Player on roll ('white' or 'black')
   * @returns {Promise<Array>} Best move as array of {from, to} objects
   */
  async getBestMove(state, dice, player = 'white') {
    if (!this.initialized) {
      throw new Error('gnubg not initialized');
    }

    try {
      // Set up position
      await this.setPosition(state, player);

      // Set dice
      await this.setDice(dice);

      // Get hint (best move)
      const output = await this.executeCommand('hint');

      // Parse the output
      const moves = this.parseMoveFromHint(output);

      return moves;
    } catch (error) {
      console.error('[gnubg] Error getting best move:', error);
      return []; // Return empty to trigger fallback
    }
  }

  /**
   * Parse move from gnubg hint output
   *
   * @param {string} output - Hint command output
   * @returns {Array} Parsed moves
   */
  parseMoveFromHint(output) {
    // gnubg hint output format:
    // "  1.   13/7  8/7                eq: +0.123"
    // Extract the move part (between position number and equity)

    const lines = output.split('\n');

    for (const line of lines) {
      // Look for line starting with number (top move)
      const match = line.match(/^\s*1\.\s+(.+?)\s+eq:/);
      if (match) {
        const moveStr = match[1].trim();
        return parseGnubgMove(moveStr);
      }

      // Alternative format: just the move string
      if (line.includes('/')) {
        const moveStr = line.trim().split(/\s+/)[0];
        const parsed = parseGnubgMove(moveStr);
        if (parsed.length > 0) {
          return parsed;
        }
      }
    }

    // No move found
    console.warn('[gnubg] No move found in hint output:', output);
    return [];
  }

  /**
   * Check if gnubg suggests doubling
   *
   * @param {Object} state - Game state
   * @param {string} player - Player considering double
   * @returns {Promise<boolean>} True if should double
   */
  async shouldDouble(state, player) {
    if (!this.initialized) {
      return false;
    }

    try {
      // Set position
      await this.setPosition(state, player);

      // Analyze cube decision
      const output = await this.executeCommand('show cubeful');

      // Parse output for cube decision
      // gnubg shows equity for no double, double/take, double/pass
      // If equity for double/take > no double, should double
      return this.parseDoubleDecision(output);
    } catch (error) {
      console.error('[gnubg] Error checking double:', error);
      return false;
    }
  }

  /**
   * Parse cube decision from output
   */
  parseDoubleDecision(output) {
    // Simple heuristic: look for "Double, take" recommendation
    return output.toLowerCase().includes('double') &&
           (output.toLowerCase().includes('take') ||
            output.toLowerCase().includes('too good'));
  }

  /**
   * Evaluate current position
   *
   * @param {Object} state - Game state
   * @param {string} player - Player to evaluate for
   * @returns {Promise<number>} Position equity (-1 to +1, positive favors player)
   */
  async evaluatePosition(state, player) {
    if (!this.initialized) {
      return 0;
    }

    try {
      await this.setPosition(state, player);
      const output = await this.executeCommand('show evaluation');

      // Parse equity from output
      // Format: "Equity: +0.123 (53.2% win)"
      const match = output.match(/Equity:\s*([-+]?\d+\.\d+)/);
      if (match) {
        return parseFloat(match[1]);
      }

      return 0;
    } catch (error) {
      console.error('[gnubg] Error evaluating position:', error);
      return 0;
    }
  }

  /**
   * Reset gnubg state
   */
  async reset() {
    if (this.initialized) {
      await this.executeCommand('new game');
    }
  }

  /**
   * Cleanup and release resources
   */
  cleanup() {
    this.module = null;
    this.initialized = false;
    this.commandQueue = [];
    this.outputBuffer = [];
    console.log('[gnubg] Interface cleaned up');
  }
}

// Singleton instance
let gnubgInstance = null;

/**
 * Get or create gnubg interface instance
 *
 * @returns {GnubgInterface} Singleton instance
 */
export function getGnubgInterface() {
  if (!gnubgInstance) {
    gnubgInstance = new GnubgInterface();
  }
  return gnubgInstance;
}

/**
 * Initialize gnubg interface with module
 *
 * @param {Object} gnubgModule - Loaded Emscripten module
 */
export async function initializeGnubg(gnubgModule) {
  const instance = getGnubgInterface();
  await instance.initialize(gnubgModule);
  return instance;
}

/**
 * Cleanup gnubg interface
 */
export function cleanupGnubg() {
  if (gnubgInstance) {
    gnubgInstance.cleanup();
    gnubgInstance = null;
  }
}

export default getGnubgInterface;
