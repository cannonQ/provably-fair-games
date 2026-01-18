/**
 * Blackjack Game Logic Tests
 *
 * Week 5, Monday: Test Blackjack game logic
 *
 * Tests:
 * - Card values (number cards, face cards, Aces)
 * - Hand calculation (hard, soft, Ace adjustment)
 * - Blackjack detection
 * - Bust detection
 * - Player options (hit, stand, double down, split, insurance)
 * - Dealer logic
 * - Hand comparison and winners
 * - Payouts
 * - Display helpers
 */

import {
  getCardValue,
  calculateHandValue,
  isBlackjack,
  isBust,
  getHandStatus,
  canHit,
  canStand,
  canDoubleDown,
  canSplit,
  canTakeInsurance,
  shouldDealerHit,
  getDealerAction,
  compareHands,
  calculatePayout,
  calculateInsurancePayout,
  formatHandValue,
  getHandDescription
} from '../gameLogic';

// ============================================
// TEST HELPERS
// ============================================

function createCard(rank, suit = 'hearts') {
  return { rank, suit, faceUp: true };
}

function createHand(...ranks) {
  return ranks.map(rank => createCard(rank));
}

// ============================================
// CARD VALUES
// ============================================

describe('Card Values', () => {
  test('number cards return their numeric value', () => {
    expect(getCardValue(createCard('2'))).toBe(2);
    expect(getCardValue(createCard('3'))).toBe(3);
    expect(getCardValue(createCard('4'))).toBe(4);
    expect(getCardValue(createCard('5'))).toBe(5);
    expect(getCardValue(createCard('6'))).toBe(6);
    expect(getCardValue(createCard('7'))).toBe(7);
    expect(getCardValue(createCard('8'))).toBe(8);
    expect(getCardValue(createCard('9'))).toBe(9);
    expect(getCardValue(createCard('10'))).toBe(10);
  });

  test('face cards all return 10', () => {
    expect(getCardValue(createCard('J'))).toBe(10);
    expect(getCardValue(createCard('Q'))).toBe(10);
    expect(getCardValue(createCard('K'))).toBe(10);
  });

  test('Ace returns 11 (soft value)', () => {
    expect(getCardValue(createCard('A'))).toBe(11);
  });
});

// ============================================
// HAND CALCULATION
// ============================================

describe('Hand Calculation', () => {
  test('calculates simple hard hand', () => {
    const hand = createHand('7', '8');
    const result = calculateHandValue(hand);
    expect(result.value).toBe(15);
    expect(result.isSoft).toBe(false);
  });

  test('calculates hard 20', () => {
    const hand = createHand('10', 'K');
    const result = calculateHandValue(hand);
    expect(result.value).toBe(20);
    expect(result.isSoft).toBe(false);
  });

  test('calculates soft hand (Ace counts as 11)', () => {
    const hand = createHand('A', '6');
    const result = calculateHandValue(hand);
    expect(result.value).toBe(17);
    expect(result.isSoft).toBe(true);
  });

  test('adjusts Ace from 11 to 1 when would bust', () => {
    const hand = createHand('A', '7', '9');  // 11 + 7 + 9 = 27, adjust to 1 + 7 + 9 = 17
    const result = calculateHandValue(hand);
    expect(result.value).toBe(17);
    expect(result.isSoft).toBe(false);
  });

  test('handles multiple Aces (only one soft)', () => {
    const hand = createHand('A', 'A', '9');  // 11 + 1 + 9 = 21
    const result = calculateHandValue(hand);
    expect(result.value).toBe(21);
    expect(result.isSoft).toBe(true);
  });

  test('adjusts multiple Aces when needed', () => {
    const hand = createHand('A', 'A', 'A', '8');  // 11 + 11 + 11 + 8 = 41, adjust to 1 + 1 + 11 + 8 = 21
    const result = calculateHandValue(hand);
    expect(result.value).toBe(21);
    expect(result.isSoft).toBe(true);  // One Ace still counts as 11
  });

  test('blackjack (Ace + 10)', () => {
    const hand = createHand('A', 'K');
    const result = calculateHandValue(hand);
    expect(result.value).toBe(21);
    expect(result.isSoft).toBe(true);
  });

  test('hard 21 (not blackjack)', () => {
    const hand = createHand('7', '7', '7');
    const result = calculateHandValue(hand);
    expect(result.value).toBe(21);
    expect(result.isSoft).toBe(false);
  });

  test('bust hand', () => {
    const hand = createHand('10', 'K', '5');
    const result = calculateHandValue(hand);
    expect(result.value).toBe(25);
    expect(result.isSoft).toBe(false);
  });
});

// ============================================
// BLACKJACK DETECTION
// ============================================

describe('Blackjack Detection', () => {
  test('detects blackjack (Ace + 10)', () => {
    expect(isBlackjack(createHand('A', '10'))).toBe(true);
  });

  test('detects blackjack (Ace + Jack)', () => {
    expect(isBlackjack(createHand('A', 'J'))).toBe(true);
  });

  test('detects blackjack (Ace + Queen)', () => {
    expect(isBlackjack(createHand('A', 'Q'))).toBe(true);
  });

  test('detects blackjack (Ace + King)', () => {
    expect(isBlackjack(createHand('A', 'K'))).toBe(true);
  });

  test('21 with 3+ cards is not blackjack', () => {
    expect(isBlackjack(createHand('7', '7', '7'))).toBe(false);
  });

  test('21 with Ace + non-10 is not blackjack', () => {
    expect(isBlackjack(createHand('A', '10'))).toBe(true);
    expect(isBlackjack(createHand('A', '5', '5'))).toBe(false);
  });
});

// ============================================
// BUST DETECTION
// ============================================

describe('Bust Detection', () => {
  test('detects bust (over 21)', () => {
    expect(isBust(createHand('10', 'K', '5'))).toBe(true);
  });

  test('22 is bust', () => {
    expect(isBust(createHand('10', 'K', '2'))).toBe(true);
  });

  test('21 is not bust', () => {
    expect(isBust(createHand('10', 'K', 'A'))).toBe(false);
  });

  test('20 is not bust', () => {
    expect(isBust(createHand('10', 'K'))).toBe(false);
  });

  test('soft hand adjusts Ace to avoid bust', () => {
    expect(isBust(createHand('A', '7', '9'))).toBe(false);  // 17, not bust
  });
});

// ============================================
// HAND STATUS
// ============================================

describe('Hand Status', () => {
  test('blackjack status', () => {
    expect(getHandStatus(createHand('A', 'K'))).toBe('blackjack');
  });

  test('bust status', () => {
    expect(getHandStatus(createHand('10', 'K', '5'))).toBe('bust');
  });

  test('standing on 21 (not blackjack)', () => {
    expect(getHandStatus(createHand('7', '7', '7'))).toBe('standing');
  });

  test('playing status', () => {
    expect(getHandStatus(createHand('10', '5'))).toBe('playing');
  });
});

// ============================================
// PLAYER OPTIONS - HIT
// ============================================

describe('Can Hit', () => {
  test('can hit with value under 21', () => {
    expect(canHit(createHand('10', '5'))).toBe(true);
  });

  test('can hit with soft 17', () => {
    expect(canHit(createHand('A', '6'))).toBe(true);
  });

  test('cannot hit with 21', () => {
    expect(canHit(createHand('10', 'K', 'A'))).toBe(false);
  });

  test('cannot hit with blackjack', () => {
    expect(canHit(createHand('A', 'K'))).toBe(false);
  });

  test('cannot hit on split Aces', () => {
    const hand = createHand('A', '10');
    const splitAcesHands = [0];  // Hand 0 is split Aces
    expect(canHit(hand, splitAcesHands, 0)).toBe(false);
  });

  test('can hit on non-split-Aces hand', () => {
    const hand = createHand('10', '5');
    const splitAcesHands = [];
    expect(canHit(hand, splitAcesHands, 0)).toBe(true);
  });
});

// ============================================
// PLAYER OPTIONS - STAND
// ============================================

describe('Can Stand', () => {
  test('can always stand', () => {
    expect(canStand()).toBe(true);
  });
});

// ============================================
// PLAYER OPTIONS - DOUBLE DOWN
// ============================================

describe('Can Double Down', () => {
  test('can double with exactly 2 cards and sufficient chips', () => {
    const hand = createHand('10', '5');
    expect(canDoubleDown(hand, 100, 10)).toBe(true);
  });

  test('cannot double with 3+ cards', () => {
    const hand = createHand('5', '5', '5');
    expect(canDoubleDown(hand, 100, 10)).toBe(false);
  });

  test('cannot double with insufficient chips', () => {
    const hand = createHand('10', '5');
    expect(canDoubleDown(hand, 5, 10)).toBe(false);
  });

  test('cannot double on split Aces', () => {
    const hand = createHand('A', '10');
    const splitAcesHands = [0];
    expect(canDoubleDown(hand, 100, 10, splitAcesHands, 0)).toBe(false);
  });

  test('can double on non-split-Aces hand', () => {
    const hand = createHand('10', '5');
    const splitAcesHands = [];
    expect(canDoubleDown(hand, 100, 10, splitAcesHands, 0)).toBe(true);
  });
});

// ============================================
// PLAYER OPTIONS - SPLIT
// ============================================

describe('Can Split', () => {
  test('can split pair of 8s with sufficient chips', () => {
    const hand = createHand('8', '8');
    expect(canSplit(hand, 100, 10, 1)).toBe(true);
  });

  test('can split pair of Aces', () => {
    const hand = createHand('A', 'A');
    expect(canSplit(hand, 100, 10, 1)).toBe(true);
  });

  test('can split pair of 10-value cards (10 and K)', () => {
    const hand = [createCard('10'), createCard('K')];
    expect(canSplit(hand, 100, 10, 1)).toBe(true);
  });

  test('cannot split with only 1 card', () => {
    const hand = createHand('8');
    expect(canSplit(hand, 100, 10, 1)).toBe(false);
  });

  test('cannot split with 3 cards', () => {
    const hand = createHand('8', '8', '3');
    expect(canSplit(hand, 100, 10, 1)).toBe(false);
  });

  test('cannot split non-matching cards', () => {
    const hand = createHand('8', '9');
    expect(canSplit(hand, 100, 10, 1)).toBe(false);
  });

  test('cannot split with insufficient chips', () => {
    const hand = createHand('8', '8');
    expect(canSplit(hand, 5, 10, 1)).toBe(false);
  });

  test('cannot split when already have 4 hands', () => {
    const hand = createHand('8', '8');
    expect(canSplit(hand, 100, 10, 4)).toBe(false);
  });
});

// ============================================
// PLAYER OPTIONS - INSURANCE
// ============================================

describe('Can Take Insurance', () => {
  test('can take insurance when dealer shows Ace during player turn', () => {
    const dealerHand = [createCard('A'), { rank: '10', suit: 'hearts', faceUp: false }];
    expect(canTakeInsurance(dealerHand, 'playerTurn')).toBe(true);
  });

  test('cannot take insurance when dealer shows non-Ace', () => {
    const dealerHand = [createCard('10'), { rank: 'A', suit: 'hearts', faceUp: false }];
    expect(canTakeInsurance(dealerHand, 'playerTurn')).toBe(false);
  });

  test('cannot take insurance during dealer turn', () => {
    const dealerHand = [createCard('A'), createCard('10')];
    expect(canTakeInsurance(dealerHand, 'dealerTurn')).toBe(false);
  });

  test('cannot take insurance before turn starts', () => {
    const dealerHand = [createCard('A'), { rank: '10', suit: 'hearts', faceUp: false }];
    expect(canTakeInsurance(dealerHand, 'betting')).toBe(false);
  });
});

// ============================================
// DEALER LOGIC
// ============================================

describe('Dealer Logic', () => {
  test('dealer hits on 16', () => {
    expect(shouldDealerHit(createHand('10', '6'))).toBe(true);
  });

  test('dealer hits on soft 16', () => {
    expect(shouldDealerHit(createHand('A', '5'))).toBe(true);
  });

  test('dealer stands on 17', () => {
    expect(shouldDealerHit(createHand('10', '7'))).toBe(false);
  });

  test('dealer stands on soft 17 (house rule)', () => {
    expect(shouldDealerHit(createHand('A', '6'))).toBe(false);
  });

  test('dealer stands on 18+', () => {
    expect(shouldDealerHit(createHand('10', '8'))).toBe(false);
  });

  test('getDealerAction returns hit when under 17', () => {
    expect(getDealerAction(createHand('10', '5'))).toBe('hit');
  });

  test('getDealerAction returns stand when 17+', () => {
    expect(getDealerAction(createHand('10', '7'))).toBe('stand');
  });
});

// ============================================
// HAND COMPARISON
// ============================================

describe('Hand Comparison', () => {
  test('player blackjack vs dealer non-blackjack', () => {
    const player = createHand('A', 'K');
    const dealer = createHand('10', '10');
    expect(compareHands(player, dealer)).toBe('player_blackjack');
  });

  test('dealer blackjack vs player non-blackjack', () => {
    const player = createHand('10', '10');
    const dealer = createHand('A', 'K');
    expect(compareHands(player, dealer)).toBe('dealer_win');
  });

  test('both blackjack is push', () => {
    const player = createHand('A', 'K');
    const dealer = createHand('A', 'Q');
    expect(compareHands(player, dealer)).toBe('push');
  });

  test('player higher value wins', () => {
    const player = createHand('10', '9');
    const dealer = createHand('10', '7');
    expect(compareHands(player, dealer)).toBe('player_win');
  });

  test('dealer higher value wins', () => {
    const player = createHand('10', '7');
    const dealer = createHand('10', '9');
    expect(compareHands(player, dealer)).toBe('dealer_win');
  });

  test('same value is push', () => {
    const player = createHand('10', '8');
    const dealer = createHand('9', '9');
    expect(compareHands(player, dealer)).toBe('push');
  });

  test('player bust', () => {
    const player = createHand('10', 'K', '5');
    const dealer = createHand('10', '7');
    expect(compareHands(player, dealer)).toBe('player_bust');
  });

  test('dealer bust', () => {
    const player = createHand('10', '7');
    const dealer = createHand('10', 'K', '5');
    expect(compareHands(player, dealer)).toBe('dealer_bust');
  });

  test('split Aces with 21 is not blackjack', () => {
    const player = createHand('A', '10');  // Split Aces, got 10
    const dealer = createHand('10', '10');
    expect(compareHands(player, dealer, true)).toBe('player_win');  // Not blackjack, just 21
  });
});

// ============================================
// PAYOUTS
// ============================================

describe('Payouts', () => {
  test('blackjack pays 3:2 (bet $10, get $25)', () => {
    expect(calculatePayout('player_blackjack', 10)).toBe(25);
  });

  test('regular win pays 1:1 (bet $10, get $20)', () => {
    expect(calculatePayout('player_win', 10)).toBe(20);
  });

  test('dealer bust pays 1:1', () => {
    expect(calculatePayout('dealer_bust', 10)).toBe(20);
  });

  test('push returns bet', () => {
    expect(calculatePayout('push', 10)).toBe(10);
  });

  test('player bust loses bet', () => {
    expect(calculatePayout('player_bust', 10)).toBe(0);
  });

  test('dealer win loses bet', () => {
    expect(calculatePayout('dealer_win', 10)).toBe(0);
  });
});

// ============================================
// INSURANCE PAYOUTS
// ============================================

describe('Insurance Payouts', () => {
  test('insurance pays 2:1 if dealer has blackjack', () => {
    expect(calculateInsurancePayout(true, 5)).toBe(15);  // Bet $5, get $15
  });

  test('insurance loses if dealer does not have blackjack', () => {
    expect(calculateInsurancePayout(false, 5)).toBe(0);
  });
});

// ============================================
// DISPLAY HELPERS
// ============================================

describe('Display Helpers', () => {
  test('formatHandValue shows blackjack', () => {
    expect(formatHandValue(createHand('A', 'K'))).toBe('Blackjack!');
  });

  test('formatHandValue shows bust', () => {
    expect(formatHandValue(createHand('10', 'K', '5'))).toBe('Bust');
  });

  test('formatHandValue shows hard value', () => {
    expect(formatHandValue(createHand('10', '7'))).toBe('17');
  });

  test('formatHandValue shows soft value', () => {
    expect(formatHandValue(createHand('A', '6'))).toBe('Soft 17');
  });

  test('formatHandValue handles empty hand', () => {
    expect(formatHandValue([])).toBe('');
  });

  test('getHandDescription formats cards', () => {
    const hand = [
      { rank: 'A', suit: 'spades', faceUp: true },
      { rank: 'K', suit: 'hearts', faceUp: true }
    ];
    expect(getHandDescription(hand)).toBe('A♠, K♥');
  });

  test('getHandDescription only shows face-up cards', () => {
    const hand = [
      { rank: 'A', suit: 'spades', faceUp: true },
      { rank: 'K', suit: 'hearts', faceUp: false }
    ];
    expect(getHandDescription(hand)).toBe('A♠');
  });
});
