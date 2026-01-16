# Provably Fair Games

Play classic card and dice games with blockchain-verified randomness. No wallet needed, no signup required, completely free.

**Live Demo:** [provably-fair-games.vercel.app](https://provably-fair-games.vercel.app)

## Games

### Solitaire (Klondike)
Classic single-player solitaire with standard Klondike rules.
- Move cards between tableau columns (opposite color, descending rank)
- Build foundations from Ace to King by suit
- Auto-complete triggers when all cards are revealed
- Submit scores to the global leaderboard

### Garbage (Trash)
Two-player card game against AI opponent.
- Fill positions 1-10 with matching cards
- Jacks are wild, Queens/Kings end your turn
- First to complete all positions wins

### Yahtzee
Classic dice game with blockchain-verified randomness.
- 13 scoring categories across upper and lower sections
- Three rolls per turn to achieve combinations
- Strategic scoring for straights, full houses, and Yahtzee
- Compete for high scores on the global leaderboard

## Features

- **Blockchain-Verified RNG** - Card shuffles and dice rolls use Ergo block hashes + transaction data as seeds
- **Anti-Spoofing Protection** - 5 independent inputs (blockHash + txHash + timestamp + gameId + txIndex)
- **Global Leaderboard** - Compete for high scores with provably fair verification
- **No Wallet Required** - Read-only blockchain access, no transactions
- **Fully Verifiable** - Anyone can independently verify any game's randomness
- **Database Fallback** - Verification works even without localStorage data

## How It Works

1. **Fetch Block Data** - Get latest Ergo block header + transaction data
2. **Generate Seed** - Combine 5 inputs: `blockHash + txHash + timestamp + gameId + txIndex`
3. **Deterministic Shuffle** - Fisher-Yates shuffle produces the deck order
4. **Anyone Can Verify** - Same inputs = same shuffle, always

The block data is determined by Ergo miners and cannot be predicted or manipulated.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| react-router-dom | Page navigation |
| Supabase | Leaderboard database |
| Vercel | Hosting & serverless functions |
| Ergo Blockchain | Verifiable randomness source |

## Quick Start (Local Development)

```bash
# Clone and install
git clone https://github.com/cannonQ/provably-fair-games.git
cd provably-fair-games
npm install

# Start development server
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

For leaderboard functionality, set these in your `.env.local` file or Vercel dashboard:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deploying to Vercel

1. Push code to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com)
3. Add environment variables in Settings > Environment Variables
4. Deploy

## Supabase Setup

Create a `LeaderBoard` table with this schema:

```sql
CREATE TABLE "LeaderBoard" (
  id SERIAL PRIMARY KEY,
  game TEXT NOT NULL,
  game_id TEXT UNIQUE NOT NULL,
  player_name TEXT DEFAULT 'Anonymous',
  score INTEGER NOT NULL,
  time_seconds INTEGER NOT NULL,
  moves INTEGER NOT NULL,
  block_height INTEGER,
  block_hash TEXT,
  tx_hash TEXT,
  block_timestamp BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE "LeaderBoard" ENABLE ROW LEVEL SECURITY;

-- Allow public reads and inserts
CREATE POLICY "Allow public reads" ON "LeaderBoard" FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public inserts" ON "LeaderBoard" FOR INSERT TO anon WITH CHECK (true);
```

## Project Structure

```
provably-fair-games/
├── api/                    # Vercel serverless functions
│   ├── submit-score.js     # POST /api/submit-score
│   ├── leaderboard.js      # GET /api/leaderboard
│   ├── game/[gameId].js    # GET /api/game/:gameId
│   └── cron/               # Scheduled jobs
│       └── daily-leaderboard.js  # Posts top scores to blockchain
├── src/
│   ├── blockchain/         # Ergo API + shuffle algorithm
│   ├── games/
│   │   ├── solitaire/      # Solitaire game + verification
│   │   ├── garbage/        # Garbage game + AI
│   │   └── yahtzee/        # Yahtzee game + verification
│   ├── components/         # Shared UI components
│   ├── services/           # Leaderboard API client
│   └── lib/                # Supabase client + blockchain transactions
└── public/
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/submit-score` | POST | Submit score with blockchain verification |
| `/api/leaderboard?game={game}` | GET | Get top scores for a game (solitaire, garbage, yahtzee) |
| `/api/game/:gameId` | GET | Get game data for verification |
| `/api/cron/daily-leaderboard` | POST | Daily cron job - posts top 3 scores per game to blockchain |

## Verification

Every game can be independently verified:

1. Click "Verify" on any leaderboard entry or in-game
2. View blockchain proof: block hash, TX hash, timestamp
3. See the regenerated shuffle matches the original
4. Click explorer links to verify on-chain

Verification works from:
- **localStorage** (same browser) - full verification with stored seed
- **Database** (any device) - verification via leaderboard data

## Leaderboard Ranking

### Solitaire
Scores are ranked by:
1. **Cards to Foundation** (primary) - 0-52
2. **Time** (secondary) - faster is better
3. **Moves** (tertiary) - fewer is better

Both wins (52/52) and partial games can be submitted.

### Yahtzee
Scores are ranked by:
1. **Score** (primary) - 0-375 max
2. **Time** (secondary) - faster is better

### Garbage
Scores are ranked by:
1. **Score** (primary)
2. **Time** (secondary)
3. **Moves** (tertiary)

## For Developers

### Adding a New Game

Want to add a new game to the platform? See the comprehensive [**Game Integration Guide**](GAME_INTEGRATION_GUIDE.md) which includes:

- ✅ Minimum required files checklist
- ✅ Step-by-step integration process
- ✅ Database schema documentation
- ✅ Testing procedures
- ✅ Common patterns and best practices
- ✅ Example implementation

The guide walks through exactly what files to create and update when adding games like Solitaire, Garbage, or Yahtzee.

### Contributing

Contributions are welcome! Feel free to:
- Report bugs or issues
- Suggest new games
- Improve existing games
- Enhance documentation

## License

MIT License - use freely, play fairly.
