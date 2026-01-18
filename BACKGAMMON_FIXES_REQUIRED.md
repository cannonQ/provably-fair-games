# Backgammon Implementation - Issues & Fixes

## 🔴 CRITICAL ISSUES (Must Fix Before Production)

### 1. Forced Die Rule Implementation Bug
**Location**: `moveValidation.js:390-422`
**Problem**: When both dice can be used in some sequence, the code returns ALL possible first moves, including those that would prevent using both dice.

**Fix**:
```javascript
function applyForcedDieRule(state, moves) {
  if (moves.length === 0) return moves;

  const availableDice = getAvailableDice(state.dice, state.diceUsed);

  // If only one die left or doubles, no filtering needed
  if (availableDice.length <= 1) return moves;

  // Check if it's doubles (all same value)
  const isDoubles = availableDice.every(d => d === availableDice[0]);
  if (isDoubles) return moves;

  // Get unique die values
  const uniqueDice = [...new Set(availableDice)];
  if (uniqueDice.length < 2) return moves;

  const largerDie = Math.max(...uniqueDice);
  const smallerDie = Math.min(...uniqueDice);

  // Check which moves allow using both dice
  const movesThatAllowBoth = [];
  for (const move of moves) {
    const stateAfterMove = applyMove(state, move);
    const subsequentMoves = getAllLegalMovesForState(stateAfterMove);

    // Check if the other die can be used after this move
    const usedDie = move.dieValue;
    const otherDie = uniqueDice.find(d => d !== usedDie);

    if (subsequentMoves.some(m => m.dieValue === otherDie)) {
      movesThatAllowBoth.push(move);
    }
  }

  // If any moves allow using both, only those are legal
  if (movesThatAllowBoth.length > 0) {
    return movesThatAllowBoth;
  }

  // Can only use one die - must use the larger one
  const movesWithLarger = moves.filter(m => m.dieValue === largerDie);
  if (movesWithLarger.length > 0) {
    return movesWithLarger;
  }

  // Larger die can't be used, use smaller
  return moves.filter(m => m.dieValue === smallerDie);
}
```

### 2. No Server-Side Validation
**Location**: Entire architecture
**Problem**: All game logic runs client-side. Players can modify code to cheat.

**Fix**: Implement server-side game engine
```
Required Architecture:
1. Server stores game state (not client)
2. Client sends move requests
3. Server validates moves using same logic
4. Server applies moves and returns new state
5. Server generates dice using blockchain
6. Server validates final scores before leaderboard submission
```

**Files to Create**:
- `api/backgammon/new-game.js` - Initialize game on server
- `api/backgammon/move.js` - Validate and apply move
- `api/backgammon/roll-dice.js` - Generate provably fair dice
- `api/backgammon/submit-score.js` - Verify and save score

### 3. Add Move Validation in Reducer
**Location**: `gameState.js:282` (MOVE_CHECKER case)

**Fix**:
```javascript
case ActionTypes.MOVE_CHECKER: {
  const { from, to } = action.payload;

  // Import at top: import { getAllLegalMoves } from './moveValidation';

  // Validate move is legal
  const legalMoves = getAllLegalMoves(state);
  const isLegal = legalMoves.some(m => m.from === from && m.to === to);

  if (!isLegal) {
    console.error('Illegal move rejected:', { from, to, legalMoves });
    return state; // Don't apply illegal moves
  }

  // ... rest of existing move application logic
}
```

## 🟡 HIGH PRIORITY ISSUES

### 4. Dice Roll Modulo Bias
**Location**: `gameLogic.js:26-31`

**Fix**:
```javascript
export function rollDiceValues(blockHash, gameId, turnNumber) {
  const seedInput = `${blockHash}${gameId}${turnNumber}`;
  const hash = CryptoJS.SHA256(seedInput).toString(CryptoJS.enc.Hex);

  const dice = [];
  let byteIndex = 0;

  // Use rejection sampling to eliminate bias
  while (dice.length < 2 && byteIndex < hash.length - 1) {
    const byte = parseInt(hash.substring(byteIndex, byteIndex + 2), 16);
    byteIndex += 2;

    // Reject values >= 252 (252 = 42 * 6, evenly divisible)
    if (byte < 252) {
      dice.push((byte % 6) + 1);
    }
  }

  // Fallback if we run out of bytes (extremely unlikely)
  while (dice.length < 2) {
    const extraHash = CryptoJS.SHA256(seedInput + dice.length).toString(CryptoJS.enc.Hex);
    const byte = parseInt(extraHash.substring(0, 2), 16);
    if (byte < 252) {
      dice.push((byte % 6) + 1);
    }
  }

  return [dice[0], dice[1]];
}
```

### 5. Insecure Game ID Generation
**Location**: `gameState.js:20-28`

**Fix**:
```javascript
export function generateGameId(blockHash) {
  const timestamp = Date.now();
  const seed = `${blockHash}-${timestamp}`;
  const hash = CryptoJS.SHA256(seed).toString(CryptoJS.enc.Hex);
  const random = hash.substring(0, 9);
  return `BGM-${timestamp}-${random}`;
}

// Update call site in gameState.js:210
case ActionTypes.INIT_GAME: {
  const { aiDifficulty, blockchainData } = action.payload;
  return {
    ...initialState,
    gameId: generateGameId(blockchainData.blockHash), // Pass blockHash
    // ... rest
  };
}
```

### 6. Improve Hard AI Depth
**Location**: `ai.js:420-459`

**Fix**:
```javascript
function selectMoveHard(legalMoves, state, player) {
  let bestMove = legalMoves[0];
  let bestScore = -Infinity;

  // Try each move and evaluate complete turn sequences
  for (const move of legalMoves) {
    const score = evaluateMoveWithLookahead(state, move, player, 3); // 3-ply depth

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

function evaluateMoveWithLookahead(state, move, player, depth) {
  const stateAfterMove = applyMove(state, move);

  // Base case: no more depth or no more moves
  if (depth <= 0 || selectors.allDiceUsed(stateAfterMove)) {
    return evaluatePosition(stateAfterMove, player, 'hard');
  }

  const subsequentMoves = getAllLegalMoves(stateAfterMove);

  if (subsequentMoves.length === 0) {
    return evaluatePosition(stateAfterMove, player, 'hard');
  }

  // Recursively evaluate best continuation
  let bestContinuation = -Infinity;
  for (const subMove of subsequentMoves) {
    const score = evaluateMoveWithLookahead(stateAfterMove, subMove, player, depth - 1);
    bestContinuation = Math.max(bestContinuation, score);
  }

  return bestContinuation;
}
```

## 🟢 MEDIUM PRIORITY IMPROVEMENTS

### 7. Remove Duplicate Bearing Off Logic
**Location**: `moveValidation.js:224-299` and `98-167`

Refactor `getMovesFromPoint` to call `getLegalBearOffMoves` instead of reimplementing logic.

### 8. Complete Verification System
**Location**: `gameLogic.js:448-473`, `BackgammonGame.jsx`

Store verification data and create verification page:
```javascript
// In BackgammonGame.jsx, after rolling dice:
const verificationData = generateVerificationData(
  block.id,
  state.gameId,
  turnNumberRef.current,
  dice
);

// Store in game state
setVerificationHistory(prev => [...prev, verificationData]);

// On game end, submit to database
await submitGameVerification({
  gameId: state.gameId,
  verificationData: verificationHistory,
  finalScore: state.finalScore
});
```

### 9. Add Comprehensive Error Handling
**Location**: `BackgammonGame.jsx:208-224, 228-274`

Add retry logic with exponential backoff for blockchain API calls.

## 📋 Testing Requirements

Create test files:
1. `moveValidation.test.js` - Test forced die rule, bar entry, bearing off
2. `ai.test.js` - Test AI doesn't make illegal moves at any difficulty
3. `gameLogic.test.js` - Test dice generation, win detection
4. `integration.test.js` - Full game scenarios

## 🎯 Implementation Priority

**Week 1 (Critical)**:
1. Fix forced die rule bug (#1)
2. Add move validation in reducer (#3)

**Week 2 (Security)**:
3. Implement server-side validation (#2)
4. Fix dice bias (#4)
5. Secure game ID generation (#5)

**Week 3 (Quality)**:
6. Improve Hard AI (#6)
7. Complete verification system (#8)
8. Add tests

**Week 4 (Polish)**:
9. Error handling improvements (#9)
10. Code cleanup (#7)

## 🚀 Deployment Checklist

- [ ] All Critical issues fixed
- [ ] Server-side validation implemented
- [ ] Test coverage > 80%
- [ ] Security audit passed
- [ ] Performance testing completed
- [ ] Documentation updated
- [ ] Blockchain integration tested on testnet
- [ ] Leaderboard submission verified

---

**Note**: Do not deploy to production until all Critical issues are resolved. Current implementation is suitable for single-player casual play only.
