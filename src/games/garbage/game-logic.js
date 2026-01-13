/**
 * Garbage Card Game Logic
 * 
 * Pure functions implementing game rules. No React, no side effects.
 * 
 * Example usage:
 *   const card = parseCard('A♠');        // { rank: 'A', suit: '♠', value: 1 }
 *   const canPlace = canPlaceCard(card, 1, playerCards);  // true if position 1 is empty
 *   const hasWon = checkWin(playerCards); // true if all 10 positions filled
 */

// Card value mapping
const RANK_VALUES = {
  'A': 1, '2': 2, '3': 3, '4': 4, '5': 5,
  '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11,  // Wild - can go anywhere
  'Q': 0,   // Garbage - ends turn
  'K': 0    // Garbage - ends turn
};

/**
 * Parses a card string into components
 * @param {string} cardString - Card like "A♠", "10♥", "K♦"
 * @returns {{ rank: string, suit: string, value: number }}
 * 
 * @example
 *   parseCard('A♠')  // { rank: 'A', suit: '♠', value: 1 }
 *   parseCard('10♥') // { rank: '10', suit: '♥', value: 10 }
 *   parseCard('J♣')  // { rank: 'J', suit: '♣', value: 11 }
 *   parseCard('K♦')  // { rank: 'K', suit: '♦', value: 0 }
 */
export function parseCard(cardString) {
  if (!cardString || typeof cardString !== 'string') {
    return null;
  }
  
  // Handle 10 (two-character rank)
  const suit = cardString.slice(-1);
  const rank = cardString.slice(0, -1);
  const value = RANK_VALUES[rank] ?? 0;
  
  return { rank, suit, value };
}

/**
 * Gets the numeric value/position for a card
 * @param {string|object} card - Card string or parsed card object
 * @returns {number} Position 1-10, 11 for wild (Jack), 0 for garbage (Q/K)
 * 
 * @example
 *   getCardValue('5♠')  // 5
 *   getCardValue('J♥')  // 11 (wild)
 *   getCardValue('Q♦')  // 0 (garbage)
 */
export function getCardValue(card) {
  if (typeof card === 'string') {
    const parsed = parseCard(card);
    return parsed ? parsed.value : 0;
  }
  return card?.value ?? 0;
}

/**
 * Checks if a card is garbage (Queen or King)
 * @param {string|object} card - Card string or parsed card
 * @returns {boolean}
 * 
 * @example
 *   isGarbage('Q♠')  // true
 *   isGarbage('K♥')  // true
 *   isGarbage('5♦')  // false
 */
export function isGarbage(card) {
  const parsed = typeof card === 'string' ? parseCard(card) : card;
  return parsed?.rank === 'Q' || parsed?.rank === 'K';
}

/**
 * Checks if a card is wild (Jack)
 * @param {string|object} card - Card string or parsed card
 * @returns {boolean}
 * 
 * @example
 *   isWild('J♠')   // true
 *   isWild('10♥')  // false
 */
export function isWild(card) {
  const parsed = typeof card === 'string' ? parseCard(card) : card;
  return parsed?.rank === 'J';
}

/**
 * Checks if a position (1-10) already has a face-up card
 * @param {Array} cards - Array of 10 card slots (null = empty/face-down)
 * @param {number} position - Position 1-10
 * @returns {boolean}
 * 
 * @example
 *   isPositionFilled([null, '2♠', null, ...], 2)  // true
 *   isPositionFilled([null, null, null, ...], 1)  // false
 */
export function isPositionFilled(cards, position) {
  const index = position - 1; // Convert 1-based to 0-based
  return cards[index] !== null && cards[index] !== undefined;
}

/**
 * Checks if a card can be placed in a position
 * @param {string|object} card - Card to place
 * @param {number} position - Target position 1-10
 * @param {Array} currentCards - Current board state (10 slots)
 * @returns {boolean}
 * 
 * @example
 *   // 5 can go in position 5 if empty
 *   canPlaceCard('5♠', 5, [null, null, null, null, null, ...])  // true
 *   // Jack can go anywhere empty
 *   canPlaceCard('J♥', 3, [null, null, null, ...])  // true
 *   // Can't place if position already filled
 *   canPlaceCard('5♠', 5, [null, null, null, null, '5♦', ...])  // false
 */
export function canPlaceCard(card, position, currentCards) {
  // Validate position
  if (position < 1 || position > 10) {
    return false;
  }
  
  // Check if position is already filled
  if (isPositionFilled(currentCards, position)) {
    return false;
  }
  
  // Garbage cards can never be placed
  if (isGarbage(card)) {
    return false;
  }
  
  // Jacks (wild) can go in any empty position
  if (isWild(card)) {
    return true;
  }
  
  // Regular cards must match the position
  const value = getCardValue(card);
  return value === position;
}

/**
 * Checks if player has won (all 10 positions filled)
 * @param {Array} cards - Player's 10 card slots
 * @returns {boolean}
 * 
 * @example
 *   checkWin(['A♠', '2♥', '3♦', '4♣', '5♠', '6♥', '7♦', '8♣', '9♠', '10♥'])  // true
 *   checkWin(['A♠', null, '3♦', ...])  // false
 */
export function checkWin(cards) {
  if (!Array.isArray(cards) || cards.length !== 10) {
    return false;
  }
  return cards.every(card => card !== null && card !== undefined);
}

/**
 * Deals initial cards to both players
 * @param {string[]} shuffledDeck - 52-card shuffled deck
 * @returns {{ playerCards: Array, aiCards: Array, drawPile: string[], discardPile: string[] }}
 * 
 * @example
 *   const deck = shuffleDeck(seed);
 *   const { playerCards, aiCards, drawPile, discardPile } = dealInitialCards(deck);
 *   // playerCards = [null, null, null, ...] (10 face-down positions)
 *   // Player's actual dealt cards are tracked separately until flipped
 */
export function dealInitialCards(shuffledDeck) {
  if (!Array.isArray(shuffledDeck) || shuffledDeck.length < 20) {
    throw new Error('Invalid deck: need at least 20 cards');
  }
  
  // Deal 10 to each player (face-down, so represented as objects with hidden cards)
  const playerDealt = shuffledDeck.slice(0, 10);
  const aiDealt = shuffledDeck.slice(10, 20);
  const drawPile = shuffledDeck.slice(20);
  
  return {
    // Face-down cards (null means not yet revealed)
    // We store the actual cards separately so they can be flipped
    playerCards: new Array(10).fill(null),
    aiCards: new Array(10).fill(null),
    // Hidden cards that will be revealed when flipped
    playerHidden: playerDealt,
    aiHidden: aiDealt,
    // Remaining deck
    drawPile: drawPile,
    discardPile: []
  };
}

/**
 * Gets valid positions where a card can be placed
 * @param {string} card - Card to place
 * @param {Array} currentCards - Current board state
 * @returns {number[]} Array of valid position numbers (1-10)
 */
export function getValidPositions(card, currentCards) {
  const positions = [];
  
  if (isGarbage(card)) {
    return []; // Q/K can't be placed anywhere
  }
  
  if (isWild(card)) {
    // Jack can go in any empty position
    for (let i = 1; i <= 10; i++) {
      if (!isPositionFilled(currentCards, i)) {
        positions.push(i);
      }
    }
  } else {
    // Regular card can only go in its matching position
    const value = getCardValue(card);
    if (value >= 1 && value <= 10 && !isPositionFilled(currentCards, value)) {
      positions.push(value);
    }
  }
  
  return positions;
}

/**
 * Counts how many positions are filled
 * @param {Array} cards - Player's 10 card slots
 * @returns {number} Count of filled positions (0-10)
 */
export function countFilledPositions(cards) {
  return cards.filter(card => card !== null && card !== undefined).length;
}

export default {
  parseCard,
  getCardValue,
  isGarbage,
  isWild,
  isPositionFilled,
  canPlaceCard,
  checkWin,
  dealInitialCards,
  getValidPositions,
  countFilledPositions
};
