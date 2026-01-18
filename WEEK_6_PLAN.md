# Week 6 Plan: Server-Side Validation

**Goal**: Implement comprehensive server-side game validation to prevent score manipulation

**Current State**: Basic validation exists (score ranges, blockchain verification), but no move-by-move replay validation

---

## 📊 Validation Gap Analysis

### What We Have ✅
- Game ID format validation (regex per game)
- Game type whitelist (6 games)
- Blockchain block verification (Ergo API)
- Basic score range checks (e.g., Yahtzee 0-375, Solitaire 0-52)
- Duplicate submission prevention

### What's Missing ❌
- **Move sequence validation** - No replay of actual gameplay
- **History validation** - Roll/round/move histories accepted but not verified
- **Deterministic verification** - Seed matches block but moves not validated against seed
- **Completion detection** - No check if game is actually finished
- **Fraud detection** - No statistical analysis of suspicious patterns

---

## 🎯 Week 6 Objectives

### Phase 1: Build Validation Infrastructure (Days 1-2)
1. Create `/api/validation/` directory structure
2. Port game logic files to server-side (Node.js compatible)
3. Build shared validation utilities
4. Set up testing infrastructure for validators

### Phase 2: Implement Game-Specific Validators (Days 3-4)
1. **Backgammon Validator** - Replay move sequence, validate against dice
2. **Yahtzee Validator** - Validate roll history → final score calculation
3. **Blackjack Validator** - Validate round history → chip balance
4. **2048 Validator** - Validate move history → grid state and score
5. **Solitaire Validator** - Validate card placements (simplified)
6. **Garbage Validator** - Validate position fills (simplified)

### Phase 3: Enhance API Endpoints (Day 5)
1. Add optional deep validation to `/api/submit-score`
2. Add fraud detection scoring
3. Add rate limiting
4. Add comprehensive tests

---

## 🏗️ Architecture Design

### Directory Structure
```
api/
├── validation/
│   ├── shared/
│   │   ├── blockchainUtils.js  (Ergo API, seed generation)
│   │   ├── seedVerification.js (Deterministic replay)
│   │   └── fraudDetection.js   (Statistical analysis)
│   ├── games/
│   │   ├── backgammon/
│   │   │   ├── moveValidator.js     (Port from moveValidation.js)
│   │   │   ├── gameLogic.js         (Port helper functions)
│   │   │   └── historyValidator.js  (Replay full game)
│   │   ├── yahtzee/
│   │   │   ├── scoringLogic.js      (Port from client)
│   │   │   └── historyValidator.js  (Validate rolls → score)
│   │   ├── blackjack/
│   │   │   ├── gameLogic.js         (Port from client)
│   │   │   └── historyValidator.js  (Validate rounds → balance)
│   │   ├── 2048/
│   │   │   ├── gridLogic.js         (Port from client)
│   │   │   └── historyValidator.js  (Validate moves → grid)
│   │   ├── solitaire/
│   │   │   └── scoreValidator.js    (Simplified validation)
│   │   └── garbage/
│   │       └── scoreValidator.js    (Simplified validation)
│   └── index.js  (Main validator dispatcher)
├── submit-score.js  (Enhanced with validation)
└── verify-game.js   (NEW: Standalone verification endpoint)
```

---

## 🔧 Implementation Strategy

### 1. Shared Validation Utilities

**blockchainUtils.js**:
```javascript
// Verify block exists on Ergo blockchain
async function verifyBlock(blockHash, blockHeight)

// Generate seed from block data (must match client)
function generateSeed(blockData, gameId)

// Fetch block transactions for advanced verification
async function getBlockTransactions(blockHash)
```

**seedVerification.js**:
```javascript
// Verify moves are possible with given seed
function verifySeedDeterminism(seed, moveHistory, gameType)

// Regenerate game outcome from seed
function replayGameFromSeed(seed, gameType, playerActions)
```

**fraudDetection.js**:
```javascript
// Statistical analysis of submission patterns
function analyzeSubmissionPattern(playerName, recentGames)

// Check if score is suspiciously high/fast
function detectSuspiciousScore(game, score, timeSeconds, moves)

// Rate limiting per player
function checkRateLimit(playerName, timeWindow)
```

### 2. Game-Specific Validators

#### Backgammon (PRIORITY 1 - Most Complex)
```javascript
// api/validation/games/backgammon/historyValidator.js

import { getAllLegalMoves } from './moveValidator.js';
import { applyMove, rollDiceValues } from './gameLogic.js';

export function validateBackgammonGame(submission) {
  const { moveHistory, seed, difficulty, winType, cubeValue } = submission;

  // 1. Replay entire game from initial position
  let gameState = createInitialGameState();

  for (const move of moveHistory) {
    // 2. Verify move is legal
    const legalMoves = getAllLegalMoves(gameState, gameState.dice);
    if (!legalMoves.includes(move)) {
      return { valid: false, reason: 'Illegal move in history' };
    }

    // 3. Apply move
    gameState = applyMove(gameState, move);
  }

  // 4. Verify final state matches claimed result
  if (gameState.winner !== 'white') {
    return { valid: false, reason: 'Game not won' };
  }

  // 5. Verify score calculation
  const expectedScore = winType * cubeValue * difficulty;
  if (submission.score !== expectedScore) {
    return { valid: false, reason: 'Score mismatch' };
  }

  return { valid: true, finalState: gameState };
}
```

#### Yahtzee (PRIORITY 2 - Comprehensive Scoring)
```javascript
// api/validation/games/yahtzee/historyValidator.js

import { calculateGrandTotal, calculateCategoryScore } from './scoringLogic.js';

export function validateYahtzeeGame(submission) {
  const { rollHistory, scorecard, score } = submission;

  // 1. Verify roll count (13 turns × 1-3 rolls each)
  if (rollHistory.length < 13 || rollHistory.length > 39) {
    return { valid: false, reason: 'Invalid roll count' };
  }

  // 2. Verify each turn's rolls match category selections
  let runningTotal = 0;
  for (let turn = 0; turn < 13; turn++) {
    const turnRolls = rollHistory.filter(r => r.turn === turn + 1);
    const finalDice = turnRolls[turnRolls.length - 1].dice;
    const category = scorecard.turns[turn].category;

    // Verify score for this category
    const expectedScore = calculateCategoryScore(category, finalDice);
    if (scorecard.turns[turn].score !== expectedScore) {
      return { valid: false, reason: `Turn ${turn+1} score mismatch` };
    }

    runningTotal += expectedScore;
  }

  // 3. Verify grand total (including bonuses)
  const expectedTotal = calculateGrandTotal(scorecard);
  if (score !== expectedTotal) {
    return { valid: false, reason: 'Final score mismatch' };
  }

  return { valid: true, calculatedScore: runningTotal };
}
```

#### Blackjack (PRIORITY 3 - Round Validation)
```javascript
// api/validation/games/blackjack/historyValidator.js

import { calculateHandValue, compareHands, calculatePayout } from './gameLogic.js';

export function validateBlackjackGame(submission) {
  const { roundHistory, score, initialBalance = 1000 } = submission;

  let chipBalance = initialBalance;

  for (const round of roundHistory) {
    const { bet, playerHands, dealerHand, outcomes } = round;

    // 1. Verify hand values
    const playerValue = calculateHandValue(playerHands[0]);
    const dealerValue = calculateHandValue(dealerHand);

    // 2. Verify outcome is correct
    const expectedOutcome = compareHands(playerValue, dealerValue,
                                         playerHands[0].isBlackjack);
    if (outcomes[0] !== expectedOutcome) {
      return { valid: false, reason: `Round ${round.id} outcome mismatch` };
    }

    // 3. Update chip balance
    const payout = calculatePayout(bet, expectedOutcome, playerHands[0].isBlackjack);
    chipBalance += payout;
  }

  // 4. Verify final balance matches score
  if (chipBalance !== score) {
    return { valid: false, reason: 'Final chip balance mismatch' };
  }

  return { valid: true, calculatedBalance: chipBalance };
}
```

#### 2048 (PRIORITY 4 - Grid Replay)
```javascript
// api/validation/games/2048/historyValidator.js

import { slideGrid, createEmptyGrid, hasWon } from './gridLogic.js';

export function validate2048Game(submission) {
  const { moveHistory, score, highestTile, seed } = submission;

  // 1. Initialize grid with seed
  let grid = createEmptyGrid();
  let totalScore = 0;

  // 2. Replay each move (encoded as "UDLR...")
  for (const move of moveHistory.split('')) {
    const direction = { U: 'up', D: 'down', L: 'left', R: 'right' }[move];
    const result = slideGrid(grid, direction);

    if (gridsEqual(result.grid, grid)) {
      return { valid: false, reason: 'Invalid move (no change)' };
    }

    grid = result.grid;
    totalScore += result.score;
  }

  // 3. Verify final score
  if (totalScore !== score) {
    return { valid: false, reason: 'Score mismatch' };
  }

  // 4. Verify highest tile
  const maxTile = Math.max(...grid.flat().map(c => c.value));
  if (maxTile !== highestTile) {
    return { valid: false, reason: 'Highest tile mismatch' };
  }

  return { valid: true, finalGrid: grid };
}
```

---

## 🧪 Testing Strategy

### Unit Tests for Validators
- Test each game validator with:
  - Valid game histories (should pass)
  - Invalid move sequences (should fail)
  - Score manipulation attempts (should fail)
  - Edge cases (empty history, incomplete games)

### Integration Tests for API
- Test `/api/submit-score` with enhanced validation
- Test fraud detection triggers
- Test rate limiting
- Test blockchain verification failures

### Test File Structure
```
api/__tests__/
├── validation/
│   ├── backgammon.validator.test.js
│   ├── yahtzee.validator.test.js
│   ├── blackjack.validator.test.js
│   ├── 2048.validator.test.js
│   └── fraudDetection.test.js
└── submit-score.enhanced.test.js
```

---

## 📈 Success Criteria

### Week 6 Deliverables
- [ ] Validation infrastructure ported and tested
- [ ] Backgammon full replay validation working
- [ ] Yahtzee score verification working
- [ ] Blackjack round validation working
- [ ] 2048 move sequence validation working
- [ ] Fraud detection system in place
- [ ] API endpoint enhanced with validation
- [ ] Comprehensive test suite (50+ tests)
- [ ] Documentation updated

### Quality Metrics
- 100% of valid games pass validation
- 100% of manipulated games caught
- Validation adds <500ms to submission latency
- No false positives on legitimate play

---

## 🚧 Implementation Order (Priority)

1. **Day 1-2**: Infrastructure
   - ✅ Create `/api/validation/` structure
   - ✅ Port Backgammon `moveValidation.js` to server
   - ✅ Port Yahtzee `scoringLogic.js` to server
   - ✅ Create shared utilities (blockchain, seed verification)
   - ✅ Set up testing framework

2. **Day 3**: Game Validators
   - ✅ Implement Backgammon history validator
   - ✅ Implement Yahtzee history validator
   - ✅ Write tests for both

3. **Day 4**: More Game Validators
   - ✅ Implement Blackjack history validator
   - ✅ Implement 2048 history validator
   - ✅ Simplified validators for Solitaire/Garbage
   - ✅ Write tests

4. **Day 5**: API Enhancement
   - ✅ Enhance `/api/submit-score` with validation
   - ✅ Add fraud detection
   - ✅ Add rate limiting
   - ✅ Integration tests
   - ✅ Documentation

---

## 🔒 Security Considerations

### What This Prevents
- ✅ Score manipulation (replaying verifies calculation)
- ✅ Impossible moves (legal move validation)
- ✅ Fake game IDs (blockchain verification)
- ✅ Replay attacks (game ID uniqueness)

### What This Doesn't Prevent (Outside Scope)
- ❌ Bot play (would need behavioral analysis)
- ❌ Shared accounts (would need session tracking)
- ❌ Colluding players (would need network analysis)

These are social/behavioral issues, not logic validation issues.

---

## 📝 Next Steps After Week 6

**Week 7 Preview**: Security & Polish
- Add CAPTCHA for submission
- Add player session tracking
- Performance optimization
- UI feedback for validation status

**Week 8 Preview**: Launch Preparation
- Final security audit
- Load testing
- Deployment pipeline
- Monitoring & alerts

---

**Week 6 Goal**: Make it mathematically impossible to submit a fake score ✅

Created on 2026-01-18 for Week 6 implementation
