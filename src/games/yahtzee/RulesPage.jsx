/**
 * Yahtzee Rules Page
 * Explains the game rules and scoring
 */

import React from 'react';
import { Link } from 'react-router-dom';

function RulesPage() {
  const containerStyle = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    color: '#eee'
  };

  const headerStyle = {
    fontSize: '36px',
    marginBottom: '10px',
    color: '#fff'
  };

  const sectionStyle = {
    backgroundColor: '#16213e',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px'
  };

  const linkStyle = {
    color: '#64b5f6',
    textDecoration: 'none',
    marginBottom: '20px',
    display: 'inline-block'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '10px'
  };

  const thStyle = {
    backgroundColor: '#0d1829',
    padding: '10px',
    textAlign: 'left',
    borderBottom: '2px solid #1976d2'
  };

  const tdStyle = {
    padding: '10px',
    borderBottom: '1px solid #2a3f5f'
  };

  return (
    <div style={containerStyle}>
      <Link to="/yahtzee" style={linkStyle}>← Back to Game</Link>

      <h1 style={headerStyle}>🎲 Yahtzee Rules</h1>
      <p style={{ color: '#aaa', marginBottom: '30px' }}>
        Classic dice game with blockchain-verified randomness
      </p>

      {/* Objective */}
      <div style={sectionStyle}>
        <h2 style={{ color: '#4ade80', marginTop: 0 }}>🎯 Objective</h2>
        <p>
          Score points by rolling five dice to make specific combinations.
          The game consists of 13 rounds. In each round, you roll the dice up to 3 times
          and choose which scoring category to use for that round.
        </p>
      </div>

      {/* How to Play */}
      <div style={sectionStyle}>
        <h2 style={{ color: '#4ade80', marginTop: 0 }}>🎮 How to Play</h2>
        <ol style={{ paddingLeft: '20px' }}>
          <li><strong>Roll the Dice:</strong> Click "Roll Dice" to start. You get 3 rolls per turn.</li>
          <li><strong>Hold Dice:</strong> After the first roll, click any die to hold it. Held dice won't change on the next roll.</li>
          <li><strong>Re-roll:</strong> Roll again (up to 3 times total) to improve your combination.</li>
          <li><strong>Score:</strong> After your final roll (or anytime after the first), click a scoring category to lock in your points.</li>
          <li><strong>Repeat:</strong> Continue for all 13 rounds until all categories are filled.</li>
        </ol>
      </div>

      {/* Scoring Categories */}
      <div style={sectionStyle}>
        <h2 style={{ color: '#4ade80', marginTop: 0 }}>📊 Scoring Categories</h2>

        <h3 style={{ color: '#64b5f6', fontSize: '18px' }}>Upper Section</h3>
        <p style={{ fontSize: '14px', color: '#ccc' }}>
          Sum the dice showing the specified number:
        </p>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Scoring</th>
              <th style={thStyle}>Example</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdStyle}><strong>Ones</strong></td>
              <td style={tdStyle}>Sum of all 1s</td>
              <td style={tdStyle}>1-1-3-4-5 = 2 points</td>
            </tr>
            <tr>
              <td style={tdStyle}><strong>Twos</strong></td>
              <td style={tdStyle}>Sum of all 2s</td>
              <td style={tdStyle}>2-2-2-4-5 = 6 points</td>
            </tr>
            <tr>
              <td style={tdStyle}><strong>Threes</strong></td>
              <td style={tdStyle}>Sum of all 3s</td>
              <td style={tdStyle}>3-3-3-4-5 = 9 points</td>
            </tr>
            <tr>
              <td style={tdStyle}><strong>Fours</strong></td>
              <td style={tdStyle}>Sum of all 4s</td>
              <td style={tdStyle}>4-4-4-4-5 = 16 points</td>
            </tr>
            <tr>
              <td style={tdStyle}><strong>Fives</strong></td>
              <td style={tdStyle}>Sum of all 5s</td>
              <td style={tdStyle}>5-5-5-3-4 = 15 points</td>
            </tr>
            <tr>
              <td style={tdStyle}><strong>Sixes</strong></td>
              <td style={tdStyle}>Sum of all 6s</td>
              <td style={tdStyle}>6-6-6-6-1 = 24 points</td>
            </tr>
          </tbody>
        </table>
        <p style={{ fontSize: '14px', color: '#4ade80', marginTop: '10px' }}>
          💡 <strong>Bonus:</strong> If your upper section total is 63 or more, you get a +35 point bonus!
        </p>

        <h3 style={{ color: '#64b5f6', fontSize: '18px', marginTop: '30px' }}>Lower Section</h3>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Requirement</th>
              <th style={thStyle}>Points</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdStyle}><strong>Three of a Kind</strong></td>
              <td style={tdStyle}>At least 3 dice the same</td>
              <td style={tdStyle}>Sum of all 5 dice</td>
            </tr>
            <tr>
              <td style={tdStyle}><strong>Four of a Kind</strong></td>
              <td style={tdStyle}>At least 4 dice the same</td>
              <td style={tdStyle}>Sum of all 5 dice</td>
            </tr>
            <tr>
              <td style={tdStyle}><strong>Full House</strong></td>
              <td style={tdStyle}>3 of one kind + 2 of another</td>
              <td style={tdStyle}>25 points</td>
            </tr>
            <tr>
              <td style={tdStyle}><strong>Small Straight</strong></td>
              <td style={tdStyle}>4 consecutive dice (1-2-3-4, 2-3-4-5, or 3-4-5-6)</td>
              <td style={tdStyle}>30 points</td>
            </tr>
            <tr>
              <td style={tdStyle}><strong>Large Straight</strong></td>
              <td style={tdStyle}>5 consecutive dice (1-2-3-4-5 or 2-3-4-5-6)</td>
              <td style={tdStyle}>40 points</td>
            </tr>
            <tr>
              <td style={tdStyle}><strong>Yahtzee</strong></td>
              <td style={tdStyle}>All 5 dice the same</td>
              <td style={tdStyle}>50 points</td>
            </tr>
            <tr>
              <td style={tdStyle}><strong>Chance</strong></td>
              <td style={tdStyle}>Any combination</td>
              <td style={tdStyle}>Sum of all 5 dice</td>
            </tr>
          </tbody>
        </table>
        <p style={{ fontSize: '14px', color: '#ff9800', marginTop: '10px' }}>
          🎉 <strong>Yahtzee Bonus:</strong> If you score additional Yahtzees after your first, you get +100 points each!
        </p>
      </div>

      {/* Strategy Tips */}
      <div style={sectionStyle}>
        <h2 style={{ color: '#4ade80', marginTop: 0 }}>💡 Strategy Tips</h2>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Try to get the upper section bonus (63+ points) - aim for at least 3 of each number</li>
          <li>Don't waste high rolls on low-scoring categories</li>
          <li>Use "Chance" as a safety net for poor rolls</li>
          <li>Yahtzee is worth 50 points - always go for it if you're close!</li>
          <li>If you must sacrifice a category, choose strategically (avoid high-value categories)</li>
        </ul>
      </div>

      {/* Maximum Score */}
      <div style={sectionStyle}>
        <h2 style={{ color: '#4ade80', marginTop: 0 }}>🏆 Maximum Possible Score</h2>
        <p>
          The theoretical maximum score in Yahtzee is <strong style={{ color: '#4ade80' }}>375 points</strong>:
        </p>
        <ul style={{ paddingLeft: '20px', fontSize: '14px', color: '#ccc' }}>
          <li>Upper Section: 105 points (all 5s and 6s)</li>
          <li>Upper Bonus: 35 points</li>
          <li>Lower Section: 235 points (with Yahtzee bonuses)</li>
        </ul>
        <p style={{ fontSize: '14px', color: '#aaa' }}>
          A score of 250+ is excellent, and 300+ is exceptional!
        </p>
      </div>

      {/* Blockchain Verification */}
      <div style={sectionStyle}>
        <h2 style={{ color: '#4ade80', marginTop: 0 }}>🔒 Provably Fair</h2>
        <p>
          Every dice roll in this game is generated using data from the Ergo blockchain,
          making it provably fair and impossible to manipulate:
        </p>
        <ul style={{ paddingLeft: '20px', fontSize: '14px' }}>
          <li>Each game starts by fetching the latest Ergo block</li>
          <li>Dice values are calculated using blockchain data (block hash + transaction data)</li>
          <li>Anyone can verify the randomness using the "Verify Rolls" button</li>
          <li>The verification page shows complete blockchain proof for every roll</li>
        </ul>
      </div>

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <Link to="/yahtzee">
          <button style={{
            backgroundColor: '#4caf50',
            color: '#fff',
            border: 'none',
            padding: '14px 32px',
            fontSize: '18px',
            fontWeight: 'bold',
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
            Start Playing
          </button>
        </Link>
      </div>
    </div>
  );
}

export default RulesPage;
