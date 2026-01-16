/**
 * GameOverModal Component for Yahtzee
 * Displays final results and submits score to leaderboard
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  calculateUpperSum,
  calculateUpperBonus,
  calculateUpperTotal,
  calculateLowerTotal,
  calculateGrandTotal
} from './scoringLogic';

function GameOverModal({
  gameId,
  playerName: initialPlayerName,
  scorecard,
  finalScore,
  elapsedSeconds,
  anchor,
  onClose,
  onNewGame,
  onViewVerification
}) {
  const [playerName, setPlayerName] = useState(initialPlayerName || '');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitRank, setSubmitRank] = useState(null);

  // Calculate score breakdown
  const upperSum = calculateUpperSum(scorecard);
  const upperBonus = calculateUpperBonus(scorecard);
  const upperTotal = calculateUpperTotal(scorecard);
  const lowerTotal = calculateLowerTotal(scorecard);
  const grandTotal = calculateGrandTotal(scorecard);
  const yahtzeeBonuses = (scorecard.yahtzeeBonusCount || 0) * 100;

  // Submit score to leaderboard
  const handleSubmitScore = async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: 'yahtzee',
          gameId,
          score: grandTotal,
          timeSeconds: elapsedSeconds,
          moves: 0,
          playerName: playerName.trim() || 'Anonymous',
          blockHeight: anchor?.blockHeight,
          blockHash: anchor?.blockHash,
          txHash: anchor?.txHash,
          blockTimestamp: anchor?.timestamp
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit score');
      }

      const result = await response.json();
      setSubmitted(true);
      setSubmitRank(result.rank);
    } catch (err) {
      console.error('Score submission failed:', err);
      setSubmitError(err.message || 'Leaderboard unavailable. Your game is still blockchain-verified.');
    } finally {
      setSubmitting(false);
    }
  };

  // Check for high score (300+ is excellent in Yahtzee)
  const isHighScore = grandTotal >= 300;
  const isExcellent = grandTotal >= 250;

  // Styles
  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  };

  const modalStyle = {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '30px',
    maxWidth: '420px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
    position: 'relative'
  };

  const headerStyle = {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: isHighScore ? '#ff9800' : '#333'
  };

  const scoreStyle = {
    fontSize: '56px',
    fontWeight: 'bold',
    color: isHighScore ? '#4caf50' : isExcellent ? '#1976d2' : '#333',
    marginBottom: '5px'
  };

  const breakdownStyle = {
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    padding: '15px',
    margin: '20px 0',
    textAlign: 'left'
  };

  const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    borderBottom: '1px solid #e0e0e0'
  };

  const totalRowStyle = {
    ...rowStyle,
    fontWeight: 'bold',
    borderBottom: 'none',
    paddingTop: '10px',
    marginTop: '5px',
    borderTop: '2px solid #333'
  };

  const buttonContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  };

  const primaryButtonStyle = {
    backgroundColor: '#4caf50',
    color: '#fff',
    border: 'none',
    padding: '14px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    borderRadius: '8px',
    cursor: 'pointer',
    width: '100%'
  };

  const secondaryButtonStyle = {
    backgroundColor: '#1976d2',
    color: '#fff',
    border: 'none',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '500',
    borderRadius: '8px',
    cursor: 'pointer',
    width: '100%'
  };

  const linkButtonStyle = {
    backgroundColor: 'transparent',
    color: '#1976d2',
    border: '1px solid #1976d2',
    padding: '10px 20px',
    fontSize: '14px',
    borderRadius: '8px',
    cursor: 'pointer',
    width: '100%',
    textDecoration: 'none',
    display: 'block',
    boxSizing: 'border-box'
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          {isHighScore ? '🏆 Amazing Game!' : isExcellent ? '🎉 Great Game!' : '🎲 Game Over!'}
        </div>

        {/* Time */}
        <div style={{ color: '#666', marginBottom: '15px' }}>
          {formatTime(elapsedSeconds)}
        </div>

        {/* Final Score */}
        <div style={scoreStyle}>{grandTotal}</div>
        <div style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
          Final Score
        </div>

        {/* Score Breakdown */}
        <div style={breakdownStyle}>
          <div style={rowStyle}>
            <span>Upper Section</span>
            <span>{upperSum}</span>
          </div>
          <div style={rowStyle}>
            <span>Upper Bonus</span>
            <span style={{ color: upperBonus > 0 ? '#2e7d32' : '#999' }}>
              {upperBonus > 0 ? `+${upperBonus}` : '+0'}
            </span>
          </div>
          <div style={rowStyle}>
            <span>Lower Section</span>
            <span>{lowerTotal - yahtzeeBonuses}</span>
          </div>
          {yahtzeeBonuses > 0 && (
            <div style={rowStyle}>
              <span>Yahtzee Bonuses</span>
              <span style={{ color: '#e65100' }}>+{yahtzeeBonuses}</span>
            </div>
          )}
          <div style={totalRowStyle}>
            <span>Grand Total</span>
            <span>{grandTotal}</span>
          </div>
        </div>

        {/* Submission Form */}
        {!submitted ? (
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
            <p style={{ fontSize: '14px', marginBottom: '10px', color: '#666' }}>
              Submit to Leaderboard:
            </p>
            <input
              type="text"
              placeholder="Your name (optional)"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                marginBottom: '10px',
                boxSizing: 'border-box'
              }}
            />
            <button
              onClick={handleSubmitScore}
              disabled={submitting}
              style={{
                ...primaryButtonStyle,
                backgroundColor: submitting ? '#ccc' : '#4caf50',
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'Submitting...' : '📤 Submit Score'}
            </button>
            {submitError && (
              <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '6px', fontSize: '13px' }}>
                ⚠ {submitError}
              </div>
            )}
          </div>
        ) : (
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '8px' }}>
            <div style={{ color: '#2e7d32', fontSize: '14px', fontWeight: '500' }}>
              ✓ Score submitted to leaderboard!
            </div>
            {submitRank && (
              <div style={{ color: '#555', fontSize: '13px', marginTop: '5px' }}>
                Your rank: #{submitRank}
              </div>
            )}
          </div>
        )}

        {/* Buttons */}
        <div style={buttonContainerStyle}>
          <button style={primaryButtonStyle} onClick={onNewGame}>
            Play Again
          </button>

          <button style={secondaryButtonStyle} onClick={onViewVerification}>
            View Verification Proof
          </button>

          <Link to="/leaderboard?game=yahtzee" style={linkButtonStyle}>
            View Leaderboard
          </Link>
        </div>

        {/* Game ID */}
        <div style={{ fontSize: '11px', color: '#999', marginTop: '15px' }}>
          Game ID: {gameId}
        </div>
      </div>
    </div>
  );
}

GameOverModal.propTypes = {
  gameId: PropTypes.string.isRequired,
  playerName: PropTypes.string.isRequired,
  scorecard: PropTypes.object.isRequired,
  finalScore: PropTypes.number.isRequired,
  elapsedSeconds: PropTypes.number.isRequired,
  anchor: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onNewGame: PropTypes.func.isRequired,
  onViewVerification: PropTypes.func.isRequired
};

export default GameOverModal;
