# Provably Fair Games

Play classic card and dice games with blockchain-verified randomness. No wallet needed, no signup required, completely free.

**Live Demo:** [provably-fair-games.vercel.app](https://provably-fair-games.vercel.app)

## All 6 Games

### 1. Solitaire (Klondike)
Classic single-player solitaire with standard Klondike rules.
- Move cards between tableau columns (opposite color, descending rank)
- Build foundations from Ace to King by suit
- Auto-complete triggers when all cards are revealed
- Submit scores to the global leaderboard

### 2. Garbage (Trash)
Two-player card game against AI opponent.
- Fill positions 1-10 with matching cards
- Jacks are wild, Queens/Kings end your turn
- First to complete all positions wins

### 3. Yahtzee
Classic dice game with blockchain-verified randomness.
- 13 scoring categories across upper and lower sections
- Three rolls per turn to achieve combinations
- Strategic scoring for straights, full houses, and Yahtzee
- Compete for high scores on the global leaderboard

### 4. Blackjack
Classic card game against the dealer.
- Place bets and aim for 21 without busting
- Dealer follows standard house rules (hits on 16, stands on 17)
- Track your chip balance across rounds
- Strategic gameplay with card counting elements

### 5. Backgammon
Ancient board game with doubling cube.
- Move checkers based on dice rolls
- Strategic bearing off and blocking
- Doubling cube for high-stakes games
- AI opponent with adjustable difficulty (Easy, Normal, Hard)

### 6. 2048
Tile-merging puzzle game.
- Combine numbered tiles to reach 2048
- Strategic moves to maximize score
- Blockchain-verified randomness for tile spawning
- Compete for highest scores and largest tiles

## Features

- **Blockchain-Verified RNG** - Card shuffles and dice rolls use Ergo block hashes + transaction data as seeds
- **Anti-Spoofing Protection** - 5 independent inputs (blockHash + txHash + timestamp + gameId + txIndex)
- **Server-Side Validation** - Comprehensive validation prevents score manipulation (see below)
- **Global Leaderboard** - Compete for high scores with provably fair verification
- **Admin Dashboard** - Review flagged submissions and manage fraud detection
- **No Wallet Required** - Read-only blockchain access, no transactions
- **Fully Verifiable** - Anyone can independently verify any game's randomness
- **Database Fallback** - Verification works even without localStorage data

## Server-Side Validation

All game submissions undergo comprehensive server-side validation to prevent score manipulation:

**Multi-Layer Validation:**
- ✅ **Game-Specific Logic** - Full move/roll/round replay validation
- ✅ **Blockchain Verification** - Validates Ergo block data and seed generation
- ✅ **Fraud Detection** - Statistical analysis with risk scoring (0-100)
- ✅ **Rate Limiting** - Prevents spam submissions (default: 10 per minute)

**Game Validators:**
- **Yahtzee**: Full history replay with scorecard verification (most comprehensive)
- **Backgammon**: Score calculation validation (winType × cube × difficulty)
- **Blackjack**: Round-by-round chip balance tracking
- **2048**: Score/tile/move correlation checks
- **Solitaire**: Score/move/time validation
- **Garbage**: Score/round validation

**Validation Levels:**
- `BASIC` - Format and range checks only
- `LOGIC` - Game-specific validation
- `BLOCKCHAIN` - Includes blockchain verification
- `FULL` - All validations + fraud detection (default)

See [API_INTEGRATION_GUIDE.md](API_INTEGRATION_GUIDE.md) for technical details.

## Admin Dashboard

Access the admin dashboard to review flagged submissions and manage the platform.

**Features:**
- 🔍 View submissions flagged by fraud detection
- ✅ Approve or reject suspicious scores
- 📊 View validation statistics and trends
- 🎯 Analyze fraud patterns by game

**Access:**
1. Navigate to `/admin`
2. Enter admin password
3. Review flagged submissions
4. Approve legitimate scores or reject fraudulent ones

See [ADMIN_DASHBOARD_GUIDE.md](ADMIN_DASHBOARD_GUIDE.md) for detailed usage instructions.

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

For full functionality, set these in your `.env.local` file or Vercel dashboard:

```env
# Required for all features
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Validation configuration (optional - defaults shown)
VALIDATION_LEVEL=FULL                # BASIC | LOGIC | BLOCKCHAIN | FULL
ENABLE_RATE_LIMITING=true            # Enable rate limiting (default: true)
ENABLE_FRAUD_DETECTION=true          # Enable fraud detection (default: true)
```

**Note:** Admin dashboard uses hardcoded password in source code. For production, consider moving to environment variable for easier rotation.

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
│   ├── submit-score.js     # POST /api/submit-score (with validation)
│   ├── leaderboard.js      # GET /api/leaderboard
│   ├── admin.js            # Admin API (flagged submissions, stats)
│   ├── game/[gameId].js    # GET /api/game/:gameId (verification data)
│   └── cron/               # Scheduled jobs
│       └── daily-leaderboard.js  # Posts top scores to blockchain
├── lib/                    # Server-side utilities
│   └── validation/         # Server-side validation framework
│       ├── index.js        # Master validator dispatcher
│       ├── shared/         # Blockchain utils, fraud detection
│       └── games/          # Game-specific validators (all 6 games)
├── src/
│   ├── blockchain/         # Ergo API + shuffle algorithm
│   ├── games/              # All 6 game implementations
│   │   ├── solitaire/      # Solitaire game + verification
│   │   ├── garbage/        # Garbage game + AI
│   │   ├── yahtzee/        # Yahtzee game + verification
│   │   ├── blackjack/      # Blackjack game + verification
│   │   ├── backgammon/     # Backgammon game + AI + verification
│   │   └── 2048/           # 2048 game + verification
│   ├── components/         # Shared UI components
│   │   ├── AdminDashboard.jsx  # Admin dashboard component
│   │   ├── Leaderboard.jsx     # Leaderboard display
│   │   └── Verification.jsx    # Verification UI
│   ├── pages/              # Page components
│   │   ├── Admin.jsx       # Admin page with password protection
│   │   ├── Home.jsx        # Landing page
│   │   └── LeaderboardPage.jsx
│   ├── services/           # Leaderboard API client
│   └── lib/                # Supabase client + blockchain transactions
└── public/
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/submit-score` | POST | Submit score with comprehensive validation |
| `/api/leaderboard?game={game}` | GET | Get top scores for a game (all 6 games supported) |
| `/api/game/:gameId` | GET | Get game data for verification |
| `/api/admin?action={action}` | GET/POST | Admin endpoints (requires authentication) |
| `/api/cron/daily-leaderboard` | POST | Daily cron job - posts top 3 scores per game to blockchain |

**Admin Actions:**
- `flagged-submissions` - Get flagged submissions (GET)
- `review-submission` - Approve/reject submissions (POST)
- `validation-stats` - Get validation statistics (GET)

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
