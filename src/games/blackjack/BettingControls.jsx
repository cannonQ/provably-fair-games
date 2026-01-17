/**
 * BettingControls - Chip selection, bet display, session timer, cash out & extend
 */

import React, { useState } from 'react';

const CHIPS = [
  { value: 5, className: 'chip-5' },
  { value: 25, className: 'chip-25' },
  { value: 100, className: 'chip-100' },
  { value: 500, className: 'chip-500' }
];

const QUICK_BETS = [5, 25, 50, 100];

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function BettingControls({
  chipBalance,
  currentBet,
  onBetChange,
  onDeal,
  onExtendSession,
  disabled,
  timeRemaining,
  extensionsUsed
}) {
  const [showExtendPrompt, setShowExtendPrompt] = useState(false);

  const available = chipBalance - currentBet;
  const canExtend = extensionsUsed < 1; // Only allow 1 extension
  const showExtendButton = timeRemaining <= 60 && canExtend; // Show when 1 min or less remaining

  const handleAddChip = (value) => {
    const addAmount = Math.min(value, available);
    if (addAmount > 0) onBetChange(currentBet + addAmount);
  };

  const handleQuickBet = (amount) => {
    if (amount === 'max') {
      onBetChange(chipBalance);
    } else {
      const newBet = Math.min(amount, chipBalance);
      onBetChange(newBet);
    }
  };

  const handleClear = () => onBetChange(0);

  const handleExtend = () => {
    setShowExtendPrompt(false);
    onExtendSession();
  };

  const timerClass = timeRemaining <= 30 ? 'critical' : timeRemaining <= 60 ? 'warning' : '';

  return (
    <div className="betting-controls">
      {/* Deal Button at Top */}
      <button
        onClick={onDeal}
        disabled={disabled || currentBet < 5}
        className="deal-button"
      >
        DEAL
      </button>

      {/* Timer & Balance Row */}
      <div className="betting-row">
        <div className="balance-display">Balance: ${chipBalance.toLocaleString()}</div>
        <div className={`session-timer ${timerClass}`}>
          Time: {formatTime(timeRemaining)}
          {extensionsUsed > 0 && <span className="extended-badge">+5</span>}
        </div>
        <div className="bet-display">Bet: ${currentBet.toLocaleString()}</div>
      </div>

      {/* Extend Session Button (if applicable) */}
      {showExtendButton && (
        <div className="session-controls">
          <button
            onClick={() => setShowExtendPrompt(true)}
            className="extend-btn"
          >
            ⏱️ +5 Min
          </button>
        </div>
      )}

      {/* Extend Session Prompt */}
      {showExtendPrompt && (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <h3>Extend Session?</h3>
            <p>Add 5 more minutes to your session?</p>
            <p className="extend-note">You can only extend once per session.</p>
            <div className="confirm-buttons">
              <button onClick={handleExtend} className="confirm-yes">
                Yes, Extend +5 Min
              </button>
              <button onClick={() => setShowExtendPrompt(false)} className="confirm-no">
                No Thanks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chip Buttons */}
      <div className="chip-selector">
        {CHIPS.map(chip => (
          <button
            key={chip.value}
            onClick={() => handleAddChip(chip.value)}
            disabled={disabled || available < chip.value}
            className={`chip ${chip.className}`}
          >
            ${chip.value}
          </button>
        ))}
      </div>

      {/* Quick Bet Buttons */}
      <div className="quick-bets">
        {QUICK_BETS.map(amount => (
          <button
            key={amount}
            onClick={() => handleQuickBet(amount)}
            disabled={disabled || chipBalance < amount}
            className="quick-bet-btn"
          >
            ${amount}
          </button>
        ))}
        <button
          onClick={() => handleQuickBet('max')}
          disabled={disabled || chipBalance < 5}
          className="quick-bet-btn max"
        >
          MAX
        </button>
        <button
          onClick={handleClear}
          disabled={disabled || currentBet === 0}
          className="quick-bet-btn clear"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
