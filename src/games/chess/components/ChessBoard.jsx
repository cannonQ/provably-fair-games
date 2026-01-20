import React, { useState, useRef } from 'react';
import { getLegalMoves, isInCheck } from '../engine/chess-logic';

/**
 * Chess board component with drag-drop and click-click functionality
 */
function ChessBoard({
  game,
  playerColor,
  onMove,
  onPromotionNeeded,
  disabled,
  lastMove,
  flipped
}) {
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [draggedPiece, setDraggedPiece] = useState(null);

  const boardRef = useRef(null);

  const board = game.board();
  const isPlayerTurn = game.turn() === (playerColor === 'white' ? 'w' : 'b');
  const inCheck = isInCheck(game);

  // Get piece symbol
  const getPieceSymbol = (piece) => {
    if (!piece) return null;

    const symbols = {
      k: { w: '♔', b: '♚' },
      q: { w: '♕', b: '♛' },
      r: { w: '♖', b: '♜' },
      b: { w: '♗', b: '♝' },
      n: { w: '♘', b: '♞' },
      p: { w: '♙', b: '♟' }
    };

    return symbols[piece.type]?.[piece.color] || '';
  };

  // Convert row/col to square notation
  const toSquare = (row, col) => {
    const file = String.fromCharCode('a'.charCodeAt(0) + col);
    const rank = 8 - row;
    return file + rank;
  };

  // Handle square click
  const handleSquareClick = (row, col) => {
    if (disabled) return;

    const square = toSquare(row, col);
    const piece = board[row][col];

    // If a square is already selected
    if (selectedSquare) {
      // Check if clicked square is a legal move
      const isLegal = legalMoves.some(m => m.to === square);

      if (isLegal) {
        // Check if promotion is needed
        const movingPiece = game.get(selectedSquare);
        if (movingPiece?.type === 'p') {
          const toRank = square[1];
          if ((movingPiece.color === 'w' && toRank === '8') ||
              (movingPiece.color === 'b' && toRank === '1')) {
            onPromotionNeeded(selectedSquare, square);
            setSelectedSquare(null);
            setLegalMoves([]);
            return;
          }
        }

        // Make the move
        onMove(selectedSquare, square);
        setSelectedSquare(null);
        setLegalMoves([]);
      } else if (piece && piece.color === (playerColor === 'white' ? 'w' : 'b')) {
        // Select a new piece
        selectSquare(square);
      } else {
        // Deselect
        setSelectedSquare(null);
        setLegalMoves([]);
      }
    } else {
      // No square selected, select this one if it has a piece
      if (piece && piece.color === (playerColor === 'white' ? 'w' : 'b')) {
        selectSquare(square);
      }
    }
  };

  const selectSquare = (square) => {
    const moves = getLegalMoves(game, square);
    setSelectedSquare(square);
    setLegalMoves(moves);
  };

  // Drag handlers
  const handleDragStart = (e, row, col) => {
    if (disabled) {
      e.preventDefault();
      return;
    }

    const square = toSquare(row, col);
    const piece = board[row][col];

    if (!piece || piece.color !== (playerColor === 'white' ? 'w' : 'b')) {
      e.preventDefault();
      return;
    }

    const moves = getLegalMoves(game, square);
    setDraggedPiece({ square, row, col });
    setLegalMoves(moves);

    // Set drag image
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', square);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, row, col) => {
    e.preventDefault();

    if (!draggedPiece) return;

    const targetSquare = toSquare(row, col);
    const isLegal = legalMoves.some(m => m.to === targetSquare);

    if (isLegal) {
      // Check if promotion is needed
      const movingPiece = game.get(draggedPiece.square);
      if (movingPiece?.type === 'p') {
        const rank = targetSquare[1];
        if ((movingPiece.color === 'w' && rank === '8') ||
            (movingPiece.color === 'b' && rank === '1')) {
          onPromotionNeeded(draggedPiece.square, targetSquare);
          setDraggedPiece(null);
          setLegalMoves([]);
          return;
        }
      }

      onMove(draggedPiece.square, targetSquare);
    }

    setDraggedPiece(null);
    setLegalMoves([]);
  };

  const handleDragEnd = () => {
    setDraggedPiece(null);
    setLegalMoves([]);
  };

  // Check if square is highlighted
  const isHighlighted = (row, col) => {
    const square = toSquare(row, col);
    return legalMoves.some(m => m.to === square);
  };

  const isLastMove = (row, col) => {
    if (!lastMove) return false;
    const square = toSquare(row, col);
    return square === lastMove.from || square === lastMove.to;
  };

  const isKingInCheck = (row, col) => {
    const piece = board[row][col];
    if (!piece || piece.type !== 'k') return false;
    return inCheck && piece.color === game.turn();
  };

  const getSquareClass = (row, col) => {
    const isLight = (row + col) % 2 === 0;
    const classes = ['chess-square', isLight ? 'light' : 'dark'];

    const square = toSquare(row, col);

    if (selectedSquare === square) {
      classes.push('selected');
    }

    if (isHighlighted(row, col)) {
      classes.push('legal-move');
    }

    if (isLastMove(row, col)) {
      classes.push('last-move');
    }

    if (isKingInCheck(row, col)) {
      classes.push('in-check');
    }

    return classes.join(' ');
  };

  // Render board (flipped for black player)
  const renderBoard = () => {
    const rows = [];
    const startRow = flipped ? 7 : 0;
    const endRow = flipped ? -1 : 8;
    const rowIncrement = flipped ? -1 : 1;

    for (let row = startRow; row !== endRow; row += rowIncrement) {
      const squares = [];
      const startCol = flipped ? 7 : 0;
      const endCol = flipped ? -1 : 8;
      const colIncrement = flipped ? -1 : 1;

      for (let col = startCol; col !== endCol; col += colIncrement) {
        const piece = board[row][col];
        const square = toSquare(row, col);

        squares.push(
          <div
            key={square}
            className={getSquareClass(row, col)}
            onClick={() => handleSquareClick(row, col)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, row, col)}
          >
            <div className="square-label">
              {col === (flipped ? 7 : 0) && <span className="rank-label">{8 - row}</span>}
              {row === (flipped ? 0 : 7) && (
                <span className="file-label">
                  {String.fromCharCode('a'.charCodeAt(0) + col)}
                </span>
              )}
            </div>

            {piece && (
              <div
                className={`chess-piece ${piece.color}`}
                draggable={!disabled && isPlayerTurn}
                onDragStart={(e) => handleDragStart(e, row, col)}
                onDragEnd={handleDragEnd}
              >
                {getPieceSymbol(piece)}
              </div>
            )}

            {isHighlighted(row, col) && !piece && (
              <div className="move-indicator" />
            )}
            {isHighlighted(row, col) && piece && (
              <div className="capture-indicator" />
            )}
          </div>
        );
      }

      rows.push(
        <div key={row} className="chess-row">
          {squares}
        </div>
      );
    }

    return rows;
  };

  return (
    <div className={`chess-board ${disabled ? 'disabled' : ''}`} ref={boardRef}>
      {renderBoard()}
    </div>
  );
}

export default ChessBoard;
