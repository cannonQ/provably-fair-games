/**
 * UCI Protocol interface for Stockfish
 * Handles communication with the chess engine
 */

export class StockfishInterface {
  constructor(worker) {
    this.worker = worker;
    this.listeners = new Map();
    this.messageQueue = [];
    this.isReady = false;

    // Set up message handler
    this.worker.onmessage = (event) => {
      this.handleMessage(event.data);
    };
  }

  /**
   * Handles messages from Stockfish
   */
  handleMessage(message) {
    // Handle wrapped message format from worker
    let msg = message;
    if (message && message.type === 'stockfish' && message.data) {
      msg = message.data;
    }

    // Skip non-string messages
    if (typeof msg !== 'string') {
      return;
    }

    const trimmedMsg = msg.trim();
    if (!trimmedMsg) {
      return;
    }

    this.messageQueue.push(trimmedMsg);

    // Notify all listeners
    this.listeners.forEach((callback) => {
      callback(trimmedMsg);
    });
  }

  /**
   * Sends a UCI command to Stockfish
   */
  send(command) {
    this.worker.postMessage(command);
  }

  /**
   * Waits for a specific response from Stockfish
   */
  waitFor(expectedText, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.listeners.delete(listenerId);
        reject(new Error(`Timeout waiting for: ${expectedText}`));
      }, timeout);

      const listenerId = Math.random().toString(36);

      this.listeners.set(listenerId, (message) => {
        if (message.includes(expectedText)) {
          clearTimeout(timeoutId);
          this.listeners.delete(listenerId);
          resolve(message);
        }
      });
    });
  }

  /**
   * Initializes the UCI engine
   */
  async init() {
    this.send('uci');
    await this.waitFor('uciok', 10000); // 10 seconds for initial handshake
    this.send('isready');
    await this.waitFor('readyok', 10000);
    this.isReady = true;
  }

  /**
   * Sets the skill level (0-20)
   */
  setSkillLevel(level) {
    const clampedLevel = Math.max(0, Math.min(20, level));
    this.send(`setoption name Skill Level value ${clampedLevel}`);
  }

  /**
   * Sets UCI_LimitStrength option
   */
  setLimitStrength(enabled) {
    this.send(`setoption name UCI_LimitStrength value ${enabled ? 'true' : 'false'}`);
  }

  /**
   * Sets UCI_Elo option (if engine supports it)
   */
  setElo(elo) {
    this.send(`setoption name UCI_Elo value ${elo}`);
  }

  /**
   * Gets the best move for a given position
   */
  async getBestMove(fen, options = {}) {
    const { moveTime, depth } = options;

    // Set position
    this.send(`position fen ${fen}`);

    // Start search
    if (depth) {
      this.send(`go depth ${depth}`);
    } else if (moveTime) {
      this.send(`go movetime ${moveTime}`);
    } else {
      this.send('go movetime 1000'); // Default 1 second
    }

    // Wait for best move
    const response = await this.waitFor('bestmove', 30000);

    // Parse response: "bestmove e2e4 ponder e7e5"
    const parts = response.split(' ');
    const bestMove = parts[1];

    return bestMove;
  }

  /**
   * Stops the current search
   */
  stop() {
    this.send('stop');
  }

  /**
   * Creates a new game
   */
  newGame() {
    this.send('ucinewgame');
    this.send('isready');
    return this.waitFor('readyok');
  }

  /**
   * Terminates the engine
   */
  quit() {
    this.send('quit');
    if (this.worker.terminate) {
      this.worker.terminate();
    }
  }
}
