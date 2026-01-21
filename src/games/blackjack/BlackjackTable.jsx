/**
 * BlackjackTable - Main table layout with dealer, player hands, and actions
 */

import React from 'react';
import Hand from './Hand';
import { canHit, canDoubleDown, canSplit, canTakeInsurance } from './gameLogic';

function getGameMessage(state) {
  switch (state.phase) {
    case 'betting':
      return state.chipBalance < 5 ? "Game over - Out of chips!" : "Place your bet to begin";
    case 'dealing':
      return "Dealing...";
    case 'playerTurn':
      if (state.playerHands.length > 1) {
        return `Playing Hand ${state.activeHandIndex + 1} of ${state.playerHands.length}`;
      }
      return "Your turn";
    case 'dealerTurn':
      return "Dealer's turn...";
    case 'payout':
      return formatResults(state.roundResult);
    case 'sessionOver':
      return "Session complete!";
    default:
      return "";
  }
}

function formatResults(results) {
  if (!results || results.length === 0) return "";
  if (results.length === 1) {
    const r = results[0];
    switch (r.outcome) {
      case 'blackjack': return `Blackjack! You win $${r.payout - r.bet}!`;
      case 'win': return `You win $${r.payout - r.bet}!`;
      case 'push': return "Push - bet returned";
      case 'lose': return "Dealer wins";
      case 'bust': return "Bust - you lose";
      default: return "";
    }
  }
  const total = results.reduce((sum, r) => sum + r.payout, 0);
  const totalBet = results.reduce((sum, r) => sum + r.bet, 0);
  const net = total - totalBet;
  if (net > 0) return `You win $${net} total!`;
  if (net < 0) return `You lose $${Math.abs(net)} total`;
  return "Push - bets returned";
}

export default function BlackjackTable({
  state,
  insuranceDeclined,
  onHit,
  onStand,
  onDoubleDown,
  onSplit,
  onInsurance
}) {
  const activeHand = state.playerHands[state.activeHandIndex] || [];
  const insuranceCost = Math.floor(state.currentBet / 2);
  const canAffordInsurance = state.chipBalance >= insuranceCost;

  const canTakeIns = canTakeInsurance(state.dealerHand, state.phase);
  const showInsurance = canTakeIns &&
                        state.insuranceBet === 0 &&
                        activeHand.length === 2 &&
                        !insuranceDeclined;

  // Debug logging for insurance prompt
  if (state.phase === 'playerTurn' && activeHand.length === 2) {
    console.log('[Insurance] Prompt visibility check:', {
      canTakeIns,
      insuranceBet: state.insuranceBet,
      handLength: activeHand.length,
      insuranceDeclined,
      showInsurance,
      dealerUpCard: state.dealerHand[0]?.rank
    });
  }
  
  // Get split Aces hands array (default to empty if not present for backwards compatibility)
  const splitAcesHands = state.splitAcesHands || [];

  // Map results to hand outcomes for badges
  const getHandResult = (index) => {
    if (state.phase !== 'payout' || !state.roundResult) return null;
    const result = state.roundResult[index];
    if (!result) return null;
    switch (result.outcome) {
      case 'blackjack': return 'blackjack';
      case 'win': return 'win';
      case 'push': return 'push';
      case 'lose':
      case 'bust': return 'lose';
      default: return null;
    }
  };

  return (
    <div className="blackjack-table">
      {/* Dealer Section */}
      <div className="dealer-section">
        <Hand
          cards={state.dealerHand}
          isDealer={true}
          label="Dealer"
          showValue={true}
        />
      </div>

      {/* Message Area */}
      <div className="message-area">
        <p className="game-message">{getGameMessage(state)}</p>
      </div>

      {/* Insurance Prompt */}
      {showInsurance && (
        <div className="insurance-prompt">
          <span>Insurance? (${insuranceCost})</span>
          <button
            onClick={() => onInsurance(true)}
            disabled={!canAffordInsurance}
            className="insurance-btn yes"
          >
            Yes
          </button>
          <button onClick={() => onInsurance(false)} className="insurance-btn no">No</button>
        </div>
      )}

      {/* Player Section */}
      <div className="player-section">
        {state.playerHands.map((hand, index) => (
          <div key={index} className="player-hand-wrapper">
            <Hand
              cards={hand}
              isDealer={false}
              isActive={state.phase === 'playerTurn' && index === state.activeHandIndex}
              label={state.playerHands.length > 1 ? `Hand ${index + 1}` : 'Player'}
              showValue={true}
              result={getHandResult(index)}
            />
            <div className="hand-bet-display">${state.handBets[index] || 0}</div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      {state.phase === 'playerTurn' && !showInsurance && (
        <div className="action-buttons">
          <button
            onClick={onHit}
            disabled={!canHit(activeHand, splitAcesHands, state.activeHandIndex)}
            className="action-btn hit"
          >
            HIT
          </button>
          <button
            onClick={onStand}
            className="action-btn stand"
          >
            STAND
          </button>
          <button
            onClick={onDoubleDown}
            disabled={!canDoubleDown(activeHand, state.chipBalance, state.handBets[state.activeHandIndex], splitAcesHands, state.activeHandIndex)}
            className="action-btn double"
          >
            DOUBLE
          </button>
          <button
            onClick={onSplit}
            disabled={!canSplit(activeHand, state.chipBalance, state.handBets[state.activeHandIndex], state.playerHands.length)}
            className="action-btn split"
          >
            SPLIT
          </button>
        </div>
      )}
    </div>
  );
}
