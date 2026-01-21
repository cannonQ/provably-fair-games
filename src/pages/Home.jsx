/**
 * Home.jsx - Landing Page
 * 
 * Welcome page with game selection cards.
 */

import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <header style={styles.hero}>
        <h1 style={styles.title}>🃏 Provably Fair Games</h1>
        <p style={styles.tagline}>Pick your card. Prove your luck.</p>
        <p style={styles.subtitle}>
          7 classic games. Zero trust required. Every random outcome anchored to the Ergo blockchain.
        </p>
      </header>

      {/* Game Selection Grid */}
      <section style={styles.gamesSection}>
        <h2 style={styles.sectionTitle}>Choose Your Game</h2>

        <div style={styles.gamesGrid}>
          {/* Solitaire Card */}
          <Link to="/solitaire" style={styles.gameCard}>
            <div style={styles.gameIcon}>♥</div>
            <h3 style={styles.gameTitle}>Solitaire</h3>
            <p style={styles.gameTagline}>Blockchain-shuffled Klondike</p>
            <p style={styles.gameDesc}>
              Classic Klondike solitaire with a 52-card deck shuffled using Ergo blockchain randomness.
              Every card placement is provably fair—verify the shuffle yourself.
            </p>
            <div style={styles.gameStats}>
              <span>👤 Solo</span>
              <span>~10 min</span>
            </div>
            <div style={styles.playBadge}>Play Now →</div>
          </Link>

          {/* Blackjack Card */}
          <Link to="/blackjack" style={styles.gameCard}>
            <div style={styles.gameIcon}>♥</div>
            <h3 style={styles.gameTitle}>Blackjack</h3>
            <p style={styles.gameTagline}>Beat the house. Verify every card.</p>
            <p style={styles.gameDesc}>
              Six-deck shoe, real casino rules. The entire shoe order is determined by blockchain data before you place your first bet. Check every card dealt.
            </p>
            <div style={styles.gameStats}>
              <span>👤 vs Dealer</span>
              <span>5 min session</span>
            </div>
            <div style={styles.playBadge}>Play Blackjack →</div>
          </Link>

          {/* Yahtzee Card */}
          <Link to="/yahtzee" style={styles.gameCard}>
            <div style={styles.gameIcon}>♦</div>
            <h3 style={styles.gameTitle}>Yahtzee</h3>
            <p style={styles.gameTagline}>Roll the dice. Prove the rolls.</p>
            <p style={styles.gameDesc}>
              Classic five-dice scoring. Every roll is derived from Ergo block data—no hidden RNG. Chase that Yahtzee with full transparency.
            </p>
            <div style={styles.gameStats}>
              <span>👤 Solo</span>
              <span>~10 min</span>
            </div>
            <div style={styles.playBadge}>Play Now →</div>
          </Link>

          {/* Garbage Card */}
          <Link to="/garbage" style={styles.gameCard}>
            <div style={styles.gameIcon}>♥</div>
            <h3 style={styles.gameTitle}>Garbage</h3>
            <p style={styles.gameTagline}>Race to clear your hand</p>
            <p style={styles.gameDesc}>
              Fast-paced card game against AI. Fill your tableau from Ace to 10 before your opponent. Wild cards and blockchain-verified deals.
            </p>
            <div style={styles.gameStats}>
              <span>👤 vs 🤖</span>
              <span>~5 min</span>
            </div>
            <div style={styles.playBadge}>Play Now →</div>
          </Link>

          {/* 2048 Card */}
          <Link to="/2048" style={styles.gameCard}>
            <div style={styles.gameIcon}>♣</div>
            <h3 style={styles.gameTitle}>2048</h3>
            <p style={styles.gameTagline}>Slide. Merge. Verify.</p>
            <p style={styles.gameDesc}>
              The addictive tile-merger with a twist: every new tile spawn (position and value) comes from blockchain randomness. Same challenge, provable fairness.
            </p>
            <div style={styles.gameStats}>
              <span>👤 Solo</span>
              <span>~5 min</span>
            </div>
            <div style={styles.playBadge}>Play 2048 →</div>
          </Link>

          {/* Backgammon Card */}
          <Link to="/backgammon" style={styles.gameCard}>
            <div style={styles.gameIcon}>♠</div>
            <h3 style={styles.gameTitle}>Backgammon</h3>
            <p style={styles.gameTagline}>Ancient game. Modern proof.</p>
            <p style={styles.gameDesc}>
              5,000 years of strategy meets blockchain verification. Play against AI with dice rolls you can independently verify. Doubling cube included.
            </p>
            <div style={styles.gameStats}>
              <span>👤 vs 🤖</span>
              <span>~15 min</span>
            </div>
            <div style={styles.playBadge}>Play Backgammon →</div>
          </Link>

          {/* Chess Card */}
          <Link to="/chess" style={styles.gameCard}>
            <div style={styles.gameIcon}>♠</div>
            <h3 style={styles.gameTitle}>Chess</h3>
            <p style={styles.gameTagline}>Challenge Stockfish. Fair colors.</p>
            <p style={styles.gameDesc}>
              Face the legendary chess engine at your chosen ELO. Your color (white/black) is determined by blockchain—no rigged starting advantages.
            </p>
            <div style={styles.gameStats}>
              <span>👤 vs 🤖</span>
              <span>~20 min</span>
            </div>
            <div style={styles.playBadge}>Play Chess →</div>
          </Link>

          {/* Coming Soon Card */}
          <div style={styles.gameCardDisabled}>
            <div style={styles.gameIcon}>🎴</div>
            <h3 style={styles.gameTitle}>More Games</h3>
            <p style={styles.gameDesc}>
              Poker, Baccarat, and more coming soon!
            </p>
            <div style={styles.comingSoon}>Coming Soon</div>
          </div>
        </div>
      </section>

      {/* Footer Copy */}
      <section style={styles.footerCopy}>
        <p style={styles.footerPrimary}>House edge: 0%. Trust required: 0%.</p>
        <p style={styles.footerSecondary}>Verify any game yourself on Ergo Explorer</p>
      </section>

      {/* How It Works Brief */}
      <section style={styles.howItWorks}>
        <h2 style={styles.sectionTitle}>How It Works</h2>
        <div style={styles.steps}>
          <div style={styles.step}>
            <span style={styles.stepNum}>1</span>
            <span>Click "New Game"</span>
          </div>
          <div style={styles.stepArrow}>→</div>
          <div style={styles.step}>
            <span style={styles.stepNum}>2</span>
            <span>Blockchain shuffles deck</span>
          </div>
          <div style={styles.stepArrow}>→</div>
          <div style={styles.step}>
            <span style={styles.stepNum}>3</span>
            <span>Play & submit score</span>
          </div>
          <div style={styles.stepArrow}>→</div>
          <div style={styles.step}>
            <span style={styles.stepNum}>4</span>
            <span>Verify the shuffle</span>
          </div>
        </div>
        <Link to="/how-it-works" style={styles.learnMore}>
          Learn more about provably fair gaming →
        </Link>
      </section>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '1rem'
  },
  hero: {
    textAlign: 'center',
    padding: '2rem 1rem 1rem'
  },
  title: {
    fontSize: '2.5rem',
    margin: '0 0 0.5rem 0',
    color: '#fff'
  },
  tagline: {
    fontSize: '1.5rem',
    color: '#4ade80',
    margin: '0 0 0.75rem 0',
    fontWeight: '600'
  },
  subtitle: {
    fontSize: '1rem',
    color: '#aaa',
    maxWidth: '600px',
    margin: '0 auto',
    lineHeight: 1.6
  },

  // Games Section
  gamesSection: {
    marginTop: '2rem'
  },
  sectionTitle: {
    textAlign: 'center',
    color: '#fff',
    fontSize: '1.25rem',
    marginBottom: '1.5rem'
  },
  gamesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem'
  },
  gameCard: {
    backgroundColor: '#16213e',
    borderRadius: '16px',
    padding: '1.5rem',
    textDecoration: 'none',
    border: '2px solid #2a3a5e',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    ':hover': {
      borderColor: '#4ade80'
    }
  },
  gameCardDisabled: {
    backgroundColor: '#16213e',
    borderRadius: '16px',
    padding: '1.5rem',
    border: '2px solid #2a3a5e',
    opacity: 0.6,
    display: 'flex',
    flexDirection: 'column'
  },
  gameIcon: {
    fontSize: '3rem',
    marginBottom: '0.75rem',
    color: '#4ade80' // Green to match theme and be visible
  },
  gameTitle: {
    color: '#fff',
    fontSize: '1.25rem',
    margin: '0 0 0.25rem 0'
  },
  gameTagline: {
    color: '#4ade80',
    fontSize: '0.85rem',
    fontWeight: '500',
    margin: '0 0 0.5rem 0'
  },
  gameDesc: {
    color: '#aaa',
    fontSize: '0.9rem',
    lineHeight: 1.5,
    margin: '0 0 1rem 0',
    flex: 1
  },
  gameStats: {
    display: 'flex',
    gap: '1rem',
    color: '#666',
    fontSize: '0.85rem',
    marginBottom: '1rem'
  },
  gameFeatures: {
    color: '#4ade80',
    fontSize: '0.8rem',
    margin: '0 0 1rem 1rem',
    padding: 0,
    lineHeight: 1.8
  },
  playBadge: {
    backgroundColor: '#4ade80',
    color: '#000',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    textAlign: 'center'
  },
  comingSoon: {
    backgroundColor: '#333',
    color: '#888',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    fontSize: '0.9rem',
    textAlign: 'center'
  },

  // Footer Copy
  footerCopy: {
    textAlign: 'center',
    marginTop: '3rem',
    padding: '2rem 1rem',
    backgroundColor: '#0f172a',
    borderRadius: '12px',
    border: '1px solid #334155'
  },
  footerPrimary: {
    fontSize: '1.25rem',
    color: '#4ade80',
    fontWeight: 'bold',
    margin: '0 0 0.5rem 0'
  },
  footerSecondary: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    margin: 0
  },

  // How It Works
  howItWorks: {
    marginTop: '2rem',
    backgroundColor: '#16213e',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid #2a3a5e'
  },
  steps: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
    marginBottom: '1rem'
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#1a1a2e',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    color: '#ccc',
    fontSize: '0.85rem'
  },
  stepNum: {
    backgroundColor: '#4ade80',
    color: '#000',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '0.75rem'
  },
  stepArrow: {
    color: '#4ade80',
    fontSize: '1rem'
  },
  learnMore: {
    display: 'block',
    textAlign: 'center',
    color: '#64b5f6',
    textDecoration: 'none',
    fontSize: '0.9rem'
  }
};

export default Home;
