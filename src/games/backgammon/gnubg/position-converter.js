/**
 * Position ID Converter for GNU Backgammon
 *
 * Converts between our board state and gnubg's Position ID format.
 * Position IDs are base64-encoded 10-byte representations of checker positions.
 *
 * Format: PositionID encodes:
 * - 15 checkers for each player (white/black)
 * - 26 positions: 24 points + bar + off
 * - Uses combinatorial number system (Lehmer code)
 *
 * Reference: https://www.gnu.org/software/gnubg/manual/html_node/A-technical-description-of-the-Position-ID.html
 */

/**
 * Converts our board state to gnubg Position ID format
 *
 * @param {Object} state - Game state with board, bar, and home
 * @param {string} onRoll - Player on roll ('white' or 'black')
 * @returns {string} Position ID in format "4HPwATDgc/ABMA" (example)
 */
export function boardToPositionId(state, onRoll = 'white') {
  // Initialize position arrays for both players (26 positions each: 0-23 points, 24 bar, 25 off)
  const whitePos = new Array(26).fill(0);
  const blackPos = new Array(26).fill(0);

  // Convert our board representation to gnubg's numbering
  // Our points: 0-23, gnubg uses same numbering (0 is white's home board corner)
  for (let i = 0; i < 24; i++) {
    const point = state.board[i];
    if (point.player === 'white') {
      whitePos[i] = point.checkers;
    } else if (point.player === 'black') {
      blackPos[i] = point.checkers;
    }
  }

  // Bar position (24)
  whitePos[24] = state.bar.white || 0;
  blackPos[24] = state.bar.black || 0;

  // Off/Home position (25)
  whitePos[25] = state.home.white || 0;
  blackPos[25] = state.home.black || 0;

  // Encode positions to key
  const key = encodePosition(whitePos, blackPos);

  // Convert to base64
  const positionId = encodeBase64(key);

  return positionId;
}

/**
 * Encodes checker positions using combinatorial number system
 * This follows gnubg's encoding algorithm
 */
function encodePosition(whitePos, blackPos) {
  const key = new Uint8Array(10); // 80 bits for position encoding

  // Encode white's checkers
  let bitPos = 0;
  bitPos = encodePlayerPosition(whitePos, key, bitPos);

  // Encode black's checkers
  bitPos = encodePlayerPosition(blackPos, key, bitPos);

  return key;
}

/**
 * Encodes one player's position using combinatorial indexing
 */
function encodePlayerPosition(positions, key, startBit) {
  // Convert position array to list of checker locations
  const checkers = [];
  for (let pos = 0; pos < 26; pos++) {
    for (let n = 0; n < positions[pos]; n++) {
      checkers.push(pos);
    }
  }

  // Encode using combinatorial number system
  // Each checker position is encoded relative to remaining positions
  let index = 0;
  let bitPos = startBit;

  for (let i = 0; i < 15; i++) {
    const pos = checkers[i] || 0;

    // Calculate combination index for this checker
    const c = combination(pos + i, i + 1);
    index += c;

    // Store in bit array
    for (let bit = 0; bit < 4; bit++) { // 4 bits per position
      if ((index >> bit) & 1) {
        const bytePos = Math.floor(bitPos / 8);
        const bitOffset = bitPos % 8;
        key[bytePos] |= (1 << bitOffset);
      }
      bitPos++;
    }
  }

  return bitPos;
}

/**
 * Calculate binomial coefficient C(n, k) = n! / (k! * (n-k)!)
 */
function combination(n, k) {
  if (k > n) return 0;
  if (k === 0 || k === n) return 1;

  let result = 1;
  for (let i = 0; i < k; i++) {
    result = result * (n - i) / (i + 1);
  }
  return Math.floor(result);
}

/**
 * Encode byte array to base64
 */
function encodeBase64(key) {
  // Use gnubg's base64 alphabet (slightly different from standard)
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  let result = '';
  let buffer = 0;
  let bitsInBuffer = 0;

  for (let i = 0; i < key.length; i++) {
    buffer = (buffer << 8) | key[i];
    bitsInBuffer += 8;

    while (bitsInBuffer >= 6) {
      bitsInBuffer -= 6;
      const index = (buffer >> bitsInBuffer) & 0x3F;
      result += alphabet[index];
      buffer &= (1 << bitsInBuffer) - 1;
    }
  }

  // Flush remaining bits
  if (bitsInBuffer > 0) {
    buffer <<= (6 - bitsInBuffer);
    result += alphabet[buffer & 0x3F];
  }

  return result;
}

/**
 * Parses gnubg move output into our move format
 *
 * @param {string} gnubgOutput - Move string like "13/7 8/7" or "24/23 13/11"
 * @returns {Array} Array of move segments [{from, to}, ...]
 */
export function parseGnubgMove(gnubgOutput) {
  if (!gnubgOutput || gnubgOutput.trim() === '') {
    return [];
  }

  // Handle "No move" or similar responses
  if (gnubgOutput.toLowerCase().includes('no move') ||
      gnubgOutput.toLowerCase().includes('cannot move')) {
    return [];
  }

  // Split by spaces and parse each move segment
  const segments = gnubgOutput.trim().split(/\s+/);
  const moves = [];

  for (const segment of segments) {
    // Match pattern like "13/7" or "bar/23" or "6/off"
    const match = segment.match(/(\d+|bar)\/(\d+|off)/i);
    if (match) {
      const from = match[1].toLowerCase() === 'bar' ? 'bar' : parseInt(match[1]);
      const to = match[2].toLowerCase() === 'off' ? 'off' : parseInt(match[2]);

      // Convert gnubg numbering (0-23) to our format if needed
      // gnubg uses 1-24 in display but 0-23 internally
      moves.push({
        from: from === 'bar' ? 'bar' : from - 1, // Adjust for 0-indexing
        to: to === 'off' ? 'off' : to - 1
      });
    }
  }

  return moves;
}

/**
 * Converts dice to gnubg format
 *
 * @param {Array} dice - [die1, die2]
 * @returns {string} Dice string for gnubg "set dice" command
 */
export function formatDiceForGnubg(dice) {
  return `${dice[0]} ${dice[1]}`;
}

/**
 * Creates match ID for position (used for match play)
 * For money games, we use a simple format
 *
 * @param {number} matchLength - Match length (0 for money game)
 * @returns {string} Match ID
 */
export function createMatchId(matchLength = 0) {
  // Format: "MatchLength:Score1:Score2:Crawford:FirstPlayer"
  // For money games: "0:0:0:0:1"
  return `${matchLength}:0:0:0:1`;
}

/**
 * Creates full position string for gnubg
 * Combines Position ID and Match ID
 *
 * @param {Object} state - Game state
 * @param {string} onRoll - Player on roll
 * @returns {string} Full position string "PositionID:MatchID"
 */
export function createFullPosition(state, onRoll = 'white') {
  const positionId = boardToPositionId(state, onRoll);
  const matchId = createMatchId();
  return `${positionId}:${matchId}`;
}
