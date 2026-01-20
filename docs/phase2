Landing Page Content
Hero Section

Tagline Options:

    "Pick your card. Prove your luck." ← playing on the card metaphor
    "Every shuffle verified. Every roll proven."
    "Where luck meets math."

Subheading:
"7 classic games. Zero trust required. Every random outcome anchored to the Ergo blockchain."
Footer Copy

Primary: "House edge: 0%. Trust required: 0%."

Secondary (smaller): "Verify any game yourself on Ergo Explorer"
Game Card Content (7 Cards)
+------------+------+------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Game       | Suit | Tagline                            | Expanded Description                                                                                                                                         |
+------------+------+------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Solitaire  | ♥    | Blockchain-shuffled Klondike       | Classic Klondike solitaire with a 52-card deck shuffled using Ergo blockchain randomness. Every card placement is provably fair—verify the shuffle yourself. |
| Blackjack  | ♥    | Beat the house. Verify every card. | Six-deck shoe, real casino rules. The entire shoe order is determined by blockchain data before you place your first bet. Check every card dealt.            |
| Garbage    | ♥    | Race to clear your hand            | Fast-paced card game against AI. Fill your tableau from Ace to 10 before your opponent. Wild cards and blockchain-verified deals.                            |
| Yahtzee    | ♦    | Roll the dice. Prove the rolls.    | Classic five-dice scoring. Every roll is derived from Ergo block data—no hidden RNG. Chase that Yahtzee with full transparency.                              |
| 2048       | ♣    | Slide. Merge. Verify.              | The addictive tile-merger with a twist: every new tile spawn (position and value) comes from blockchain randomness. Same challenge, provable fairness.       |
| Backgammon | ♠    | Ancient game. Modern proof.        | 5,000 years of strategy meets blockchain verification. Play against AI with dice rolls you can independently verify. Doubling cube included.                 |
| Chess      | ♠    | Challenge Stockfish. Fair colors.  | Face the legendary chess engine at your chosen ELO. Your color (white/black) is determined by blockchain—no rigged starting advantages.                      |
+------------+------+------------------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------+

How It Works Page Content
🎰 The Problem

Headline: "Online games have a trust problem"

Copy:
When you play games online, you're trusting the house with everything:

    The shuffle — Did they really randomize the deck?
    The dice — Are those rolls truly random?
    The outcome — Could they manipulate results?

Traditional online casinos use server-side random number generators. You can't see them. You can't verify them. You just have to trust.

"Trust us" isn't good enough.
⛓️ The Solution: Blockchain RNG

Headline: "Randomness you can verify"

Copy:
We don't ask you to trust us. We use the Ergo blockchain as our source of randomness.

How it works:

    Before you play — We grab data from a recent Ergo block (block hash, transaction data, timestamps)
    We create a seed — This blockchain data becomes the seed for all random events in your game
    You can verify — Anyone can look up that block on Ergo Explorer and recalculate the exact same results

Why this matters:

    We can't predict future blocks (neither can anyone)
    We can't modify past blocks (that's how blockchains work)
    You don't need to trust us—you can verify yourself

🎮 How Each Game Works

[Dropdown/selector: Choose a game]

Solitaire

    What's randomized: The 52-card deck shuffle
    Blockchain source: Block hash + transaction data
    How to verify: The seed determines card order. Recalculate the shuffle from the block data.

Blackjack

    What's randomized: The 312-card shoe (6 decks)
    Blockchain source: Block hash + transaction data
    How to verify: Every card's position in the shoe is deterministic from the seed.

Yahtzee

    What's randomized: Each dice roll (5 dice, up to 3 rolls per turn)
    Blockchain source: Different block for each roll
    How to verify: Each roll links to a specific block. Recalculate dice values from block data.

Garbage

    What's randomized: Initial deal (player hand, AI hand, draw pile)
    Blockchain source: Block hash + transaction data
    How to verify: Seed determines entire card distribution.

2048

    What's randomized: Tile spawns (position 1-16, value 2 or 4)
    Blockchain source: Single anchor block for entire game
    How to verify: Each spawn's position and value derived from seed + move number.

Backgammon

    What's randomized: Dice rolls (2 dice per turn)
    Blockchain source: Different block for each roll
    How to verify: Each roll links to block data. Chi-squared test included to prove fairness.

Chess

    What's randomized: Player color assignment (white/black)
    Blockchain source: Block hash + user seed
    How to verify: Color determined by hash of block data. AI settings locked via commitment hash.

🔒 Why This is Trustless

Headline: "Verify, don't trust"

Three pillars:

1. Can't Predict
Ergo blocks are mined roughly every 2 minutes. Nobody—not us, not miners, not anyone—can predict what the next block hash will be. The randomness is real.

2. Can't Modify
Once a block is on the chain, it's permanent. We can't go back and change it. The blockchain is immutable.

3. Can Verify
Every game links to real Ergo blocks. You can look them up on Ergo Explorer, grab the data, and recalculate the results yourself. We even provide Python scripts.
🏆 Leaderboards

Headline: "Compete fairly"

Copy:
Our leaderboards track high scores across all games. But we don't just trust submissions—we validate them.

How we prevent cheating:

    Server-side replay — We replay your game history to verify the score
    Blockchain verification — We confirm your game used real block data
    Statistical analysis — We flag suspicious patterns (impossibly fast times, statistically unlikely outcomes)
    Manual review — Flagged submissions go to admin review

Scoring varies by game:

    Solitaire: Cards moved to foundation + time bonus
    Blackjack: Final chip balance
    Yahtzee: Final scorecard total
    2048: Highest tile achieved
    Backgammon: Points based on win type × difficulty
    Chess: ELO-based scoring (harder opponent = more points)
    Garbage: Win streak bonus

❓ Frequently Asked Questions

Q: Do I need to understand blockchain to play?
A: No. Just play normally. The blockchain verification happens automatically. You can verify if you want to, but you don't have to.

Q: Is this gambling?
A: No. These are free games with no real money involved. The leaderboard tracks scores, not bets.

Q: Why Ergo blockchain specifically?
A: Ergo has predictable 2-minute block times, rich transaction data for seed generation, and a public explorer anyone can use. It's purpose-built for applications like this.

Q: Can you manipulate which block gets used?
A: We use the latest block when your game starts. We can't predict future blocks, so we can't choose a favorable one. And once the game starts, we can't change it.

Q: What if the blockchain goes down?
A: Ergo is a decentralized network with high uptime. If we can't reach the blockchain, games simply won't start until it's available.

Q: How do I verify a game myself?
A: Each game has a "Verify" button that shows the block data and seed formula. We also provide downloadable Python scripts that recalculate everything independently.

Q: Is the source code available?
A: Yes. The entire platform is open source on GitHub. Review the code, verify our claims, or run your own instance.
