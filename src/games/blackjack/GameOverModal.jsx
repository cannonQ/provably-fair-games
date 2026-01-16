/**
 * GameOverModal - Session end modal with stats and leaderboard submission
 * Sends complete verification data to Supabase for blockchain proof
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const STARTING_BALANCE = 1000;

export default function GameOverModal({
  gameId,
  finalBalance,
  peakBalance,
  handsPlayed,
  handsWon,
  blackjacksHit,
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

  const netProfit = finalBalance - startingBalance;
  const isProfitable = netProfit >= 0;
  const winRate = handsPlayed > 0 ? Math.round((handsWon / handsPlayed) * 100) : 0;

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

        {/* Verification Link */}
        <div className="verify-link">
          <a href={`/verify/blackjack/${gameId}`} target="_blank" rel="noopener noreferrer">
            🔗 Verify this session on blockchain
          </a>
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <button onClick={onPlayAgain} className="play-again-btn">
            Play Again
          </button>
          <div className="modal-links">
            <Link to="/leaderboard?game=blackjack">View Leaderboard</Link>
            <Link to="/">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
