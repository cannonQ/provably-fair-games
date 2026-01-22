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
  rollHistory,
  onClose,
  onNewGame
}) {
  const [playerName, setPlayerName] = useState(initialPlayerName || '');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitRank, setSubmitRank] = useState(null);
  const [showVerification, setShowVerification] = useState(false);
  const [showFullBlockHash, setShowFullBlockHash] = useState(false);
  const [showFullTxHash, setShowFullTxHash] = useState(false);
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
          blockTimestamp: anchor?.timestamp,
          rollHistory: rollHistory || []
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

  // Verification modal styles
  const verifyOverlayStyle = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.95)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1100,
    padding: '16px'
  };

  const verifyModalStyle = {
    backgroundColor: '#1e293b',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    position: 'relative'
  };

  const verifyCloseBtnStyle = {
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
  };

  const verifySectionStyle = {
    backgroundColor: '#16213e',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem',
    border: '1px solid #2a3a5e'
  };

  const verifySectionTitleStyle = {
    margin: '0 0 0.75rem 0',
    fontSize: '1rem',
    color: '#a0a0ff',
    borderBottom: '1px solid #2a3a5e',
    paddingBottom: '0.5rem'
  };

  const verifyRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
    flexWrap: 'wrap'
  };

  const verifyLabelStyle = {
    color: '#888',
    minWidth: '90px',
    fontSize: '0.85rem'
  };

  const verifyMonoStyle = {
    fontFamily: 'monospace',
    backgroundColor: '#0d1a0d',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.8rem',
    wordBreak: 'break-all',
    color: '#a5b4fc'
  };

  const verifyCopyBtnStyle = {
    padding: '0.2rem 0.4rem',
    fontSize: '0.65rem',
    backgroundColor: '#2a3a5e',
    color: '#aaa',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  };

  const antiSpoofBoxStyle = {
    backgroundColor: '#1a2a1a',
    border: '1px solid #2a4a2a',
    borderRadius: '6px',
    padding: '0.75rem',
    margin: '0.75rem 0'
  };

  const antiSpoofHeaderStyle = {
    color: '#4ade80',
    fontWeight: 'bold',
    fontSize: '0.85rem',
    marginBottom: '0.5rem'
  };

  const antiSpoofNoteStyle = {
    color: '#666',
    fontSize: '0.7rem',
    margin: '0.5rem 0 0 0',
    fontStyle: 'italic'
  };

  const explorerLinksStyle = {
    display: 'flex',
    gap: '1rem',
    marginTop: '0.75rem',
    flexWrap: 'wrap'
  };

  const explorerLinkStyle = {
    color: '#60a5fa',
    textDecoration: 'none',
    fontSize: '0.85rem'
  };

  const verifyInfoStyle = {
    color: '#aaa',
    fontSize: '0.85rem',
    margin: '0 0 0.75rem 0',
    lineHeight: 1.5
  };

  const collapsibleTitleStyle = {
    margin: '0.5rem 0',
    fontSize: '0.95rem',
    color: '#a0a0ff',
    cursor: 'pointer',
    userSelect: 'none',
    fontWeight: 'bold'
  };

  const seedDetailsStyle = {
    backgroundColor: '#0d1a0d',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '0.75rem'
  };

  const codeBlockStyle = {
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    color: '#4ade80',
    display: 'block'
  };

  const seedNoteStyle = {
    color: '#888',
    fontSize: '0.7rem',
    margin: '0.5rem 0 0 0'
  };

  const fullVerifyLinkStyle = {
    textAlign: 'center',
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #2a3a5e'
  };

  const copyToastStyle = {
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
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={primaryButtonStyle} onClick={onNewGame}>
              Play Again
            </button>
            <button style={{ ...secondaryButtonStyle, backgroundColor: '#f59e0b' }} onClick={() => setShowVerification(true)}>
              Verify
            </button>
          </div>

          <Link to="/leaderboard?game=yahtzee" style={linkButtonStyle}>
            View Leaderboard
          </Link>
        </div>

        {/* Game ID */}
        <div style={{ fontSize: '11px', color: '#999', marginTop: '15px' }}>
          Game ID: {gameId}
        </div>
      </div>

      {/* Verification Modal */}
      {showVerification && anchor && (
        <div style={verifyOverlayStyle} onClick={() => setShowVerification(false)}>
          <div style={verifyModalStyle} onClick={(e) => e.stopPropagation()}>
            <button style={verifyCloseBtnStyle} onClick={() => setShowVerification(false)}>×</button>

            {/* Game Summary */}
            <div style={verifySectionStyle}>
              <h3 style={verifySectionTitleStyle}>Game Summary</h3>
              <div style={verifyRowStyle}>
                <span style={verifyLabelStyle}>Game ID:</span>
                <span style={verifyMonoStyle}>{gameId}</span>
                <button style={verifyCopyBtnStyle} onClick={() => copyToClipboard(gameId, 'Game ID')}>Copy</button>
              </div>
              <div style={verifyRowStyle}>
                <span style={verifyLabelStyle}>Final Score:</span>
                <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{grandTotal} points</span>
              </div>
              <div style={verifyRowStyle}>
                <span style={verifyLabelStyle}>Played:</span>
                <span>{formatDate(anchor?.timestamp)}</span>
              </div>
            </div>

            {/* Blockchain Proof */}
            <div style={verifySectionStyle}>
              <h3 style={verifySectionTitleStyle}>Blockchain Proof</h3>
              <div style={verifyRowStyle}>
                <span style={verifyLabelStyle}>Block Height:</span>
                <span style={verifyMonoStyle}>{anchor?.blockHeight?.toLocaleString()}</span>
              </div>
              <div style={verifyRowStyle}>
                <span style={verifyLabelStyle}>Block Hash:</span>
                <span style={verifyMonoStyle}>
                  {showFullBlockHash ? anchor?.blockHash : truncateHash(anchor?.blockHash)}
                </span>
                <button style={verifyCopyBtnStyle} onClick={() => setShowFullBlockHash(!showFullBlockHash)}>
                  {showFullBlockHash ? 'Hide' : 'Full'}
                </button>
                <button style={verifyCopyBtnStyle} onClick={() => copyToClipboard(anchor?.blockHash, 'Block Hash')}>
                  Copy
                </button>
              </div>

              {/* Anti-Spoofing Box */}
              <div style={antiSpoofBoxStyle}>
                <div style={antiSpoofHeaderStyle}>🛡️ Anti-Spoofing Data</div>
                <div style={verifyRowStyle}>
                  <span style={verifyLabelStyle}>TX Hash:</span>
                  <span style={verifyMonoStyle}>
                    {showFullTxHash ? anchor?.txHash : truncateHash(anchor?.txHash)}
                  </span>
                  {anchor?.txHash && (
                    <>
                      <button style={verifyCopyBtnStyle} onClick={() => setShowFullTxHash(!showFullTxHash)}>
                        {showFullTxHash ? 'Hide' : 'Full'}
                      </button>
                      <button style={verifyCopyBtnStyle} onClick={() => copyToClipboard(anchor?.txHash, 'TX Hash')}>
                        Copy
                      </button>
                    </>
                  )}
                </div>
                <div style={verifyRowStyle}>
                  <span style={verifyLabelStyle}>TX Index:</span>
                  <span style={verifyMonoStyle}>{anchor?.txIndex} of {anchor?.txCount || '?'}</span>
                </div>
                <div style={verifyRowStyle}>
                  <span style={verifyLabelStyle}>Timestamp:</span>
                  <span style={verifyMonoStyle}>{anchor?.timestamp}</span>
                </div>
                <p style={antiSpoofNoteStyle}>TX selected deterministically: index = timestamp % txCount</p>
              </div>

              {/* Explorer Links */}
              <div style={explorerLinksStyle}>
                <a
                  href={`https://explorer.ergoplatform.com/en/blocks/${anchor?.blockHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={explorerLinkStyle}
                >
                  🔗 View Block
                </a>
                {anchor?.txHash && (
                  <a
                    href={`https://explorer.ergoplatform.com/en/transactions/${anchor?.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={explorerLinkStyle}
                  >
                    🔗 View Transaction
                  </a>
                )}
              </div>
            </div>

            {/* Dice Roll Verification */}
            <div style={verifySectionStyle}>
              <h3 style={verifySectionTitleStyle}>Dice Roll Verification</h3>
              <p style={verifyInfoStyle}>
                All dice rolls are generated from the blockchain seed. The seed combines block hash + transaction hash + timestamp + game ID.
              </p>

              <div
                style={collapsibleTitleStyle}
                onClick={() => setShowSeedDetails(!showSeedDetails)}
              >
                {showSeedDetails ? '▼' : '▶'} View Seed Formula
              </div>
              {showSeedDetails && (
                <div style={seedDetailsStyle}>
                  <code style={codeBlockStyle}>
                    seed = HASH(blockHash + txHash + timestamp + gameId + txIndex)
                  </code>
                  <p style={seedNoteStyle}>5 independent inputs = virtually impossible to manipulate</p>
                </div>
              )}
            </div>

            {/* Full Verification Link */}
            <div style={fullVerifyLinkStyle}>
              <Link to={`/verify/yahtzee/${gameId}`} style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '0.9rem' }}>
                View Full Verification Page →
              </Link>
            </div>

            {/* Copy Toast */}
            {copyFeedback && <div style={copyToastStyle}>{copyFeedback}</div>}
          </div>
        </div>
      )}
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
  rollHistory: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
  onNewGame: PropTypes.func.isRequired
};

export default GameOverModal;
