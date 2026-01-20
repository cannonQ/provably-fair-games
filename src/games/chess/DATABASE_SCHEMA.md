# Chess Database Schema

## Leaderboard Table Structure

The chess game should use the same `leaderboard` table as other games with the following fields:

### Required Fields

```sql
CREATE TABLE IF NOT EXISTS leaderboard (
  id SERIAL PRIMARY KEY,
  game VARCHAR(50) NOT NULL,              -- 'chess'
  game_id VARCHAR(255) NOT NULL UNIQUE,   -- Unique game identifier
  player_name VARCHAR(100) NOT NULL,
  score INTEGER NOT NULL,                 -- Calculated score (see below)
  time_seconds INTEGER NOT NULL,          -- Game duration in seconds
  moves INTEGER NOT NULL,                 -- Total moves made in the game
  metadata JSONB,                         -- Additional game data
  created_at TIMESTAMP DEFAULT NOW(),
  rank INTEGER                            -- Computed rank (updated via trigger or query)
);

CREATE INDEX idx_leaderboard_game ON leaderboard(game);
CREATE INDEX idx_leaderboard_score ON leaderboard(game, score DESC, time_seconds ASC, moves ASC);
```

## Chess-Specific Scoring System

### Score Calculation
```
Win:  100 × (AI_ELO ÷ 100) = points
Draw: 25 × (AI_ELO ÷ 100) = points
Loss: 10 × (AI_ELO ÷ 100) = points

Examples:
- Beating 1400 ELO: 100 × 14 = 1,400 points
- Drawing 1800 ELO: 25 × 18 = 450 points
- Losing to 1400 ELO: 10 × 14 = 140 points
- Losing to 700 ELO: 10 × 7 = 70 points
- Beating 2200 ELO: 100 × 22 = 2,200 points
```

**Rationale:** Losing to a stronger opponent (1400 ELO) gives 2× the points of losing to a weak opponent (700 ELO). This rewards players for challenging themselves against harder difficulties.

### Ranking Order
1. **Score** (descending) - Higher score = higher rank
2. **Metadata->aiElo** (descending) - Tiebreaker: higher AI difficulty = higher rank
3. **Moves** (ascending) - Tiebreaker: fewer moves = higher rank

### Metadata JSONB Structure
```json
{
  "result": "1-0",                    // "1-0" (white wins), "0-1" (black wins), "1/2-1/2" (draw)
  "reason": "checkmate",              // "checkmate", "resignation", "stalemate", "threefold", etc.
  "playerColor": "white",             // "white" or "black"
  "aiElo": 1400,                      // AI difficulty (400-2800)
  "aiSkillLevel": 12,                 // Stockfish skill level (0-20)
  "blockHeight": 987654,              // Ergo block height used for color assignment
  "blockHash": "abc123...",           // Ergo block hash
  "colorCommitment": "def456...",     // SHA256 commitment for color assignment
  "aiCommitment": "ghi789...",        // SHA256 commitment for AI settings
  "pgn": "1. e4 e5 2. Nf3...",       // Full PGN notation of the game
  "finalFen": "rnbqkbnr/..."         // Final board position
}
```

## Example Leaderboard Entry

```json
{
  "id": 1,
  "game": "chess",
  "game_id": "chess_1706112345678_abc123",
  "player_name": "ChessMaster",
  "score": 1800,                      // Beat 1800 ELO AI
  "time_seconds": 1245,               // 20 minutes 45 seconds
  "moves": 42,                        // Total moves (21 full rounds)
  "metadata": {
    "result": "1-0",
    "reason": "checkmate",
    "playerColor": "white",
    "aiElo": 1800,
    "aiSkillLevel": 16,
    "blockHeight": 987654,
    "blockHash": "abc123...",
    "colorCommitment": "def456...",
    "aiCommitment": "ghi789...",
    "pgn": "1. e4 e5 2. Nf3 Nc6...",
    "finalFen": "rnb1kbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R"
  },
  "created_at": "2024-01-24T15:30:45Z",
  "rank": 1
}
```

## API Integration

### Submit Score Endpoint
```javascript
POST /api/leaderboard/submit

Body:
{
  "game": "chess",
  "game_id": "chess_1706112345678_abc123",
  "player_name": "ChessMaster",
  "score": 1800,
  "time_seconds": 1245,
  "moves": 42,
  "metadata": { ... }
}
```

### Fetch Leaderboard Endpoint
```javascript
GET /api/leaderboard?game=chess&limit=20

Response:
{
  "entries": [
    {
      "id": 1,
      "rank": 1,
      "player_name": "ChessMaster",
      "score": 1800,
      "time_seconds": 1245,
      "moves": 42,
      "game_id": "chess_1706112345678_abc123",
      "created_at": "2024-01-24T15:30:45Z"
    },
    ...
  ]
}
```

## Implementation Notes

1. **Game ID Format**: `chess_${timestamp}_${randomHash}`
2. **Player Names**: Allow anonymous or registered usernames
3. **Verification**: Each game_id links to full blockchain verification data
4. **Caching**: API responses cached for 60 seconds
5. **Pagination**: Support limit/offset parameters
6. **Ordering**: Always order by (score DESC, metadata->aiElo DESC, moves ASC)

## Required Implementation in ChessGame.jsx

Add to GameOverModal:
```javascript
const handleSubmitScore = async () => {
  const score = calculateScore(result, aiSettings.targetElo);

  await fetch('/api/leaderboard/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      game: 'chess',
      game_id: gameId,
      player_name: playerName,
      score: score,
      time_seconds: Math.floor(gameDuration / 1000),
      moves: getMoveHistory(game).length,
      metadata: {
        result: result.result,
        reason: result.reason,
        playerColor: playerColor,
        aiElo: aiSettings.targetElo,
        aiSkillLevel: aiSettings.skillLevel,
        blockHeight: colorAssignment.blockHeight,
        blockHash: colorAssignment.blockHash,
        colorCommitment: colorAssignment.commitment,
        aiCommitment: aiCommitment.commitment,
        pgn: getPgn(game),
        finalFen: getFen(game)
      }
    })
  });
};
```

## Score Calculation Function

```javascript
function calculateChessScore(result, aiElo, playerColor) {
  if (result.winner === playerColor) {
    // Win: 100 points per 100 ELO
    return Math.floor(100 * (aiElo / 100));
  } else if (result.winner === null) {
    // Draw: 25 points per 100 ELO
    return Math.floor(25 * (aiElo / 100));
  } else {
    // Loss: 10 points per 100 ELO (rewards challenging harder opponents)
    return Math.floor(10 * (aiElo / 100));
  }
}

// Examples:
// Win vs 1400 ELO:  100 × 14 = 1,400 pts
// Draw vs 1400 ELO: 25 × 14 = 350 pts
// Loss vs 1400 ELO: 10 × 14 = 140 pts
// Loss vs 700 ELO:  10 × 7 = 70 pts (half the points of losing to 1400)
```
