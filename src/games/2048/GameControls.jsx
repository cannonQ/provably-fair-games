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
  const [showVerification, setShowVerification] = useState(false);
  const [showFullBlockHash, setShowFullBlockHash] = useState(false);
  const [showFullTxHash, setShowFullTxHash] = useState(false);
  const [showSeedDetails, setShowSeedDetails] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');
  const showStatus = ((gameStatus === 'won' && !canContinue) || gameStatus === 'lost') && !modalDismissed;

  // Helper functions for verification
  const truncateHash = (hash) => {
    if (!hash || hash.length <= 24) return hash || 'N/A';
    return `${hash.slice(0, 10)}...${hash.slice(-10)}`;
  };

  const formatDate = (ts) => {
    if (!ts) return 'Unknown';
    return new Date(ts).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  };

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(`${label} copied!`);
      setTimeout(() => setCopyFeedback(''), 2000);
    } catch (err) {
      setCopyFeedback('Copy failed');
      setTimeout(() => setCopyFeedback(''), 2000);
    }
  };

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
              {gameId && anchorBlock && (
                <button style={{ ...styles.button, ...styles.verifyButton }} onClick={() => setShowVerification(true)}>
                  Verify
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {showVerification && anchorBlock && (
        <div style={verifyStyles.overlay}>
          <div style={verifyStyles.modal}>
            <button style={verifyStyles.closeBtn} onClick={() => setShowVerification(false)}>×</button>

            {/* Game Summary */}
            <div style={verifyStyles.section}>
              <h3 style={verifyStyles.sectionTitle}>Game Summary</h3>
              <div style={verifyStyles.row}>
                <span style={verifyStyles.label}>Game ID:</span>
                <span style={verifyStyles.mono}>{gameId}</span>
                <button style={verifyStyles.copyBtn} onClick={() => copyToClipboard(gameId, 'Game ID')}>Copy</button>
              </div>
              <div style={verifyStyles.row}>
                <span style={verifyStyles.label}>Result:</span>
                <span style={gameStatus === 'won' ? verifyStyles.win : verifyStyles.loss}>
                  {gameStatus === 'won' ? '🏆 Victory!' : '📉 Game Over'}
                </span>
              </div>
              <div style={verifyStyles.row}>
                <span style={verifyStyles.label}>Score:</span>
                <span>{formatScore(score)} points</span>
              </div>
              <div style={verifyStyles.row}>
                <span style={verifyStyles.label}>Played:</span>
                <span>{formatDate(anchorBlock?.timestamp)}</span>
              </div>
            </div>

            {/* Blockchain Proof */}
            <div style={verifyStyles.section}>
              <h3 style={verifyStyles.sectionTitle}>Blockchain Proof</h3>
              <div style={verifyStyles.row}>
                <span style={verifyStyles.label}>Block Height:</span>
                <span style={verifyStyles.mono}>{anchorBlock?.blockHeight?.toLocaleString()}</span>
              </div>
              <div style={verifyStyles.row}>
                <span style={verifyStyles.label}>Block Hash:</span>
                <span style={verifyStyles.mono}>
                  {showFullBlockHash ? anchorBlock?.blockHash : truncateHash(anchorBlock?.blockHash)}
                </span>
                <button style={verifyStyles.copyBtn} onClick={() => setShowFullBlockHash(!showFullBlockHash)}>
                  {showFullBlockHash ? 'Hide' : 'Full'}
                </button>
                <button style={verifyStyles.copyBtn} onClick={() => copyToClipboard(anchorBlock?.blockHash, 'Block Hash')}>
                  Copy
                </button>
              </div>

              {/* Anti-Spoofing Box */}
              <div style={verifyStyles.antiSpoofBox}>
                <div style={verifyStyles.antiSpoofHeader}>🛡️ Anti-Spoofing Data</div>
                <div style={verifyStyles.row}>
                  <span style={verifyStyles.label}>TX Hash:</span>
                  <span style={verifyStyles.mono}>
                    {showFullTxHash ? anchorBlock?.txHash : truncateHash(anchorBlock?.txHash)}
                  </span>
                  {anchorBlock?.txHash && (
                    <>
                      <button style={verifyStyles.copyBtn} onClick={() => setShowFullTxHash(!showFullTxHash)}>
                        {showFullTxHash ? 'Hide' : 'Full'}
                      </button>
                      <button style={verifyStyles.copyBtn} onClick={() => copyToClipboard(anchorBlock?.txHash, 'TX Hash')}>
                        Copy
                      </button>
                    </>
                  )}
                </div>
                <div style={verifyStyles.row}>
                  <span style={verifyStyles.label}>TX Index:</span>
                  <span style={verifyStyles.mono}>{anchorBlock?.txIndex} of {anchorBlock?.txCount || '?'}</span>
                </div>
                <div style={verifyStyles.row}>
                  <span style={verifyStyles.label}>Timestamp:</span>
                  <span style={verifyStyles.mono}>{anchorBlock?.timestamp}</span>
                </div>
                <p style={verifyStyles.antiSpoofNote}>TX selected deterministically: index = timestamp % txCount</p>
              </div>

              {/* Explorer Links */}
              <div style={verifyStyles.explorerLinks}>
                <a
                  href={`https://explorer.ergoplatform.com/en/blocks/${anchorBlock?.blockHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={verifyStyles.explorerLink}
                >
                  🔗 View Block
                </a>
                {anchorBlock?.txHash && (
                  <a
                    href={`https://explorer.ergoplatform.com/en/transactions/${anchorBlock?.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={verifyStyles.explorerLink}
                  >
                    🔗 View Transaction
                  </a>
                )}
              </div>
            </div>

            {/* Tile Spawn Verification */}
            <div style={verifyStyles.section}>
              <h3 style={verifyStyles.sectionTitle}>Tile Spawn Verification</h3>
              <p style={verifyStyles.info}>
                All tile spawns (position and value) are generated from the blockchain seed.
                The seed combines block hash + transaction hash + timestamp + game ID.
              </p>

              <div
                style={verifyStyles.collapsibleTitle}
                onClick={() => setShowSeedDetails(!showSeedDetails)}
              >
                {showSeedDetails ? '▼' : '▶'} View Seed Formula
              </div>
              {showSeedDetails && (
                <div style={verifyStyles.seedDetails}>
                  <code style={verifyStyles.codeBlock}>
                    seed = HASH(blockHash + txHash + timestamp + gameId + txIndex)
                  </code>
                  <p style={verifyStyles.seedNote}>5 independent inputs = virtually impossible to manipulate</p>
                </div>
              )}
            </div>

            {/* Full Verification Link */}
            <div style={verifyStyles.fullLink}>
              <Link to={`/verify/2048/${gameId}`} style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '0.9rem' }}>
                View Full Verification Page →
              </Link>
            </div>

            {/* Copy Toast */}
            {copyFeedback && <div style={verifyStyles.toast}>{copyFeedback}</div>}
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
  },
  verifyButton: {
    backgroundColor: '#f59e0b',
    color: '#fff'
  }
};

// Verification modal styles
const verifyStyles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.95)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1100,
    padding: '16px'
  },
  modal: {
    backgroundColor: '#1e293b',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    position: 'relative'
  },
  closeBtn: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: '1.5rem',
    cursor: 'pointer',
    lineHeight: 1,
    padding: '4px 8px',
    borderRadius: '4px'
  },
  section: {
    backgroundColor: '#16213e',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem',
    border: '1px solid #2a3a5e'
  },
  sectionTitle: {
    margin: '0 0 0.75rem 0',
    fontSize: '1rem',
    color: '#a0a0ff',
    borderBottom: '1px solid #2a3a5e',
    paddingBottom: '0.5rem'
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
    flexWrap: 'wrap'
  },
  label: {
    color: '#888',
    minWidth: '90px',
    fontSize: '0.85rem'
  },
  mono: {
    fontFamily: 'monospace',
    backgroundColor: '#0d1a0d',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.8rem',
    wordBreak: 'break-all',
    color: '#a5b4fc'
  },
  copyBtn: {
    padding: '0.2rem 0.4rem',
    fontSize: '0.65rem',
    backgroundColor: '#2a3a5e',
    color: '#aaa',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  win: { color: '#4ade80', fontWeight: 'bold' },
  loss: { color: '#f87171' },
  antiSpoofBox: {
    backgroundColor: '#1a2a1a',
    border: '1px solid #2a4a2a',
    borderRadius: '6px',
    padding: '0.75rem',
    margin: '0.75rem 0'
  },
  antiSpoofHeader: {
    color: '#4ade80',
    fontWeight: 'bold',
    fontSize: '0.85rem',
    marginBottom: '0.5rem'
  },
  antiSpoofNote: {
    color: '#666',
    fontSize: '0.7rem',
    margin: '0.5rem 0 0 0',
    fontStyle: 'italic'
  },
  explorerLinks: {
    display: 'flex',
    gap: '1rem',
    marginTop: '0.75rem',
    flexWrap: 'wrap'
  },
  explorerLink: {
    color: '#60a5fa',
    textDecoration: 'none',
    fontSize: '0.85rem'
  },
  info: {
    color: '#aaa',
    fontSize: '0.85rem',
    margin: '0 0 0.75rem 0',
    lineHeight: 1.5
  },
  collapsibleTitle: {
    margin: '0.5rem 0',
    fontSize: '0.95rem',
    color: '#a0a0ff',
    cursor: 'pointer',
    userSelect: 'none',
    fontWeight: 'bold'
  },
  seedDetails: {
    backgroundColor: '#0d1a0d',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '0.75rem'
  },
  codeBlock: {
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    color: '#4ade80',
    display: 'block'
  },
  seedNote: {
    color: '#888',
    fontSize: '0.7rem',
    margin: '0.5rem 0 0 0'
  },
  fullLink: {
    textAlign: 'center',
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #2a3a5e'
  },
  toast: {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#333',
    color: '#fff',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    fontSize: '0.875rem',
    zIndex: 1200
  }
};

export default GameControls;
