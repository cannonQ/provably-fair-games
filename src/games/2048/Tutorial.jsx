/**
 * 2048 Tutorial - How to play and blockchain verification explanation
 * @module Tutorial
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Collapsible section component
 */
const Section = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const styles = {
    section: {
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      marginBottom: '15px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '15px 20px',
      cursor: 'pointer',
      backgroundColor: isOpen ? '#bbada0' : '#ffffff',
      transition: 'background-color 0.2s'
    },
    title: {
      fontSize: '1.1rem',
      fontWeight: 'bold',
      color: isOpen ? '#ffffff' : '#776e65',
      margin: 0
    },
    toggle: {
      fontSize: '1.2rem',
      color: isOpen ? '#ffffff' : '#776e65'
    },
    content: {
      padding: isOpen ? '20px' : '0 20px',
      maxHeight: isOpen ? '2000px' : '0',
      overflow: 'hidden',
      transition: 'all 0.3s ease'
    }
  };

  return (
    <div style={styles.section}>
      <div style={styles.header} onClick={() => setIsOpen(!isOpen)}>
        <h3 style={styles.title}>{title}</h3>
        <span style={styles.toggle}>{isOpen ? '▼' : '▶'}</span>
      </div>
      <div style={styles.content}>
        {children}
      </div>
    </div>
  );
};

/**
 * Mini grid for visual examples
 */
const MiniGrid = ({ cells, label }) => {
  const styles = {
    container: {
      display: 'inline-block',
      margin: '10px',
      textAlign: 'center'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 40px)',
      gap: '4px',
      padding: '8px',
      backgroundColor: '#bbada0',
      borderRadius: '6px'
    },
    cell: {
      width: '40px',
      height: '40px',
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.9rem',
      fontWeight: 'bold'
    },
    label: {
      fontSize: '0.8rem',
      color: '#776e65',
      marginTop: '5px'
    }
  };

  const getColor = (value) => {
    const colors = {
      0: { bg: '#cdc1b4', text: 'transparent' },
      2: { bg: '#eee4da', text: '#776e65' },
      4: { bg: '#ede0c8', text: '#776e65' },
      8: { bg: '#f2b179', text: '#f9f6f2' },
      16: { bg: '#f59563', text: '#f9f6f2' },
      32: { bg: '#f67c5f', text: '#f9f6f2' },
      64: { bg: '#f65e3b', text: '#f9f6f2' },
      128: { bg: '#edcf72', text: '#f9f6f2' },
      256: { bg: '#edcc61', text: '#f9f6f2' },
      512: { bg: '#edc850', text: '#f9f6f2' },
      1024: { bg: '#edc53f', text: '#f9f6f2' },
      2048: { bg: '#edc22e', text: '#f9f6f2' }
    };
    return colors[value] || { bg: '#3c3a32', text: '#f9f6f2' };
  };

  return (
    <div style={styles.container}>
      <div style={styles.grid}>
        {cells.map((value, i) => {
          const color = getColor(value);
          return (
            <div
              key={i}
              style={{
                ...styles.cell,
                backgroundColor: color.bg,
                color: color.text
              }}
            >
              {value > 0 ? value : ''}
            </div>
          );
        })}
      </div>
      {label && <div style={styles.label}>{label}</div>}
    </div>
  );
};

/**
 * Tutorial Page Component
 */
const Tutorial = () => {
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#faf8ef',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    },
    wrapper: {
      maxWidth: '800px',
      margin: '0 auto'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      flexWrap: 'wrap',
      gap: '10px'
    },
    title: {
      fontSize: '1.8rem',
      fontWeight: 'bold',
      color: '#776e65',
      margin: 0
    },
    backLink: {
      color: '#8f7a66',
      textDecoration: 'none',
      fontSize: '0.9rem'
    },
    intro: {
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    introText: {
      color: '#776e65',
      lineHeight: 1.6,
      margin: 0
    },
    p: {
      color: '#776e65',
      lineHeight: 1.6,
      marginBottom: '15px'
    },
    ul: {
      color: '#776e65',
      lineHeight: 1.8,
      paddingLeft: '20px',
      marginBottom: '15px'
    },
    example: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '15px 0',
      gap: '10px'
    },
    arrow: {
      fontSize: '1.5rem',
      color: '#8f7a66'
    },
    keyboardGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 50px)',
      gap: '5px',
      justifyContent: 'center',
      margin: '15px 0'
    },
    key: {
      width: '50px',
      height: '50px',
      backgroundColor: '#bbada0',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#f9f6f2',
      fontWeight: 'bold',
      fontSize: '1.2rem'
    },
    keyEmpty: {
      width: '50px',
      height: '50px'
    },
    code: {
      backgroundColor: '#f0f0f0',
      padding: '2px 6px',
      borderRadius: '4px',
      fontFamily: 'monospace',
      fontSize: '0.9rem'
    },
    codeBlock: {
      backgroundColor: '#2d2d2d',
      color: '#f8f8f2',
      padding: '15px',
      borderRadius: '6px',
      fontFamily: 'monospace',
      fontSize: '0.85rem',
      overflowX: 'auto',
      whiteSpace: 'pre-wrap',
      marginBottom: '15px'
    },
    faq: {
      marginBottom: '15px'
    },
    question: {
      fontWeight: 'bold',
      color: '#776e65',
      marginBottom: '5px'
    },
    answer: {
      color: '#9e948a',
      marginBottom: '15px',
      paddingLeft: '15px'
    },
    playButton: {
      display: 'inline-block',
      padding: '15px 30px',
      backgroundColor: '#8f7a66',
      color: '#f9f6f2',
      textDecoration: 'none',
      borderRadius: '6px',
      fontWeight: 'bold',
      fontSize: '1.1rem',
      marginTop: '10px'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>📖 How to Play 2048</h1>
          <Link to="/2048" style={styles.backLink}>← Back to Game</Link>
        </div>

        {/* Introduction */}
        <div style={styles.intro}>
          <p style={styles.introText}>
            2048 is a sliding puzzle game where you combine numbered tiles to reach the 2048 tile. 
            This version uses <strong>Ergo blockchain randomness</strong> for provably fair tile spawning!
          </p>
        </div>

        {/* How to Play */}
        <Section title="🎮 How to Play" defaultOpen={true}>
          <p style={styles.p}>Use arrow keys on desktop or swipe on mobile to move all tiles:</p>
          
          <div style={styles.keyboardGrid}>
            <div style={styles.keyEmpty} />
            <div style={styles.key}>↑</div>
            <div style={styles.keyEmpty} />
            <div style={styles.key}>←</div>
            <div style={styles.key}>↓</div>
            <div style={styles.key}>→</div>
          </div>
          
          <p style={{ ...styles.p, textAlign: 'center', fontSize: '0.85rem', color: '#9e948a' }}>
            Also works with W, A, S, D keys
          </p>

          <ul style={styles.ul}>
            <li>All tiles slide in the direction you choose until they hit the edge or another tile</li>
            <li>When two tiles with the <strong>same number</strong> collide, they merge into one</li>
            <li>After each valid move, a new tile (2 or 4) appears in a random empty cell</li>
            <li><strong>Goal:</strong> Create a tile with the number 2048!</li>
            <li>You can continue playing after reaching 2048 to get higher scores</li>
          </ul>
        </Section>

        {/* Tile Merging */}
        <Section title="🔄 Tile Merging">
          <p style={styles.p}><strong>Basic merge:</strong> Two matching tiles combine into one</p>
          
          <div style={styles.example}>
            <MiniGrid 
              cells={[2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]} 
              label="Before"
            />
            <span style={styles.arrow}>→</span>
            <MiniGrid 
              cells={[0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]} 
              label="After (slide right)"
            />
          </div>

          <p style={styles.p}><strong>Important:</strong> Each tile can only merge <em>once</em> per move!</p>
          
          <div style={styles.example}>
            <MiniGrid 
              cells={[2, 2, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]} 
              label="Before"
            />
            <span style={styles.arrow}>→</span>
            <MiniGrid 
              cells={[0, 0, 4, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]} 
              label="After (2+2=4, 4+4=8)"
            />
          </div>

          <p style={styles.p}><strong>Chain example:</strong> Four 2's become two 4's, NOT one 8</p>
          
          <div style={styles.example}>
            <MiniGrid 
              cells={[2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]} 
              label="Before"
            />
            <span style={styles.arrow}>→</span>
            <MiniGrid 
              cells={[0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]} 
              label="After (NOT 8!)"
            />
          </div>
        </Section>

        {/* Scoring */}
        <Section title="🏆 Scoring">
          <p style={styles.p}>You earn points whenever tiles merge:</p>
          <ul style={styles.ul}>
            <li>2 + 2 = 4 → Earn <strong>4 points</strong></li>
            <li>4 + 4 = 8 → Earn <strong>8 points</strong></li>
            <li>8 + 8 = 16 → Earn <strong>16 points</strong></li>
            <li>...and so on!</li>
          </ul>
          <p style={styles.p}>
            The merged tile's value equals the points you earn. Your <strong>high score</strong> is 
            saved locally and persists across games.
          </p>
        </Section>

        {/* Winning & Losing */}
        <Section title="🎯 Winning & Losing">
          <p style={styles.p}><strong>You win</strong> when you create a 2048 tile! 🎉</p>
          
          <div style={styles.example}>
            <MiniGrid 
              cells={[1024, 1024, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]} 
              label="Almost there..."
            />
            <span style={styles.arrow}>→</span>
            <MiniGrid 
              cells={[0, 0, 0, 2048, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]} 
              label="YOU WIN! 🏆"
            />
          </div>

          <p style={styles.p}>After winning, you can <strong>continue playing</strong> to reach even higher tiles (4096, 8192, etc.)</p>
          
          <p style={styles.p}><strong>You lose</strong> when:</p>
          <ul style={styles.ul}>
            <li>The grid is completely full</li>
            <li>AND no adjacent tiles can merge</li>
          </ul>
        </Section>

        {/* Strategy Tips */}
        <Section title="💡 Strategy Tips">
          <ul style={styles.ul}>
            <li><strong>Keep your highest tile in a corner</strong> - Pick one corner and always try to keep your biggest tile there</li>
            <li><strong>Build toward that corner</strong> - Arrange tiles in descending order leading to your corner</li>
            <li><strong>Don't spread high tiles</strong> - Having 256's in opposite corners makes them hard to combine</li>
            <li><strong>Plan ahead</strong> - Think 2-3 moves ahead, not just the next move</li>
            <li><strong>Leave merge opportunities</strong> - Don't fill the board with all different numbers</li>
            <li><strong>Use edges wisely</strong> - The edges help control where tiles go</li>
          </ul>
        </Section>

        {/* Blockchain Verification */}
        <Section title="🔗 Blockchain Verification">
          <p style={styles.p}>
            This version of 2048 is <strong>provably fair</strong> using the Ergo blockchain for randomness!
          </p>
          
          <p style={styles.p}><strong>How it works:</strong></p>
          <ul style={styles.ul}>
            <li>Every new tile spawn fetches the latest Ergo block hash</li>
            <li>The <strong>position</strong> of the new tile is determined by: <code style={styles.code}>SHA256(seed + "position") mod empty_cells</code></li>
            <li>The <strong>value</strong> (2 or 4) is determined by: <code style={styles.code}>SHA256(seed + "value") mod 100</code></li>
            <li>Result &lt; 90 = tile is 2 (90% chance)</li>
            <li>Result ≥ 90 = tile is 4 (10% chance)</li>
          </ul>

          <p style={styles.p}><strong>Example calculation:</strong></p>
          <div style={styles.codeBlock}>
{`Block Hash: 5f8c3a2b...
Game ID: abc123
Move #: 5

Master Seed = SHA256("5f8c3a2b...abc1235")
Position = SHA256(seed + "position") mod 14
         = 7 (8th empty cell)
Value    = SHA256(seed + "value") mod 100
         = 42 (< 90, so tile = 2)`}
          </div>

          <p style={styles.p}>
            Click <strong>"Verify"</strong> in the game to see blockchain proof for every spawn, 
            or download a Python script to verify independently!
          </p>
        </Section>

        {/* FAQ */}
        <Section title="❓ Frequently Asked Questions">
          <div style={styles.faq}>
            <p style={styles.question}>Q: Is this truly random?</p>
            <p style={styles.answer}>
              A: Yes! The randomness comes from Ergo blockchain block hashes, which are 
              cryptographically secure and cannot be predicted or manipulated.
            </p>

            <p style={styles.question}>Q: Can I verify the spawns myself?</p>
            <p style={styles.answer}>
              A: Absolutely! Visit the Verification page to see all spawn proofs, or download 
              a Python script that recalculates every spawn using the blockchain data.
            </p>

            <p style={styles.question}>Q: What if the blockchain fetch fails?</p>
            <p style={styles.answer}>
              A: The game will show an error message and use a fallback (timestamp-based) 
              randomness. For fully verifiable games, ensure you have a stable connection.
            </p>

            <p style={styles.question}>Q: Can I save my game?</p>
            <p style={styles.answer}>
              A: Currently there's no save feature, but your high score is saved locally 
              and will persist across browser sessions.
            </p>

            <p style={styles.question}>Q: Why did my move not work?</p>
            <p style={styles.answer}>
              A: A move only counts if at least one tile actually moves or merges. If nothing 
              can move in that direction, the move is ignored.
            </p>
          </div>
        </Section>

        {/* Play Button */}
        <div style={{ textAlign: 'center', marginTop: '30px', marginBottom: '30px' }}>
          <Link to="/2048" style={styles.playButton}>
            🎮 Play 2048 Now!
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;
