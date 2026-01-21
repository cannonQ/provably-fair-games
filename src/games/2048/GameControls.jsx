/**
 * 2048 Game Controls - Score display, status messages, and control buttons
 * @module GameControls
 *
 * Mobile-optimized with compact layout
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatScore } from './scoreLogic';

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
  gameId = '',
  anchorBlock = null,
  onSubmitScore,
  scoreSubmitted = false,
  submittedRank = null,
  playerName = '',
  onPlayerNameChange,
  isSubmitting = false
}) => {
  const [modalDismissed, setModalDismissed] = useState(false);
  const showStatus = ((gameStatus === 'won' && !canContinue) || gameStatus === 'lost') && !modalDismissed;

  const handleClose = () => {
    setModalDismissed(true);
  };

  // Reset dismissed state when game status changes (new game)
  React.useEffect(() => {
    if (gameStatus === 'playing') {
      setModalDismissed(false);
    }
  }, [gameStatus]);

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
            {/* Close Button */}
            <button style={styles.closeButton} onClick={handleClose}>×</button>

            <div style={styles.statusTitle}>
              {gameStatus === 'won' ? '🎉 You Won!' : 'Game Over'}
            </div>
            <div style={styles.statusSubtitle}>
              {gameStatus === 'won'
                ? 'You reached 2048!'
                : `Score: ${formatScore(score)}`
              }
            </div>

            {/* Verification Info */}
            {gameId && anchorBlock && (
              <div style={styles.verificationSection}>
                <div style={styles.verificationTitle}>🔗 Provably Fair</div>
                <div style={styles.verificationRow}>
                  <span style={styles.verificationLabel}>Game ID:</span>
                  <span style={styles.verificationValue}>{gameId.slice(0, 12)}...</span>
                </div>
                <div style={styles.verificationRow}>
                  <span style={styles.verificationLabel}>Block:</span>
                  <span style={styles.verificationValue}>#{anchorBlock.blockHeight}</span>
                </div>
                <Link
                  to={`/2048/verify/${gameId}`}
                  state={{ gameId, score, anchorBlock }}
                  style={styles.verifyLink}
                >
                  View Full Verification →
                </Link>
              </div>
            )}

            {/* Score Submission */}
            {!scoreSubmitted && onSubmitScore && (
              <div style={styles.submitSection}>
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

            {scoreSubmitted && (
              <div style={styles.submittedText}>
                ✓ Submitted! {submittedRank ? `Rank #${submittedRank}` : ''}
              </div>
            )}

            <div style={styles.buttonRow}>
              {gameStatus === 'won' && (
                <button style={{ ...styles.button, ...styles.continueButton }} onClick={onContinue}>
                  Continue
                </button>
              )}
              {!scoreSubmitted && onSubmitScore && (
                <button
                  style={{ ...styles.button, ...styles.submitButton }}
                  onClick={onSubmitScore}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              )}
              <button style={{ ...styles.button, ...styles.newGameButton }} onClick={onNewGame}>
                New Game
              </button>
            </div>
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
    width: '100%',
    position: 'relative'
  },
  closeButton: {
    position: 'absolute',
    top: '8px',
    right: '12px',
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '4px 8px',
    lineHeight: 1
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
  verificationSection: {
    backgroundColor: '#0f172a',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '16px',
    textAlign: 'left'
  },
  verificationTitle: {
    fontSize: '0.85rem',
    fontWeight: 'bold',
    color: '#22c55e',
    marginBottom: '8px'
  },
  verificationRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    marginBottom: '4px'
  },
  verificationLabel: {
    color: '#64748b'
  },
  verificationValue: {
    color: '#94a3b8',
    fontFamily: 'monospace'
  },
  verifyLink: {
    display: 'block',
    marginTop: '8px',
    color: '#3b82f6',
    fontSize: '0.8rem',
    textDecoration: 'none'
  },
  submitSection: {
    marginBottom: '12px'
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
  submittedText: {
    color: '#22c55e',
    fontWeight: '600',
    marginBottom: '12px',
    fontSize: '0.9rem'
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
  }
};

export default GameControls;
