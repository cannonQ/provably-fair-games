/**
 * Game Over Modal Component
 * 
 * Displays game results, score breakdown, and leaderboard submission.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GameOverModal = ({
  gameId,
  winner,
  winType,
  finalScore,
  cubeValue,
  difficulty,
  duration,
  blockchainData,
  onNewGame,
  onViewVerification
}) => {
  const navigate = useNavigate();
  
  // Local state
  const [playerName, setPlayerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitRank, setSubmitRank] = useState(null);

  const playerWon = winner === 'white';
  const timeSeconds = Math.floor(duration / 1000);
  const timeFormatted = `${Math.floor(timeSeconds / 60)}:${(timeSeconds % 60).toString().padStart(2, '0')}`;

  // Score breakdown
  const winTypeMultipliers = { normal: 1, gammon: 2, backgammon: 3 };
  const difficultyBonuses = { easy: 1, normal: 2, hard: 3 };
  const winTypeMult = winTypeMultipliers[winType] || 1;
  const diffBonus = difficultyBonuses[difficulty] || 1;

  // Submit score to leaderboard
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: 'backgammon',
          gameId,
          playerName: playerName.trim() || 'Anonymous',
          score: finalScore,
          timeSeconds,
          moves: 0,
          blockHeight: blockchainData?.blockHeight,
          blockHash: blockchainData?.blockHash,
          txHash: blockchainData?.txHash,
          blockTimestamp: blockchainData?.timestamp
        })
      });

      if (!response.ok) throw new Error('Submission failed');
      const result = await response.json();
      setSubmitted(true);
      setSubmitRank(result.rank);
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit score');
    } finally {
      setSubmitting(false);
    }
  };

  // Styles
  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  };

  const modalStyle = {
    backgroundColor: '#2a2a4a',
    borderRadius: '16px',
    padding: '30px',
    maxWidth: '450px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '25px'
  };

  const titleStyle = {
    fontSize: '36px',
    fontWeight: 'bold',
    color: playerWon ? '#4CAF50' : '#f44336',
    marginBottom: '5px'
  };

  const sectionStyle = {
    backgroundColor: '#1a1a2e',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px'
  };

  const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #333'
  };

  const labelStyle = {
    color: '#888'
  };

  const valueStyle = {
    fontWeight: 'bold',
    color: '#fff'
  };

  const scoreStyle = {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#ffd700',
    textAlign: 'center',
    margin: '15px 0'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    borderRadius: '8px',
    border: '2px solid #444',
    backgroundColor: '#1a1a2e',
    color: '#fff',
    marginBottom: '15px',
    boxSizing: 'border-box'
  };

  const buttonStyle = (color) => ({
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: color,
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    width: '100%',
    marginBottom: '10px'
  });

  const winTypeDisplay = {
    normal: 'Normal Win',
    gammon: 'Gammon! 🎯',
    backgammon: 'BACKGAMMON! 🏆'
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={titleStyle}>
            {playerWon ? '🎉 Victory!' : '😔 Defeat'}
          </div>
          <div style={{ color: '#888', fontSize: '14px' }}>
            Game: {gameId}
          </div>
        </div>

        {/* Game Summary */}
        <div style={sectionStyle}>
          <h3 style={{ color: '#ffd700', marginBottom: '15px', marginTop: 0 }}>
            Game Summary
          </h3>
          <div style={rowStyle}>
            <span style={labelStyle}>Winner</span>
            <span style={valueStyle}>{playerWon ? 'You' : 'AI'}</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Win Type</span>
            <span style={{ ...valueStyle, color: winType === 'backgammon' ? '#ffd700' : '#fff' }}>
              {winTypeDisplay[winType]}
            </span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Difficulty</span>
            <span style={valueStyle}>{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Cube Value</span>
            <span style={valueStyle}>{cubeValue}x</span>
          </div>
          <div style={{ ...rowStyle, borderBottom: 'none' }}>
            <span style={labelStyle}>Time</span>
            <span style={valueStyle}>{timeFormatted}</span>
          </div>
        </div>

        {/* Score Breakdown */}
        {playerWon && (
          <div style={sectionStyle}>
            <h3 style={{ color: '#ffd700', marginBottom: '15px', marginTop: 0 }}>
              Score Breakdown
            </h3>
            <div style={rowStyle}>
              <span style={labelStyle}>Win Type ({winType})</span>
              <span style={valueStyle}>{winTypeMult}x</span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>Cube Value</span>
              <span style={valueStyle}>{cubeValue}x</span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>Difficulty ({difficulty})</span>
              <span style={valueStyle}>{diffBonus}x</span>
            </div>
            <div style={scoreStyle}>
              {finalScore} pts
            </div>
            <div style={{ textAlign: 'center', color: '#888', fontSize: '12px' }}>
              {winTypeMult} × {cubeValue} × {diffBonus} = {finalScore}
            </div>
          </div>
        )}

        {/* Leaderboard Submission */}
        {playerWon && !submitted && (
          <div style={sectionStyle}>
            <h3 style={{ color: '#ffd700', marginBottom: '15px', marginTop: 0 }}>
              Submit to Leaderboard
            </h3>
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              style={inputStyle}
              maxLength={20}
            />
            <button
              style={{ ...buttonStyle('#4CAF50'), opacity: submitting ? 0.7 : 1 }}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Score'}
            </button>
            <div style={{ textAlign: 'center', color: '#666', fontSize: '12px' }}>
              Ranked by points, time as tiebreaker
            </div>
            {submitError && (
              <div style={{ color: '#f44336', textAlign: 'center', marginTop: '10px' }}>
                {submitError}
              </div>
            )}
          </div>
        )}

        {/* Submission Success */}
        {submitted && (
          <div style={{ ...sectionStyle, textAlign: 'center' }}>
            <div style={{ fontSize: '24px', color: '#4CAF50', marginBottom: '10px' }}>
              ✓ Score Submitted!
            </div>
            {submitRank && (
              <div style={{ color: '#ffd700', fontSize: '18px' }}>
                Your rank: #{submitRank}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ marginTop: '20px' }}>
          <button style={buttonStyle('#1976D2')} onClick={onNewGame}>
            🎲 Play Again
          </button>
          <button
            style={buttonStyle('#666')}
            onClick={() => navigate('/backgammon/leaderboard')}
          >
            🏆 View Leaderboard
          </button>
          <button
            style={{ ...buttonStyle('transparent'), border: '1px solid #4CAF50', color: '#4CAF50' }}
            onClick={onViewVerification}
          >
            🔗 Verify on Blockchain
          </button>
          <button
            style={{ ...buttonStyle('transparent'), border: '1px solid #888', color: '#888' }}
            onClick={() => navigate('/')}
          >
            🏠 Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverModal;
