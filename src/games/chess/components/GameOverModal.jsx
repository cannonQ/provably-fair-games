import React, { useState } from 'react';
import VerificationPanel from './VerificationPanel';

/**
 * Game over modal with results, leaderboard submission, and verification
 */
function GameOverModal({ result, gameData, gameId, gameDuration, onNewGame, onClose }) {
  const [playerName, setPlayerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitRank, setSubmitRank] = useState(null);

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

  // Calculate score
  const calculateScore = () => {
    const aiElo = gameData.aiSettings?.targetElo || 1000;
    if (result.winner === gameData.playerColor) {
      // Win: 100 points per 100 ELO
      return Math.floor(100 * (aiElo / 100));
    } else if (result.winner === null) {
      // Draw: 25 points per 100 ELO
      return Math.floor(25 * (aiElo / 100));
    } else {
      // Loss: 10 points per 100 ELO
      return Math.floor(10 * (aiElo / 100));
    }
  };

  const score = calculateScore();

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: 'chess',
          gameId,
          playerName: playerName.trim() || 'Anonymous',
          score,
          timeSeconds: Math.floor(gameDuration / 1000),
          moves: gameData.moves?.length || 0,
          // Blockchain verification data
          blockHeight: gameData.colorAssignment?.blockHeight,
          blockHash: gameData.colorAssignment?.blockHash,
          // Metadata
          metadata: {
            result: result.result,
            reason: result.reason,
            playerColor: gameData.playerColor,
            aiElo: gameData.aiSettings?.targetElo,
            aiSkillLevel: gameData.aiSettings?.skillLevel,
            colorCommitment: gameData.aiCommitment?.commitment,
            aiCommitment: gameData.aiCommitment?.commitment
          }
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Submission failed');
      }

      const responseData = await response.json();
      setSubmitted(true);
      setSubmitRank(responseData.rank);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
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
          <div className="stat-item">
            <span className="stat-label">Score</span>
            <span className="stat-value score-highlight">{score} pts</span>
          </div>
        </div>

        <VerificationPanel gameData={gameData} />

        {/* Leaderboard Submission */}
        {!submitted ? (
          <div className="leaderboard-submit">
            <h3>Submit to Leaderboard?</h3>
            <div className="submit-row">
              <input
                type="text"
                className="name-input"
                placeholder="Your name (optional)"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
              />
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="submit-btn"
              >
                {submitting ? 'Submitting...' : 'Submit Score'}
              </button>
            </div>
            {submitError && <p className="submit-error">{submitError}</p>}
          </div>
        ) : (
          <div className="submit-success">
            ✓ Submitted! You ranked #{submitRank}
          </div>
        )}

        {/* Verification Link - Opens in new tab */}
        {gameId && (
          <div className="verify-link">
            <a
              href={`/verify/chess/${gameId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="verify-link-btn"
            >
              🔗 Verify this game on blockchain
            </a>
          </div>
        )}

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
