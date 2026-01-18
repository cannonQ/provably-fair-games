/**
 * Blackjack History Validator
 *
 * Validates round history and final chip balance
 */

import {
  calculateHandValue,
  isBlackjack,
  isBust,
  compareHands
} from './gameLogic.js';

/**
 * Validate Blackjack game submission
 * Verifies round history produces claimed chip balance
 * @param {Object} submission - Game submission data
 * @param {Array} submission.roundHistory - Array of round objects
 * @param {number} submission.score - Final chip balance
 * @param {number} submission.initialBalance - Starting balance (default 1000)
 * @returns {{valid: boolean, reason?: string, calculatedBalance?: number, details?: Object}}
 */
export function validateBlackjackGame(submission) {
  const { roundHistory, score, initialBalance = 1000 } = submission;

  // Validation 1: Basic data present
  if (!roundHistory || !Array.isArray(roundHistory)) {
    return { valid: false, reason: 'Missing or invalid round history' };
  }

  if (score === undefined || score === null) {
    return { valid: false, reason: 'Missing score' };
  }

  // Validation 2: Must have played at least one round
  if (roundHistory.length === 0) {
    return { valid: false, reason: 'No rounds played' };
  }

  // Validation 3: Replay all rounds and calculate balance
  let chipBalance = initialBalance;
  const roundResults = [];

  for (let i = 0; i < roundHistory.length; i++) {
    const round = roundHistory[i];

    // Validate round structure
    if (!round.bet || !round.playerHands || !round.dealerHand) {
      return {
        valid: false,
        reason: `Round ${i + 1}: Missing bet, playerHands, or dealerHand`
      };
    }

    // Validate bet amount
    if (round.bet <= 0) {
      return {
        valid: false,
        reason: `Round ${i + 1}: Invalid bet amount ${round.bet}`
      };
    }

    // Validate bet doesn't exceed balance
    if (round.bet > chipBalance) {
      return {
        valid: false,
        reason: `Round ${i + 1}: Bet ${round.bet} exceeds balance ${chipBalance}`
      };
    }

    // Process each player hand (can be multiple due to splits)
    let roundProfit = 0;

    for (let handIndex = 0; handIndex < round.playerHands.length; handIndex++) {
      const playerHand = round.playerHands[handIndex];
      const dealerHand = round.dealerHand;

      // Calculate hand values
      const playerValue = calculateHandValue(playerHand.cards || playerHand);
      const dealerValue = calculateHandValue(dealerHand.cards || dealerHand);

      // Check for bust
      const playerBust = isBust({ cards: playerHand.cards || playerHand });
      const dealerBust = isBust({ cards: dealerHand.cards || dealerHand });

      // Determine outcome
      let outcome;
      if (playerBust) {
        outcome = 'loss';
      } else if (dealerBust) {
        outcome = 'win';
      } else {
        const playerBlackjack = isBlackjack(playerHand.cards || playerHand);
        const dealerBlackjack = isBlackjack(dealerHand.cards || dealerHand);

        if (playerBlackjack && !dealerBlackjack) {
          outcome = 'blackjack';
        } else if (playerValue > dealerValue) {
          outcome = 'win';
        } else if (playerValue < dealerValue) {
          outcome = 'loss';
        } else {
          outcome = 'push';
        }
      }

      // Calculate payout
      const handBet = round.bet; // For splits, bet is per hand
      let payout = 0;

      if (outcome === 'blackjack') {
        payout = handBet * 2.5; // Bet + 1.5x bet
      } else if (outcome === 'win') {
        payout = handBet * 2; // Bet + bet
      } else if (outcome === 'push') {
        payout = handBet; // Return bet
      } else {
        payout = 0; // Loss - lose bet
      }

      roundProfit += payout - handBet;
    }

    chipBalance += roundProfit;
    roundResults.push({
      roundNumber: i + 1,
      profit: roundProfit,
      newBalance: chipBalance
    });

    // Balance cannot go negative
    if (chipBalance < 0) {
      chipBalance = 0;
      break; // Player is out of chips
    }
  }

  // Validation 4: Verify final balance matches score
  if (chipBalance !== score) {
    return {
      valid: false,
      reason: `Balance mismatch: calculated ${chipBalance}, claimed ${score}`,
      calculatedBalance: chipBalance
    };
  }

  return {
    valid: true,
    calculatedBalance: chipBalance,
    details: {
      initialBalance,
      roundsPlayed: roundHistory.length,
      finalBalance: chipBalance,
      totalProfit: chipBalance - initialBalance,
      roundResults
    }
  };
}

/**
 * Validate a single round structure
 * @param {Object} round - Round object
 * @returns {{valid: boolean, reason?: string}}
 */
export function validateRoundFormat(round) {
  if (!round || typeof round !== 'object') {
    return { valid: false, reason: 'Round must be an object' };
  }

  if (typeof round.bet !== 'number' || round.bet <= 0) {
    return { valid: false, reason: 'Invalid bet amount' };
  }

  if (!Array.isArray(round.playerHands)) {
    return { valid: false, reason: 'playerHands must be an array' };
  }

  if (!round.dealerHand) {
    return { valid: false, reason: 'Missing dealer hand' };
  }

  // Validate each player hand has cards
  for (let i = 0; i < round.playerHands.length; i++) {
    const hand = round.playerHands[i];
    const cards = hand.cards || hand;

    if (!Array.isArray(cards) || cards.length === 0) {
      return { valid: false, reason: `Player hand ${i} has no cards` };
    }
  }

  // Validate dealer hand has cards
  const dealerCards = round.dealerHand.cards || round.dealerHand;
  if (!Array.isArray(dealerCards) || dealerCards.length === 0) {
    return { valid: false, reason: 'Dealer hand has no cards' };
  }

  return { valid: true };
}

/**
 * Calculate expected balance from round history
 * @param {Array} roundHistory - Array of rounds
 * @param {number} initialBalance - Starting balance
 * @returns {number} Final balance
 */
export function calculateFinalBalance(roundHistory, initialBalance = 1000) {
  const result = validateBlackjackGame({
    roundHistory,
    score: 0, // Dummy value, we just want the calculation
    initialBalance
  });

  return result.calculatedBalance || initialBalance;
}

/**
 * Validate round history format
 * @param {Array} roundHistory - Array of rounds
 * @returns {{valid: boolean, reason?: string, invalidRoundIndex?: number}}
 */
export function validateRoundHistoryFormat(roundHistory) {
  if (!Array.isArray(roundHistory)) {
    return { valid: false, reason: 'Round history must be an array' };
  }

  for (let i = 0; i < roundHistory.length; i++) {
    const roundValidation = validateRoundFormat(roundHistory[i]);
    if (!roundValidation.valid) {
      return {
        valid: false,
        reason: `Round ${i + 1}: ${roundValidation.reason}`,
        invalidRoundIndex: i
      };
    }
  }

  return { valid: true };
}

export default {
  validateBlackjackGame,
  validateRoundFormat,
  calculateFinalBalance,
  validateRoundHistoryFormat
};
