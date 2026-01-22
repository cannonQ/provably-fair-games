/**
 * GameOverModal - Session end modal with stats and leaderboard submission
 * Sends complete verification data to Supabase for blockchain proof
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { generateSeed, shuffleArray } from '../../blockchain/shuffle';
import { createSixDeckShoe } from './gameState';

const STARTING_BALANCE = 1000;
const SESSION_DURATION = 300; // 5 minutes in seconds

export default function GameOverModal({
  gameId,
  finalBalance,
  peakBalance,
  handsPlayed,
  handsWon,
  blackjacksHit,
  timePlayed,
  startingBalance = STARTING_BALANCE,
  blockchainData,
  roundHistory,
  shoe,
  shoePosition,
  onPlayAgain,
  onClose
}) {
  const [playerName, setPlayerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitRank, setSubmitRank] = useState(null);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showFullBlockHash, setShowFullBlockHash] = useState(false);
  const [showFullTxHash, setShowFullTxHash] = useState(false);
  const [showSeedDetails, setShowSeedDetails] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');

  const netProfit = finalBalance - startingBalance;
  const isProfitable = netProfit >= 0;
  const winRate = handsPlayed > 0 ? Math.round((handsWon / handsPlayed) * 100) : 0;

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

  const handleVerifyShuffle = async () => {
    if (!blockchainData || !shoe) return;

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      const blockData = {
        blockHash: blockchainData.blockHash,
        txHash: blockchainData.txHash,
        timestamp: blockchainData.timestamp,
        txIndex: blockchainData.txIndex
      };
      const regeneratedSeed = generateSeed(blockData, gameId);
      const rawShoe = createSixDeckShoe();
      const regeneratedShoe = shuffleArray(rawShoe, regeneratedSeed);

      const seedsMatch = regeneratedSeed === blockchainData.seed;
      const shoeMatches = shoe?.every((card, i) => card.id === regeneratedShoe[i]?.id);

      setVerificationResult(seedsMatch && shoeMatches ? 'verified' : 'failed');
    } catch (error) {
      setVerificationResult('failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: 'blackjack',
          gameId,
          playerName: playerName.trim() || 'Anonymous',
          score: finalBalance,
          timeSeconds: timePlayed,
          moves: handsPlayed,
          // Blockchain verification data
          blockHeight: blockchainData?.blockHeight,
          blockHash: blockchainData?.blockHash,
          txHash: blockchainData?.txHash,
          blockTimestamp: blockchainData?.timestamp,
          txIndex: blockchainData?.txIndex,
          seed: blockchainData?.seed,
          // Round history for detailed verification (JSONB)
          roundHistory: roundHistory || []
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Submission failed');
      }

      const result = await response.json();
      setSubmitted(true);
      setSubmitRank(result.rank);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="game-over-modal">
        <button className="close-btn" onClick={onClose}>✕</button>
        
        {/* Header */}
        <div className="modal-header">
          <h2>{isProfitable ? '🎉 Session Complete!' : '⏱️ Time\'s Up!'}</h2>
          <p className={isProfitable ? 'profit-text' : 'loss-text'}>
            {isProfitable ? 'You finished in profit!' : 'Better luck next time!'}
          </p>
        </div>

        {/* Stats */}
        <div className="final-stats">
          <div className="stat-row">
            <span className="label">Final Balance</span>
            <span className={`value ${isProfitable ? 'profit' : 'loss'}`}>
              ${finalBalance.toLocaleString()}
            </span>
          </div>
          <div className="stat-row">
            <span className="label">Peak Balance</span>
            <span className="value highlight">${peakBalance.toLocaleString()}</span>
          </div>
          <div className="stat-row">
            <span className="label">Starting Balance</span>
            <span className="value">${startingBalance.toLocaleString()}</span>
          </div>
          <div className="stat-row">
            <span className="label">{isProfitable ? 'Net Profit' : 'Net Loss'}</span>
            <span className={`value ${isProfitable ? 'profit' : 'loss'}`}>
              {isProfitable ? '+' : ''}${netProfit.toLocaleString()}
            </span>
          </div>
          
          <div className="stats-grid">
            <div>
              <div className="stat-number">{handsPlayed}</div>
              <div className="stat-label">Hands</div>
            </div>
            <div>
              <div className="stat-number">{winRate}%</div>
              <div className="stat-label">Win Rate</div>
            </div>
            <div>
              <div className="stat-number" style={{ color: '#ffd700' }}>{blackjacksHit}</div>
              <div className="stat-label">Blackjacks</div>
            </div>
          </div>
        </div>

        {/* Leaderboard Submission */}
        {!submitted ? (
          <div className="leaderboard-submit">
            <h3>Submit to Leaderboard?</h3>
            <div className="submit-row">
              <input
                type="text"
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
                {submitting ? '...' : 'Submit'}
              </button>
            </div>
            {submitError && <p className="submit-error">{submitError}</p>}
          </div>
        ) : (
          <div className="submit-success">
            ✓ Submitted! You ranked #{submitRank}
          </div>
        )}

        {/* Actions */}
        <div className="modal-actions">
          <button onClick={onPlayAgain} className="play-again-btn">
            Play Again
          </button>
          <button onClick={() => setShowVerification(true)} className="verify-btn">
            Verify
          </button>
        </div>
        <div className="modal-links">
          <Link to="/leaderboard?game=blackjack">View Leaderboard</Link>
          <Link to="/">Back to Home</Link>
        </div>
      </div>

      {/* Verification Modal */}
      {showVerification && (
        <div className="verification-modal-overlay">
          <div className="verification-modal">
            <button className="modal-close-btn" onClick={() => setShowVerification(false)}>×</button>

            {/* Game Summary */}
            <div className="verify-section">
              <h3 className="verify-section-title">Game Summary</h3>
              <div className="verify-row">
                <span className="verify-label">Game ID:</span>
                <span className="verify-mono">{gameId}</span>
                <button className="verify-copy-btn" onClick={() => copyToClipboard(gameId, 'Game ID')}>Copy</button>
              </div>
              <div className="verify-row">
                <span className="verify-label">Result:</span>
                <span className={isProfitable ? 'verify-win' : 'verify-loss'}>
                  {isProfitable ? '🏆 Profitable Session!' : '📉 Session Loss'}
                </span>
              </div>
              <div className="verify-row">
                <span className="verify-label">Played:</span>
                <span>{formatDate(blockchainData?.timestamp)}</span>
              </div>
            </div>

            {/* Blockchain Proof */}
            <div className="verify-section">
              <h3 className="verify-section-title">Blockchain Proof</h3>
              <div className="verify-row">
                <span className="verify-label">Block Height:</span>
                <span className="verify-mono">{blockchainData?.blockHeight?.toLocaleString()}</span>
              </div>
              <div className="verify-row">
                <span className="verify-label">Block Hash:</span>
                <span className="verify-mono">
                  {showFullBlockHash ? blockchainData?.blockHash : truncateHash(blockchainData?.blockHash)}
                </span>
                <button className="verify-copy-btn" onClick={() => setShowFullBlockHash(!showFullBlockHash)}>
                  {showFullBlockHash ? 'Hide' : 'Full'}
                </button>
                <button className="verify-copy-btn" onClick={() => copyToClipboard(blockchainData?.blockHash, 'Block Hash')}>
                  Copy
                </button>
              </div>

              {/* Anti-Spoofing Box */}
              <div className="anti-spoof-box">
                <div className="anti-spoof-header">🛡️ Anti-Spoofing Data</div>
                <div className="verify-row">
                  <span className="verify-label">TX Hash:</span>
                  <span className="verify-mono">
                    {showFullTxHash ? blockchainData?.txHash : truncateHash(blockchainData?.txHash)}
                  </span>
                  {blockchainData?.txHash && (
                    <>
                      <button className="verify-copy-btn" onClick={() => setShowFullTxHash(!showFullTxHash)}>
                        {showFullTxHash ? 'Hide' : 'Full'}
                      </button>
                      <button className="verify-copy-btn" onClick={() => copyToClipboard(blockchainData?.txHash, 'TX Hash')}>
                        Copy
                      </button>
                    </>
                  )}
                </div>
                <div className="verify-row">
                  <span className="verify-label">TX Index:</span>
                  <span className="verify-mono">{blockchainData?.txIndex} of {blockchainData?.txCount || '?'}</span>
                </div>
                <div className="verify-row">
                  <span className="verify-label">Timestamp:</span>
                  <span className="verify-mono">{blockchainData?.timestamp}</span>
                </div>
                <p className="anti-spoof-note">TX selected deterministically: index = timestamp % txCount</p>
              </div>

              {/* Explorer Links */}
              <div className="explorer-links">
                <a
                  href={`https://explorer.ergoplatform.com/en/blocks/${blockchainData?.blockHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="explorer-link"
                >
                  🔗 View Block
                </a>
                {blockchainData?.txHash && (
                  <a
                    href={`https://explorer.ergoplatform.com/en/transactions/${blockchainData?.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="explorer-link"
                  >
                    🔗 View Transaction
                  </a>
                )}
              </div>
            </div>

            {/* Shuffle Verification */}
            <div className="verify-section">
              <h3 className="verify-section-title">Shuffle Verification</h3>
              <p className="verify-info">
                This shuffle combines block hash + transaction hash + timestamp + game ID.
                An attacker would need to control all these simultaneously — practically impossible.
              </p>

              <div
                className="collapsible-title"
                onClick={() => setShowSeedDetails(!showSeedDetails)}
              >
                {showSeedDetails ? '▼' : '▶'} View Seed Formula
              </div>
              {showSeedDetails && (
                <div className="seed-details">
                  <code className="code-block">
                    seed = HASH(blockHash + txHash + timestamp + gameId + txIndex)
                  </code>
                  <p className="seed-note">5 independent inputs = virtually impossible to manipulate</p>
                </div>
              )}

              <button
                className="verify-shuffle-btn"
                onClick={handleVerifyShuffle}
                disabled={isVerifying || !blockchainData?.blockHash || !gameId}
              >
                {isVerifying ? '⏳ Verifying...' : '🔍 Verify Shuffle'}
              </button>

              {verificationResult === 'verified' && (
                <div className="result-success">✓ VERIFIED: Shuffle matches blockchain seed</div>
              )}
              {verificationResult === 'failed' && (
                <div className="result-fail">✗ FAILED: Shuffle does not match</div>
              )}
            </div>

            {/* Full Verification Link */}
            <div className="full-verify-link">
              <Link to={`/verify/blackjack/${gameId}`}>
                View Full Verification Page →
              </Link>
            </div>

            {/* Copy Toast */}
            {copyFeedback && <div className="copy-toast">{copyFeedback}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
