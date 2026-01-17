/**
 * 2048 Game Controls - Score display, status messages, and control buttons
 * @module GameControls
 */

import React from 'react';
import { formatScore, getScoreRank } from './scoreLogic';

/**
 * GameControls component
 * @param {Object} props - Component props
 * @param {number} props.score - Current score
 * @param {number} props.highScore - High score
 * @param {number} props.moveCount - Total moves
 * @param {'playing'|'won'|'lost'} props.gameStatus - Current game status
 * @param {boolean} props.canContinue - Can continue after winning
 * @param {function} props.onNewGame - New game handler
 * @param {function} props.onContinue - Continue after win handler
 * @param {function} props.onMove - Move handler (direction)
 * @param {function} props.onSubmitScore - Submit score handler
 * @param {boolean} props.scoreSubmitted - Whether score has been submitted
 * @param {number} props.submittedRank - Rank after submission
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
  submittedRank = null
}) => {
  const styles = {
    container: {
      width: '100%',
      maxWidth: '500px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    },
    scoreSection: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'stretch',
      gap: '10px',
      marginBottom: '15px'
    },
    scoreBox: {
      flex: 1,
      backgroundColor: '#bbada0',
      borderRadius: '6px',
      padding: '10px 15px',
      textAlign: 'center'
    },
    scoreLabel: {
      fontSize: '0.75rem',
      color: '#eee4da',
      textTransform: 'uppercase',
      fontWeight: 'bold',
      marginBottom: '4px'
    },
    scoreValue: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#ffffff'
    },
    highScoreValue: {
      fontSize: '1.25rem',
      fontWeight: 'bold',
      color: '#ffffff'
    },
    moveCount: {
      fontSize: '0.9rem',
      color: '#776e65',
      marginBottom: '10px',
      textAlign: 'center'
    },
    rank: {
      fontSize: '0.8rem',
      color: '#eee4da',
      marginTop: '2px'
    },
    statusOverlay: {
      position: 'relative',
      marginBottom: '15px'
    },
    statusMessage: {
      backgroundColor: 'rgba(238, 228, 218, 0.95)',
      borderRadius: '8px',
      padding: '20px',
      textAlign: 'center'
    },
    wonMessage: {
      backgroundColor: 'rgba(237, 194, 46, 0.95)'
    },
    lostMessage: {
      backgroundColor: 'rgba(238, 228, 218, 0.95)'
    },
    statusTitle: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#776e65',
      marginBottom: '10px'
    },
    statusSubtitle: {
      fontSize: '1rem',
      color: '#776e65',
      marginBottom: '15px'
    },
    buttonRow: {
      display: 'flex',
      gap: '10px',
      justifyContent: 'center',
      flexWrap: 'wrap'
    },
    button: {
      padding: '12px 24px',
      fontSize: '1rem',
      fontWeight: 'bold',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'transform 0.1s, opacity 0.1s'
    },
    newGameButton: {
      backgroundColor: '#8f7a66',
      color: '#f9f6f2'
    },
    continueButton: {
      backgroundColor: '#edc22e',
      color: '#f9f6f2'
    },
    submitButton: {
      backgroundColor: '#4CAF50',
      color: '#f9f6f2'
    },
    submittedText: {
      color: '#4CAF50',
      fontWeight: 'bold',
      marginTop: '10px'
    },
    arrowControls: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '5px',
      marginTop: '15px'
    },
    arrowRow: {
      display: 'flex',
      gap: '5px'
    },
    arrowButton: {
      width: '60px',
      height: '60px',
      fontSize: '1.5rem',
      backgroundColor: '#bbada0',
      color: '#f9f6f2',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color 0.1s'
    },
    arrowPlaceholder: {
      width: '60px',
      height: '60px'
    },
    keyboardHint: {
      fontSize: '0.75rem',
      color: '#9e948a',
      textAlign: 'center',
      marginTop: '10px'
    },
    mobileOnly: {
      display: 'block'
    }
  };

  // Check if touch device
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleButtonHover = (e, isHover) => {
    e.target.style.opacity = isHover ? '0.85' : '1';
  };

  const showStatus = gameStatus === 'won' && !canContinue || gameStatus === 'lost';

  return (
    <div style={styles.container}>
      {/* Score Section */}
      <div style={styles.scoreSection}>
        <div style={styles.scoreBox}>
          <div style={styles.scoreLabel}>Score</div>
          <div style={styles.scoreValue}>{formatScore(score)}</div>
          <div style={styles.rank}>{getScoreRank(score)}</div>
        </div>
        <div style={styles.scoreBox}>
          <div style={styles.scoreLabel}>Best</div>
          <div style={styles.highScoreValue}>{formatScore(highScore)}</div>
        </div>
      </div>

      {/* Move Count */}
      <div style={styles.moveCount}>
        Moves: {moveCount}
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
                ? 'You reached 2048! Keep going?' 
                : `Final Score: ${formatScore(score)}`
              }
            </div>
            <div style={styles.buttonRow}>
              {gameStatus === 'won' && (
                <button
                  style={{ ...styles.button, ...styles.continueButton }}
                  onClick={onContinue}
                  onMouseEnter={(e) => handleButtonHover(e, true)}
                  onMouseLeave={(e) => handleButtonHover(e, false)}
                >
                  Continue
                </button>
              )}
              {!scoreSubmitted && onSubmitScore && (
                <button
                  style={{ ...styles.button, ...styles.submitButton }}
                  onClick={onSubmitScore}
                  onMouseEnter={(e) => handleButtonHover(e, true)}
                  onMouseLeave={(e) => handleButtonHover(e, false)}
                >
                  Submit Score
                </button>
              )}
              <button
                style={{ ...styles.button, ...styles.newGameButton }}
                onClick={onNewGame}
                onMouseEnter={(e) => handleButtonHover(e, true)}
                onMouseLeave={(e) => handleButtonHover(e, false)}
              >
                New Game
              </button>
            </div>
            {scoreSubmitted && (
              <div style={styles.submittedText}>
                ✓ Score submitted! {submittedRank ? `Rank: #${submittedRank}` : ''}
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Game Button (when playing) */}
      {!showStatus && (
        <div style={{ ...styles.buttonRow, marginBottom: '15px' }}>
          <button
            style={{ ...styles.button, ...styles.newGameButton }}
            onClick={onNewGame}
            onMouseEnter={(e) => handleButtonHover(e, true)}
            onMouseLeave={(e) => handleButtonHover(e, false)}
          >
            New Game
          </button>
        </div>
      )}

      {/* Arrow Controls (Mobile) */}
      {isMobile && (
        <div style={styles.arrowControls}>
          <div style={styles.arrowRow}>
            <div style={styles.arrowPlaceholder} />
            <button
              style={styles.arrowButton}
              onClick={() => onMove('up')}
              aria-label="Move Up"
            >
              ↑
            </button>
            <div style={styles.arrowPlaceholder} />
          </div>
          <div style={styles.arrowRow}>
            <button
              style={styles.arrowButton}
              onClick={() => onMove('left')}
              aria-label="Move Left"
            >
              ←
            </button>
            <button
              style={styles.arrowButton}
              onClick={() => onMove('down')}
              aria-label="Move Down"
            >
              ↓
            </button>
            <button
              style={styles.arrowButton}
              onClick={() => onMove('right')}
              aria-label="Move Right"
            >
              →
            </button>
          </div>
        </div>
      )}

      {/* Keyboard Hint (Desktop) */}
      {!isMobile && (
        <div style={styles.keyboardHint}>
          Use arrow keys or WASD to move tiles
        </div>
      )}
    </div>
  );
};

export default GameControls;
