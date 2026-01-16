/**
 * Solitaire Game Logic
 * 
 * Contains all rules validation and move checking for Klondike Solitaire.
 * Pure functions with no side effects - safe to use anywhere.
 */

const RANK_VALUES = {
  'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
  '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13
};

// ============ COLOR HELPERS ============

export const isRed = (card) => card.suit === 'hearts' || card.suit === 'diamonds';
export const isBlack = (card) => card.suit === 'clubs' || card.suit === 'spades';
export const isOppositeColor = (card1, card2) => isRed(card1) !== isRed(card2);

// ============ RANK HELPERS ============

export const getRankValue = (rank) => RANK_VALUES[rank] || 0;
export const isOneHigher = (card1, card2) => getRankValue(card1.rank) === getRankValue(card2.rank) + 1;
export const isOneLower = (card1, card2) => getRankValue(card1.rank) === getRankValue(card2.rank) - 1;

// ============ TABLEAU VALIDATION ============

export function canPlaceOnTableau(card, targetColumn) {
  if (targetColumn.length === 0) {
    return getRankValue(card.rank) === 13; // Only Kings on empty
  }
  
  const topCard = targetColumn[targetColumn.length - 1];
  return isOppositeColor(card, topCard) && isOneLower(card, topCard);
}

export function getMovableSequence(column, fromIndex) {
  if (fromIndex < 0 || fromIndex >= column.length) return null;
  
  const sequence = column.slice(fromIndex);
  if (!sequence.every(card => card.faceUp)) return null;
  
  for (let i = 0; i < sequence.length - 1; i++) {
    const current = sequence[i];
    const next = sequence[i + 1];
    if (!isOppositeColor(current, next) || !isOneHigher(current, next)) {
      return null;
    }
  }
  
  return sequence;
}

// ============ FOUNDATION VALIDATION ============

export function canPlaceOnFoundation(card, foundationPile, foundationSuit) {
  if (card.suit !== foundationSuit) return false;
  
  if (foundationPile.length === 0) {
    return card.rank === 'A';
  }
  
  const topCard = foundationPile[foundationPile.length - 1];
  return isOneHigher(card, topCard);
}

// ============ STOCK/WASTE VALIDATION ============

export const canDrawFromStock = (stock) => stock.length > 0;
export const canRecycleStock = (stock, waste) => stock.length === 0 && waste.length > 0;

// ============ GAME STATE CHECKS ============

export function checkWinCondition(foundations) {
  return Object.values(foundations).every(pile => pile.length === 13);
}

export function canAutoComplete(state) {
  // Can auto-complete when all tableau cards are face-up
  // Even with cards in stock/waste, if all tableau is revealed, game is completable
  return state.tableau.every(column =>
    column.every(card => card.faceUp)
  );
}

// ============ STUCK DETECTION ============

/**
 * Check if any valid moves exist
 * @param {Object} state - Current game state
 * @returns {boolean} True if at least one move is possible
 */
export function hasValidMoves(state) {
  const { tableau, waste, stock, foundations } = state;

  // Can draw from stock or recycle
  if (stock.length > 0) return true;
  if (stock.length === 0 && waste.length > 0) return true;

  // Check waste card
  if (waste.length > 0) {
    const wasteCard = waste[waste.length - 1];
    
    // Can waste go to foundation?
    const foundationPile = foundations[wasteCard.suit];
    if (foundationPile && canPlaceOnFoundation(wasteCard, foundationPile, wasteCard.suit)) {
      return true;
    }
    
    // Can waste go to tableau?
    for (const column of tableau) {
      if (canPlaceOnTableau(wasteCard, column)) {
        return true;
      }
    }
  }

  // Check tableau moves
  for (let fromCol = 0; fromCol < 7; fromCol++) {
    const column = tableau[fromCol];
    if (column.length === 0) continue;

    // Check top card to foundation
    const topCard = column[column.length - 1];
    if (topCard.faceUp) {
      const foundationPile = foundations[topCard.suit];
      if (foundationPile && canPlaceOnFoundation(topCard, foundationPile, topCard.suit)) {
        return true;
      }
    }

    // Check movable sequences to other tableau columns
    const firstFaceUp = column.findIndex(c => c.faceUp);
    if (firstFaceUp === -1) continue;

    const sequence = getMovableSequence(column, firstFaceUp);
    if (!sequence) continue;

    const bottomCard = sequence[0];
    
    for (let toCol = 0; toCol < 7; toCol++) {
      if (toCol === fromCol) continue;
      
      // Skip if moving King from empty-ish column to another empty (pointless)
      if (bottomCard.rank === 'K' && firstFaceUp === 0 && tableau[toCol].length === 0) {
        continue;
      }
      
      if (canPlaceOnTableau(bottomCard, tableau[toCol])) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if game is stuck (no moves and can't draw/recycle)
 * @param {Object} state - Current game state
 * @returns {boolean} True if game is stuck
 */
export function isGameStuck(state) {
  // If all tableau cards are face-up, game is always completable (not stuck)
  const allTableauFaceUp = state.tableau.every(column =>
    column.every(card => card.faceUp)
  );
  if (allTableauFaceUp) return false;

  return !hasValidMoves(state);
}

// ============ HINT SYSTEM ============

export function getHint(state) {
  const { tableau, waste, foundations } = state;
  
  // Check waste card moves
  if (waste.length > 0) {
    const wasteCard = waste[waste.length - 1];
    
    const foundationPile = foundations[wasteCard.suit];
    if (foundationPile && canPlaceOnFoundation(wasteCard, foundationPile, wasteCard.suit)) {
      return { from: { type: 'waste' }, to: { type: 'foundation', suit: wasteCard.suit }, cards: [wasteCard] };
    }
    
    for (let i = 0; i < 7; i++) {
      if (canPlaceOnTableau(wasteCard, tableau[i])) {
        return { from: { type: 'waste' }, to: { type: 'tableau', index: i }, cards: [wasteCard] };
      }
    }
  }
  
  // Check tableau moves
  for (let fromCol = 0; fromCol < 7; fromCol++) {
    const column = tableau[fromCol];
    
    const firstFaceUp = column.findIndex(c => c.faceUp);
    if (firstFaceUp === -1) continue;
    
    const sequence = getMovableSequence(column, firstFaceUp);
    if (!sequence) continue;
    
    const bottomCard = sequence[0];
    
    // Try foundation for top card
    const topCard = column[column.length - 1];
    const topFoundation = foundations[topCard.suit];
    if (topFoundation && canPlaceOnFoundation(topCard, topFoundation, topCard.suit)) {
      return { from: { type: 'tableau', index: fromCol }, to: { type: 'foundation', suit: topCard.suit }, cards: [topCard] };
    }
    
    // Try moving to other columns
    for (let toCol = 0; toCol < 7; toCol++) {
      if (toCol === fromCol) continue;
      if (canPlaceOnTableau(bottomCard, tableau[toCol])) {
        return { from: { type: 'tableau', index: fromCol }, to: { type: 'tableau', index: toCol }, cards: sequence };
      }
    }
  }
  
  return null;
}

// ============ VALID MOVE CHECKER ============

export function isValidMove(cards, destination, state) {
  if (!cards || cards.length === 0) return false;
  
  if (destination.type === 'tableau') {
    const targetColumn = state.tableau[destination.index];
    return canPlaceOnTableau(cards[0], targetColumn);
  }
  
  if (destination.type === 'foundation') {
    if (cards.length !== 1) return false;
    const pile = state.foundations[destination.suit];
    if (!pile) return false;
    return canPlaceOnFoundation(cards[0], pile, destination.suit);
  }
  
  return false;
}
