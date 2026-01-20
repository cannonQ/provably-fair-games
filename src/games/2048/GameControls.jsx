/**
 * 2048 Game Controls - Score display, status messages, and control buttons
 * @module GameControls
 *
 * Mobile-optimized with compact layout
 */

import React from 'react';
import { formatScore, getScoreRank } from './scoreLogic';

/**
 * GameControls component - Compact mobile-first design
 */
const GameControls = ({
  score = 0,
  highScore = 0,
  moveCount = 0,
  gameStatus = 'playing',
  canContinue = false,
  onNewGame,
  onContinue,
  onMove,
  onSubmitScore,
  scoreSubmitted = false,
  submittedRank = null,
  playerName = '',
  onPlayerNameChange
}) => {
  const showStatus = (gameStatus === 'won' && !canContinue) || gameStatus === 'lost';

  return (
    <div style={styles.container}>
      {/* Score Section - Compact horizontal layout */}
      <div style={styles.scoreSection}>
        <div style={styles.scoreBox}>
          <div style={styles.scoreLabel}>SCORE</div>
          <div style={styles.scoreValue}>{formatScore(score)}</div>
        </div>
        <div style={styles.scoreBox}>
          <div style={styles.scoreLabel}>BEST</div>
          <div style={styles.highScoreValue}>{formatScore(highScore)}</div>
        </div>
      </div>

      {/* Status Messages */}
      {showStatus && (
        <div style={styles.statusOverlay}>
          <div style={{
            ...styles.statusMessage,
            ...(gameStatus === 'won' ? styles.wonMessage : styles.lostMessage)
          }}>
            <div style={styles.statusTitle}>
              {gameStatus === 'won' ? '🎉 You Won!' : 'Game Over'}
            </div>
            <div style={styles.statusSubtitle}>
              {gameStatus === 'won'
                ? 'You reached 2048!'
                : `Score: ${formatScore(score)}`
              }
            </div>
            {/* Name input for score submission */}
            {!scoreSubmitted && onSubmitScore && (
              <div style={styles.nameInputRow}>
                <input
                  type="text"
                  placeholder="Your name"
                  value={playerName}
                  onChange={(e) => onPlayerNameChange && onPlayerNameChange(e.target.value)}
                  style={styles.nameInput}
                  maxLength={20}
                />
              </div>
            )}
            <div style={styles.buttonRow}>
              {gameStatus === 'won' && (
                <button style={{ ...styles.button, ...styles.continueButton }} onClick={onContinue}>
                  Continue
                </button>
              )}
              {!scoreSubmitted && onSubmitScore && (
                <button style={{ ...styles.button, ...styles.submitButton }} onClick={onSubmitScore}>
                  Submit
                </button>
              )}
              <button style={{ ...styles.button, ...styles.newGameButton }} onClick={onNewGame}>
                New Game
              </button>
            </div>
            {scoreSubmitted && (
              <div style={styles.submittedText}>
                ✓ Submitted! {submittedRank ? `Rank #${submittedRank}` : ''}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Compact mobile-first styles
const styles = {
  container: {
    width: '100%',
    maxWidth: '400px',
    margin: '0 auto 12px',
    fontFamily: 'system-ui, sans-serif'
  },
  scoreSection: {
    display: 'flex',
    gap: '8px'
  },
  scoreBox: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: '8px',
    padding: '8px 12px',
    textAlign: 'center'
  },
  scoreLabel: {
    fontSize: '0.65rem',
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    letterSpacing: '0.5px'
  },
  scoreValue: {
    fontSize: 'clamp(1.25rem, 5vw, 1.5rem)',
    fontWeight: 'bold',
    color: '#f1f5f9'
  },
  highScoreValue: {
    fontSize: 'clamp(1.25rem, 5vw, 1.5rem)',
    fontWeight: 'bold',
    color: '#94a3b8'
  },
  statusOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  statusMessage: {
    backgroundColor: '#1e293b',
    borderRadius: '16px',
    padding: '24px',
    textAlign: 'center',
    border: '2px solid #334155',
    maxWidth: '320px',
    width: '100%'
  },
  wonMessage: {
    borderColor: '#22c55e'
  },
  lostMessage: {
    borderColor: '#ef4444'
  },
  statusTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: '8px'
  },
  statusSubtitle: {
    fontSize: '1rem',
    color: '#94a3b8',
    marginBottom: '16px'
  },
  buttonRow: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  button: {
    padding: '10px 20px',
    fontSize: '0.9rem',
    fontWeight: '600',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    touchAction: 'manipulation'
  },
  newGameButton: {
    backgroundColor: '#334155',
    color: '#f1f5f9'
  },
  continueButton: {
    backgroundColor: '#22c55e',
    color: '#fff'
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    color: '#fff'
  },
  submittedText: {
    color: '#22c55e',
    fontWeight: '600',
    marginTop: '12px',
    fontSize: '0.9rem'
  },
  nameInput: {
    padding: '10px 12px',
    fontSize: '0.9rem',
    border: '2px solid #334155',
    borderRadius: '8px',
    width: '100%',
    maxWidth: '200px',
    textAlign: 'center',
    outline: 'none',
    backgroundColor: '#0f172a',
    color: '#f1f5f9'
  },
  nameInputRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px'
  }
};

export default GameControls;
