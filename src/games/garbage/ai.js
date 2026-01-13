/**
 * Garbage Card Game AI
 * 
 * Simple decision-making AI with three difficulty levels.
 * No machine learning - just probability-based choices.
 * 
 * Example usage:
 *   const move = makeMove(aiCards, aiHidden, drawPile, discardPile, 'normal');
 *   // { action: 'draw_pile', placements: [...], endedWith: 'garbage' }
 */

import { 
  getCardValue, 
  isGarbage, 
  isWild, 
  isPositionFilled,
  getValidPositions,
  countFilledPositions
} from './game-logic';

/**
 * Decides if AI should take from discard pile or draw pile
 * @param {string} discardCard - Top card of discard pile (or null)
 * @param {Array} aiCards - AI's current 10 card positions
 * @param {string} difficulty - 'easy', 'normal', 'hard'
 * @returns {boolean} true = take discard, false = draw from pile
 */
export function shouldTakeDiscard(discardCard, aiCards, difficulty = 'normal') {
  // No discard available
  if (!discardCard) {
    return false;
  }
  
  // Garbage cards are never useful
  if (isGarbage(discardCard)) {
    return false;
  }
  
  const validPositions = getValidPositions(discardCard, aiCards);
  const canUse = validPositions.length > 0;
  
  switch (difficulty) {
    case 'easy':
      // Easy AI: 30% chance to make correct decision
      return Math.random() < 0.3 ? canUse : !canUse;
      
    case 'hard':
      // Hard AI: Always take if useful, with preference for lower positions
      // (lower positions are more valuable early game)
      if (!canUse) return false;
      if (isWild(discardCard)) {
        // Only take wild if we have 3+ empty spots (save for later otherwise)
        const emptyCount = 10 - countFilledPositions(aiCards);
        return emptyCount >= 3;
      }
      return true;
      
    case 'normal':
    default:
      // Normal AI: Take if it fits an open position
      return canUse;
  }
}

/**
 * Selects where to place a wild Jack
 * @param {string} card - The Jack card
 * @param {Array} aiCards - AI's current positions
 * @param {string} difficulty - 'easy', 'normal', 'hard'
 * @returns {number} Position 1-10 to place the Jack
 */
export function selectWildPlacement(card, aiCards, difficulty = 'normal') {
  const openPositions = [];
  for (let i = 1; i <= 10; i++) {
    if (!isPositionFilled(aiCards, i)) {
      openPositions.push(i);
    }
  }
  
  if (openPositions.length === 0) {
    return null; // No valid placement
  }
  
  switch (difficulty) {
    case 'easy':
      // Easy AI: Random position
      return openPositions[Math.floor(Math.random() * openPositions.length)];
      
    case 'hard':
      // Hard AI: Pick position least likely to be filled naturally
      // 10s and Aces are rarer to draw, so prioritize those
      const priority = [10, 1, 9, 2, 8, 3, 7, 4, 6, 5];
      for (const pos of priority) {
        if (openPositions.includes(pos)) {
          return pos;
        }
      }
      return openPositions[0];
      
    case 'normal':
    default:
      // Normal AI: Lowest open position
      return Math.min(...openPositions);
  }
}

/**
 * Executes a complete AI turn with chain handling
 * @param {Array} aiCards - AI's visible card positions
 * @param {Array} aiHidden - AI's face-down cards
 * @param {string[]} drawPile - Remaining deck
 * @param {string[]} discardPile - Discard pile
 * @param {string} difficulty - 'easy', 'normal', 'hard'
 * @returns {object} Move result with all details
 */
export function makeMove(aiCards, aiHidden, drawPile, discardPile, difficulty = 'normal') {
  const result = {
    action: null,
    placements: [],      // Array of { card, position }
    discarded: null,
    endedWith: null,     // 'garbage', 'no_placement', 'complete'
    newAiCards: [...aiCards],
    newAiHidden: [...aiHidden],
    newDrawPile: [...drawPile],
    newDiscardPile: [...discardPile]
  };
  
  // Decide: take discard or draw?
  const topDiscard = discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;
  const takeDiscard = shouldTakeDiscard(topDiscard, aiCards, difficulty);
  
  let currentCard;
  if (takeDiscard && topDiscard) {
    result.action = 'take_discard';
    currentCard = result.newDiscardPile.pop();
  } else {
    result.action = 'draw_pile';
    currentCard = result.newDrawPile.shift();
  }
  
  if (!currentCard) {
    result.endedWith = 'no_cards';
    return result;
  }
  
  // Chain loop: keep placing until we can't
  while (currentCard) {
    // Check if garbage
    if (isGarbage(currentCard)) {
      result.newDiscardPile.push(currentCard);
      result.discarded = currentCard;
      result.endedWith = 'garbage';
      break;
    }
    
    // Find valid placement
    let targetPosition;
    if (isWild(currentCard)) {
      targetPosition = selectWildPlacement(currentCard, result.newAiCards, difficulty);
    } else {
      const positions = getValidPositions(currentCard, result.newAiCards);
      targetPosition = positions.length > 0 ? positions[0] : null;
    }
    
    // Can't place? Discard and end turn
    if (targetPosition === null) {
      result.newDiscardPile.push(currentCard);
      result.discarded = currentCard;
      result.endedWith = 'no_placement';
      break;
    }
    
    // Place the card
    const index = targetPosition - 1;
    result.placements.push({ card: currentCard, position: targetPosition });
    
    // Pick up what was there (from hidden cards)
    const hiddenCard = result.newAiHidden[index];
    result.newAiCards[index] = currentCard;
    result.newAiHidden[index] = null;
    
    // Continue chain with the picked-up card
    currentCard = hiddenCard;
    
    // Check for win
    if (result.newAiCards.every(c => c !== null)) {
      result.endedWith = 'complete';
      break;
    }
  }
  
  return result;
}

export default {
  shouldTakeDiscard,
  selectWildPlacement,
  makeMove
};
