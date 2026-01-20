import React from 'react';

/**
 * Modal for pawn promotion piece selection
 */
function PromotionModal({ color, onSelect, onCancel }) {
  const pieces = [
    { type: 'q', name: 'Queen', symbol: color === 'white' ? '♕' : '♛' },
    { type: 'r', name: 'Rook', symbol: color === 'white' ? '♖' : '♜' },
    { type: 'b', name: 'Bishop', symbol: color === 'white' ? '♗' : '♝' },
    { type: 'n', name: 'Knight', symbol: color === 'white' ? '♘' : '♞' }
  ];

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="promotion-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Choose Promotion</h3>
        <div className="promotion-pieces">
          {pieces.map(piece => (
            <button
              key={piece.type}
              className={`promotion-piece ${color}`}
              onClick={() => onSelect(piece.type)}
            >
              <span className="piece-symbol">{piece.symbol}</span>
              <span className="piece-name">{piece.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PromotionModal;
