/**
 * Verification.jsx - Shuffle Verification Display (Enhanced Anti-Spoofing)
 * 
 * Displays blockchain proof including transaction data.
 * Shows visual deal replay with color-coded card flow.
 */

import React, { useState } from 'react';
import { generateSeed, shuffleDeck } from '../blockchain/shuffle';

function Verification({
  gameId = '',
  blockData = null,
  deck = [],
  winner = null
}) {
  // Extract from blockData object
  const blockHeight = blockData?.blockHeight || 0;
  const blockHash = blockData?.blockHash || '';
  const timestamp = blockData?.timestamp || 0;
  const txHash = blockData?.txHash || '';
  const txIndex = blockData?.txIndex || 0;
  const txCount = blockData?.txCount || 0;
  const shuffledDeck = deck;

  // State
  const [showFullBlockHash, setShowFullBlockHash] = useState(false);
  const [showFullTxHash, setShowFullTxHash] = useState(false);
  const [showDealReplay, setShowDealReplay] = useState(false);
  const [showSeedDetails, setShowSeedDetails] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');

  // Card color helper
  const getCardColor = (card) => {
    if (!card) return '#888';
    if (card.includes('♥') || card.includes('♦')) return '#ef4444'; // red
    return '#fff'; // black suits show as white on dark bg
  };

  // Format timestamp
  const formatDate = (ts) => {
    if (!ts) return 'Unknown';
    return new Date(ts).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  };

  // Truncate hash
  const truncateHash = (hash) => {
    if (!hash || hash.length <= 24) return hash || 'N/A';
    return `${hash.slice(0, 10)}...${hash.slice(-10)}`;
  };

  // Copy to clipboard
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

  // Verify shuffle
  const handleVerify = async () => {
    setIsVerifying(true);
    setVerificationResult(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const seed = generateSeed(blockData, gameId);
      const expectedDeck = shuffleDeck(seed);
      const isMatch = shuffledDeck.length === expectedDeck.length &&
        shuffledDeck.every((card, i) => card === expectedDeck[i]);
      setVerificationResult(isMatch ? 'verified' : 'failed');
    } catch (error) {
      setVerificationResult('failed');
    } finally {
      setIsVerifying(false);
    }
  };

  // Render a single card with appropriate styling
  const renderCard = (card, index, type) => {
    const bgColors = {
      player: '#1e3a5f',    // blue for player
      ai: '#5f1e3a',        // red/pink for AI  
      draw: '#2a2a2a'       // dark gray for draw pile
    };
    
    return (
      <span 
        key={index} 
        style={{
          ...styles.dealCard,
          backgroundColor: bgColors[type],
          color: getCardColor(card),
          borderColor: type === 'player' ? '#3b82f6' : type === 'ai' ? '#ec4899' : '#444'
        }}
      >
        {card}
      </span>
    );
  };

  // Render the deal replay visualization
  const renderDealReplay = () => {
    if (shuffledDeck.length < 52) return null;

    const playerInitial = shuffledDeck.slice(0, 10);
    const aiInitial = shuffledDeck.slice(10, 20);
    const drawPile = shuffledDeck.slice(20);

    return (
      <div style={styles.dealReplayContainer}>
        {/* Legend */}
        <div style={styles.legend}>
          <span style={styles.legendItem}>
            <span style={{...styles.legendDot, backgroundColor: '#1e3a5f', borderColor: '#3b82f6'}}></span>
            You (Player)
          </span>
          <span style={styles.legendItem}>
            <span style={{...styles.legendDot, backgroundColor: '#5f1e3a', borderColor: '#ec4899'}}></span>
            AI Opponent
          </span>
          <span style={styles.legendItem}>
            <span style={{...styles.legendDot, backgroundColor: '#2a2a2a', borderColor: '#444'}}></span>
            Draw Pile
          </span>
        </div>

        {/* Initial Deal - Player */}
        <div style={styles.dealSection}>
          <div style={styles.dealHeader}>
            <span style={{...styles.dealLabel, color: '#3b82f6'}}>👤 YOUR INITIAL HAND</span>
            <span style={styles.dealRange}>Cards 1-10 (face down)</span>
          </div>
          <div style={styles.dealRow}>
            {playerInitial.map((card, i) => (
              <div key={i} style={styles.positionWrapper}>
                <span style={styles.positionNumber}>{i + 1}</span>
                {renderCard(card, i, 'player')}
              </div>
            ))}
          </div>
        </div>

        {/* Initial Deal - AI */}
        <div style={styles.dealSection}>
          <div style={styles.dealHeader}>
            <span style={{...styles.dealLabel, color: '#ec4899'}}>🤖 AI INITIAL HAND</span>
            <span style={styles.dealRange}>Cards 11-20 (face down)</span>
          </div>
          <div style={styles.dealRow}>
            {aiInitial.map((card, i) => (
              <div key={i} style={styles.positionWrapper}>
                <span style={styles.positionNumber}>{i + 1}</span>
                {renderCard(card, i + 10, 'ai')}
              </div>
            ))}
          </div>
        </div>

        {/* Draw Pile */}
        <div style={styles.dealSection}>
          <div style={styles.dealHeader}>
            <span style={{...styles.dealLabel, color: '#888'}}>📚 DRAW PILE ORDER</span>
            <span style={styles.dealRange}>Cards 21-52 (top to bottom)</span>
          </div>
          <div style={styles.drawPileGrid}>
            {drawPile.map((card, i) => (
              <div key={i} style={styles.drawCardWrapper}>
                <span style={styles.drawNumber}>{i + 21}</span>
                {renderCard(card, i + 20, 'draw')}
              </div>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div style={styles.statsSection}>
          <div style={styles.statBox}>
            <span style={styles.statLabel}>Your Jacks (Wild)</span>
            <span style={styles.statValue}>
              {playerInitial.filter(c => c.startsWith('J')).length}
            </span>
          </div>
          <div style={styles.statBox}>
            <span style={styles.statLabel}>Your Q/K (Garbage)</span>
            <span style={styles.statValue}>
              {playerInitial.filter(c => c.startsWith('Q') || c.startsWith('K')).length}
            </span>
          </div>
          <div style={styles.statBox}>
            <span style={styles.statLabel}>AI Jacks (Wild)</span>
            <span style={styles.statValue}>
              {aiInitial.filter(c => c.startsWith('J')).length}
            </span>
          </div>
          <div style={styles.statBox}>
            <span style={styles.statLabel}>AI Q/K (Garbage)</span>
            <span style={styles.statValue}>
              {aiInitial.filter(c => c.startsWith('Q') || c.startsWith('K')).length}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* Section 1: Game Summary */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Game Summary</h3>
        <div style={styles.row}>
          <span style={styles.label}>Game ID:</span>
          <span style={styles.mono}>{gameId || 'N/A'}</span>
          {gameId && (
            <button style={styles.copyBtn} onClick={() => copyToClipboard(gameId, 'Game ID')}>
              Copy
            </button>
          )}
        </div>
        {winner && (
          <div style={styles.row}>
            <span style={styles.label}>Winner:</span>
            <span style={winner === 'player' ? styles.winText : styles.loseText}>
              {winner === 'player' ? '🏆 You Won!' : '🤖 AI Won'}
            </span>
          </div>
        )}
        <div style={styles.row}>
          <span style={styles.label}>Played:</span>
          <span>{formatDate(timestamp)}</span>
        </div>
      </div>

      {/* Section 2: Blockchain Proof */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Blockchain Proof</h3>
        
        <div style={styles.row}>
          <span style={styles.label}>Block Height:</span>
          <span style={styles.mono}>{blockHeight.toLocaleString()}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Block Hash:</span>
          <span style={styles.mono}>
            {showFullBlockHash ? blockHash : truncateHash(blockHash)}
          </span>
          <button style={styles.copyBtn} onClick={() => setShowFullBlockHash(!showFullBlockHash)}>
            {showFullBlockHash ? 'Hide' : 'Full'}
          </button>
          <button style={styles.copyBtn} onClick={() => copyToClipboard(blockHash, 'Block Hash')}>
            Copy
          </button>
        </div>
        
        {/* Anti-Spoofing Box */}
        <div style={styles.antiSpoofBox}>
          <div style={styles.antiSpoofHeader}>🛡️ Anti-Spoofing Data</div>
          <div style={styles.row}>
            <span style={styles.label}>TX Hash:</span>
            <span style={styles.mono}>
              {showFullTxHash ? txHash : truncateHash(txHash)}
            </span>
            {txHash && (
              <>
                <button style={styles.copyBtn} onClick={() => setShowFullTxHash(!showFullTxHash)}>
                  {showFullTxHash ? 'Hide' : 'Full'}
                </button>
                <button style={styles.copyBtn} onClick={() => copyToClipboard(txHash, 'TX Hash')}>
                  Copy
                </button>
              </>
            )}
          </div>
          <div style={styles.row}>
            <span style={styles.label}>TX Index:</span>
            <span style={styles.mono}>{txIndex} of {txCount}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Timestamp:</span>
            <span style={styles.mono}>{timestamp}</span>
          </div>
          <p style={styles.antiSpoofNote}>
            TX selected deterministically: index = timestamp % txCount
          </p>
        </div>

        {/* Explorer Links */}
        <div style={styles.linksRow}>
          <a href={`https://explorer.ergoplatform.com/en/blocks/${blockHash}`}
            target="_blank" rel="noopener noreferrer" style={styles.explorerLink}>
            🔗 View Block
          </a>
          {txHash && (
            <a href={`https://explorer.ergoplatform.com/en/transactions/${txHash}`}
              target="_blank" rel="noopener noreferrer" style={styles.explorerLink}>
              🔗 View Transaction
            </a>
          )}
        </div>
      </div>

      {/* Section 3: Shuffle Verification */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Shuffle Verification</h3>
        <p style={styles.infoText}>
          This shuffle combines block hash + transaction hash + timestamp + game ID.
          An attacker would need to control all these simultaneously — practically impossible.
        </p>
        
        <div style={styles.collapsibleTitle} onClick={() => setShowSeedDetails(!showSeedDetails)}>
          {showSeedDetails ? '▼' : '▶'} View Seed Formula
        </div>
        {showSeedDetails && (
          <div style={styles.seedDetails}>
            <code style={styles.codeBlock}>
              seed = HASH(blockHash + txHash + timestamp + gameId + txIndex)
            </code>
            <p style={styles.seedNote}>5 independent inputs = virtually impossible to manipulate</p>
          </div>
        )}
        
        <button style={styles.verifyBtn} onClick={handleVerify}
          disabled={isVerifying || !blockHash || !gameId}>
          {isVerifying ? '⏳ Verifying...' : '🔍 Verify Shuffle'}
        </button>

        {verificationResult === 'verified' && (
          <div style={styles.resultSuccess}>✓ VERIFIED: Shuffle matches blockchain seed</div>
        )}
        {verificationResult === 'failed' && (
          <div style={styles.resultFail}>✗ FAILED: Shuffle does not match</div>
        )}
      </div>

      {/* Section 4: Deal Replay (Enhanced) */}
      <div style={styles.section}>
        <h3 style={styles.collapsibleTitle} onClick={() => setShowDealReplay(!showDealReplay)}>
          {showDealReplay ? '▼' : '▶'} 🎴 View Deal Replay
        </h3>
        
        {showDealReplay && renderDealReplay()}
      </div>

      {/* Section 5: How to Verify */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>How to Verify Yourself</h3>
        <p style={styles.infoText}>You can verify this shuffle independently:</p>
        <ol style={styles.stepsList}>
          <li>Check the block on <a href={`https://explorer.ergoplatform.com/en/blocks/${blockHash}`}
            target="_blank" rel="noopener noreferrer" style={styles.inlineLink}>Ergo Explorer</a></li>
          <li>Verify the transaction exists in that block</li>
          <li>Confirm TX index: {timestamp} % {txCount} = {txIndex}</li>
          <li>Run our shuffle algorithm with all 5 inputs</li>
          <li>Compare: identical inputs = identical deck</li>
        </ol>
      </div>

      {/* Toast */}
      {copyFeedback && <div style={styles.toast}>{copyFeedback}</div>}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: '12px',
    padding: '1.5rem',
    maxWidth: '700px',
    margin: '1rem auto 0'
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
  collapsibleTitle: {
    margin: '0.5rem 0',
    fontSize: '0.95rem',
    color: '#a0a0ff',
    cursor: 'pointer',
    userSelect: 'none',
    fontWeight: 'bold'
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
    flexWrap: 'wrap'
  },
  linksRow: {
    display: 'flex',
    gap: '1rem',
    marginTop: '0.75rem',
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
    wordBreak: 'break-all'
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
  winText: { color: '#4ade80', fontWeight: 'bold' },
  loseText: { color: '#f87171' },
  explorerLink: {
    color: '#60a5fa',
    textDecoration: 'none',
    fontSize: '0.85rem'
  },
  infoText: {
    color: '#aaa',
    fontSize: '0.85rem',
    margin: '0 0 0.75rem 0',
    lineHeight: 1.5
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
  verifyBtn: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    backgroundColor: '#4ade80',
    color: '#000',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  resultSuccess: {
    marginTop: '0.75rem',
    padding: '0.75rem',
    backgroundColor: '#166534',
    color: '#4ade80',
    borderRadius: '6px',
    fontWeight: 'bold'
  },
  resultFail: {
    marginTop: '0.75rem',
    padding: '0.75rem',
    backgroundColor: '#7f1d1d',
    color: '#f87171',
    borderRadius: '6px',
    fontWeight: 'bold'
  },
  stepsList: {
    color: '#ccc',
    fontSize: '0.85rem',
    margin: 0,
    paddingLeft: '1.25rem',
    lineHeight: 1.8
  },
  inlineLink: { color: '#60a5fa' },
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
    zIndex: 1000
  },
  
  // Deal Replay Styles
  dealReplayContainer: {
    marginTop: '1rem'
  },
  legend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1.5rem',
    marginBottom: '1rem',
    flexWrap: 'wrap'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.75rem',
    color: '#aaa'
  },
  legendDot: {
    width: '12px',
    height: '12px',
    borderRadius: '3px',
    border: '2px solid'
  },
  dealSection: {
    marginBottom: '1.25rem'
  },
  dealHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem'
  },
  dealLabel: {
    fontWeight: 'bold',
    fontSize: '0.85rem'
  },
  dealRange: {
    fontSize: '0.7rem',
    color: '#666'
  },
  dealRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.35rem',
    justifyContent: 'center'
  },
  positionWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px'
  },
  positionNumber: {
    fontSize: '0.6rem',
    color: '#555',
    fontWeight: 'bold'
  },
  dealCard: {
    padding: '0.3rem 0.4rem',
    borderRadius: '4px',
    fontSize: '0.8rem',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    border: '2px solid',
    minWidth: '36px',
    textAlign: 'center'
  },
  drawPileGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.25rem',
    justifyContent: 'center'
  },
  drawCardWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1px'
  },
  drawNumber: {
    fontSize: '0.55rem',
    color: '#444'
  },
  statsSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '0.5rem',
    marginTop: '1rem',
    padding: '0.75rem',
    backgroundColor: '#0d1a0d',
    borderRadius: '6px'
  },
  statBox: {
    textAlign: 'center'
  },
  statLabel: {
    display: 'block',
    fontSize: '0.65rem',
    color: '#666',
    marginBottom: '0.25rem'
  },
  statValue: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#4ade80'
  }
};

export default Verification;
