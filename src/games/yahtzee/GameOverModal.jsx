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
  playerName,
  scorecard,
  finalScore,
  elapsedSeconds,
  anchor,
  onClose,
  onNewGame,
  onViewVerification
}) {
  const [submitStatus, setSubmitStatus] = useState('pending'); // pending, submitting, success, error
  const [errorMessage, setErrorMessage] = useState(null);

  // Calculate score breakdown
  const upperSum = calculateUpperSum(scorecard);
  const upperBonus = calculateUpperBonus(scorecard);
  const upperTotal = calculateUpperTotal(scorecard);
  const lowerTotal = calculateLowerTotal(scorecard);
  const grandTotal = calculateGrandTotal(scorecard);
  const yahtzeeBonuses = (scorecard.yahtzeeBonusCount || 0) * 100;

  // Auto-submit score on mount
  useEffect(() => {
    const submitScore = async () => {
      setSubmitStatus('submitting');
      
      try {
        const response = await fetch('/api/submit-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            game: 'yahtzee',
            gameId,
            score: grandTotal,
            timeSeconds: elapsedSeconds,
            playerName,
            blockHeight: anchor?.blockHeight,
            blockHash: anchor?.blockHash
          })
        });

        if (!response.ok) {
          throw new Error('Failed to submit score');
        }

        setSubmitStatus('success');
      } catch (err) {
        console.error('Score submission failed:', err);
        setSubmitStatus('error');
        setErrorMessage('Leaderboard unavailable. Your game is still blockchain-verified - click "View Verification Proof" to see the proof.');
      }
    };

    submitScore();
  }, [gameId, grandTotal, elapsedSeconds, playerName, anchor]);

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

  const statusStyle = {
    fontSize: '14px',
    padding: '8px 12px',
    borderRadius: '6px',
    marginBottom: '20px',
    backgroundColor: submitStatus === 'success' ? '#e8f5e9' : 
                     submitStatus === 'error' ? '#ffebee' : '#e3f2fd',
    color: submitStatus === 'success' ? '#2e7d32' :
           submitStatus === 'error' ? '#c62828' : '#1565c0'
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

        {/* Player name */}
        <div style={{ color: '#666', marginBottom: '15px' }}>
          {playerName} • {formatTime(elapsedSeconds)}
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

        {/* Submit Status */}
        <div style={statusStyle}>
          {submitStatus === 'submitting' && '⏳ Submitting score...'}
          {submitStatus === 'success' && '✓ Score submitted to leaderboard!'}
          {submitStatus === 'error' && `⚠ ${errorMessage}`}
        </div>

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
