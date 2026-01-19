# API Integration Guide - Enhanced Validation

## Overview

The `/api/submit-score` endpoint has been enhanced with comprehensive server-side validation. This guide explains how to use it and what to expect.

---

## Endpoint

**POST** `/api/submit-score`

**Description**: Submit a game score with full validation (blockchain, game logic, fraud detection)

---

## Request Format

### Required Fields (All Games)
```json
{
  "game": "string",       // Game type: backgammon, yahtzee, blackjack, 2048, solitaire, garbage
  "gameId": "string",     // Unique game ID (format varies by game)
  "score": "number"       // Final score
}
```

### Optional Common Fields
```json
{
  "playerName": "string",      // Player name (default: "Anonymous")
  "timeSeconds": "number",     // Time taken in seconds
  "moves": "number",           // Number of moves made
  "blockHash": "string",       // Ergo blockchain block hash
  "blockHeight": "number",     // Ergo blockchain block height
  "txHash": "string",          // Transaction hash
  "blockTimestamp": "number",  // Block timestamp
  "txIndex": "number",         // Transaction index in block
  "seed": "string"             // Generated seed (for verification)
}
```

### Game-Specific Fields

#### Yahtzee
```json
{
  "scorecard": {
    "ones": 3,
    "twos": 6,
    "threes": 9,
    // ... all 13 categories
    "yahtzeeBonusCount": 0
  },
  "rollHistory": [
    {
      "turn": 1,
      "rollNumber": 1,
      "dice": [1, 2, 3, 4, 5]
    }
    // ... 13-39 rolls total
  ]
}
```

#### Blackjack
```json
{
  "roundHistory": [
    {
      "bet": 100,
      "playerHands": [
        { "cards": ["A♠", "K♥"] }
      ],
      "dealerHand": { "cards": ["9♣", "10♦"] }
    }
    // ... all rounds played
  ]
}
```

#### Backgammon
```json
{
  "winType": "normal",      // normal, gammon, or backgammon
  "cubeValue": 1,           // 1, 2, 4, 8, 16, 32, or 64
  "difficulty": "hard",     // easy, normal, or hard
  "moveHistory": [
    { "from": 24, "to": 20 }
    // ... all moves
  ]
}
```

#### 2048
```json
{
  "moveHistory": "UDLRUDLR...",  // Sequence of moves (U/D/L/R)
  "highestTile": 2048             // Highest tile achieved
}
```

#### Solitaire
```json
{
  "moves": 87,
  "timeSeconds": 145
}
```

#### Garbage
```json
{
  "rounds": 5,
  "difficulty": "normal"
}
```

---

## Response Format

### Success Response (200 OK)
```json
{
  "success": true,
  "verified": true,
  "validationLevel": "FULL",
  "rank": 42,
  "entry": {
    "id": 123,
    "game": "yahtzee",
    "score": 248,
    "created_at": "2026-01-18T...",
    // ... full database entry
  },
  "validation": {
    "passed": true,
    "riskScore": 15,
    "needsReview": false,
    "calculatedScore": 248
  }
}
```

### Validation Failed (400 Bad Request)
```json
{
  "error": "Validation failed",
  "reason": "Score mismatch: claimed 300, calculated 248",
  "validationResults": {
    "blockchain": { "valid": true },
    "gameLogic": {
      "valid": false,
      "reason": "Score mismatch: claimed 300, calculated 248",
      "calculatedScore": 248
    },
    "fraudDetection": null
  }
}
```

### Fraud Detection Rejection (400 Bad Request)
```json
{
  "error": "Validation failed",
  "reason": "Fraud detection: Perfect score achieved in 45s, Average 0.2s per move",
  "riskScore": 78,
  "validationResults": {
    "fraudDetection": {
      "riskScore": 78,
      "flags": [
        "Perfect score achieved in 45s",
        "Average 0.2s per move"
      ],
      "recommendation": "REJECT"
    }
  }
}
```

### Rate Limit Exceeded (400 Bad Request)
```json
{
  "error": "Validation failed",
  "reason": "Rate limit exceeded: 10 submissions per 60s",
  "waitTime": 15
}
```

### Duplicate Submission (409 Conflict)
```json
{
  "error": "Score already submitted for this game",
  "duplicate": true
}
```

---

## Validation Levels

The endpoint supports multiple validation levels (configured via environment variable):

### BASIC
- Game ID format validation only
- Fastest, minimal security

### LOGIC
- Game ID format
- Game-specific logic validation
- No blockchain verification

### BLOCKCHAIN
- Game ID format
- Game logic validation
- Blockchain verification
- No fraud detection

### FULL (Default)
- All validations enabled
- Blockchain verification
- Game logic validation
- Fraud detection
- Rate limiting

---

## Environment Variables

Configure validation behavior:

```bash
# Validation level (BASIC, LOGIC, BLOCKCHAIN, FULL)
VALIDATION_LEVEL=FULL

# Enable/disable rate limiting (default: true)
ENABLE_RATE_LIMITING=true

# Enable/disable fraud detection (default: true)
ENABLE_FRAUD_DETECTION=true

# Supabase credentials (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Client Integration Examples

### Yahtzee Submission
```javascript
const response = await fetch('/api/submit-score', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    game: 'yahtzee',
    gameId: 'YAH-1234567-abc123',
    playerName: 'Alice',
    score: 248,
    timeSeconds: 780,
    blockHash: '0x123...',
    blockHeight: 1234567,
    scorecard: {
      ones: 3,
      twos: 6,
      // ... full scorecard
      yahtzeeBonusCount: 0
    },
    rollHistory: [
      { turn: 1, rollNumber: 1, dice: [1, 2, 3, 4, 5] },
      // ... all rolls
    ]
  })
});

const result = await response.json();

if (result.success) {
  console.log(`Rank: ${result.rank}`);
  console.log(`Risk Score: ${result.validation.riskScore}`);
} else {
  console.error(`Validation failed: ${result.reason}`);
}
```

### Blackjack Submission
```javascript
const response = await fetch('/api/submit-score', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    game: 'blackjack',
    gameId: 'BJK-1234567-abc123',
    playerName: 'Bob',
    score: 1500,  // Final chip balance
    roundHistory: [
      {
        bet: 100,
        playerHands: [{ cards: ['A♠', 'K♥'] }],
        dealerHand: { cards: ['9♣', '10♦'] }
      }
      // ... all rounds
    ]
  })
});
```

### Simple Submission (No History)
For games where detailed history isn't available:

```javascript
const response = await fetch('/api/submit-score', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    game: 'solitaire',
    gameId: 'SOL-1234567-abc123',
    playerName: 'Charlie',
    score: 52,
    timeSeconds: 145,
    moves: 87
  })
});
```

---

## Validation Details by Game

### Yahtzee
**Validates**:
- ✅ Scorecard has all 13 categories filled
- ✅ Each category score matches dice values
- ✅ Grand total = upper + lower + bonuses
- ✅ Upper bonus = 35 if sum ≥ 63
- ✅ Roll history has 13-39 rolls (13 turns, 1-3 rolls each)

**Catches**:
- ❌ Tampered scorecard values
- ❌ Incorrect bonus calculation
- ❌ Invalid roll sequences
- ❌ Score doesn't match scorecard

### Backgammon
**Validates**:
- ✅ Score = winType × cubeValue × difficulty
- ✅ Win type is normal/gammon/backgammon
- ✅ Cube value is power of 2 (max 64)
- ✅ Difficulty is easy/normal/hard
- ✅ Move history format (from/to positions)
- ✅ Move count is reasonable (10-500)

**Catches**:
- ❌ Incorrect score calculation
- ❌ Invalid win type
- ❌ Invalid cube value
- ❌ Suspiciously few/many moves

### Blackjack
**Validates**:
- ✅ Replays all rounds from history
- ✅ Each hand outcome is correct (win/loss/push/blackjack)
- ✅ Final chip balance matches round results
- ✅ Bet amounts don't exceed balance
- ✅ Handles split hands correctly
- ✅ Payout calculations (blackjack 2.5x, win 2x, etc.)

**Catches**:
- ❌ Manipulated round outcomes
- ❌ Incorrect payout calculations
- ❌ Impossible bet sequences
- ❌ Balance doesn't match history

### 2048
**Validates**:
- ✅ Highest tile is power of 2
- ✅ Score is reasonable for tile achieved
- ✅ Move count matches tile progression
- ✅ Move history format (UDLR encoding)

**Catches**:
- ❌ Score too high/low for tile
- ❌ Tile impossible with move count
- ❌ Invalid move encoding

### Solitaire
**Validates**:
- ✅ Score is 0-52 cards
- ✅ Move count ≥ score
- ✅ Perfect game (52) has reasonable moves/time
- ✅ Time ≥ 0.3s per move (human speed)

**Catches**:
- ❌ Impossible move/score ratios
- ❌ Too fast completion
- ❌ Invalid score range

### Garbage
**Validates**:
- ✅ Score matches round count (5×rounds to 2000×rounds)
- ✅ Round count is 1-50
- ✅ Time per round is reasonable (2-300s)
- ✅ Difficulty is valid

**Catches**:
- ❌ Score doesn't match rounds
- ❌ Too fast/slow gameplay
- ❌ Invalid round count

---

## Fraud Detection Flags

Common flags you might see:

### Time-based
- `"Perfect score achieved in 45s"` - Suspicious speed
- `"Average 0.2s per move"` - Too fast (human minimum: 0.3s)
- `"Completed 52 cards in 10s"` - Impossible timing

### Pattern-based
- `"10/12 games are perfect (83%)"` - Too many perfect scores
- `"Scores are suspiciously consistent (std dev: 2.1)"` - Bot-like behavior
- `"Submissions averaged 15s apart"` - Rapid succession

### Game-specific
- `"Highest tile 4096 unlikely with only 200 moves"` - Progression mismatch
- `"Score 50 too low for 10 rounds (min: 50)"` - Correlation issue

---

## Testing

### Test Valid Submission
```bash
curl -X POST http://localhost:3000/api/submit-score \
  -H "Content-Type: application/json" \
  -d '{
    "game": "yahtzee",
    "gameId": "YAH-TEST-123",
    "score": 100,
    "scorecard": {
      "ones": 5, "twos": 0, "threes": 0, "fours": 0,
      "fives": 0, "sixes": 0, "threeOfAKind": 0,
      "fourOfAKind": 0, "fullHouse": 0, "smallStraight": 0,
      "largeStraight": 0, "yahtzee": 0, "chance": 0,
      "yahtzeeBonusCount": 0
    },
    "rollHistory": [
      {"turn": 1, "rollNumber": 1, "dice": [1,1,1,1,1]},
      {"turn": 2, "rollNumber": 1, "dice": [2,2,2,2,2]},
      {"turn": 3, "rollNumber": 1, "dice": [3,3,3,3,3]},
      {"turn": 4, "rollNumber": 1, "dice": [4,4,4,4,4]},
      {"turn": 5, "rollNumber": 1, "dice": [5,5,5,5,5]},
      {"turn": 6, "rollNumber": 1, "dice": [6,6,6,6,6]},
      {"turn": 7, "rollNumber": 1, "dice": [1,2,3,4,5]},
      {"turn": 8, "rollNumber": 1, "dice": [1,2,3,4,5]},
      {"turn": 9, "rollNumber": 1, "dice": [1,2,3,4,5]},
      {"turn": 10, "rollNumber": 1, "dice": [1,2,3,4,5]},
      {"turn": 11, "rollNumber": 1, "dice": [1,2,3,4,5]},
      {"turn": 12, "rollNumber": 1, "dice": [1,2,3,4,5]},
      {"turn": 13, "rollNumber": 1, "dice": [1,2,3,4,5]}
    ]
  }'
```

### Test Invalid Submission (Score Mismatch)
```bash
curl -X POST http://localhost:3000/api/submit-score \
  -H "Content-Type: application/json" \
  -d '{
    "game": "yahtzee",
    "gameId": "YAH-TEST-456",
    "score": 500,
    "scorecard": {
      "ones": 5, "twos": 0, "threes": 0, "fours": 0,
      "fives": 0, "sixes": 0, "threeOfAKind": 0,
      "fourOfAKind": 0, "fullHouse": 0, "smallStraight": 0,
      "largeStraight": 0, "yahtzee": 0, "chance": 0,
      "yahtzeeBonusCount": 0
    },
    "rollHistory": [...]
  }'
```

Expected: `400 Bad Request` with reason "Score mismatch: claimed 500, calculated 5"

---

## Migration from Old Endpoint

### Old Endpoint (Basic Validation)
```javascript
// Only basic checks
await fetch('/api/submit-score', {
  method: 'POST',
  body: JSON.stringify({ game, gameId, score })
});
```

### New Endpoint (Enhanced Validation)
```javascript
// Add game history for full validation
await fetch('/api/submit-score', {
  method: 'POST',
  body: JSON.stringify({
    game,
    gameId,
    score,
    // NEW: Add game-specific history
    scorecard,      // Yahtzee
    rollHistory,    // Yahtzee
    roundHistory,   // Blackjack
    moveHistory,    // 2048, Backgammon
    highestTile,    // 2048
    winType,        // Backgammon
    cubeValue,      // Backgammon
    difficulty      // Backgammon, Garbage
  })
});
```

### Backwards Compatibility
✅ **Old requests still work** - history fields are optional
✅ **No client changes required** - but recommended for full validation
✅ **Gradual migration** - add history fields game by game

---

## Troubleshooting

### "Validation failed: Missing roll history"
**Solution**: Include `rollHistory` for Yahtzee submissions

### "Validation failed: Score mismatch"
**Solution**: Ensure your score calculation matches server logic exactly

### "Rate limit exceeded"
**Solution**: Wait before submitting again, or disable rate limiting in env

### "Block not found on blockchain"
**Solution**: Ensure blockHash and blockHeight are valid Ergo blockchain data

### "Fraud detection: Perfect score achieved in 45s"
**Solution**: This is working as intended - impossibly fast scores are flagged

---

## Best Practices

1. **Always include game history** - Enables full validation
2. **Store blockchain data** - Required for provably fair verification
3. **Handle validation errors gracefully** - Show user why submission failed
4. **Test with valid data first** - Ensure integration works before going live
5. **Monitor fraud flags** - Review flagged submissions periodically

---

## Summary

**The enhanced endpoint provides**:
- ✅ Complete game logic validation
- ✅ Blockchain verification
- ✅ Fraud detection
- ✅ Rate limiting
- ✅ Backwards compatibility

**You need to**:
- Include game-specific history fields for full validation
- Handle new response format (validation metadata)
- Optionally: Add Supabase columns for storing validation data

**You do NOT need to**:
- Change existing client code (backwards compatible)
- Modify Supabase schema (optional enhancement)
- Migrate existing data (new system works alongside old)

---

**Ready to use!** 🚀

For questions or issues, check the validation results in the response for detailed error information.
