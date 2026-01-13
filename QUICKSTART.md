# Quick Start Guide

Get up and running in 5 minutes.

## Prerequisites

- **Node.js 18+** — [Download here](https://nodejs.org/)
- **npm** — Comes with Node.js

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

This installs React, React Router, and Axios (~30 seconds).

## 2. Start the Dev Server

```bash
npm start
```

Your browser opens automatically to `http://localhost:3000`.

## 3. Test the Blockchain Connection

1. Click **"Play Garbage"** from the home page
2. Click **"New Game"**
3. Look for the green block info banner showing:
   - Block height (e.g., #1,247,842)
   - Truncated hash
   - "Connected to Ergo blockchain"

If you see this, you're connected! 🎉

## 4. Play Your First Game

**Garbage Rules (30-second version):**
- You have 10 face-down cards in positions 1-10
- Draw a card and place it in its matching position (5 goes in slot 5)
- The card you replace goes to your hand — keep going!
- Jacks are wild (place anywhere)
- Queens/Kings are garbage (end your turn)
- First to fill all 10 positions wins

**Controls:**
- Click **Draw Pile** to draw a card
- Click **Discard Pile** to take the top discard
- Click a **position (1-10)** to place your held card
- Click **Discard** button to end your turn

## 5. Verify a Shuffle

After the game ends:

1. Click **"View Verification"** button
2. Click **"Verify Shuffle"** — watch it regenerate the deck
3. See the green ✓ VERIFIED message
4. Click the **Ergo Explorer** link to see the actual block

**Manual verification:**
1. Copy the block hash
2. Copy the game ID
3. Run through our shuffle algorithm (see `src/blockchain/shuffle.js`)
4. Compare results — they'll match exactly

## 6. Common Issues

| Problem | Solution |
|---------|----------|
| `npm install` fails | Delete `node_modules` folder, run `npm install` again |
| Port 3000 in use | Kill other processes or set `PORT=3001 npm start` |
| "Cannot reach Ergo API" | Check internet connection; API may be temporarily down |
| Cards not displaying | Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac) |
| Blank page | Check browser console (F12) for errors |

## File Structure

```
src/
├── blockchain/     # Ergo API + shuffle algorithm
├── games/garbage/  # Game logic + AI
├── components/     # Card, GameBoard, Verification
└── pages/          # Home, HowItWorks
```

## Next Steps

- Read `README.md` for full documentation
- Visit `/how-it-works` to understand the math
- Check `src/blockchain/shuffle.js` to see the algorithm
- Modify AI difficulty in `src/games/garbage/ai.js`

---

**Questions?** Open an issue on GitHub.

**Have fun playing provably fair games!** 🃏
