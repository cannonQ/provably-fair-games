# Quick Start Guide

Get up and running in 5 minutes.

## Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm** - Comes with Node.js

Verify installation:
```bash
node --version   # Should show v18.x.x or higher
npm --version    # Should show 9.x.x or higher
```

## 1. Install Dependencies

```bash
cd provably-fair-games
npm install
```

## 2. Environment Setup (Optional)

For leaderboard functionality, create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> **Note:** The game works without these - you just won't have leaderboard features locally.

## 3. Start the Dev Server

```bash
npm start
```

Opens automatically at `http://localhost:3000`.

## 4. Test the Blockchain Connection

1. Click **"Solitaire"** from the home page
2. Click **"Start New Game"**
3. Check the header shows block info and card count

If cards appear and the game is playable, you're connected!

## 5. Play Solitaire

**Controls:**
- **Click stock pile** (top-left) to draw cards
- **Click/drag cards** to move between columns
- **Double-click** to auto-move to foundation
- **Click foundation** (top-right) to place cards

**Rules:**
- Build tableau columns: alternating colors, descending rank (K-Q-J-10...)
- Build foundations: same suit, ascending (A-2-3...K)
- Only Kings can fill empty tableau columns
- Game auto-completes when all cards are face-up

**Buttons:**
- **New** - Start fresh game
- **Undo** - Undo last move
- **Hint** - Highlight a valid move
- **Auto** - Auto-complete (when available)
- **Give Up** - End game early

## 6. Submit Your Score

When the game ends:

1. Enter your name (optional)
2. Click **"Submit Score"**
3. See your rank on the leaderboard
4. Click **"Verify"** to see blockchain proof

## 7. Verify a Shuffle

On the verification page:

1. View **Block Hash** and **TX Hash** - the randomness source
2. See **Stored Seed** matches **Regenerated Seed**
3. Click **"View Deal Replay"** to see exact card order
4. Click **Ergo Explorer** links to verify on-chain

## 8. Play Garbage

1. Go back to home page
2. Click **"Garbage"**
3. Click **"New Game"**

**Rules (30-second version):**
- You have 10 face-down cards in positions 1-10
- Draw a card and place it in its matching position
- The replaced card goes to your hand - keep going!
- Jacks are wild, Queens/Kings end your turn
- First to fill all 10 positions wins

## Common Issues

| Problem | Solution |
|---------|----------|
| `npm install` fails | Delete `node_modules`, run `npm install` again |
| Port 3000 in use | `PORT=3001 npm start` |
| "Cannot reach Ergo API" | Check internet; API may be temporarily down |
| Leaderboard not working | Check `.env.local` has correct Supabase credentials |
| Cards not displaying | Hard refresh: `Ctrl+Shift+R` / `Cmd+Shift+R` |

## Deploying to Vercel

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) and import project
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

## Supabase Setup

1. Create project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run:

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

ALTER TABLE "LeaderBoard" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public reads" ON "LeaderBoard"
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public inserts" ON "LeaderBoard"
  FOR INSERT TO anon WITH CHECK (true);
```

3. Copy URL and anon key from Settings > API

## File Structure

```
src/
├── blockchain/         # Ergo API + shuffle algorithm
├── games/
│   ├── solitaire/      # Solitaire game, logic, verification
│   └── garbage/        # Garbage game + AI opponent
├── components/         # Leaderboard, Verification, Cards
├── services/           # API client for leaderboard
└── lib/                # Supabase client config

api/
├── submit-score.js     # Score submission + blockchain verification
├── leaderboard.js      # Get top scores
└── game/[gameId].js    # Get game data for verification
```

## Next Steps

- Read `README.md` for full documentation
- Visit `/how-it-works` in the app to understand the math
- Check `src/blockchain/shuffle.js` to see the algorithm
- Explore the verification page to understand provably fair gaming

---

**Questions?** Open an issue on GitHub.

**Have fun playing provably fair games!**
