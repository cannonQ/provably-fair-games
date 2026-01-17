/**
 * Tutorial Component
 * 
 * Interactive tutorial covering all backgammon rules
 * with visual diagrams and step-by-step explanations.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Tutorial = () => {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState(0);

  const sections = [
    {
      title: '🎯 Board Layout',
      content: `The backgammon board has 24 triangular points arranged in four quadrants of 6 points each.

• Points 1-6: White's home board (bearing off zone)
• Points 7-12: White's outer board
• Points 13-18: Black's outer board  
• Points 19-24: Black's home board

The bar divides the board in half. The bear-off trays collect removed checkers.`,
      diagram: 'board'
    },
    {
      title: '🏆 Objective',
      content: `The goal is to move all 15 of your checkers into your home board, then bear them off the board.

The first player to bear off all their checkers wins!

Each player starts with checkers distributed across the board in a specific pattern.`,
      diagram: 'objective'
    },
    {
      title: '🎲 Movement',
      content: `Roll two dice to determine your moves. Each die is a separate move.

• White moves from point 24 toward point 1
• Black moves from point 1 toward point 24

You can move one checker twice (using both dice) or two different checkers once each.

You must use both dice if possible. If only one can be used, you must use the higher one.`,
      diagram: 'movement'
    },
    {
      title: '💥 Hitting (Blots)',
      content: `A single checker on a point is called a "blot" and is vulnerable.

If you land on an opponent's blot, that checker is "hit" and sent to the bar in the center of the board.

A point with 2+ checkers is "made" and blocks the opponent from landing there.`,
      diagram: 'hitting'
    },
    {
      title: '🚪 Bar Entry',
      content: `If you have checkers on the bar, you MUST re-enter them before making any other moves.

To enter, roll a die matching an open point in the opponent's home board.

• White enters on points 19-24 (die 1 = point 24, die 6 = point 19)
• Black enters on points 1-6 (die 1 = point 1, die 6 = point 6)

If all entry points are blocked, you lose your turn!`,
      diagram: 'bar'
    },
    {
      title: '🏁 Bearing Off',
      content: `Once ALL your checkers are in your home board, you can start bearing off.

• Roll the exact number to remove a checker, OR
• Use a higher number if no checkers are on higher points

Example: White rolls a 5, can bear off from point 5 or lower if no checkers on points 5-6.

Continue until all 15 checkers are borne off to win!`,
      diagram: 'bearoff'
    },
    {
      title: '🎲🎲 Doubles',
      content: `When you roll doubles (same number on both dice), you get FOUR moves instead of two!

For example, rolling double 3s means you can move 3 spaces four times.

Doubles can be powerful for quick advancement or building defensive positions.`,
      diagram: 'doubles'
    },
    {
      title: '📦 Doubling Cube',
      content: `The doubling cube multiplies the game stakes: 1, 2, 4, 8, 16, 32, 64.

Before rolling, a player can offer to double. The opponent must:
• Accept: Stakes double, opponent now "owns" the cube
• Decline: Forfeit the game at current stakes

Only the cube owner can offer the next double. The cube starts centered (either can double).`,
      diagram: 'cube'
    },
    {
      title: '🏅 Win Types',
      content: `There are three ways to win, each worth different points:

• Normal Win (1x): Opponent has borne off at least one checker
• Gammon (2x): Opponent has borne off ZERO checkers
• Backgammon (3x): Gammon + opponent has checker on bar or in your home board

Your final score = Win Type × Cube Value × Difficulty Bonus`,
      diagram: 'wintypes'
    },
    {
      title: '🔗 Blockchain Verification',
      content: `Every dice roll is provably fair using the Ergo blockchain!

How it works:
1. Fetch the latest block hash from Ergo blockchain
2. Combine: SHA256(blockHash + gameId + turnNumber)
3. Convert first two bytes to dice values (mod 6 + 1)

You can verify any roll using the block explorer. The blockchain data is determined before your game, making manipulation impossible!`,
      diagram: 'blockchain'
    }
  ];

  // Render diagram based on section
  const renderDiagram = (type) => {
    const diagramStyle = {
      backgroundColor: '#1a1a2e',
      borderRadius: '12px',
      padding: '20px',
      marginTop: '20px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '150px'
    };

    const diagrams = {
      board: (
        <div style={{ textAlign: 'center', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginBottom: '10px' }}>
            {[13,14,15,16,17,18].map(n => (
              <div key={n} style={{ width: '35px', textAlign: 'center' }}>
                <div style={{ width: 0, height: 0, borderLeft: '17px solid transparent', borderRight: '17px solid transparent', borderTop: '50px solid #8B4513', margin: '0 auto' }} />
                <div style={{ fontSize: '10px', color: '#888' }}>{n}</div>
              </div>
            ))}
            <div style={{ width: '20px', backgroundColor: '#4E342E', margin: '0 5px' }} />
            {[19,20,21,22,23,24].map(n => (
              <div key={n} style={{ width: '35px', textAlign: 'center' }}>
                <div style={{ width: 0, height: 0, borderLeft: '17px solid transparent', borderRight: '17px solid transparent', borderTop: '50px solid #D2B48C', margin: '0 auto' }} />
                <div style={{ fontSize: '10px', color: '#888' }}>{n}</div>
              </div>
            ))}
          </div>
          <div style={{ color: '#ffd700', fontSize: '12px' }}>Black's Home ← BAR → Black's Outer</div>
        </div>
      ),

      objective: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '40px' }}>🏠</div>
            <div style={{ color: '#888', fontSize: '12px' }}>Get all checkers</div>
            <div style={{ color: '#888', fontSize: '12px' }}>to home board</div>
          </div>
          <div style={{ fontSize: '30px', color: '#ffd700' }}>→</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '40px' }}>📤</div>
            <div style={{ color: '#888', fontSize: '12px' }}>Bear off</div>
            <div style={{ color: '#888', fontSize: '12px' }}>all 15 checkers</div>
          </div>
          <div style={{ fontSize: '30px', color: '#ffd700' }}>→</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '40px' }}>🏆</div>
            <div style={{ color: '#888', fontSize: '12px' }}>WIN!</div>
          </div>
        </div>
      ),

      movement: (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '15px' }}>
            <div style={{ width: '50px', height: '50px', backgroundColor: '#f0f0f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontWeight: 'bold' }}>W</div>
            <div style={{ color: '#888' }}>moves</div>
            <div style={{ color: '#ffd700', fontSize: '20px' }}>24 → 1</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <div style={{ width: '50px', height: '50px', backgroundColor: '#2a2a2a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', border: '2px solid #444' }}>B</div>
            <div style={{ color: '#888' }}>moves</div>
            <div style={{ color: '#ffd700', fontSize: '20px' }}>1 → 24</div>
          </div>
        </div>
      ),

      hitting: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#2a2a2a', borderRadius: '50%', margin: '0 auto', border: '2px solid #f44336' }} />
            <div style={{ color: '#f44336', fontSize: '11px', marginTop: '5px' }}>Blot (1)</div>
            <div style={{ color: '#888', fontSize: '10px' }}>Vulnerable!</div>
          </div>
          <div style={{ fontSize: '24px' }}>💥</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', gap: '2px', justifyContent: 'center' }}>
              <div style={{ width: '40px', height: '40px', backgroundColor: '#f0f0f0', borderRadius: '50%', border: '2px solid #4CAF50' }} />
              <div style={{ width: '40px', height: '40px', backgroundColor: '#f0f0f0', borderRadius: '50%', marginLeft: '-15px', border: '2px solid #4CAF50' }} />
            </div>
            <div style={{ color: '#4CAF50', fontSize: '11px', marginTop: '5px' }}>Made (2+)</div>
            <div style={{ color: '#888', fontSize: '10px' }}>Safe & blocks!</div>
          </div>
        </div>
      ),

      bar: (
        <div style={{ textAlign: 'center' }}>
          <div style={{ backgroundColor: '#4E342E', padding: '15px 30px', borderRadius: '8px', display: 'inline-block' }}>
            <div style={{ color: '#ffd700', marginBottom: '10px' }}>THE BAR</div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <div style={{ width: '35px', height: '35px', backgroundColor: '#f0f0f0', borderRadius: '50%' }} />
              <div style={{ width: '35px', height: '35px', backgroundColor: '#2a2a2a', borderRadius: '50%', border: '2px solid #444' }} />
            </div>
          </div>
          <div style={{ color: '#888', fontSize: '12px', marginTop: '10px' }}>
            Hit checkers wait here until re-entry
          </div>
        </div>
      ),

      bearoff: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '5px' }}>Home Board</div>
            <div style={{ display: 'flex', gap: '3px' }}>
              {[1,2,3,4,5,6].map(n => (
                <div key={n} style={{ width: '25px', height: '60px', backgroundColor: n % 2 ? '#8B4513' : '#D2B48C', borderRadius: '3px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '5px' }}>
                  {n <= 3 && <div style={{ width: '18px', height: '18px', backgroundColor: '#f0f0f0', borderRadius: '50%' }} />}
                </div>
              ))}
            </div>
          </div>
          <div style={{ fontSize: '24px', color: '#4CAF50' }}>→</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '5px' }}>Bear Off</div>
            <div style={{ backgroundColor: '#3E2723', padding: '10px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ width: '30px', height: '8px', backgroundColor: '#f0f0f0', borderRadius: '2px' }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      ),

      doubles: (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '15px' }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ width: '45px', height: '45px', backgroundColor: '#fff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', border: '2px solid #333' }}>
                ⚃
              </div>
            ))}
          </div>
          <div style={{ color: '#ffd700', fontSize: '16px' }}>Double 4s = FOUR moves of 4!</div>
        </div>
      ),

      cube: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {[1, 2, 4, 8, 16, 32, 64].map((val, i) => (
            <div key={val} style={{ 
              width: i === 0 ? '50px' : '35px', 
              height: i === 0 ? '50px' : '35px', 
              backgroundColor: '#1a1a1a', 
              borderRadius: '6px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#ffd700', 
              fontWeight: 'bold',
              fontSize: i === 0 ? '18px' : '12px',
              border: `2px solid ${i === 0 ? '#ffd700' : '#444'}`,
              opacity: i === 0 ? 1 : 0.6
            }}>
              {val}
            </div>
          ))}
        </div>
      ),

      wintypes: (
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#2a2a4a', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px' }}>🎯</div>
            <div style={{ color: '#fff', fontWeight: 'bold' }}>Normal</div>
            <div style={{ color: '#ffd700' }}>1x</div>
          </div>
          <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#2a2a4a', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px' }}>🎯🎯</div>
            <div style={{ color: '#fff', fontWeight: 'bold' }}>Gammon</div>
            <div style={{ color: '#ffd700' }}>2x</div>
          </div>
          <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#2a2a4a', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px' }}>🎯🎯🎯</div>
            <div style={{ color: '#fff', fontWeight: 'bold' }}>Backgammon</div>
            <div style={{ color: '#ffd700' }}>3x</div>
          </div>
        </div>
      ),

      blockchain: (
        <div style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: '12px' }}>
          <div style={{ marginBottom: '10px' }}>
            <span style={{ color: '#888' }}>Block Hash: </span>
            <span style={{ color: '#4CAF50' }}>9f8a7b...</span>
          </div>
          <div style={{ color: '#ffd700', margin: '10px 0' }}>↓ SHA256</div>
          <div style={{ marginBottom: '10px' }}>
            <span style={{ color: '#888' }}>+ GameID + Turn → </span>
            <span style={{ color: '#1976D2' }}>3c7f2e...</span>
          </div>
          <div style={{ color: '#ffd700', margin: '10px 0' }}>↓ mod 6 + 1</div>
          <div style={{ fontSize: '24px' }}>🎲 [4, 2]</div>
        </div>
      )
    };

    return <div style={diagramStyle}>{diagrams[type]}</div>;
  };

  // Styles
  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: '#1a1a2e',
    color: '#fff',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  };

  const cardStyle = {
    maxWidth: '700px',
    margin: '0 auto',
    backgroundColor: '#2a2a4a',
    borderRadius: '16px',
    padding: '30px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
  };

  const progressStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '30px'
  };

  const dotStyle = (active, completed) => ({
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: active ? '#ffd700' : completed ? '#4CAF50' : '#444',
    transition: 'all 0.3s ease'
  });

  const buttonStyle = {
    padding: '12px 32px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  };

  const navButtonStyle = {
    padding: '10px 20px',
    fontSize: '14px',
    backgroundColor: 'transparent',
    color: '#888',
    border: '1px solid #444',
    borderRadius: '8px',
    cursor: 'pointer'
  };

  const section = sections[currentSection];

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Progress dots */}
        <div style={progressStyle}>
          {sections.map((_, i) => (
            <div
              key={i}
              style={dotStyle(i === currentSection, i < currentSection)}
              onClick={() => setCurrentSection(i)}
            />
          ))}
        </div>

        {/* Section content */}
        <h2 style={{ color: '#ffd700', marginTop: 0, textAlign: 'center' }}>
          {section.title}
        </h2>

        <div style={{ 
          whiteSpace: 'pre-line', 
          lineHeight: '1.7',
          color: '#ddd',
          fontSize: '15px'
        }}>
          {section.content}
        </div>

        {/* Diagram */}
        {renderDiagram(section.diagram)}

        {/* Navigation */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginTop: '30px' 
        }}>
          <button
            style={navButtonStyle}
            onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
            disabled={currentSection === 0}
          >
            ← Previous
          </button>

          <span style={{ color: '#888' }}>
            {currentSection + 1} / {sections.length}
          </span>

          {currentSection < sections.length - 1 ? (
            <button
              style={buttonStyle}
              onClick={() => setCurrentSection(currentSection + 1)}
            >
              Got it! →
            </button>
          ) : (
            <button
              style={{ ...buttonStyle, backgroundColor: '#1976D2' }}
              onClick={() => navigate('/backgammon')}
            >
              Start Playing! 🎲
            </button>
          )}
        </div>

        {/* Skip link */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            style={{ ...navButtonStyle, border: 'none' }}
            onClick={() => navigate('/backgammon')}
          >
            Skip Tutorial
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;
