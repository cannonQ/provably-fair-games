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
  moveHistory,
  rollHistory,
  gameStartTime,
  gameEndTime,
  loserPipCount = 0,
  onNewGame
}) => {
  const navigate = useNavigate();

  // Build verification data for the full verification page
  const buildVerificationData = () => ({
    gameId,
    winner,
    winType,
    finalScore,
    difficulty,
    blockchainData,
    moveHistory,
    rollHistory,
    gameStartTime,
    gameEndTime,
    doublingCube: { value: cubeValue },
    loserPipCount
  });

  // Save verification data to localStorage
  const saveVerificationData = () => {
    try {
      const data = buildVerificationData();
      localStorage.setItem(`backgammon_verify_${gameId}`, JSON.stringify(data));
    } catch (err) {
      console.warn('Failed to save verification data:', err);
    }
  };

  // Navigate to full verification page with state
  const handleViewFullVerification = () => {
    saveVerificationData();
    navigate(`/verify/backgammon/${gameId}`, {
      state: { gameState: buildVerificationData() }
    });
  };

  // Local state
  const [playerName, setPlayerName] = useState('');
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

  const playerWon = winner === 'white';
  const timeSeconds = Math.floor(duration / 1000);
  const timeFormatted = `${Math.floor(timeSeconds / 60)}:${(timeSeconds % 60).toString().padStart(2, '0')}`;

  // Score breakdown
  const winTypeMultipliers = { normal: 1, gammon: 2, backgammon: 3 };
  const difficultyBonuses = { easy: 1, normal: 2, hard: 3 };
  const winTypeMult = winTypeMultipliers[winType] || 1;
  const diffBonus = difficultyBonuses[difficulty] || 1;
  // Pip bonus: 1x for close games, up to 2x for crushing victories
  const pipBonus = Math.min(2, 1 + (loserPipCount / 200));

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
          moves: moveHistory?.length || 0,
          blockHeight: blockchainData?.blockHeight,
          blockHash: blockchainData?.blockHash,
          txHash: blockchainData?.txHash,
          blockTimestamp: blockchainData?.timestamp,
          winType,
          difficulty,
          cubeValue,
          loserPipCount,
          moveHistory: moveHistory || []
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
            <div style={rowStyle}>
              <span style={labelStyle}>Pip Bonus ({loserPipCount} pips)</span>
              <span style={valueStyle}>{pipBonus.toFixed(2)}x</span>
            </div>
            <div style={scoreStyle}>
              {finalScore} pts
            </div>
            <div style={{ textAlign: 'center', color: '#888', fontSize: '12px' }}>
              {winTypeMult} × {cubeValue} × {diffBonus} × {pipBonus.toFixed(2)} = {finalScore}
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
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <button style={{ ...buttonStyle('#1976D2'), flex: 1 }} onClick={onNewGame}>
              Play Again
            </button>
            <button
              style={{ ...buttonStyle('#f59e0b'), flex: 1 }}
              onClick={() => {
                saveVerificationData();
                setShowVerification(true);
              }}
            >
              Verify
            </button>
          </div>
          <button
            style={buttonStyle('#666')}
            onClick={() => navigate('/leaderboard?game=backgammon')}
          >
            🏆 View Leaderboard
          </button>
          <button
            style={{ ...buttonStyle('transparent'), border: '1px solid #888', color: '#888' }}
            onClick={() => navigate('/')}
          >
            🏠 Home
          </button>
        </div>
      </div>

      {/* Verification Modal */}
      {showVerification && blockchainData && (
        <div style={verifyOverlayStyle}>
          <div style={verifyModalStyle}>
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
                <span style={verifyLabelStyle}>Result:</span>
                <span style={playerWon ? verifyWinStyle : verifyLossStyle}>
                  {playerWon ? '🏆 Victory!' : '📉 Defeat'}
                </span>
              </div>
              <div style={verifyRowStyle}>
                <span style={verifyLabelStyle}>Win Type:</span>
                <span>{winTypeDisplay[winType]}</span>
              </div>
              <div style={verifyRowStyle}>
                <span style={verifyLabelStyle}>Played:</span>
                <span>{formatDate(blockchainData?.timestamp)}</span>
              </div>
            </div>

            {/* Blockchain Proof */}
            <div style={verifySectionStyle}>
              <h3 style={verifySectionTitleStyle}>Blockchain Proof</h3>
              <div style={verifyRowStyle}>
                <span style={verifyLabelStyle}>Block Height:</span>
                <span style={verifyMonoStyle}>{blockchainData?.blockHeight?.toLocaleString()}</span>
              </div>
              <div style={verifyRowStyle}>
                <span style={verifyLabelStyle}>Block Hash:</span>
                <span style={verifyMonoStyle}>
                  {showFullBlockHash ? blockchainData?.blockHash : truncateHash(blockchainData?.blockHash)}
                </span>
                <button style={verifyCopyBtnStyle} onClick={() => setShowFullBlockHash(!showFullBlockHash)}>
                  {showFullBlockHash ? 'Hide' : 'Full'}
                </button>
                <button style={verifyCopyBtnStyle} onClick={() => copyToClipboard(blockchainData?.blockHash, 'Block Hash')}>
                  Copy
                </button>
              </div>

              {/* Anti-Spoofing Box */}
              <div style={antiSpoofBoxStyle}>
                <div style={antiSpoofHeaderStyle}>🛡️ Anti-Spoofing Data</div>
                <div style={verifyRowStyle}>
                  <span style={verifyLabelStyle}>TX Hash:</span>
                  <span style={verifyMonoStyle}>
                    {showFullTxHash ? blockchainData?.txHash : truncateHash(blockchainData?.txHash)}
                  </span>
                  {blockchainData?.txHash && (
                    <>
                      <button style={verifyCopyBtnStyle} onClick={() => setShowFullTxHash(!showFullTxHash)}>
                        {showFullTxHash ? 'Hide' : 'Full'}
                      </button>
                      <button style={verifyCopyBtnStyle} onClick={() => copyToClipboard(blockchainData?.txHash, 'TX Hash')}>
                        Copy
                      </button>
                    </>
                  )}
                </div>
                <div style={verifyRowStyle}>
                  <span style={verifyLabelStyle}>TX Index:</span>
                  <span style={verifyMonoStyle}>{blockchainData?.txIndex} of {blockchainData?.txCount || '?'}</span>
                </div>
                <div style={verifyRowStyle}>
                  <span style={verifyLabelStyle}>Timestamp:</span>
                  <span style={verifyMonoStyle}>{blockchainData?.timestamp}</span>
                </div>
                <p style={antiSpoofNoteStyle}>TX selected deterministically: index = timestamp % txCount</p>
              </div>

              {/* Explorer Links */}
              <div style={explorerLinksStyle}>
                <a
                  href={`https://explorer.ergoplatform.com/en/blocks/${blockchainData?.blockHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={explorerLinkStyle}
                >
                  🔗 View Block
                </a>
                {blockchainData?.txHash && (
                  <a
                    href={`https://explorer.ergoplatform.com/en/transactions/${blockchainData?.txHash}`}
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
              <button
                onClick={handleViewFullVerification}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#60a5fa',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                View Full Verification Page →
              </button>
            </div>

            {/* Copy Toast */}
            {copyFeedback && <div style={copyToastStyle}>{copyFeedback}</div>}
          </div>
        </div>
      )}
    </div>
  );
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

const verifyWinStyle = {
  color: '#4ade80',
  fontWeight: 'bold'
};

const verifyLossStyle = {
  color: '#f87171'
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

export default GameOverModal;
