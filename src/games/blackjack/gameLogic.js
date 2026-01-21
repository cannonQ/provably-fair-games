/**
 * Blackjack Game Logic - Hand evaluation, player options, dealer rules, payouts
 */

// =============================================================================
// CARD VALUES
// =============================================================================

/** @param {Object} card @returns {number} Card value (Ace = 11) */
export function getCardValue(card) {
  if (['J', 'Q', 'K'].includes(card.rank)) return 10;
  if (card.rank === 'A') return 11;
  return parseInt(card.rank, 10);
}

// =============================================================================
// HAND EVALUATION
// =============================================================================

/**
 * Calculate hand value, adjusting Aces as needed
 * @param {Array} hand @returns {{ value: number, isSoft: boolean }}
 */
export function calculateHandValue(hand) {
  let value = 0, aces = 0;
  for (const card of hand) {
    value += getCardValue(card);
    if (card.rank === 'A') aces++;
  }
  while (value > 21 && aces > 0) { value -= 10; aces--; }
  return { value, isSoft: aces > 0 && value <= 21 };
}

/** Check if hand is natural blackjack (Ace + 10-value on first 2 cards) */
export function isBlackjack(hand) {
  return hand.length === 2 && calculateHandValue(hand).value === 21;
}

/** @returns {boolean} True if hand value > 21 */
export function isBust(hand) {
  return calculateHandValue(hand).value > 21;
}

/** @returns {'blackjack'|'bust'|'standing'|'playing'} */
export function getHandStatus(hand) {
  if (isBlackjack(hand)) return 'blackjack';
  if (isBust(hand)) return 'bust';
  if (calculateHandValue(hand).value === 21) return 'standing';
  return 'playing';
}

// =============================================================================
// PLAYER OPTIONS
// =============================================================================

/** @returns {boolean} True if hand can receive another card */
export function canHit(hand, splitAcesHands = [], handIndex = 0) {
  // Can't hit on split Aces (only get one card)
  if (splitAcesHands.includes(handIndex)) return false;
  return calculateHandValue(hand).value < 21;
}

/** @returns {boolean} Always true during player turn */
export function canStand() {
  return true;
}

/** @returns {boolean} True if exactly 2 cards, has chips to double, and not split Aces */
export function canDoubleDown(hand, chipBalance, currentBet, splitAcesHands = [], handIndex = 0) {
  // Can't double on split Aces
  if (splitAcesHands.includes(handIndex)) return false;
  return hand.length === 2 && chipBalance >= currentBet;
}

/** @returns {boolean} True if pair, has chips, and under 4 hands */
export function canSplit(hand, chipBalance, currentBet, numHands) {
  if (hand.length !== 2 || numHands >= 4 || chipBalance < currentBet) return false;
  // Must be same RANK, not same VALUE (K-Q-J all have value 10 but can't split)
  return hand[0].rank === hand[1].rank;
}

/** @returns {boolean} True if dealer shows Ace and it's player turn */
export function canTakeInsurance(dealerHand, phase) {
  if (phase !== 'playerTurn') return false;
  const upCard = dealerHand.find(c => c.faceUp);
  return upCard?.rank === 'A';
}

// =============================================================================
// DEALER LOGIC (Stand on soft 17)
// =============================================================================

/** @returns {boolean} True if dealer must hit */
export function shouldDealerHit(dealerHand) {
  return calculateHandValue(dealerHand).value < 17;
}

/** @returns {'hit'|'stand'} */
export function getDealerAction(dealerHand) {
  return shouldDealerHit(dealerHand) ? 'hit' : 'stand';
}

// =============================================================================
// ROUND RESOLUTION
// =============================================================================

/**
 * Compare hands to determine winner
 * @param {Array} playerHand
 * @param {Array} dealerHand
 * @param {boolean} isSplitAcesHand - If true, 21 is not considered blackjack
 * @returns {'player_blackjack'|'player_win'|'dealer_win'|'push'|'player_bust'|'dealer_bust'}
 */
export function compareHands(playerHand, dealerHand, isSplitAcesHand = false) {
  // Split Aces getting 21 is NOT a blackjack (just 21)
  const playerBJ = !isSplitAcesHand && isBlackjack(playerHand);
  const dealerBJ = isBlackjack(dealerHand);
  const playerValue = calculateHandValue(playerHand).value;
  const dealerValue = calculateHandValue(dealerHand).value;

  if (playerValue > 21) return 'player_bust';
  if (dealerValue > 21) return 'dealer_bust';
  if (playerBJ && dealerBJ) return 'push';
  if (playerBJ) return 'player_blackjack';
  if (dealerBJ) return 'dealer_win';
  if (playerValue > dealerValue) return 'player_win';
  if (dealerValue > playerValue) return 'dealer_win';
  return 'push';
}

/**
 * Calculate payout for a hand result
 * @param {string} result @param {number} betAmount
 * @returns {number} Total returned (including original bet if won)
 */
export function calculatePayout(result, betAmount) {
  switch (result) {
    case 'player_blackjack': return betAmount * 2.5;  // 3:2
    case 'player_win':       return betAmount * 2;    // 1:1
    case 'dealer_bust':      return betAmount * 2;    // 1:1
    case 'push':             return betAmount;        // Return bet
    default:                 return 0;                // Lose bet
  }
}

/** @returns {number} Insurance payout (2:1 if dealer has BJ, else 0) */
export function calculateInsurancePayout(dealerHasBlackjack, insuranceBet) {
  return dealerHasBlackjack ? insuranceBet * 3 : 0;
}

// =============================================================================
// DISPLAY HELPERS
// =============================================================================

/** @returns {string} e.g., "17", "Soft 17", "Blackjack!", "Bust" */
export function formatHandValue(hand) {
  if (hand.length === 0) return '';
  if (isBlackjack(hand)) return 'Blackjack!';
  if (isBust(hand)) return 'Bust';
  const { value, isSoft } = calculateHandValue(hand);
  return isSoft ? `Soft ${value}` : `${value}`;
}

/** @returns {string} e.g., "A♠, K♥" */
export function getHandDescription(hand) {
  const symbols = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
  return hand.filter(c => c.faceUp).map(c => `${c.rank}${symbols[c.suit]}`).join(', ');
}
