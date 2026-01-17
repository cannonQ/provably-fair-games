/**
 * HowItWorks.jsx - Educational Page
 * 
 * Explains provably fair gaming, blockchain RNG, verification, and leaderboards.
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
          the Ergo blockchain publishes a new block with unique data determined by miners.
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
            Our system fetches the latest Ergo blockchain block, including transaction data. 
            This was published minutes ago by miners — we have no control over its contents.
          </p>
          <div style={styles.codeBlock}>
            Block #1,700,090<br/>
            Block Hash: 3f27eb915a...3510a1e0ba<br/>
            TX Hash: 9c44d92897...f44a02b84f<br/>
            TX Index: 5 of 6<br/>
            Timestamp: 1768450201667
          </div>
        </div>

        {/* Step 2 */}
        <div style={styles.step}>
          <div style={styles.stepHeader}>
            <span style={styles.stepNumber}>2</span>
            <h3 style={styles.stepTitle}>Generate Random Seed (Anti-Spoofing)</h3>
          </div>
          <p style={styles.stepText}>
            We combine <strong>5 independent inputs</strong> using a cryptographic hash. 
            This makes prediction virtually impossible — an attacker would need to control 
            the blockchain, predict the timestamp, AND know your game ID.
          </p>
          <div style={styles.codeBlock}>
            seed = HASH(blockHash + txHash + timestamp + gameId + txIndex)<br/><br/>
            5 inputs = virtually impossible to manipulate
          </div>
          <div style={styles.infoBox}>
            <strong>🛡️ Why 5 inputs?</strong><br/>
            Block hash alone could theoretically be predicted. By adding transaction hash, 
            timestamp, game ID, and TX index, we create unpredictable entropy that no one 
            can control or anticipate.
          </div>
        </div>

        {/* Step 3 */}
        <div style={styles.step}>
          <div style={styles.stepHeader}>
            <span style={styles.stepNumber}>3</span>
            <h3 style={styles.stepTitle}>Generate Game Randomness</h3>
          </div>
          <p style={styles.stepText}>
            Using cryptographic algorithms, we generate verifiable random outcomes. For card games,
            we use Fisher-Yates shuffle. For 2048, we determine tile spawn positions. For Backgammon,
            we generate dice rolls. Same seed = same result, every time, guaranteed.
          </p>
          <div style={styles.diagram}>
            <span style={styles.diagramLabel}>Card Games:</span>
            <span style={styles.diagramContent}>A♠ 2♠ 3♠ ... → 7♣ K♠ 3♦ A♥ ...</span>
            <span style={styles.diagramArrow}>↓ Blockchain Seed</span>
            <span style={styles.diagramLabel}>2048 / Backgammon:</span>
            <span style={styles.diagramContent}>Tile position & value / Dice rolls</span>
          </div>
        </div>

        {/* Step 4 */}
        <div style={styles.step}>
          <div style={styles.stepHeader}>
            <span style={styles.stepNumber}>4</span>
            <h3 style={styles.stepTitle}>Play the Game</h3>
          </div>
          <p style={styles.stepText}>
            Cards are dealt from the shuffled deck. In 2048, every tile spawn uses fresh blockchain
            data. In Backgammon, every dice roll is blockchain-verified. You make decisions, the
            AI responds — all randomness is locked in and verifiable.
          </p>
        </div>

        {/* Step 5 */}
        <div style={styles.step}>
          <div style={styles.stepHeader}>
            <span style={styles.stepNumber}>5</span>
            <h3 style={styles.stepTitle}>Submit Your Score</h3>
          </div>
          <p style={styles.stepText}>
            When the game ends (win or lose), you can submit your score to the leaderboard. 
            Your result is linked to the blockchain proof — anyone can verify your game was fair.
          </p>
          <div style={styles.codeBlock}>
            Game ID: SOL-1768455876-x7k2<br/>
            Cards to Foundation: 42/52<br/>
            Time: 03:45<br/>
            Moves: 67<br/>
            ✓ Submitted to Leaderboard
          </div>
        </div>

        {/* Step 6 */}
        <div style={styles.step}>
          <div style={styles.stepHeader}>
            <span style={styles.stepNumber}>6</span>
            <h3 style={styles.stepTitle}>Verify Afterwards</h3>
          </div>
          <p style={styles.stepText}>
            Anyone can verify any game on the leaderboard. Look up the block on Ergo Explorer, 
            confirm the transaction, re-run our shuffle algorithm, and verify the deck matches.
          </p>
          <div style={styles.codeBlock}>
            ✓ Block exists on blockchain<br/>
            ✓ Transaction hash matches<br/>
            ✓ TX index = timestamp % txCount<br/>
            ✓ Re-shuffled deck is identical<br/>
            ✓ VERIFIED FAIR
          </div>
        </div>
      </section>

      {/* Leaderboards */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>🏆 Leaderboards</h2>
        <p style={styles.text}>
          Every game you play can be submitted to our public leaderboard. Unlike traditional 
          leaderboards, every entry is verifiable — click "Verify" on any score to confirm 
          the game was provably fair.
        </p>
        <div style={styles.leaderboardDemo}>
          <div style={styles.lbHeader}>
            <span>Rank</span>
            <span>Player</span>
            <span>Cards</span>
            <span>Time</span>
            <span>Proof</span>
          </div>
          <div style={styles.lbRow}>
            <span>🥇</span>
            <span>CryptoAce</span>
            <span style={{color: '#4ade80'}}>52/52 ✓</span>
            <span>2:34</span>
            <span style={{color: '#64b5f6'}}>Verify</span>
          </div>
          <div style={styles.lbRow}>
            <span>🥈</span>
            <span>CardShark</span>
            <span style={{color: '#4ade80'}}>52/52 ✓</span>
            <span>3:12</span>
            <span style={{color: '#64b5f6'}}>Verify</span>
          </div>
          <div style={styles.lbRow}>
            <span>#3</span>
            <span>Anonymous</span>
            <span>48/52</span>
            <span>4:05</span>
            <span style={{color: '#64b5f6'}}>Verify</span>
          </div>
        </div>
        <p style={styles.textSmall}>
          <strong>Ranking:</strong> Cards to Foundation → Time → Moves<br/>
          Both wins and losses can be submitted!
        </p>
      </section>

      {/* Why Trustless */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>🔒 Why This is Trustless</h2>
        <div style={styles.trustGrid}>
          <div style={styles.trustItem}>
            <strong>Block published first</strong>
            <span>Data existed before your game — can't be manipulated</span>
          </div>
          <div style={styles.trustItem}>
            <strong>5 independent inputs</strong>
            <span>Impossible to predict or control all factors</span>
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
          <div style={styles.trustItem}>
            <strong>Verifiable leaderboard</strong>
            <span>Every score can be independently verified</span>
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
            No. The block and transaction were published by independent miners before your game started. 
            We combine 5 inputs making prediction virtually impossible.
          </p>
        </div>
        
        <div style={styles.faq}>
          <h4 style={styles.question}>What are the 5 anti-spoofing inputs?</h4>
          <p style={styles.answer}>
            Block hash, transaction hash, block timestamp, your game ID, and the transaction index. 
            All combined cryptographically to create the shuffle seed.
          </p>
        </div>
        
        <div style={styles.faq}>
          <h4 style={styles.question}>How can I verify myself?</h4>
          <p style={styles.answer}>
            Use the <a href="https://explorer.ergoplatform.com" target="_blank" 
            rel="noopener noreferrer" style={styles.link}>Ergo Explorer</a> to find the block and transaction, 
            then run our open-source shuffle algorithm with the same inputs.
          </p>
        </div>

        <div style={styles.faq}>
          <h4 style={styles.question}>Can I submit losing games?</h4>
          <p style={styles.answer}>
            Yes! The leaderboard ranks by cards to foundation, time, and moves. Even if you don't win, 
            you can still compete for the best partial completion.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section style={styles.cta}>
        <h2 style={styles.ctaTitle}>Try It Yourself</h2>
        <p style={styles.ctaText}>
          Experience provably fair gaming firsthand. Play a game, submit your score, then verify the randomness.
        </p>
        <div style={styles.ctaButtons}>
          <Link to="/solitaire" style={styles.primaryBtn}>Play Solitaire</Link>
          <Link to="/blackjack" style={styles.primaryBtn}>Play Blackjack</Link>
          <Link to="/yahtzee" style={styles.primaryBtn}>Play Yahtzee</Link>
          <Link to="/2048" style={styles.primaryBtn}>Play 2048</Link>
          <Link to="/backgammon" style={styles.primaryBtn}>Play Backgammon</Link>
          <Link to="/garbage" style={styles.primaryBtn}>Play Garbage</Link>
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
  textSmall: {
    color: '#888',
    fontSize: '0.85rem',
    lineHeight: 1.6,
    margin: '1rem 0 0 0'
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
  infoBox: {
    backgroundColor: '#1a2a1a',
    border: '1px solid #2a4a2a',
    padding: '0.75rem',
    borderRadius: '6px',
    marginTop: '0.75rem',
    fontSize: '0.85rem',
    color: '#aaa',
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
  
  // Leaderboard demo
  leaderboardDemo: {
    backgroundColor: '#1a1a2e',
    borderRadius: '8px',
    overflow: 'hidden',
    fontSize: '0.85rem'
  },
  lbHeader: {
    display: 'grid',
    gridTemplateColumns: '50px 1fr 80px 60px 60px',
    padding: '0.5rem 0.75rem',
    backgroundColor: '#0d1117',
    color: '#888',
    fontSize: '0.75rem',
    textTransform: 'uppercase'
  },
  lbRow: {
    display: 'grid',
    gridTemplateColumns: '50px 1fr 80px 60px 60px',
    padding: '0.5rem 0.75rem',
    borderBottom: '1px solid #2a3a5e',
    color: '#ccc'
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
  }
};

export default HowItWorks;
