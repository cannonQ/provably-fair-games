/**
 * Solitaire State Management
 * 
 * Uses React useReducer pattern for predictable state updates.
 * Tracks cards to foundation for leaderboard ranking.
 */

// Scoring constants (for display, not ranking)
export const SCORING = {
  standard: {
    wasteToTableau: 5,
    wasteToFoundation: 10,
    tableauToFoundation: 10,
    flipCard: 5,
    foundationToTableau: -15,
    recycleStock: -20,
    name: 'Standard'
  },
  vegas: {
    costToPlay: 52,
    perCardToFoundation: 5,
    name: 'Vegas'
  }
};

// Initial state structure
export const initialState = {
  tableau: [[], [], [], [], [], [], []],
  stock: [],
  waste: [],
  foundations: {
    hearts: [],
    diamonds: [],
    clubs: [],
    spades: []
  },
  selectedCards: null,
  moves: 0,
  score: 0,
  scoringMode: 'standard',
  recycleCount: 0,
  startTime: null,
  moveHistory: [],
  gameStatus: 'playing', // 'playing' | 'won' | 'lost'
  blockchainData: null
};

/**
 * Get total cards in foundations
 */
export function getFoundationCount(foundations) {
  return Object.values(foundations).reduce((sum, pile) => sum + pile.length, 0);
}

/**
 * Calculate Vegas score
 */
function calculateVegasScore(foundations) {
  const totalCards = getFoundationCount(foundations);
  return (totalCards * SCORING.vegas.perCardToFoundation) - SCORING.vegas.costToPlay;
}

/**
 * Deal cards into initial Klondike layout
 */
export function dealCards(shuffledDeck, scoringMode = 'standard') {
  const tableau = [[], [], [], [], [], [], []];
  let cardIndex = 0;

  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = { ...shuffledDeck[cardIndex] };
      card.faceUp = (row === col);
      tableau[col].push(card);
      cardIndex++;
    }
  }

  const stock = shuffledDeck.slice(28).map(card => ({
    ...card,
    faceUp: false
  }));

  const initialScore = scoringMode === 'vegas' ? -SCORING.vegas.costToPlay : 0;

  return {
    ...initialState,
    tableau,
    stock,
    waste: [],
    foundations: {
      hearts: [],
      diamonds: [],
      clubs: [],
      spades: []
    },
    score: initialScore,
    scoringMode,
    recycleCount: 0,
    startTime: Date.now(),
    gameStatus: 'playing'
  };
}

/**
 * Create snapshot for undo
 */
function createSnapshot(state) {
  return {
    tableau: state.tableau.map(col => col.map(card => ({ ...card }))),
    stock: state.stock.map(card => ({ ...card })),
    waste: state.waste.map(card => ({ ...card })),
    foundations: {
      hearts: [...state.foundations.hearts],
      diamonds: [...state.foundations.diamonds],
      clubs: [...state.foundations.clubs],
      spades: [...state.foundations.spades]
    },
    moves: state.moves,
    score: state.score,
    recycleCount: state.recycleCount
  };
}

/**
 * Main reducer
 */
export function solitaireReducer(state, action) {
  switch (action.type) {
    case 'INIT_GAME': {
      const { shuffledDeck, blockchainData, scoringMode } = action.payload;
      const dealtState = dealCards(shuffledDeck, scoringMode || state.scoringMode);
      return {
        ...dealtState,
        blockchainData,
        moveHistory: []
      };
    }

    case 'SET_SCORING_MODE': {
      return {
        ...state,
        scoringMode: action.payload
      };
    }

    case 'SELECT_CARDS': {
      const { cards, source } = action.payload;
      return {
        ...state,
        selectedCards: { cards, source }
      };
    }

    case 'CLEAR_SELECTION': {
      return {
        ...state,
        selectedCards: null
      };
    }

    case 'MOVE_TO_TABLEAU': {
      const { targetIndex } = action.payload;
      const { cards, source } = state.selectedCards;
      const snapshot = createSnapshot(state);

      const newTableau = state.tableau.map((col, i) => {
        if (i === targetIndex) {
          return [...col, ...cards.map(c => ({ ...c, faceUp: true }))];
        }
        if (source.type === 'tableau' && i === source.index) {
          return col.slice(0, col.length - cards.length);
        }
        return col;
      });

      const newWaste = source.type === 'waste'
        ? state.waste.slice(0, -1)
        : state.waste;

      const newFoundations = source.type === 'foundation'
        ? {
            ...state.foundations,
            [source.suit]: state.foundations[source.suit].slice(0, -1)
          }
        : state.foundations;

      let scoreChange = 0;
      if (state.scoringMode === 'standard') {
        if (source.type === 'waste') {
          scoreChange = SCORING.standard.wasteToTableau;
        } else if (source.type === 'foundation') {
          scoreChange = SCORING.standard.foundationToTableau;
        }
      }

      return {
        ...state,
        tableau: newTableau,
        waste: newWaste,
        foundations: newFoundations,
        selectedCards: null,
        moves: state.moves + 1,
        score: state.score + scoreChange,
        moveHistory: [...state.moveHistory, snapshot]
      };
    }

    case 'MOVE_TO_FOUNDATION': {
      const { suit } = action.payload;
      const { cards, source } = state.selectedCards;
      const card = cards[0];
      const snapshot = createSnapshot(state);

      const newFoundations = {
        ...state.foundations,
        [suit]: [...state.foundations[suit], { ...card, faceUp: true }]
      };

      let newTableau = state.tableau;
      let newWaste = state.waste;

      if (source.type === 'tableau') {
        newTableau = state.tableau.map((col, i) =>
          i === source.index ? col.slice(0, -1) : col
        );
      } else if (source.type === 'waste') {
        newWaste = state.waste.slice(0, -1);
      }

      let scoreChange = 0;
      if (state.scoringMode === 'standard') {
        if (source.type === 'waste') {
          scoreChange = SCORING.standard.wasteToFoundation;
        } else if (source.type === 'tableau') {
          scoreChange = SCORING.standard.tableauToFoundation;
        }
      } else if (state.scoringMode === 'vegas') {
        scoreChange = SCORING.vegas.perCardToFoundation;
      }

      return {
        ...state,
        tableau: newTableau,
        waste: newWaste,
        foundations: newFoundations,
        selectedCards: null,
        moves: state.moves + 1,
        score: state.score + scoreChange,
        moveHistory: [...state.moveHistory, snapshot]
      };
    }

    case 'DRAW_FROM_STOCK': {
      if (state.stock.length === 0) return state;
      const snapshot = createSnapshot(state);

      const drawnCard = { ...state.stock[state.stock.length - 1], faceUp: true };
      
      return {
        ...state,
        stock: state.stock.slice(0, -1),
        waste: [...state.waste, drawnCard],
        selectedCards: null,
        moves: state.moves + 1,
        moveHistory: [...state.moveHistory, snapshot]
      };
    }

    case 'RECYCLE_STOCK': {
      if (state.stock.length > 0 || state.waste.length === 0) return state;
      const snapshot = createSnapshot(state);

      const newStock = state.waste
        .slice()
        .reverse()
        .map(card => ({ ...card, faceUp: false }));

      let scoreChange = 0;
      if (state.scoringMode === 'standard' && state.recycleCount > 0) {
        scoreChange = SCORING.standard.recycleStock;
      }

      return {
        ...state,
        stock: newStock,
        waste: [],
        selectedCards: null,
        moves: state.moves + 1,
        score: state.score + scoreChange,
        recycleCount: state.recycleCount + 1,
        moveHistory: [...state.moveHistory, snapshot]
      };
    }

    case 'FLIP_CARD': {
      const { columnIndex } = action.payload;
      const column = state.tableau[columnIndex];
      
      if (column.length === 0) return state;
      const topCard = column[column.length - 1];
      if (topCard.faceUp) return state;

      const newTableau = state.tableau.map((col, i) => {
        if (i !== columnIndex) return col;
        return col.map((card, j) =>
          j === col.length - 1 ? { ...card, faceUp: true } : card
        );
      });

      const scoreChange = state.scoringMode === 'standard' ? SCORING.standard.flipCard : 0;

      return {
        ...state,
        tableau: newTableau,
        score: state.score + scoreChange
      };
    }

    case 'UNDO': {
      if (state.moveHistory.length === 0) return state;

      const previousSnapshot = state.moveHistory[state.moveHistory.length - 1];
      
      return {
        ...state,
        tableau: previousSnapshot.tableau,
        stock: previousSnapshot.stock,
        waste: previousSnapshot.waste,
        foundations: previousSnapshot.foundations,
        moves: previousSnapshot.moves,
        score: previousSnapshot.score,
        recycleCount: previousSnapshot.recycleCount,
        moveHistory: state.moveHistory.slice(0, -1),
        selectedCards: null
      };
    }

    case 'SET_WON': {
      return {
        ...state,
        gameStatus: 'won'
      };
    }

    case 'SET_LOST': {
      return {
        ...state,
        gameStatus: 'lost'
      };
    }

    default:
      return state;
  }
}
