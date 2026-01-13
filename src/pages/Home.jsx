/**
 * Home.jsx - Landing Page
 * 
 * Welcome page with hero, features, quick start, and CTA sections.
 * Static page - no state needed.
 */

import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <header style={styles.hero}>
        <h1 style={styles.title}>🃏 Provably Fair Card Games</h1>
        <p style={styles.subtitle}>Play with blockchain-verified randomness</p>
        <p style={styles.description}>
          Every card shuffle uses public Ergo blockchain data. 
          No trust required — verify the math yourself.
        </p>
        <div style={styles.buttonGroup}>
          <Link to="/play" style={styles.primaryBtn}>Play Garbage</Link>
          <Link to="/how-it-works" style={styles.secondaryBtn}>How It Works</Link>
        </div>
      </header>

      {/* Features Grid */}
      <section style={styles.features}>
        <div style={styles.featureCard}>
          <span style={styles.icon}>🔒</span>
          <h3 style={styles.featureTitle}>Provably Fair</h3>
          <p style={styles.featureText}>
            Every shuffle uses blockchain data published before your game started. 
            No one can manipulate the outcome.
          </p>
        </div>
        <div style={styles.featureCard}>
          <span style={styles.icon}>🎮</span>
          <h3 style={styles.featureTitle}>Free to Play</h3>
          <p style={styles.featureText}>
            No signup, no wallet, no cryptocurrency needed. Just click and play.
          </p>
        </div>
        <div style={styles.featureCard}>
          <span style={styles.icon}>✓</span>
          <h3 style={styles.featureTitle}>Verifiable</h3>
          <p style={styles.featureText}>
            Anyone can independently verify the shuffle using blockchain explorers 
            and our open-source code.
          </p>
        </div>
      </section>

      {/* Quick Start */}
      <section style={styles.quickStart}>
        <h2 style={styles.sectionTitle}>How to Start Playing</h2>
        <div style={styles.steps}>
          <div style={styles.step}>
            <span style={styles.stepNumber}>1</span>
            <span>Click "Play Garbage"</span>
          </div>
          <div style={styles.step}>
            <span style={styles.stepNumber}>2</span>
            <span>Click "New Game" to shuffle</span>
          </div>
          <div style={styles.step}>
            <span style={styles.stepNumber}>3</span>
            <span>Play! Click cards to place them</span>
          </div>
          <div style={styles.step}>
            <span style={styles.stepNumber}>4</span>
            <span>After the game, verify the shuffle</span>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={styles.cta}>
        <h2 style={styles.ctaTitle}>Ready to experience provably fair gaming?</h2>
        <Link to="/play" style={styles.primaryBtn}>Start Playing Now</Link>
      </section>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '1rem'
  },
  hero: {
    textAlign: 'center',
    padding: '3rem 1rem',
    marginBottom: '2rem'
  },
  title: {
    fontSize: '2.5rem',
    margin: '0 0 0.5rem 0',
    color: '#fff'
  },
  subtitle: {
    fontSize: '1.25rem',
    color: '#a0a0ff',
    margin: '0 0 1rem 0'
  },
  description: {
    fontSize: '1rem',
    color: '#aaa',
    maxWidth: '500px',
    margin: '0 auto 1.5rem auto',
    lineHeight: 1.6
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  primaryBtn: {
    padding: '0.875rem 2rem',
    backgroundColor: '#4ade80',
    color: '#000',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    fontSize: '1rem'
  },
  secondaryBtn: {
    padding: '0.875rem 2rem',
    backgroundColor: 'transparent',
    color: '#a0a0ff',
    textDecoration: 'none',
    borderRadius: '8px',
    border: '2px solid #a0a0ff',
    fontSize: '1rem'
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '3rem'
  },
  featureCard: {
    backgroundColor: '#16213e',
    borderRadius: '12px',
    padding: '1.5rem',
    textAlign: 'center',
    border: '1px solid #2a3a5e'
  },
  icon: {
    fontSize: '2.5rem',
    display: 'block',
    marginBottom: '0.75rem'
  },
  featureTitle: {
    margin: '0 0 0.5rem 0',
    color: '#fff',
    fontSize: '1.125rem'
  },
  featureText: {
    margin: 0,
    color: '#aaa',
    fontSize: '0.9rem',
    lineHeight: 1.5
  },
  quickStart: {
    backgroundColor: '#16213e',
    borderRadius: '12px',
    padding: '2rem',
    marginBottom: '3rem',
    border: '1px solid #2a3a5e'
  },
  sectionTitle: {
    margin: '0 0 1.5rem 0',
    color: '#fff',
    textAlign: 'center'
  },
  steps: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '1rem'
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#1a1a2e',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    color: '#ccc',
    fontSize: '0.9rem'
  },
  stepNumber: {
    backgroundColor: '#4ade80',
    color: '#000',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '0.8rem'
  },
  cta: {
    textAlign: 'center',
    padding: '2rem',
    backgroundColor: '#0d1a0d',
    borderRadius: '12px',
    border: '1px solid #1a3a1a'
  },
  ctaTitle: {
    margin: '0 0 1.5rem 0',
    color: '#fff',
    fontSize: '1.25rem'
  }
};

export default Home;
