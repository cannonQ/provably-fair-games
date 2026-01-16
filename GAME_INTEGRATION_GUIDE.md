# Game Integration Guide

This guide explains how to integrate a new game into the Provably Fair Games platform. Follow this checklist when adding games like Garbage, Solitaire, or Yahtzee.

## Table of Contents
1. [Overview](#overview)
2. [Minimum Required Files](#minimum-required-files)
3. [Files to Update](#files-to-update)
4. [Database Schema](#database-schema)
5. [Step-by-Step Integration Checklist](#step-by-step-integration-checklist)
6. [Testing](#testing)

---

## Overview

The platform uses:
- **Blockchain RNG**: Ergo blockchain for provably fair randomness
- **Leaderboard**: Supabase for score storage
- **Verification**: Client-side verification using stored blockchain data
- **Cron Jobs**: Daily blockchain posting of top scores

---

## Minimum Required Files

When creating a new game, you need these files at minimum:

### 1. Game Component (`/src/games/{game-name}/{GameName}Game.jsx`)
The main game logic component.

**Required features:**
- Blockchain anchor fetching (via `getLatestBlock()`)
- Seed generation and RNG using blockchain data
- Game state management
- Timer tracking
- Player name input
- Game over handling with optional submission

**Key imports:**
```javascript
import { getLatestBlock } from '../../blockchain/ergo-api';
import { generateSeed, shuffleDeck } from '../../blockchain/shuffle';
```

**State requirements:**
- `gameId`: Unique identifier (format: `{GAME}-{timestamp}-{random}`)
- `playerName`: Player identifier
- `startTime`: For elapsed time calculation
- `anchor`: Blockchain block data (blockHeight, blockHash, txHash, timestamp)

### 2. Verification Page (`/src/games/{game-name}/VerificationPage.jsx`)
Allows users to verify game fairness using blockchain data.

**Required features:**
- Game ID input/parsing from URL params
- Block data fetching from blockchain
- Seed regeneration
- Visual proof display (side-by-side comparison)
- Link back to game

### 3. Game-Specific Logic Files
Depending on game complexity:
- `gameLogic.js` - Core game rules and move validation
- `gameState.js` - State management (reducer pattern)
- `scoringLogic.js` - Score calculation functions

### 4. UI Components (Optional but Recommended)
- `GameOverModal.jsx` - End game display with submission
- Additional game-specific components (e.g., `DiceArea.jsx`, `Scorecard.jsx`)

---

## Files to Update

### 1. `/src/App.jsx`
Add routes for your game:

```javascript
// Import game components
import YourGame from './games/your-game/YourGame';
import YourGameVerification from './games/your-game/VerificationPage';

// Add navigation link in Header component
<Link to="/your-game" style={...}>Your Game</Link>

// Add routes
<Route path="/your-game" element={<YourGame />} />
<Route path="/verify/your-game/:gameId" element={<YourGameVerification />} />
<Route path="/your-game/verify" element={<YourGameVerification />} />
```

### 2. `/src/pages/Home.jsx`
Add a game card to the home page:

```javascript
<div style={cardStyle}>
  <div style={cardIconStyle}>🎮</div>
  <h2 style={cardTitleStyle}>Your Game</h2>
  <p style={cardDescStyle}>
    Brief description of your game and what makes it unique.
  </p>
  <div style={cardFooterStyle}>
    <Link to="/your-game" style={playButtonStyle}>
      Play Now
    </Link>
  </div>
</div>
```

### 3. `/api/submit-score.js`
Add game type validation and scoring rules:

```javascript
// Add to valid games list (line ~123)
if (!['solitaire', 'garbage', 'yahtzee', 'your-game'].includes(game)) {
  return res.status(400).json({ error: 'Invalid game type' });
}

// Add game ID pattern validation (line ~128)
const gameIdPatterns = {
  solitaire: /^SOL-\d+-\w+$/,
  garbage: /^GRB-\d+-\w+$/,
  yahtzee: /^YAH-\d+-\w+$/,
  'your-game': /^YRG-\d+-\w+$/
};

if (!gameIdPatterns[game]?.test(gameId)) {
  return res.status(400).json({ error: 'Invalid game ID format' });
}

// Add score validation in validateScore() function (line ~77)
if (game === 'your-game') {
  if (score < 0 || score > MAX_SCORE) {
    return { valid: false, reason: 'Invalid score range' };
  }
  // Add any game-specific validation
}
```

### 4. `/api/leaderboard.js`
Add game to valid games array:

```javascript
const VALID_GAMES = ['solitaire', 'garbage', 'yahtzee', 'your-game'];
```

### 5. `/api/cron/daily-leaderboard.js`
Add game to daily blockchain posting:

```javascript
const GAMES = ['garbage', 'solitaire', 'yahtzee', 'your-game'];
```

### 6. `/src/pages/LeaderboardPage.jsx`
Add game display logic if needed. The component already handles multiple games dynamically, but you may need to customize column display:

```javascript
// Check if moves column logic needs updating
const showMoves = game !== 'yahtzee' && game !== 'your-game';
```

### 7. `/README.md`
Document your game:

**Add to Features section:**
```markdown
- **Your Game**: Description of gameplay and rules
```

**Add to Leaderboard Ranking section:**
```markdown
### Your Game
Scores are ranked by:
1. **Primary Metric** (primary) - description
2. **Time** (secondary) - faster is better
3. **Moves** (tertiary, if applicable) - fewer is better
```

**Add to Project Structure:**
```markdown
- `src/games/your-game/` - Your Game implementation
```

**Add to API Endpoints:**
Update the table to show your game is supported.

---

## Database Schema

The platform uses Supabase with a single `LeaderBoard` table:

### Table: `LeaderBoard`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `game` | TEXT | Game type: 'solitaire', 'garbage', 'yahtzee', 'your-game' |
| `game_id` | TEXT | Unique game identifier (indexed, unique constraint) |
| `player_name` | TEXT | Player display name |
| `score` | INTEGER | Primary ranking metric (cards, points, etc.) |
| `time_seconds` | INTEGER | Time taken in seconds |
| `moves` | INTEGER | Number of moves (nullable for games that don't track moves) |
| `block_height` | INTEGER | Ergo blockchain block height |
| `block_hash` | TEXT | Ergo blockchain block hash |
| `tx_hash` | TEXT | Transaction hash used for RNG seed (nullable) |
| `block_timestamp` | BIGINT | Block timestamp |
| `created_at` | TIMESTAMP | Submission timestamp |

**Indexes:**
- `game_id` - Unique constraint to prevent duplicate submissions
- `game`, `score`, `time_seconds` - For leaderboard ranking queries

**No schema changes needed** - existing table supports all games.

---

## Step-by-Step Integration Checklist

### Phase 1: Game Implementation
- [ ] Create game directory: `/src/games/{game-name}/`
- [ ] Implement main game component with blockchain integration
- [ ] Implement game logic and state management
- [ ] Add verification page component
- [ ] Create GameOverModal with optional submission flow
- [ ] Test game locally (blockchain fetching, RNG, gameplay)

### Phase 2: Platform Integration
- [ ] Update `/src/App.jsx` - Add routes and navigation
- [ ] Update `/src/pages/Home.jsx` - Add game card
- [ ] Update `/api/submit-score.js` - Add validation
- [ ] Update `/api/leaderboard.js` - Add to valid games
- [ ] Update `/api/cron/daily-leaderboard.js` - Add to GAMES array
- [ ] Update `/README.md` - Document game

### Phase 3: Testing
- [ ] Test game flow end-to-end
- [ ] Test score submission to leaderboard
- [ ] Test verification page with real game ID
- [ ] Test mobile responsiveness
- [ ] Verify leaderboard displays correctly
- [ ] Test blockchain verification works

### Phase 4: Deployment
- [ ] Commit changes to feature branch
- [ ] Create pull request
- [ ] Test on staging/preview environment
- [ ] Merge to main branch
- [ ] Verify cron job includes new game
- [ ] Monitor for errors in production

---

## Testing

### Local Testing Checklist

1. **Game Flow**
   - [ ] Start new game fetches latest block
   - [ ] Game ID generated correctly (format: `{PREFIX}-{timestamp}-{random}`)
   - [ ] Gameplay works as expected
   - [ ] Timer tracks correctly
   - [ ] Game over triggers appropriately

2. **Submission Flow**
   - [ ] GameOverModal displays correctly
   - [ ] Player can optionally enter name
   - [ ] Submit button disabled during submission
   - [ ] Success message shows with rank
   - [ ] Error handling works (network issues, duplicate submission)

3. **Verification**
   - [ ] Verification page loads with game ID from URL
   - [ ] Blockchain data fetched correctly
   - [ ] Seed regenerated matches original
   - [ ] Visual comparison displays properly

4. **Leaderboard**
   - [ ] Game appears in leaderboard dropdown
   - [ ] Scores display with correct columns
   - [ ] Ranking order correct (primary → secondary → tertiary)
   - [ ] Pagination works

5. **Mobile**
   - [ ] Burger menu shows game link
   - [ ] Game playable on mobile viewport
   - [ ] Modal displays correctly on mobile
   - [ ] Touch interactions work

### API Testing

```bash
# Test score submission
curl -X POST http://localhost:3000/api/submit-score \
  -H "Content-Type: application/json" \
  -d '{
    "game": "your-game",
    "gameId": "YRG-1234567890-abc123",
    "playerName": "TestPlayer",
    "score": 100,
    "timeSeconds": 120,
    "moves": 50,
    "blockHeight": 123456,
    "blockHash": "abc...",
    "txHash": "def...",
    "blockTimestamp": 1234567890
  }'

# Test leaderboard fetch
curl "http://localhost:3000/api/leaderboard?game=your-game&limit=10"
```

---

## Common Patterns

### 1. Game ID Format
Use a 3-letter prefix followed by timestamp and random string:
```javascript
const gameId = `YRG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
```

### 2. Blockchain Anchor
Always fetch a block first:
```javascript
const anchor = await getLatestBlock();
setAnchor(anchor);
setGameId(`YRG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
```

### 3. Seed Generation
Use consistent seed generation:
```javascript
import { generateSeed } from '../../blockchain/shuffle';

const seed = generateSeed({
  blockHash: anchor.blockHash,
  txHash: anchor.txHash,
  timestamp: anchor.timestamp,
  txIndex: 0
}, gameId);
```

### 4. Optional Submission
Pattern from Solitaire/Yahtzee:
```javascript
const [playerName, setPlayerName] = useState('');
const [submitting, setSubmitting] = useState(false);
const [submitted, setSubmitted] = useState(false);
const [submitError, setSubmitError] = useState(null);

// Manual submission handler
const handleSubmitScore = async () => {
  setSubmitting(true);
  setSubmitError(null);
  try {
    const response = await fetch('/api/submit-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game: 'your-game',
        gameId,
        playerName: playerName.trim() || 'Anonymous',
        score,
        timeSeconds,
        moves,
        blockHeight: anchor.blockHeight,
        blockHash: anchor.blockHash,
        txHash: anchor.txHash,
        blockTimestamp: anchor.timestamp
      })
    });

    if (!response.ok) throw new Error('Submission failed');

    const result = await response.json();
    setSubmitted(true);
    setSubmitRank(result.rank);
  } catch (err) {
    setSubmitError(err.message);
  } finally {
    setSubmitting(false);
  }
};
```

---

## Tips and Best Practices

1. **Game ID Uniqueness**: Always include timestamp + random string to prevent collisions
2. **Moves Parameter**: Use `moves: 0` or `moves: null` for games that don't track moves
3. **Score Validation**: Add server-side validation to prevent impossible scores
4. **Mobile First**: Design game UI with mobile screens in mind
5. **Error Handling**: Always handle blockchain fetch failures gracefully
6. **Loading States**: Show loading indicators during blockchain operations
7. **Verification**: Make verification accessible from game over modal and leaderboard
8. **Documentation**: Update README.md with game-specific rules and ranking

---

## Troubleshooting

### Score Submission Fails
- Check game ID format matches pattern in `/api/submit-score.js`
- Verify all required fields are present
- Check Supabase connection and table schema

### Blockchain Fetch Fails
- Verify Ergo API is accessible: https://api.ergoplatform.com/api/v1
- Check network connectivity
- Handle errors gracefully with user-friendly messages

### Verification Doesn't Match
- Ensure seed generation is identical between game and verification
- Verify block data is correctly stored and retrieved
- Check RNG implementation matches exactly

### Leaderboard Not Showing Scores
- Verify game name exactly matches in all files
- Check database for inserted records
- Verify ranking query in `/api/leaderboard.js`

---

## Example: Minimal Game Integration

Here's the minimal code needed to add a simple game:

```javascript
// /src/games/coin-flip/CoinFlipGame.jsx
import React, { useState } from 'react';
import { getLatestBlock } from '../../blockchain/ergo-api';
import { generateSeed } from '../../blockchain/shuffle';

export default function CoinFlipGame() {
  const [gameId, setGameId] = useState(null);
  const [anchor, setAnchor] = useState(null);
  const [result, setResult] = useState(null);

  const startGame = async () => {
    const block = await getLatestBlock();
    const id = `CFP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const seed = generateSeed(block, id);

    // Simple RNG: use first 8 chars of seed as hex number
    const randomValue = parseInt(seed.substring(0, 8), 16);
    const isHeads = randomValue % 2 === 0;

    setAnchor(block);
    setGameId(id);
    setResult(isHeads ? 'Heads' : 'Tails');
  };

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Coin Flip</h1>
      {!result ? (
        <button onClick={startGame}>Flip Coin</button>
      ) : (
        <>
          <div style={{ fontSize: '4rem' }}>{result}</div>
          <p>Game ID: {gameId}</p>
          <p>Block: #{anchor.blockHeight}</p>
        </>
      )}
    </div>
  );
}
```

Then follow the checklist to integrate it into the platform!

---

## Support

For questions or issues:
- Review existing game implementations (Solitaire, Garbage, Yahtzee)
- Check API endpoint responses for error messages
- Verify Supabase database schema matches expectations
- Test blockchain connectivity to Ergo API

Good luck building your game! 🎮
