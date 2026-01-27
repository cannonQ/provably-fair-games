/**
 * LeaderboardPage.jsx - Leaderboard Landing Page
 * 
 * Shows leaderboards for all games with scoring explanation.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Leaderboard from '../components/Leaderboard';

function LeaderboardPage() {
  const [activeGame, setActiveGame] = useState('solitaire');

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>🏆 Leaderboards</h1>
        <p style={styles.subtitle}>Cryptographically verified rankings • Commit-reveal protocol</p>
      </header>

      {/* Game Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveGame('solitaire')}
          style={activeGame === 'solitaire' ? styles.tabActive : styles.tab}
        >
          ♠️ Solitaire
        </button>
        <button
          onClick={() => setActiveGame('blackjack')}
          style={activeGame === 'blackjack' ? styles.tabActive : styles.tab}
        >
          ♠️ Blackjack
        </button>
        <button
          onClick={() => setActiveGame('yahtzee')}
          style={activeGame === 'yahtzee' ? styles.tabActive : styles.tab}
        >
          🎲 Yahtzee
        </button>
        <button
          onClick={() => setActiveGame('2048')}
          style={activeGame === '2048' ? styles.tabActive : styles.tab}
        >
          🔢 2048
        </button>
        <button
          onClick={() => setActiveGame('backgammon')}
          style={activeGame === 'backgammon' ? styles.tabActive : styles.tab}
        >
          🎲 Backgammon
        </button>
        <button
          onClick={() => setActiveGame('chess')}
          style={activeGame === 'chess' ? styles.tabActive : styles.tab}
        >
          ♟️ Chess
        </button>
      </div>

      {/* Leaderboard */}
      <Leaderboard game={activeGame} />

      {/* Scoring Explanation */}
      <section style={styles.scoringSection}>
        <h2 style={styles.sectionTitle}>📊 How Scoring Works</h2>

        {activeGame === 'solitaire' && (
          <div style={styles.scoringContent}>
            <div style={styles.rankingBox}>
              <h3 style={styles.rankingTitle}>Ranking Order</h3>
              <div style={styles.rankingList}>
                <div style={styles.rankingItem}>
                  <span style={styles.rankNum}>1st</span>
                  <span style={styles.rankLabel}>Cards to Foundation</span>
                  <span style={styles.rankDesc}>More cards = higher rank (max 52)</span>
                </div>
                <div style={styles.rankingItem}>
                  <span style={styles.rankNum}>2nd</span>
                  <span style={styles.rankLabel}>Time</span>
                  <span style={styles.rankDesc}>Faster completion = higher rank</span>
                </div>
                <div style={styles.rankingItem}>
                  <span style={styles.rankNum}>3rd</span>
                  <span style={styles.rankLabel}>Moves</span>
                  <span style={styles.rankDesc}>Fewer moves = higher rank</span>
                </div>
              </div>
            </div>

            <div style={styles.infoGrid}>
              <div style={styles.infoCard}>
                <h4 style={styles.infoTitle}>✔ Wins & Losses Count</h4>
                <p style={styles.infoText}>
                  You don't have to win to compete! Someone with 48/52 cards in 3 minutes 
                  ranks higher than someone with 40/52 cards regardless of time.
                </p>
              </div>
              <div style={styles.infoCard}>
                <h4 style={styles.infoTitle}>🎯 Perfect Game</h4>
                <p style={styles.infoText}>
                  52/52 cards + fastest time + fewest moves = #1 rank. 
                  Multiple winners are separated by speed and efficiency.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeGame === 'blackjack' && (
          <div style={styles.scoringContent}>
            <div style={styles.rankingBox}>
              <h3 style={styles.rankingTitle}>Ranking Order</h3>
              <div style={styles.rankingList}>
                <div style={styles.rankingItem}>
                  <span style={styles.rankNum}>1st</span>
                  <span style={styles.rankLabel}>Final Balance</span>
                  <span style={styles.rankDesc}>Higher chip balance = higher rank</span>
                </div>
                <div style={styles.rankingItem}>
                  <span style={styles.rankNum}>2nd</span>
                  <span style={styles.rankLabel}>Hands Won</span>
                  <span style={styles.rankDesc}>More hands won = higher rank</span>
                </div>
                <div style={styles.rankingItem}>
                  <span style={styles.rankNum}>3rd</span>
                  <span style={styles.rankLabel}>Blackjacks</span>
                  <span style={styles.rankDesc}>More blackjacks = higher rank</span>
                </div>
              </div>
            </div>

            <div style={styles.infoGrid}>
              <div style={styles.infoCard}>
                <h4 style={styles.infoTitle}>💰 Session-Based Play</h4>
                <p style={styles.infoText}>
                  Start with $1,000 in chips. Play as many hands as you want
                  within your 5-minute session. Cash out anytime or extend once.
                </p>
              </div>
              <div style={styles.infoCard}>
                <h4 style={styles.infoTitle}>🃏 Classic Rules</h4>
                <p style={styles.infoText}>
                  Blackjack pays 3:2. Insurance pays 2:1. Dealer stands on 17.
                  Double down and split available.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeGame === 'yahtzee' && (
          <div style={styles.scoringContent}>
            <div style={styles.rankingBox}>
              <h3 style={styles.rankingTitle}>Ranking Order</h3>
              <div style={styles.rankingList}>
                <div style={styles.rankingItem}>
                  <span style={styles.rankNum}>1st</span>
                  <span style={styles.rankLabel}>Total Score</span>
                  <span style={styles.rankDesc}>Higher score = higher rank (max ~400)</span>
                </div>
                <div style={styles.rankingItem}>
                  <span style={styles.rankNum}>2nd</span>
                  <span style={styles.rankLabel}>Time</span>
                  <span style={styles.rankDesc}>Faster completion = higher rank</span>
                </div>
              </div>
            </div>

            <div style={styles.infoGrid}>
              <div style={styles.infoCard}>
                <h4 style={styles.infoTitle}>🎲 Scoring Categories</h4>
                <p style={styles.infoText}>
                  <strong>Upper Section:</strong> Ones through Sixes (sum of matching dice)<br/>
                  <strong>Upper Bonus:</strong> +35 if upper total ≥ 63<br/>
                  <strong>Lower Section:</strong> Three/Four of Kind, Full House (25),
                  Small Straight (30), Large Straight (40), Yahtzee (50), Chance
                </p>
              </div>
              <div style={styles.infoCard}>
                <h4 style={styles.infoTitle}>🎯 Yahtzee Bonus</h4>
                <p style={styles.infoText}>
                  Roll multiple Yahtzees? After your first Yahtzee (50 pts),
                  each additional Yahtzee earns +100 bonus points!
                </p>
              </div>
              <div style={styles.infoCard}>
                <h4 style={styles.infoTitle}>🔒 Provably Fair Dice</h4>
                <p style={styles.infoText}>
                  Every dice roll uses cryptographic commit-reveal protocol.
                  Server commits secret hash before fetching blockchain data,
                  then combines both for verifiable randomness.
                </p>
              </div>
            </div>

            <div style={styles.example}>
              <h4 style={styles.exampleTitle}>Example High Score Breakdown:</h4>
              <table style={styles.exampleTable}>
                <thead>
                  <tr>
                    <th>Section</th>
                    <th>Score</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Upper Section</td>
                    <td>63</td>
                    <td>Hit bonus threshold</td>
                  </tr>
                  <tr>
                    <td>Upper Bonus</td>
                    <td style={{color: '#4ade80'}}>+35</td>
                    <td>≥63 bonus</td>
                  </tr>
                  <tr>
                    <td>Lower Section</td>
                    <td>180</td>
                    <td>Good rolls!</td>
                  </tr>
                  <tr>
                    <td>Yahtzee Bonus</td>
                    <td style={{color: '#ff9800'}}>+100</td>
                    <td>2nd Yahtzee</td>
                  </tr>
                  <tr style={{fontWeight: 'bold'}}>
                    <td>Total</td>
                    <td style={{color: '#4ade80'}}>378</td>
                    <td>Great game!</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeGame === '2048' && (
          <div style={styles.scoringContent}>
            <div style={styles.rankingBox}>
              <h3 style={styles.rankingTitle}>Ranking Order</h3>
              <div style={styles.rankingList}>
                <div style={styles.rankingItem}>
                  <span style={styles.rankNum}>1st</span>
                  <span style={styles.rankLabel}>Highest Tile</span>
                  <span style={styles.rankDesc}>Bigger tile = higher rank (2048, 4096, etc.)</span>
                </div>
                <div style={styles.rankingItem}>
                  <span style={styles.rankNum}>2nd</span>
                  <span style={styles.rankLabel}>Total Score</span>
                  <span style={styles.rankDesc}>Higher score = higher rank</span>
                </div>
                <div style={styles.rankingItem}>
                  <span style={styles.rankNum}>3rd</span>
                  <span style={styles.rankLabel}>Moves</span>
                  <span style={styles.rankDesc}>Fewer moves = higher rank</span>
                </div>
              </div>
            </div>

            <div style={styles.infoGrid}>
              <div style={styles.infoCard}>
                <h4 style={styles.infoTitle}>🔢 How to Play</h4>
                <p style={styles.infoText}>
                  Slide tiles using arrow keys or swipe gestures.
                  When two tiles with the same number collide, they merge!
                  Reach 2048 to win, but you can keep going for higher scores.
                </p>
              </div>
              <div style={styles.infoCard}>
                <h4 style={styles.infoTitle}>🎯 Scoring</h4>
                <p style={styles.infoText}>
                  Points equal the value of merged tiles.
                  Merging two 32s = 64 points.
                  Strategy: Keep your highest tile in a corner!
                </p>
              </div>
              <div style={styles.infoCard}>
                <h4 style={styles.infoTitle}>🔒 Provably Fair Spawns</h4>
                <p style={styles.infoText}>
                  Every new tile spawn uses deterministic randomness from blockchain
                  data for position and value (90% 2s, 10% 4s). Completely verifiable!
                </p>
              </div>
            </div>
          </div>
        )}

        {activeGame === 'backgammon' && (
          <div style={styles.scoringContent}>
            <div style={styles.rankingBox}>
              <h3 style={styles.rankingTitle}>Score Formula</h3>
              <p style={{ color: '#4ade80', textAlign: 'center', fontSize: '1.1rem', margin: '0.5rem 0 1rem' }}>
                <strong>Score = WinType × Cube × Difficulty × PipBonus</strong>
              </p>
              <div style={styles.rankingList}>
                <div style={styles.rankingItem}>
                  <span style={styles.rankNum}>W</span>
                  <span style={styles.rankLabel}>Win Type</span>
                  <span style={styles.rankDesc}>Normal (1x) • Gammon (2x) • Backgammon (3x)</span>
                </div>
                <div style={styles.rankingItem}>
                  <span style={styles.rankNum}>C</span>
                  <span style={styles.rankLabel}>Cube Value</span>
                  <span style={styles.rankDesc}>1x → 2x → 4x → 8x → 16x → 32x → 64x</span>
                </div>
                <div style={styles.rankingItem}>
                  <span style={styles.rankNum}>D</span>
                  <span style={styles.rankLabel}>Difficulty</span>
                  <span style={styles.rankDesc}>Easy (1x) • Normal (2x) • Hard (3x)</span>
                </div>
                <div style={styles.rankingItem}>
                  <span style={styles.rankNum}>P</span>
                  <span style={styles.rankLabel}>Pip Bonus</span>
                  <span style={styles.rankDesc}>1.0x (close game) → 2.0x (crushing victory)</span>
                </div>
              </div>
            </div>

            <div style={styles.infoGrid}>
              <div style={styles.infoCard}>
                <h4 style={styles.infoTitle}>🎲 Win Types Explained</h4>
                <p style={styles.infoText}>
                  <strong>Normal (N):</strong> Opponent bore off at least 1 checker<br/>
                  <strong>Gammon (G):</strong> Opponent bore off 0 checkers<br/>
                  <strong>Backgammon (BG):</strong> Opponent still has checker on bar or in your home board
                </p>
              </div>
              <div style={styles.infoCard}>
                <h4 style={styles.infoTitle}>📊 Pip Bonus</h4>
                <p style={styles.infoText}>
                  Based on loser's remaining pip count (distance to bear off all checkers).<br/>
                  <strong>Formula:</strong> 1 + (pips ÷ 200), max 2x<br/>
                  0 pips = 1.0x • 100 pips = 1.5x • 167 pips = 1.8x
                </p>
              </div>
              <div style={styles.infoCard}>
                <h4 style={styles.infoTitle}>📦 Doubling Cube</h4>
                <p style={styles.infoText}>
                  Double the stakes during your turn before rolling.
                  Opponent can accept (play for 2x) or decline (forfeit at current stakes).
                </p>
              </div>
              <div style={styles.infoCard}>
                <h4 style={styles.infoTitle}>🔒 Provably Fair Dice</h4>
                <p style={styles.infoText}>
                  Cryptographic commit-reveal protocol: server commits secret hash
                  first, then combines with blockchain data for each roll.
                  Fully verifiable and tamper-proof!
                </p>
              </div>
            </div>

            <div style={styles.example}>
              <h4 style={styles.exampleTitle}>Example Score Calculations:</h4>
              <table style={styles.exampleTable}>
                <thead>
                  <tr>
                    <th>Win Type</th>
                    <th>Cube</th>
                    <th>Diff</th>
                    <th>Pips</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Normal</td>
                    <td>1x</td>
                    <td>Easy</td>
                    <td>50</td>
                    <td style={{color: '#4ade80'}}>1×1×1×1.25 = <strong>1</strong></td>
                  </tr>
                  <tr>
                    <td>Gammon</td>
                    <td>2x</td>
                    <td>Normal</td>
                    <td>100</td>
                    <td style={{color: '#4ade80'}}>2×2×2×1.5 = <strong>12</strong></td>
                  </tr>
                  <tr>
                    <td>Backgammon</td>
                    <td>4x</td>
                    <td>Hard</td>
                    <td>150</td>
                    <td style={{color: '#ff9800'}}>3×4×3×1.75 = <strong>63</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeGame === 'chess' && (
          <div style={styles.scoringContent}>
            <div style={styles.rankingBox}>
              <h3 style={styles.rankingTitle}>Ranking Order</h3>
              <div style={styles.rankingList}>
                <div style={styles.rankingItem}>
                  <span style={styles.rankNum}>1st</span>
                  <span style={styles.rankLabel}>Final Score</span>
                  <span style={styles.rankDesc}>Win points × difficulty multiplier</span>
                </div>
                <div style={styles.rankingItem}>
                  <span style={styles.rankNum}>2nd</span>
                  <span style={styles.rankLabel}>AI Difficulty</span>
                  <span style={styles.rankDesc}>Higher AI ELO = higher rank</span>
                </div>
                <div style={styles.rankingItem}>
                  <span style={styles.rankNum}>3rd</span>
                  <span style={styles.rankLabel}>Moves</span>
                  <span style={styles.rankDesc}>Fewer moves to win = higher rank</span>
                </div>
              </div>
            </div>

            <div style={styles.infoGrid}>
              <div style={styles.infoCard}>
                <h4 style={styles.infoTitle}>🏆 Scoring System</h4>
                <p style={styles.infoText}>
                  <strong>Win:</strong> 100 pts × (AI ELO ÷ 100)<br/>
                  <strong>Draw:</strong> 25 pts × (AI ELO ÷ 100)<br/>
                  <strong>Loss:</strong> 10 pts × (AI ELO ÷ 100)<br/>
                  <br/>
                  <strong>Examples:</strong><br/>
                  Beat 1400 ELO = 1,400 pts<br/>
                  Lose to 1400 ELO = 140 pts<br/>
                  Lose to 700 ELO = 70 pts
                </p>
              </div>
              <div style={styles.infoCard}>
                <h4 style={styles.infoTitle}>♟️ AI Difficulty Levels</h4>
                <p style={styles.infoText}>
                  Choose your challenge level from 400 to 2800 ELO.
                  Higher difficulty opponents give more points when beaten.
                  Play against Stockfish AI with blockchain-proven settings!
                </p>
              </div>
              <div style={styles.infoCard}>
                <h4 style={styles.infoTitle}>🔒 Provably Fair Chess</h4>
                <p style={styles.infoText}>
                  Color assignment (white/black) uses blockchain data for proven randomness.
                  AI difficulty level is recorded and verifiable on the blockchain.
                  Fair play guaranteed!
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Verification Note */}
      <section style={styles.verifySection}>
        <h3 style={styles.verifyTitle}>🔍 Every Score is Verifiable</h3>
        <p style={styles.verifyText}>
          Click "Verify" on any leaderboard entry to see the cryptographic proof.
          Our commit-reveal protocol ensures the server commits to a secret before blockchain
          data is fetched — creating verifiable randomness that neither player nor server can manipulate.
        </p>
        <Link to="/how-it-works" style={styles.learnLink}>
          Learn how commit-reveal verification works →
        </Link>
      </section>

      {/* CTA */}
      <section style={styles.cta}>
        <h3 style={styles.ctaTitle}>Ready to compete?</h3>
        <div style={styles.ctaButtons}>
          <Link to="/solitaire" style={styles.primaryBtn}>Play Solitaire</Link>
          <Link to="/blackjack" style={styles.primaryBtn}>Play Blackjack</Link>
          <Link to="/yahtzee" style={styles.primaryBtn}>Play Yahtzee</Link>
          <Link to="/2048" style={styles.primaryBtn}>Play 2048</Link>
          <Link to="/backgammon" style={styles.primaryBtn}>Play Backgammon</Link>
          <Link to="/chess" style={styles.primaryBtn}>Play Chess</Link>
        </div>
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
  header: {
    textAlign: 'center',
    marginBottom: '1.5rem'
  },
  title: {
    fontSize: '2rem',
    margin: '0 0 0.5rem 0',
    color: '#fff'
  },
  subtitle: {
    fontSize: '1rem',
    color: '#4ade80',
    margin: 0
  },
  
  // Tabs
  tabs: {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.5rem',
    marginBottom: '1rem',
    flexWrap: 'wrap'
  },
  tab: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#16213e',
    color: '#888',
    border: '2px solid #2a3a5e',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.2s'
  },
  tabActive: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#1a3a1a',
    color: '#4ade80',
    border: '2px solid #4ade80',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem'
  },
  
  // Scoring Section
  scoringSection: {
    backgroundColor: '#16213e',
    borderRadius: '12px',
    padding: '1.5rem',
    marginTop: '1.5rem',
    border: '1px solid #2a3a5e'
  },
  sectionTitle: {
    margin: '0 0 1.25rem 0',
    color: '#fff',
    fontSize: '1.25rem',
    textAlign: 'center'
  },
  scoringContent: {},
  
  // Ranking Box
  rankingBox: {
    backgroundColor: '#1a1a2e',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1.25rem'
  },
  rankingTitle: {
    margin: '0 0 0.75rem 0',
    color: '#a0a0ff',
    fontSize: '1rem',
    textAlign: 'center'
  },
  rankingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  rankingItem: {
    display: 'grid',
    gridTemplateColumns: '50px 150px 1fr',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem 0.75rem',
    backgroundColor: '#0d1117',
    borderRadius: '6px'
  },
  rankNum: {
    color: '#4ade80',
    fontWeight: 'bold',
    fontSize: '0.9rem'
  },
  rankLabel: {
    color: '#fff',
    fontWeight: '500'
  },
  rankDesc: {
    color: '#888',
    fontSize: '0.85rem'
  },
  
  // Info Grid
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1rem',
    marginBottom: '1.25rem'
  },
  infoCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: '8px',
    padding: '1rem'
  },
  infoTitle: {
    margin: '0 0 0.5rem 0',
    color: '#fff',
    fontSize: '0.95rem'
  },
  infoText: {
    margin: 0,
    color: '#aaa',
    fontSize: '0.85rem',
    lineHeight: 1.5
  },
  
  // Example
  example: {
    backgroundColor: '#1a1a2e',
    borderRadius: '8px',
    padding: '1rem'
  },
  exampleTitle: {
    margin: '0 0 0.75rem 0',
    color: '#a0a0ff',
    fontSize: '0.95rem'
  },
  exampleTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.85rem',
    color: '#ccc',
    textAlign: 'left'
  },
  
  // Verify Section
  verifySection: {
    backgroundColor: '#0d1a0d',
    borderRadius: '12px',
    padding: '1.5rem',
    marginTop: '1.5rem',
    border: '1px solid #1a3a1a',
    textAlign: 'center'
  },
  verifyTitle: {
    margin: '0 0 0.75rem 0',
    color: '#4ade80',
    fontSize: '1.1rem'
  },
  verifyText: {
    margin: '0 0 1rem 0',
    color: '#aaa',
    fontSize: '0.9rem',
    lineHeight: 1.6,
    maxWidth: '600px',
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  learnLink: {
    color: '#64b5f6',
    textDecoration: 'none',
    fontSize: '0.9rem'
  },
  
  // CTA
  cta: {
    textAlign: 'center',
    marginTop: '1.5rem',
    padding: '1.5rem',
    backgroundColor: '#16213e',
    borderRadius: '12px',
    border: '1px solid #2a3a5e'
  },
  ctaTitle: {
    margin: '0 0 1rem 0',
    color: '#fff',
    fontSize: '1.1rem'
  },
  ctaButtons: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  primaryBtn: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#4ade80',
    color: '#000',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    fontSize: '0.95rem'
  }
};

export default LeaderboardPage;
