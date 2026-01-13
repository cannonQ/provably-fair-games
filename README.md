# Provably Fair Card Games

Play the classic **Garbage** card game with blockchain-verified randomness. No wallet needed, no signup required, completely free.

## Features

- **Blockchain-Verified RNG** — Card shuffles use real Ergo block hashes as seeds
- **No Wallet Required** — We only read public blockchain data, no transactions
- **No Signup Needed** — Just open and play
- **Completely Free** — No fees, no tokens, no catch
- **Fully Verifiable** — Anyone can verify the shuffle was fair

## How It Works

1. **Fetch Block Data** — We call Ergo's public API to get recent block headers
2. **Extract Block Hash** — The block hash becomes our random seed
3. **Deterministic Shuffle** — Fisher-Yates shuffle using the seed produces the deck order
4. **Anyone Can Verify** — Same block hash + same algorithm = same shuffle every time

The block hash is determined by Ergo miners and cannot be predicted or manipulated. This gives us cryptographically secure randomness without needing any wallet integration.

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/provably-fair-games.git
cd provably-fair-games

# Install dependencies
npm install

# Start development server
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000).

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| react-router-dom | Page navigation |
| axios | HTTP requests to Ergo API |
| Ergo Blockchain | Source of verifiable randomness (read-only) |
| Fisher-Yates | Deterministic shuffle algorithm |

## Game: Garbage

Garbage (also called "Trash") is a simple card game where you try to fill positions 1-10 with the correct cards.

**Rules:**
- Each player has 10 face-down cards in positions 1-10
- Draw a card and place it in its matching position (e.g., 5 goes in position 5)
- The card you replace goes to your hand — keep going until you draw a card you can't place
- Kings are wild, Jacks/Queens are dead cards
- First player to fill all 10 positions wins the round

## Project Structure

```
provably-fair-games/
├── src/
│   ├── blockchain/      # Ergo API calls and shuffle logic
│   ├── games/garbage/   # Garbage game components and AI
│   ├── components/      # Reusable UI components
│   └── pages/           # Home and How It Works pages
└── public/
```

## Verification

To verify any game's shuffle:

1. Note the block height shown in the game
2. Look up that block on [Ergo Explorer](https://explorer.ergoplatform.com)
3. Copy the block hash
4. Run it through our shuffle algorithm
5. Compare the resulting deck order

The shuffle is 100% deterministic — same input always produces same output.

## License

MIT License — use freely, play fairly.
