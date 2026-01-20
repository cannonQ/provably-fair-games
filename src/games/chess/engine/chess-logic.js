import { Chess } from 'chess.js';

/**
 * Wrapper around chess.js for game logic
 * Provides clean interface for game state management
 */

/**
 * Creates a new chess game instance
 */
export function createGame(fen = null) {
  return new Chess(fen);
}

/**
 * Checks if a move is legal
 */
export function isLegalMove(game, from, to, promotion) {
  const moves = game.moves({ square: from, verbose: true });
  return moves.some(m => m.to === to && (!promotion || m.promotion === promotion));
}

/**
 * Makes a move on the board
 */
export function makeMove(game, from, to, promotion) {
  try {
    const move = game.move({
      from,
      to,
      promotion: promotion || 'q'
    });
    return move;
  } catch (error) {
    return null;
  }
}

/**
 * Gets all legal moves for a square
 */
export function getLegalMoves(game, square) {
  return game.moves({ square, verbose: true });
}

/**
 * Gets all legal moves in the current position
 */
export function getAllLegalMoves(game) {
  return game.moves({ verbose: true });
}

/**
 * Checks if the game is over
 */
export function isGameOver(game) {
  return game.isGameOver();
}

/**
 * Gets the game result
 */
export function getGameResult(game) {
  if (game.isCheckmate()) {
    return {
      gameOver: true,
      result: game.turn() === 'w' ? '0-1' : '1-0',
      reason: 'checkmate',
      winner: game.turn() === 'w' ? 'black' : 'white'
    };
  }

  if (game.isDraw()) {
    let reason = 'draw';
    if (game.isStalemate()) reason = 'stalemate';
    else if (game.isThreefoldRepetition()) reason = 'threefold repetition';
    else if (game.isInsufficientMaterial()) reason = 'insufficient material';

    return {
      gameOver: true,
      result: '1/2-1/2',
      reason,
      winner: null
    };
  }

  return {
    gameOver: false,
    result: '*',
    reason: null,
    winner: null
  };
}

/**
 * Checks if the current player is in check
 */
export function isInCheck(game) {
  return game.inCheck();
}

/**
 * Gets the current FEN string
 */
export function getFen(game) {
  return game.fen();
}

/**
 * Gets the current turn (w or b)
 */
export function getTurn(game) {
  return game.turn();
}

/**
 * Gets the move history in SAN notation
 */
export function getMoveHistory(game) {
  return game.history();
}

/**
 * Gets the move history with detailed information
 */
export function getVerboseMoveHistory(game) {
  return game.history({ verbose: true });
}

/**
 * Gets the current board position as 2D array
 */
export function getBoard(game) {
  return game.board();
}

/**
 * Gets piece at a specific square
 */
export function getPiece(game, square) {
  return game.get(square);
}

/**
 * Undoes the last move
 */
export function undoMove(game) {
  return game.undo();
}

/**
 * Gets PGN string of the game
 */
export function getPgn(game) {
  return game.pgn();
}

/**
 * Loads a game from PGN
 */
export function loadPgn(pgn) {
  const game = new Chess();
  game.loadPgn(pgn);
  return game;
}

/**
 * Loads a position from FEN
 */
export function loadFen(fen) {
  return new Chess(fen);
}

/**
 * Checks if a piece requires promotion
 */
export function needsPromotion(game, from, to) {
  const piece = game.get(from);
  if (!piece || piece.type !== 'p') return false;

  const fromRank = from[1];
  const toRank = to[1];

  // White pawn moving to rank 8 or black pawn moving to rank 1
  return (piece.color === 'w' && fromRank === '7' && toRank === '8') ||
         (piece.color === 'b' && fromRank === '2' && toRank === '1');
}

/**
 * Converts UCI move to chess.js format
 */
export function uciToMove(game, uci) {
  const from = uci.substring(0, 2);
  const to = uci.substring(2, 4);
  const promotion = uci.length > 4 ? uci[4] : undefined;

  return makeMove(game, from, to, promotion);
}

/**
 * Gets position evaluation (simple material count)
 */
export function evaluatePosition(game) {
  const board = game.board();
  const pieceValues = {
    p: 1,
    n: 3,
    b: 3,
    r: 5,
    q: 9,
    k: 0
  };

  let whiteScore = 0;
  let blackScore = 0;

  board.forEach(row => {
    row.forEach(square => {
      if (square) {
        const value = pieceValues[square.type];
        if (square.color === 'w') {
          whiteScore += value;
        } else {
          blackScore += value;
        }
      }
    });
  });

  return whiteScore - blackScore;
}

/**
 * Converts square notation to coordinates
 */
export function squareToCoords(square) {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = 8 - parseInt(square[1]);
  return { row: rank, col: file };
}

/**
 * Converts coordinates to square notation
 */
export function coordsToSquare(row, col) {
  const file = String.fromCharCode('a'.charCodeAt(0) + col);
  const rank = 8 - row;
  return file + rank;
}
