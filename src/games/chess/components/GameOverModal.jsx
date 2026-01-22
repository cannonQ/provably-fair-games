import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  const [showVerification, setShowVerification] = useState(false);
  const [showFullBlockHash, setShowFullBlockHash] = useState(false);
  const [showSeedDetails, setShowSeedDetails] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');

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

        <div className="modal-actions">
          <button className="action-btn primary" onClick={onNewGame}>
            New Game
          </button>
          <button className="action-btn verify" onClick={() => setShowVerification(true)}>
            Verify
          </button>
          <button className="action-btn secondary" onClick={onClose}>
            Review Game
          </button>
        </div>
      </div>

      {/* Verification Modal */}
      {showVerification && gameData?.colorAssignment && (
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
                <span style={result.winner === gameData.playerColor ? verifyStyles.win : verifyStyles.loss}>
                  {getResultText()} {getReasonText()}
                </span>
              </div>
              <div style={verifyStyles.row}>
                <span style={verifyStyles.label}>Your Color:</span>
                <span>{gameData.playerColor}</span>
              </div>
              <div style={verifyStyles.row}>
                <span style={verifyStyles.label}>AI Rating:</span>
                <span>{gameData.aiSettings?.targetElo || 'N/A'} ELO</span>
              </div>
            </div>

            {/* Blockchain Proof */}
            <div style={verifyStyles.section}>
              <h3 style={verifyStyles.sectionTitle}>Blockchain Proof</h3>
              <div style={verifyStyles.row}>
                <span style={verifyStyles.label}>Block Height:</span>
                <span style={verifyStyles.mono}>{gameData.colorAssignment?.blockHeight?.toLocaleString()}</span>
              </div>
              <div style={verifyStyles.row}>
                <span style={verifyStyles.label}>Block Hash:</span>
                <span style={verifyStyles.mono}>
                  {showFullBlockHash ? gameData.colorAssignment?.blockHash : truncateHash(gameData.colorAssignment?.blockHash)}
                </span>
                <button style={verifyStyles.copyBtn} onClick={() => setShowFullBlockHash(!showFullBlockHash)}>
                  {showFullBlockHash ? 'Hide' : 'Full'}
                </button>
                <button style={verifyStyles.copyBtn} onClick={() => copyToClipboard(gameData.colorAssignment?.blockHash, 'Block Hash')}>
                  Copy
                </button>
              </div>

              {/* Color Assignment Info */}
              <div style={verifyStyles.antiSpoofBox}>
                <div style={verifyStyles.antiSpoofHeader}>🎨 Color Assignment Proof</div>
                <div style={verifyStyles.row}>
                  <span style={verifyStyles.label}>Method:</span>
                  <span style={verifyStyles.mono}>Block Hash Parity</span>
                </div>
                <div style={verifyStyles.row}>
                  <span style={verifyStyles.label}>Last Digit:</span>
                  <span style={verifyStyles.mono}>
                    {gameData.colorAssignment?.blockHash?.slice(-1)} → {gameData.playerColor}
                  </span>
                </div>
                <p style={verifyStyles.antiSpoofNote}>Even = White, Odd = Black</p>
              </div>

              {/* AI Commitment */}
              {gameData.aiCommitment && (
                <div style={verifyStyles.antiSpoofBox}>
                  <div style={verifyStyles.antiSpoofHeader}>🤖 AI Commitment</div>
                  <div style={verifyStyles.row}>
                    <span style={verifyStyles.label}>Commitment:</span>
                    <span style={verifyStyles.mono}>{truncateHash(gameData.aiCommitment.commitment)}</span>
                  </div>
                  <p style={verifyStyles.antiSpoofNote}>AI committed to moves before seeing player input</p>
                </div>
              )}

              {/* Explorer Link */}
              <div style={verifyStyles.explorerLinks}>
                <a
                  href={`https://explorer.ergoplatform.com/en/blocks/${gameData.colorAssignment?.blockHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={verifyStyles.explorerLink}
                >
                  🔗 View Block on Ergo Explorer
                </a>
              </div>
            </div>

            {/* Verification Explanation */}
            <div style={verifyStyles.section}>
              <h3 style={verifyStyles.sectionTitle}>How Verification Works</h3>
              <p style={verifyStyles.info}>
                Your color was determined by the blockchain block hash at game start.
                Neither you nor the AI could predict or manipulate this assignment.
              </p>

              <div
                style={verifyStyles.collapsibleTitle}
                onClick={() => setShowSeedDetails(!showSeedDetails)}
              >
                {showSeedDetails ? '▼' : '▶'} View Assignment Formula
              </div>
              {showSeedDetails && (
                <div style={verifyStyles.seedDetails}>
                  <code style={verifyStyles.codeBlock}>
                    color = (lastDigitOfBlockHash % 2 === 0) ? 'white' : 'black'
                  </code>
                  <p style={verifyStyles.seedNote}>Block hash is immutable and unpredictable</p>
                </div>
              )}
            </div>

            {/* Full Verification Link */}
            <div style={verifyStyles.fullLink}>
              <Link to={`/verify/chess/${gameId}`} style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '0.9rem' }}>
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
}

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

export default GameOverModal;
