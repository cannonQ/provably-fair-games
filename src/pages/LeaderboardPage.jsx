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
        <p style={styles.subtitle}>Provably fair rankings you can verify</p>
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
          onClick={() => setActiveGame('garbage')}
          style={activeGame === 'garbage' ? styles.tabActive : styles.tab}
        >
          🗑️ Garbage
        </button>
        <button
          onClick={() => setActiveGame('yahtzee')}
          style={activeGame === 'yahtzee' ? styles.tabActive : styles.tab}
        >
          🎲 Yahtzee
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

        {activeGame === 'garbage' && (
          <div style={styles.scoringContent}>
            <div style={styles.rankingBox}>
              <h3 style={styles.rankingTitle}>Ranking Order</h3>
              <div style={styles.rankingList}>
                <div style={styles.rankingItem}>
                  <span style={styles.rankNum}>1st</span>
                  <span style={styles.rankLabel}>Score</span>
                  <span style={styles.rankDesc}>Higher score = higher rank</span>
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
                <h4 style={styles.infoTitle}>🎯 Score Calculation</h4>
                <p style={styles.infoText}>
                  Base: 100 pts per position filled (max 1000)<br/>
                  Time bonus: &lt;1min +500, &lt;2min +300, &lt;3min +100<br/>
                  Win bonus: +500
                </p>
              </div>
              <div style={styles.infoCard}>
                <h4 style={styles.infoTitle}>🤖 Beat the AI</h4>
                <p style={styles.infoText}>
                  Only wins against the AI count for the leaderboard. 
                  Fill all 10 positions before your opponent!
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
                  Every dice roll uses blockchain data. The seed is generated from 
                  block hash + transaction + game ID + turn/roll number. 
                  Completely verifiable!
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
      </section>

      {/* Verification Note */}
      <section style={styles.verifySection}>
        <h3 style={styles.verifyTitle}>🔍 Every Score is Verifiable</h3>
        <p style={styles.verifyText}>
          Click "Verify" on any leaderboard entry to see the blockchain proof. 
          The randomness was determined by Ergo blockchain data before the game started — 
          no one can cheat or manipulate results.
        </p>
        <Link to="/how-it-works" style={styles.learnLink}>
          Learn how provably fair gaming works →
        </Link>
      </section>

      {/* CTA */}
      <section style={styles.cta}>
        <h3 style={styles.ctaTitle}>Ready to compete?</h3>
        <div style={styles.ctaButtons}>
          <Link to="/solitaire" style={styles.primaryBtn}>Play Solitaire</Link>
          <Link to="/garbage" style={styles.primaryBtn}>Play Garbage</Link>
          <Link to="/yahtzee" style={styles.primaryBtn}>Play Yahtzee</Link>
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
