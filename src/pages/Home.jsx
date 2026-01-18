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
        <p style={styles.subtitle}>Blockchain-verified randomness you can trust</p>
        <p style={styles.description}>
          Every shuffle uses public Ergo blockchain data. 
          No trust required – verify the math yourself.
        </p>
      </header>

      {/* Game Selection Grid */}
      <section style={styles.gamesSection}>
        <h2 style={styles.sectionTitle}>Choose Your Game</h2>

        <div style={styles.gamesGrid}>
          {/* Solitaire Card */}
          <Link to="/solitaire" style={styles.gameCard}>
            <div style={styles.gameIcon}>♠️</div>
            <h3 style={styles.gameTitle}>Solitaire</h3>
            <p style={styles.gameDesc}>
              Classic Klondike solitaire. Build foundations from Ace to King by suit.
            </p>
            <div style={styles.gameStats}>
              <span>👤 Solo</span>
              <span>~10 min</span>
            </div>
            <ul style={styles.gameFeatures}>
              <li>Provably fair shuffle</li>
              <li>Undo moves available</li>
              <li>Track completion time</li>
            </ul>
            <div style={styles.playBadge}>Play Now →</div>
          </Link>

          {/* Blackjack Card */}
          <Link to="/blackjack" style={styles.gameCard}>
            <div style={styles.gameIcon}>🃏</div>
            <h3 style={styles.gameTitle}>Blackjack</h3>
            <p style={styles.gameDesc}>
              Classic casino blackjack with blockchain-verified 6-deck shoe. Hit, Stand, Double, Split – every card is verifiable!
            </p>
            <div style={styles.gameStats}>
              <span>👤 vs Dealer</span>
              <span>5 min session</span>
            </div>
            <ul style={styles.gameFeatures}>
              <li>Blackjack pays 3:2</li>
              <li>Split up to 4 hands</li>
              <li>Provably fair shoe</li>
            </ul>
            <div style={styles.playBadge}>Play Blackjack →</div>
          </Link>

          {/* Yahtzee Card */}
          <Link to="/yahtzee" style={styles.gameCard}>
            <div style={styles.gameIcon}>🎲</div>
            <h3 style={styles.gameTitle}>Yahtzee</h3>
            <p style={styles.gameDesc}>
              Classic dice game with 13 scoring categories. Roll for straights, full houses, and Yahtzee!
            </p>
            <div style={styles.gameStats}>
              <span>👤 Solo</span>
              <span>~10 min</span>
            </div>
            <ul style={styles.gameFeatures}>
              <li>Blockchain-verified dice</li>
              <li>All 13 categories</li>
              <li>Upper section bonus</li>
            </ul>
            <div style={styles.playBadge}>Play Now →</div>
          </Link>

          {/* Garbage Card */}
          <Link to="/garbage" style={styles.gameCard}>
            <div style={styles.gameIcon}>🗑️</div>
            <h3 style={styles.gameTitle}>Garbage</h3>
            <p style={styles.gameDesc}>
              Race against AI to fill positions 1-10. Jacks are wild, Queens & Kings are garbage!
            </p>
            <div style={styles.gameStats}>
              <span>👤 vs 🤖</span>
              <span>~5 min</span>
            </div>
            <ul style={styles.gameFeatures}>
              <li>3 difficulty levels</li>
              <li>Jacks are wild cards</li>
              <li>Provably fair shuffle</li>
            </ul>
            <div style={styles.playBadge}>Play Now →</div>
          </Link>

          {/* 2048 Card */}
          <Link to="/2048" style={styles.gameCard}>
            <div style={styles.gameIcon}>🔢</div>
            <h3 style={styles.gameTitle}>2048</h3>
            <p style={styles.gameDesc}>
              Slide tiles to combine matching numbers. Reach 2048 with blockchain-verified tile spawns!
            </p>
            <div style={styles.gameStats}>
              <span>👤 Solo</span>
              <span>~5 min</span>
            </div>
            <ul style={styles.gameFeatures}>
              <li>Blockchain-verified spawns</li>
              <li>Each tile position verifiable</li>
            </ul>
            <div style={styles.playBadge}>Play 2048 →</div>
          </Link>

          {/* Backgammon Card */}
          <Link to="/backgammon" style={styles.gameCard}>
            <div style={styles.gameIcon}>🎲</div>
            <h3 style={styles.gameTitle}>Backgammon</h3>
            <p style={styles.gameDesc}>
              Classic backgammon against AI with blockchain-verified dice rolls. Features doubling cube!
            </p>
            <div style={styles.gameStats}>
              <span>👤 vs 🤖</span>
              <span>~15 min</span>
            </div>
            <ul style={styles.gameFeatures}>
              <li>Provably fair dice</li>
              <li>3 difficulty levels</li>
              <li>Doubling cube</li>
            </ul>
            <div style={styles.playBadge}>Play Backgammon →</div>
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

      {/* Features Strip */}
      <section style={styles.features}>
        <div style={styles.feature}>
          <span style={styles.featureIcon}>🔒</span>
          <span style={styles.featureText}>Provably Fair</span>
        </div>
        <div style={styles.feature}>
          <span style={styles.featureIcon}>🆓</span>
          <span style={styles.featureText}>Free to Play</span>
        </div>
        <div style={styles.feature}>
          <span style={styles.featureIcon}>🔍</span>
          <span style={styles.featureText}>Verifiable</span>
        </div>
        <div style={styles.feature}>
          <span style={styles.featureIcon}>🏆</span>
          <span style={styles.featureText}>Leaderboards</span>
        </div>
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
  subtitle: {
    fontSize: '1.2rem',
    color: '#4ade80',
    margin: '0 0 1rem 0',
    fontWeight: '500'
  },
  description: {
    fontSize: '1rem',
    color: '#aaa',
    maxWidth: '500px',
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
    marginBottom: '0.75rem'
  },
  gameTitle: {
    color: '#fff',
    fontSize: '1.25rem',
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

  // Features
  features: {
    display: 'flex',
    justifyContent: 'center',
    gap: '2rem',
    flexWrap: 'wrap',
    marginTop: '3rem',
    padding: '1.5rem',
    backgroundColor: '#0d1a0d',
    borderRadius: '12px',
    border: '1px solid #1a3a1a'
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  featureIcon: {
    fontSize: '1.25rem'
  },
  featureText: {
    color: '#4ade80',
    fontSize: '0.9rem',
    fontWeight: '500'
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
