/**
 * GNU Backgammon Interface
 *
 * Provides a clean UCI-style interface to the gnubg WASM module.
 * Handles command execution, response parsing, and error handling.
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

    // Initialize gnubg with world-class settings
    await this.setupWorldClassSettings();

    this.initialized = true;
    console.log('[gnubg] Interface initialized with world-class settings');
  }

  /**
   * Configure gnubg for world-class play (~2000 FIBS rating)
   */
  async setupWorldClassSettings() {
    const commands = [
      // Set evaluation to 2-ply (world class)
      'set player 0 chequer evaluation plies 2',
      'set player 0 cube evaluation plies 2',

      // Disable noise for maximum strength
      'set player 0 chequer evaluation noise 0.0',

      // Enable neural net evaluations
      'set player 0 chequer evaluation cubeful on',
      'set player 0 chequer evaluation prune on',

      // Set player 0 as computer
      'set player 0 gnubg',

      // Disable automatic play (we control it)
      'set automatic game off',
      'set automatic roll off',

      // Set match to money game
      'set matchlength 0',
    ];

    for (const cmd of commands) {
      await this.executeCommand(cmd);
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

      // Helper to allocate string on WASM heap
      // Emscripten helpers may be global or on Module
      const allocString = (str) => {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(str + '\0'); // null-terminated
        const ptr = this.module._malloc(bytes.length);
        const heap = new Uint8Array(this.module.HEAPU8.buffer, ptr, bytes.length);
        heap.set(bytes);
        return ptr;
      };

      if (typeof this.module._HandleCommand === 'function') {
        const cmdPtr = allocString(command);
        this.module._HandleCommand(cmdPtr);
        this.module._free(cmdPtr);
      } else if (typeof this.module._run_command === 'function') {
        const cmdPtr = allocString(command);
        this.module._run_command(cmdPtr);
        this.module._free(cmdPtr);
      } else {
        // Log available functions for debugging
        const funcs = Object.keys(this.module).filter(k =>
          k.startsWith('_') || k === 'ccall' || k === 'cwrap'
        );
        console.log('[gnubg] Available module functions:', funcs);
        throw new Error('No suitable method to execute gnubg commands');
      }

      // Wait a tick for output to be captured
      await new Promise(resolve => setTimeout(resolve, 10));

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
      // gnubg outputs moves in format like "13/7 8/7" or "24/23 13/11"
      const moves = this.parseMoveFromHint(output);

      return moves;
    } catch (error) {
      console.error('[gnubg] Error getting best move:', error);
      throw error;
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
