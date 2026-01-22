/**
 * Blackjack Game State Management
 * React useReducer pattern for provably-fair blackjack
 */

const DECK_COUNT = 6;
const TOTAL_CARDS = DECK_COUNT * 52; // 312
const CUT_CARD_POSITION = Math.floor(TOTAL_CARDS * 0.75); // ~234
const SESSION_DURATION = 5 * 60; // 5 minutes
const EXTENSION_DURATION = 5 * 60; // 5 minute extension
const STARTING_BALANCE = 1000;

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const SUIT_INITIALS = { hearts: 'H', diamonds: 'D', clubs: 'C', spades: 'S' };

// =============================================================================
// INITIAL STATE
// =============================================================================

export const initialState = {
  gameId: null,
  shoe: [],
  shoePosition: 0,
  cutCardPosition: CUT_CARD_POSITION,
  playerHands: [[]],
  activeHandIndex: 0,
  dealerHand: [],
  currentBet: 0,
  chipBalance: STARTING_BALANCE,
  handBets: [],
  insuranceBet: 0,
  phase: 'betting', // betting | dealing | playerTurn | dealerTurn | payout | sessionOver
  roundResult: null,
  sessionStartTime: null,
  sessionDuration: SESSION_DURATION,
  timeRemaining: SESSION_DURATION,
  extensionsUsed: 0,
  roundHistory: [],
  blockchainData: null,
  handsPlayed: 0,
  handsWon: 0,
  blackjacksHit: 0,
  peakBalance: STARTING_BALANCE,
  startingBalance: STARTING_BALANCE,
  splitAcesHands: [] // Track which hands are from split Aces (can only take 1 card)
};

// =============================================================================
// HELPERS
// =============================================================================

/** Generate game ID: BJK-{timestamp}-{random9chars} */
export function generateGameId() {
  return `BJK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/** Create 6-deck shoe (312 cards) with unique IDs */
export function createSixDeckShoe() {
  const shoe = [];
  for (let deck = 1; deck <= DECK_COUNT; deck++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        shoe.push({
          id: `${rank}${SUIT_INITIALS[suit]}-${deck}`,
          rank,
          suit,
          faceUp: true
        });
      }
    }
  }
  return shoe;
}

/** Deal single card from shoe */
export function dealCard(shoe, shoePosition, faceUp = true) {
  return {
    card: { ...shoe[shoePosition], faceUp },
    newPosition: shoePosition + 1
  };
}

// =============================================================================
// REDUCER
// =============================================================================

export function blackjackReducer(state, action) {
  switch (action.type) {
    case 'INIT_SHOE': {
      const { shuffledShoe, blockchainData, gameId } = action.payload;
      // Reset to full initial state for new session
      return {
        ...initialState,
        shoe: shuffledShoe,
        shoePosition: 0,
        cutCardPosition: CUT_CARD_POSITION,
        gameId: gameId || generateGameId(),
        blockchainData,
        phase: 'betting'
      };
    }

    case 'START_SESSION':
      return { ...state, sessionStartTime: Date.now(), timeRemaining: SESSION_DURATION };

    case 'PLACE_BET': {
      const { amount } = action.payload;
      // Just set the bet amount, don't deduct chips yet
      // Chips will be deducted when DEAL_INITIAL is called
      if (amount < 0 || amount > state.chipBalance + state.currentBet) return state;
      return {
        ...state,
        currentBet: amount,
        handBets: [amount]
      };
    }

    case 'DEAL_INITIAL': {
      // Now deduct the bet from balance
      const betAmount = state.currentBet;
      if (betAmount > state.chipBalance || betAmount < 5) return state;

      let pos = state.shoePosition;
      const p1 = dealCard(state.shoe, pos); pos = p1.newPosition;
      const d1 = dealCard(state.shoe, pos); pos = d1.newPosition;
      const p2 = dealCard(state.shoe, pos); pos = p2.newPosition;
      const d2 = dealCard(state.shoe, pos, false); pos = d2.newPosition; // Hole card face down

      return {
        ...state,
        playerHands: [[p1.card, p2.card]],
        dealerHand: [d1.card, d2.card],
        handBets: [betAmount], // Explicitly set handBets for this round
        shoePosition: pos,
        activeHandIndex: 0,
        chipBalance: state.chipBalance - betAmount,
        phase: 'playerTurn',
        roundResult: null,
        splitAcesHands: []
      };
    }

    case 'HIT': {
      // Check if this hand is from split Aces - if so, can't hit
      if (state.splitAcesHands.includes(state.activeHandIndex)) {
        return state;
      }
      
      const { card, newPosition } = dealCard(state.shoe, state.shoePosition);
      const newHands = state.playerHands.map((hand, i) =>
        i === state.activeHandIndex ? [...hand, card] : hand
      );
      return { ...state, playerHands: newHands, shoePosition: newPosition };
    }

    case 'STAND': {
      const nextIdx = state.activeHandIndex + 1;
      if (nextIdx < state.playerHands.length) {
        return { ...state, activeHandIndex: nextIdx };
      }
      return { ...state, phase: 'dealerTurn' };
    }

    case 'DOUBLE_DOWN': {
      const bet = state.handBets[state.activeHandIndex];
      if (bet > state.chipBalance) return state;
      
      // Can't double on split Aces
      if (state.splitAcesHands.includes(state.activeHandIndex)) {
        return state;
      }

      const { card, newPosition } = dealCard(state.shoe, state.shoePosition);
      const newHands = state.playerHands.map((hand, i) =>
        i === state.activeHandIndex ? [...hand, card] : hand
      );
      const newBets = [...state.handBets];
      newBets[state.activeHandIndex] = bet * 2;

      const nextIdx = state.activeHandIndex + 1;
      return {
        ...state,
        playerHands: newHands,
        shoePosition: newPosition,
        chipBalance: state.chipBalance - bet,
        handBets: newBets,
        activeHandIndex: nextIdx < state.playerHands.length ? nextIdx : state.activeHandIndex,
        phase: nextIdx < state.playerHands.length ? 'playerTurn' : 'dealerTurn'
      };
    }

    case 'SPLIT': {
      if (state.playerHands.length >= 4) return state; // Max 4 hands
      const bet = state.handBets[state.activeHandIndex];
      if (bet > state.chipBalance) return state;

      const hand = state.playerHands[state.activeHandIndex];
      const isSplittingAces = hand[0].rank === 'A';
      
      let pos = state.shoePosition;
      const c1 = dealCard(state.shoe, pos); pos = c1.newPosition;
      const c2 = dealCard(state.shoe, pos); pos = c2.newPosition;

      // Replace current hand with first split hand, insert second split hand after it
      const newHands = [
        ...state.playerHands.slice(0, state.activeHandIndex),
        [hand[0], c1.card],  // First split hand (at current index)
        [hand[1], c2.card],  // Second split hand (inserted after)
        ...state.playerHands.slice(state.activeHandIndex + 1)
      ];

      // Insert bet at the correct position (after current hand's bet)
      const newBets = [
        ...state.handBets.slice(0, state.activeHandIndex + 1),
        bet,  // New bet for second split hand
        ...state.handBets.slice(state.activeHandIndex + 1)
      ];
      
      // Track split Aces hands - they can only receive one card each
      let newSplitAcesHands = [...state.splitAcesHands];
      if (isSplittingAces) {
        // Adjust existing indices that are > activeHandIndex (shift by 1 for inserted hand)
        newSplitAcesHands = newSplitAcesHands.map(idx =>
          idx > state.activeHandIndex ? idx + 1 : idx
        );
        // Both resulting hands are split Aces hands
        newSplitAcesHands.push(state.activeHandIndex);
        newSplitAcesHands.push(state.activeHandIndex + 1);
      } else {
        // Adjust existing indices for the inserted hand
        newSplitAcesHands = newSplitAcesHands.map(idx =>
          idx > state.activeHandIndex ? idx + 1 : idx
        );
      }

      // Stay on current hand - player must manually stand even on split Aces
      // (They received their one card, but must still stand to move to next hand)
      return {
        ...state,
        playerHands: newHands,
        handBets: newBets,
        shoePosition: pos,
        chipBalance: state.chipBalance - bet,
        splitAcesHands: newSplitAcesHands,
        activeHandIndex: state.activeHandIndex,
        phase: 'playerTurn'
      };
    }

    case 'TAKE_INSURANCE': {
      const amount = Math.floor(state.currentBet / 2);
      if (amount > state.chipBalance) return state;
      return { ...state, insuranceBet: amount, chipBalance: state.chipBalance - amount };
    }

    case 'DEALER_PLAY': {
      const { dealerHand, shoePosition } = action.payload;
      const revealed = dealerHand.map((c, i) => i === 1 ? { ...c, faceUp: true } : c);
      return { ...state, dealerHand: revealed, shoePosition, phase: 'payout' };
    }

    case 'RESOLVE_ROUND': {
      const {
        results, totalPayout, blackjackCount, insuranceBet, insurancePayout,
        // Use payload values to avoid race conditions with state
        handBets: payloadHandBets,
        playerHands: payloadPlayerHands,
        dealerHand: payloadDealerHand
      } = action.payload;
      const newBalance = state.chipBalance + totalPayout;
      const wins = results.filter(r => ['win', 'blackjack', 'losebust'].includes(r.outcome)).length;

      const record = {
        roundNumber: state.handsPlayed + 1,
        gameId: state.gameId,
        // Use payload values (captured at resolve time) to ensure consistency
        playerHands: payloadPlayerHands || state.playerHands,
        dealerHand: payloadDealerHand || state.dealerHand,
        handBets: payloadHandBets || state.handBets,
        results,
        insuranceBet: insuranceBet || 0,
        insurancePayout: insurancePayout || 0,
        totalPayout,
        balanceAfter: newBalance,
        timestamp: Date.now()
      };

      return {
        ...state,
        chipBalance: newBalance,
        peakBalance: Math.max(state.peakBalance, newBalance),
        handsPlayed: state.handsPlayed + 1,
        handsWon: state.handsWon + wins,
        blackjacksHit: state.blackjacksHit + blackjackCount,
        roundResult: results,
        roundHistory: [...state.roundHistory, record]
      };
    }

    case 'NEW_ROUND':
      return {
        ...state,
        playerHands: [[]],
        activeHandIndex: 0,
        dealerHand: [],
        currentBet: 0,
        handBets: [],
        insuranceBet: 0,
        phase: 'betting',
        roundResult: null,
        splitAcesHands: []
      };

    case 'RESHUFFLE': {
      const { shuffledShoe, blockchainData } = action.payload;
      return { ...state, shoe: shuffledShoe, shoePosition: 0, blockchainData, gameId: generateGameId() };
    }

    case 'UPDATE_TIMER': {
      const newTime = Math.max(0, state.timeRemaining - 1);
      return { ...state, timeRemaining: newTime, phase: newTime === 0 ? 'sessionOver' : state.phase };
    }

    case 'EXTEND_SESSION':
      return { 
        ...state, 
        timeRemaining: state.timeRemaining + EXTENSION_DURATION,
        extensionsUsed: state.extensionsUsed + 1
      };

    case 'CASH_OUT':
      return { ...state, phase: 'sessionOver' };

    case 'END_SESSION':
      return { ...state, phase: 'sessionOver' };

    default:
      return state;
  }
}
