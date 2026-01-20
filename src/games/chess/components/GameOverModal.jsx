import React from 'react';
import VerificationPanel from './VerificationPanel';

/**
 * Game over modal with results and verification
 */
function GameOverModal({ result, gameData, onNewGame, onClose }) {
  if (!result || !result.gameOver) {
    return null;
  }

  const getResultText = () => {
    if (result.winner === 'white') {
      return gameData.playerColor === 'white' ? 'You Won!' : 'You Lost';
    } else if (result.winner === 'black') {
      return gameData.playerColor === 'black' ? 'You Won!' : 'You Lost';
    } else {
      return 'Draw';
    }
  };

  const getResultClass = () => {
    if (result.winner === gameData.playerColor) {
      return 'win';
    } else if (result.winner && result.winner !== gameData.playerColor) {
      return 'loss';
    } else {
      return 'draw';
    }
  };

  const getReasonText = () => {
    switch (result.reason) {
      case 'checkmate':
        return 'by Checkmate';
      case 'stalemate':
        return 'by Stalemate';
      case 'threefold repetition':
        return 'by Threefold Repetition';
      case 'insufficient material':
        return 'by Insufficient Material';
      case 'resignation':
        return 'by Resignation';
      default:
        return '';
    }
  };

  return (
    <div className="modal-overlay">
      <div className="game-over-modal">
        <div className={`result-header ${getResultClass()}`}>
          <h2>{getResultText()}</h2>
          <div className="result-score">{result.result}</div>
          <div className="result-reason">{getReasonText()}</div>
        </div>

        <div className="game-stats">
          <div className="stat-item">
            <span className="stat-label">Your Color</span>
            <span className="stat-value">{gameData.playerColor}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">AI Rating</span>
            <span className="stat-value">{gameData.aiSettings?.targetElo || 'N/A'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Moves</span>
            <span className="stat-value">{gameData.moves?.length || 0}</span>
          </div>
        </div>

        <VerificationPanel gameData={gameData} />

        <div className="modal-actions">
          <button className="action-btn primary" onClick={onNewGame}>
            New Game
          </button>
          <button className="action-btn secondary" onClick={onClose}>
            Review Game
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameOverModal;
