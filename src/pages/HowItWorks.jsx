/**
 * HowItWorks.jsx - Educational Page
 * 
 * Explains provably fair gaming, blockchain RNG, and verification process.
 * Static content - no state needed.
 */

import React from 'react';
import { Link } from 'react-router-dom';

function HowItWorks() {
  return (
    <div style={styles.container}>
      {/* Page Title */}
      <header style={styles.header}>
        <h1 style={styles.title}>How Provably Fair Gaming Works</h1>
        <p style={styles.subtitle}>The math behind blockchain-verified randomness</p>
      </header>

      {/* The Problem */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>🎰 The Problem</h2>
        <p style={styles.text}>
          <strong>Traditional online games require trust.</strong> When you play cards online, 
          you must trust that the company didn't rig the shuffle. There's no way to verify 
          if the randomness was actually fair.
        </p>
        <p style={styles.text}>
          History is full of examples where this trust was violated — from rigged online poker 
          rooms to manipulated casino games. Even honest operators can't prove their innocence.
        </p>
      </section>

      {/* The Solution */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>⛓️ The Solution: Blockchain RNG</h2>
        <p style={styles.text}>
          <strong>Blockchain provides public, unchangeable data.</strong> Every few minutes, 
          the Ergo blockchain publishes a new block with a unique hash — a random-looking 
          string of characters determined by miners.
        </p>
        <ul style={styles.list}>
          <li>Anyone can access it (public)</li>
          <li>Published before your game starts</li>
          <li>Cannot be changed retroactively (immutable)</li>
          <li>We don't control it (trustless)</li>
        </ul>
      </section>

      {/* How It Works - Steps */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>🔧 How It Works</h2>
        
        {/* Step 1 */}
        <div style={styles.step}>
          <div style={styles.stepHeader}>
            <span style={styles.stepNumber}>1</span>
            <h3 style={styles.stepTitle}>You Click "New Game"</h3>
          </div>
          <p style={styles.stepText}>
            Our system fetches the latest Ergo blockchain block. This block was published 
            minutes ago by miners — we have no control over its contents.
          </p>
          <div style={styles.codeBlock}>
            Block #1,247,842<br/>
            Hash: 9f8e7d6c5b4a3...
          </div>
        </div>

        {/* Step 2 */}
        <div style={styles.step}>
          <div style={styles.stepHeader}>
            <span style={styles.stepNumber}>2</span>
            <h3 style={styles.stepTitle}>Generate Random Seed</h3>
          </div>
          <p style={styles.stepText}>
            We combine the block hash with your unique game ID using a cryptographic hash. 
            This creates a deterministic seed — the same inputs always produce the same output.
          </p>
          <div style={styles.codeBlock}>
            seed = HASH(blockHash + gameId)<br/>
            seed = HASH("9f8e7d..." + "game-abc123")<br/>
            seed = "7a2b9c4d..."
          </div>
        </div>

        {/* Step 3 */}
        <div style={styles.step}>
          <div style={styles.stepHeader}>
            <span style={styles.stepNumber}>3</span>
            <h3 style={styles.stepTitle}>Shuffle the Deck</h3>
          </div>
          <p style={styles.stepText}>
            Using the Fisher-Yates algorithm, we shuffle 52 cards. The seed provides 
            pseudo-random numbers. Same seed = same shuffle, every time, guaranteed.
          </p>
          <div style={styles.diagram}>
            <span style={styles.diagramLabel}>Unshuffled:</span>
            <span style={styles.diagramContent}>A♠ 2♠ 3♠ ... K♣</span>
            <span style={styles.diagramArrow}>↓ Fisher-Yates + Seed</span>
            <span style={styles.diagramLabel}>Shuffled:</span>
            <span style={styles.diagramContent}>7♣ K♠ 3♦ A♥ 9♠ ...</span>
          </div>
        </div>

        {/* Step 4 */}
        <div style={styles.step}>
          <div style={styles.stepHeader}>
            <span style={styles.stepNumber}>4</span>
            <h3 style={styles.stepTitle}>Play the Game</h3>
          </div>
          <p style={styles.stepText}>
            Cards are dealt from the shuffled deck. The game plays normally — you make 
            decisions, the AI responds. The shuffle was locked in before play began.
          </p>
        </div>

        {/* Step 5 */}
        <div style={styles.step}>
          <div style={styles.stepHeader}>
            <span style={styles.stepNumber}>5</span>
            <h3 style={styles.stepTitle}>Verify Afterwards</h3>
          </div>
          <p style={styles.stepText}>
            After the game, you can verify everything. Look up the block on Ergo Explorer, 
            re-run our shuffle algorithm, and confirm the deck matches. Math doesn't lie.
          </p>
          <div style={styles.codeBlock}>
            ✓ Block exists on blockchain<br/>
            ✓ Hash matches our record<br/>
            ✓ Re-shuffled deck is identical<br/>
            ✓ VERIFIED FAIR
          </div>
        </div>
      </section>

      {/* Why Trustless */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>🔒 Why This is Trustless</h2>
        <div style={styles.trustGrid}>
          <div style={styles.trustItem}>
            <strong>Block published first</strong>
            <span>Hash existed before your game — can't be manipulated</span>
          </div>
          <div style={styles.trustItem}>
            <strong>Deterministic algorithm</strong>
            <span>Anyone can reproduce the exact shuffle</span>
          </div>
          <div style={styles.trustItem}>
            <strong>Open source code</strong>
            <span>No hidden tricks — read it yourself</span>
          </div>
          <div style={styles.trustItem}>
            <strong>Public blockchain</strong>
            <span>Permanent, accessible record</span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>❓ Frequently Asked Questions</h2>
        
        <div style={styles.faq}>
          <h4 style={styles.question}>Do I need cryptocurrency?</h4>
          <p style={styles.answer}>No. We only read public blockchain data, which is completely free.</p>
        </div>
        
        <div style={styles.faq}>
          <h4 style={styles.question}>Do I need a wallet?</h4>
          <p style={styles.answer}>No. We never make transactions — just reading public data.</p>
        </div>
        
        <div style={styles.faq}>
          <h4 style={styles.question}>What blockchain do you use?</h4>
          <p style={styles.answer}>
            Ergo blockchain. It's fast, reliable, and free to read via public APIs.
          </p>
        </div>
        
        <div style={styles.faq}>
          <h4 style={styles.question}>Can this be rigged?</h4>
          <p style={styles.answer}>
            No. The block was published by independent miners before your game started. 
            We have no control over what hash they produce.
          </p>
        </div>
        
        <div style={styles.faq}>
          <h4 style={styles.question}>How can I verify myself?</h4>
          <p style={styles.answer}>
            Use the <a href="https://explorer.ergoplatform.com" target="_blank" 
            rel="noopener noreferrer" style={styles.link}>Ergo Explorer</a> to find the block, 
            then run our open-source shuffle algorithm with the same inputs.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section style={styles.cta}>
        <h2 style={styles.ctaTitle}>Try It Yourself</h2>
        <p style={styles.ctaText}>
          Experience provably fair gaming firsthand. Play a game, then verify the shuffle.
        </p>
        <div style={styles.ctaButtons}>
          <Link to="/play" style={styles.primaryBtn}>Play Garbage</Link>
          <a 
            href="https://github.com/yourusername/provably-fair-games" 
            target="_blank" 
            rel="noopener noreferrer"
            style={styles.secondaryBtn}
          >
            View Code on GitHub
          </a>
        </div>
      </section>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '1rem'
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem'
  },
  title: {
    fontSize: '2rem',
    margin: '0 0 0.5rem 0',
    color: '#fff'
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#a0a0ff',
    margin: 0
  },
  section: {
    backgroundColor: '#16213e',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    border: '1px solid #2a3a5e'
  },
  sectionTitle: {
    margin: '0 0 1rem 0',
    color: '#fff',
    fontSize: '1.25rem'
  },
  text: {
    color: '#ccc',
    lineHeight: 1.7,
    margin: '0 0 1rem 0'
  },
  list: {
    color: '#ccc',
    lineHeight: 1.8,
    paddingLeft: '1.5rem',
    margin: 0
  },
  step: {
    backgroundColor: '#1a1a2e',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem'
  },
  stepHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.5rem'
  },
  stepNumber: {
    backgroundColor: '#4ade80',
    color: '#000',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold'
  },
  stepTitle: {
    margin: 0,
    color: '#fff',
    fontSize: '1rem'
  },
  stepText: {
    color: '#aaa',
    margin: '0 0 0.75rem 0',
    fontSize: '0.9rem',
    lineHeight: 1.6
  },
  codeBlock: {
    backgroundColor: '#0d1a0d',
    padding: '0.75rem',
    borderRadius: '6px',
    fontFamily: 'monospace',
    fontSize: '0.85rem',
    color: '#4ade80',
    lineHeight: 1.6
  },
  diagram: {
    backgroundColor: '#0d1a0d',
    padding: '1rem',
    borderRadius: '6px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
    fontFamily: 'monospace',
    fontSize: '0.85rem'
  },
  diagramLabel: {
    color: '#888'
  },
  diagramContent: {
    color: '#fff'
  },
  diagramArrow: {
    color: '#4ade80',
    padding: '0.5rem 0'
  },
  trustGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem'
  },
  trustItem: {
    backgroundColor: '#1a1a2e',
    padding: '1rem',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    color: '#4ade80',
    fontSize: '0.9rem'
  },
  faq: {
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #2a3a5e'
  },
  question: {
    margin: '0 0 0.5rem 0',
    color: '#fff'
  },
  answer: {
    margin: 0,
    color: '#aaa',
    lineHeight: 1.6
  },
  link: {
    color: '#60a5fa'
  },
  cta: {
    textAlign: 'center',
    backgroundColor: '#0d1a0d',
    borderRadius: '12px',
    padding: '2rem',
    border: '1px solid #1a3a1a'
  },
  ctaTitle: {
    margin: '0 0 0.5rem 0',
    color: '#fff'
  },
  ctaText: {
    color: '#aaa',
    margin: '0 0 1.5rem 0'
  },
  ctaButtons: {
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
    fontWeight: 'bold'
  },
  secondaryBtn: {
    padding: '0.875rem 2rem',
    backgroundColor: 'transparent',
    color: '#a0a0ff',
    textDecoration: 'none',
    borderRadius: '8px',
    border: '2px solid #a0a0ff'
  }
};

export default HowItWorks;
