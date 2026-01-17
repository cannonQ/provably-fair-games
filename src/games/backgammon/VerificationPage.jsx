/**
 * Verification Page Component
 * 
 * Displays blockchain proof for all dice rolls including:
 * - Roll-by-roll verification
 * - Dice statistics
 * - Downloadable verification script
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import CryptoJS from 'crypto-js';

const VerificationPage = () => {
  const { gameId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Get game data from navigation state or localStorage
  const [gameData, setGameData] = useState(null);
  const [expandedRolls, setExpandedRolls] = useState({});
  const [replayPosition, setReplayPosition] = useState(0);

  useEffect(() => {
    if (location.state?.gameState) {
      setGameData(location.state.gameState);
    } else {
      // Try to load from localStorage
      const saved = localStorage.getItem(`backgammon-${gameId}`);
      if (saved) {
        setGameData(JSON.parse(saved));
      }
    }
  }, [gameId, location.state]);

  // Calculate dice statistics
  const diceStats = useMemo(() => {
    if (!gameData?.rollHistory) return null;

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    let doublesCount = 0;
    let totalRolls = 0;

    gameData.rollHistory.forEach(roll => {
      if (roll.dice) {
        distribution[roll.dice[0]]++;
        distribution[roll.dice[1]]++;
        totalRolls += 2;
        if (roll.dice[0] === roll.dice[1]) {
          doublesCount++;
        }
      }
    });

    // Chi-squared test
    const expected = totalRolls / 6;
    let chiSquared = 0;
    Object.values(distribution).forEach(observed => {
      chiSquared += Math.pow(observed - expected, 2) / expected;
    });

    // Critical value for df=5, p=0.05 is 11.07
    const isRandom = chiSquared < 11.07;

    return {
      distribution,
      totalDice: totalRolls,
      totalTurns: gameData.rollHistory.length,
      doublesCount,
      doublesPercent: ((doublesCount / gameData.rollHistory.length) * 100).toFixed(1),
      chiSquared: chiSquared.toFixed(2),
      isRandom
    };
  }, [gameData]);

  // Toggle roll expansion
  const toggleRoll = (index) => {
    setExpandedRolls(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Generate verification for a roll
  const generateRollVerification = (roll, index) => {
    const seedInput = `${roll.blockHash}${gameId}${index + 1}`;
    const hash = CryptoJS.SHA256(seedInput).toString(CryptoJS.enc.Hex);
    const byte1 = parseInt(hash.substring(0, 2), 16);
    const byte2 = parseInt(hash.substring(2, 4), 16);
    const die1 = (byte1 % 6) + 1;
    const die2 = (byte2 % 6) + 1;

    return {
      seedInput,
      hash,
      byte1,
      byte2,
      die1,
      die2,
      verified: die1 === roll.dice[0] && die2 === roll.dice[1]
    };
  };

  // Generate Python verification script
  const generatePythonScript = () => {
    if (!gameData) return '';

    const rolls = gameData.rollHistory.map((roll, i) => ({
      turn: i + 1,
      blockHash: roll.blockHash,
      expectedDice: roll.dice
    }));

    return `#!/usr/bin/env python3
"""
Backgammon Dice Verification Script
Game ID: ${gameId}
Generated: ${new Date().toISOString()}

This script independently verifies all dice rolls using blockchain data.
"""

import hashlib
import json

GAME_ID = "${gameId}"

ROLLS = ${JSON.stringify(rolls, null, 2)}

def verify_roll(block_hash: str, game_id: str, turn_number: int) -> tuple:
    """Calculate dice values from blockchain hash."""
    seed_input = f"{block_hash}{game_id}{turn_number}"
    hash_result = hashlib.sha256(seed_input.encode()).hexdigest()
    
    byte1 = int(hash_result[0:2], 16)
    byte2 = int(hash_result[2:4], 16)
    
    die1 = (byte1 % 6) + 1
    die2 = (byte2 % 6) + 1
    
    return die1, die2, hash_result

def main():
    print(f"Verifying Game: {GAME_ID}")
    print(f"Total Rolls: {len(ROLLS)}")
    print("-" * 60)
    
    all_verified = True
    
    for roll in ROLLS:
        turn = roll["turn"]
        block_hash = roll["blockHash"]
        expected = roll["expectedDice"]
        
        die1, die2, hash_result = verify_roll(block_hash, GAME_ID, turn)
        verified = (die1 == expected[0] and die2 == expected[1])
        
        status = "✓" if verified else "✗"
        print(f"Turn {turn}: {status} Dice [{die1}, {die2}]")
        
        if not verified:
            all_verified = False
            print(f"  ERROR: Expected {expected}, got [{die1}, {die2}]")
        
    print("-" * 60)
    if all_verified:
        print("✓ ALL ROLLS VERIFIED - Game is provably fair!")
    else:
        print("✗ VERIFICATION FAILED - Some rolls do not match!")
    
    return all_verified

if __name__ == "__main__":
    main()
`;
  };

  // Download verification script
  const downloadScript = () => {
    const script = generatePythonScript();
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verify-${gameId}.py`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Styles
  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: '#1a1a2e',
    color: '#fff',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '30px'
  };

  const sectionStyle = {
    backgroundColor: '#2a2a4a',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    maxWidth: '900px',
    margin: '0 auto 20px'
  };

  const rollItemStyle = (expanded) => ({
    backgroundColor: '#1a1a2e',
    borderRadius: '8px',
    marginBottom: '10px',
    overflow: 'hidden',
    border: '1px solid #333'
  });

  const rollHeaderStyle = {
    padding: '15px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const rollDetailsStyle = {
    padding: '15px',
    backgroundColor: '#0d0d1a',
    borderTop: '1px solid #333',
    fontSize: '13px',
    fontFamily: 'monospace'
  };

  const statBoxStyle = {
    display: 'inline-block',
    padding: '15px 25px',
    backgroundColor: '#1a1a2e',
    borderRadius: '8px',
    margin: '5px',
    textAlign: 'center'
  };

  const barStyle = (percent) => ({
    height: '20px',
    backgroundColor: '#4CAF50',
    borderRadius: '4px',
    width: `${percent}%`,
    transition: 'width 0.3s ease'
  });

  const buttonStyle = {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 'bold',
    backgroundColor: '#1976D2',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginRight: '10px'
  };

  if (!gameData) {
    return (
      <div style={containerStyle}>
        <div style={{ ...sectionStyle, textAlign: 'center' }}>
          <h2>Game Not Found</h2>
          <p style={{ color: '#888' }}>
            Game data for {gameId} is not available.
          </p>
          <button style={buttonStyle} onClick={() => navigate('/backgammon')}>
            Back to Game
          </button>
        </div>
      </div>
    );
  }

  const duration = gameData.gameEndTime 
    ? Math.floor((gameData.gameEndTime - gameData.gameStartTime) / 1000)
    : 0;
  const durationFormatted = `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={{ color: '#ffd700', marginBottom: '10px' }}>
          🔗 Blockchain Verification
        </h1>
        <p style={{ color: '#888' }}>
          Provably fair dice rolls verified on Ergo blockchain
        </p>
      </div>

      {/* Game Summary */}
      <div style={sectionStyle}>
        <h2 style={{ color: '#ffd700', marginTop: 0 }}>Game Summary</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          <div style={statBoxStyle}>
            <div style={{ color: '#888', fontSize: '12px' }}>Game ID</div>
            <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>{gameId}</div>
          </div>
          <div style={statBoxStyle}>
            <div style={{ color: '#888', fontSize: '12px' }}>Winner</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {gameData.winner === 'white' ? 'Player' : 'AI'}
            </div>
          </div>
          <div style={statBoxStyle}>
            <div style={{ color: '#888', fontSize: '12px' }}>Win Type</div>
            <div style={{ fontSize: '18px', color: '#4CAF50' }}>
              {gameData.winType?.charAt(0).toUpperCase() + gameData.winType?.slice(1)}
            </div>
          </div>
          <div style={statBoxStyle}>
            <div style={{ color: '#888', fontSize: '12px' }}>Final Score</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffd700' }}>
              {gameData.finalScore}
            </div>
          </div>
          <div style={statBoxStyle}>
            <div style={{ color: '#888', fontSize: '12px' }}>Duration</div>
            <div style={{ fontSize: '18px' }}>{durationFormatted}</div>
          </div>
          <div style={statBoxStyle}>
            <div style={{ color: '#888', fontSize: '12px' }}>Total Turns</div>
            <div style={{ fontSize: '18px' }}>{gameData.rollHistory?.length || 0}</div>
          </div>
        </div>
      </div>

      {/* Dice Statistics */}
      {diceStats && (
        <div style={sectionStyle}>
          <h2 style={{ color: '#ffd700', marginTop: 0 }}>Dice Statistics</h2>
          
          {/* Distribution */}
          <h4 style={{ color: '#aaa' }}>Distribution (Expected: 16.67% each)</h4>
          <div style={{ marginBottom: '20px' }}>
            {[1, 2, 3, 4, 5, 6].map(die => {
              const count = diceStats.distribution[die];
              const percent = ((count / diceStats.totalDice) * 100).toFixed(1);
              return (
                <div key={die} style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '20px' }}>⚀⚁⚂⚃⚄⚅'.split('')[die - 1] || die}</span>
                    <span style={{ width: '30px' }}>{die}:</span>
                    <div style={{ flex: 1, backgroundColor: '#1a1a2e', borderRadius: '4px', height: '20px' }}>
                      <div style={barStyle(percent)} />
                    </div>
                    <span style={{ width: '80px', textAlign: 'right' }}>
                      {count} ({percent}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Statistics Summary */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
            <div style={statBoxStyle}>
              <div style={{ color: '#888', fontSize: '12px' }}>Total Dice</div>
              <div style={{ fontSize: '20px' }}>{diceStats.totalDice}</div>
            </div>
            <div style={statBoxStyle}>
              <div style={{ color: '#888', fontSize: '12px' }}>Doubles</div>
              <div style={{ fontSize: '20px' }}>
                {diceStats.doublesCount} ({diceStats.doublesPercent}%)
              </div>
              <div style={{ fontSize: '11px', color: '#666' }}>Expected: ~16.67%</div>
            </div>
            <div style={statBoxStyle}>
              <div style={{ color: '#888', fontSize: '12px' }}>Chi-Squared</div>
              <div style={{ fontSize: '20px' }}>{diceStats.chiSquared}</div>
              <div style={{ fontSize: '11px', color: diceStats.isRandom ? '#4CAF50' : '#f44336' }}>
                {diceStats.isRandom ? '✓ Random (p>0.05)' : '✗ Non-random'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Roll-by-Roll Verification */}
      <div style={sectionStyle}>
        <h2 style={{ color: '#ffd700', marginTop: 0 }}>
          Roll-by-Roll Verification
        </h2>
        <p style={{ color: '#888', marginBottom: '20px' }}>
          Click any roll to see detailed blockchain proof
        </p>

        {gameData.rollHistory?.map((roll, index) => {
          const verification = generateRollVerification(roll, index);
          const isExpanded = expandedRolls[index];

          return (
            <div key={index} style={rollItemStyle(isExpanded)}>
              <div style={rollHeaderStyle} onClick={() => toggleRoll(index)}>
                <div>
                  <span style={{ color: '#888', marginRight: '15px' }}>
                    Turn {index + 1}
                  </span>
                  <span style={{ 
                    color: roll.player === 'white' ? '#f0f0f0' : '#666',
                    marginRight: '15px'
                  }}>
                    {roll.player === 'white' ? 'Player' : 'AI'}
                  </span>
                  <span style={{ fontSize: '20px' }}>
                    🎲 [{roll.dice[0]}, {roll.dice[1]}]
                    {roll.dice[0] === roll.dice[1] && ' (Doubles!)'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ 
                    color: verification.verified ? '#4CAF50' : '#f44336',
                    fontSize: '14px'
                  }}>
                    {verification.verified ? '✓ Verified' : '✗ Mismatch'}
                  </span>
                  <span style={{ color: '#888' }}>{isExpanded ? '▼' : '▶'}</span>
                </div>
              </div>

              {isExpanded && (
                <div style={rollDetailsStyle}>
                  <div style={{ marginBottom: '15px' }}>
                    <strong style={{ color: '#ffd700' }}>Block Hash:</strong>
                    <div style={{ wordBreak: 'break-all', color: '#4CAF50' }}>
                      {roll.blockHash}
                    </div>
                    <a
                      href={`https://explorer.ergoplatform.com/blocks/${roll.blockHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#1976D2', fontSize: '12px' }}
                    >
                      View on Ergo Explorer →
                    </a>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <strong style={{ color: '#ffd700' }}>Seed Input:</strong>
                    <div style={{ wordBreak: 'break-all', color: '#aaa' }}>
                      {verification.seedInput}
                    </div>
                    <div style={{ color: '#666', fontSize: '11px', marginTop: '5px' }}>
                      Formula: blockHash + gameId + turnNumber
                    </div>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <strong style={{ color: '#ffd700' }}>SHA256 Hash:</strong>
                    <div style={{ wordBreak: 'break-all', color: '#aaa' }}>
                      {verification.hash}
                    </div>
                  </div>

                  <div style={{ 
                    backgroundColor: '#1a1a2e', 
                    padding: '15px', 
                    borderRadius: '8px',
                    marginTop: '15px'
                  }}>
                    <strong style={{ color: '#ffd700' }}>Dice Calculation:</strong>
                    <div style={{ marginTop: '10px' }}>
                      <div>
                        Byte 1: 0x{verification.hash.substring(0, 2)} = {verification.byte1}
                        → {verification.byte1} mod 6 + 1 = <strong style={{ color: '#4CAF50' }}>{verification.die1}</strong>
                      </div>
                      <div>
                        Byte 2: 0x{verification.hash.substring(2, 4)} = {verification.byte2}
                        → {verification.byte2} mod 6 + 1 = <strong style={{ color: '#4CAF50' }}>{verification.die2}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Position Replay */}
      <div style={sectionStyle}>
        <h2 style={{ color: '#ffd700', marginTop: 0 }}>Position Replay</h2>
        <div style={{ marginBottom: '15px' }}>
          <input
            type="range"
            min="0"
            max={gameData.rollHistory?.length || 0}
            value={replayPosition}
            onChange={(e) => setReplayPosition(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ textAlign: 'center', color: '#888' }}>
            Turn {replayPosition} of {gameData.rollHistory?.length || 0}
          </div>
        </div>
        <div style={{ 
          backgroundColor: '#1a1a2e', 
          padding: '20px', 
          borderRadius: '8px',
          textAlign: 'center',
          color: '#666'
        }}>
          Position replay visualization would render here
          <br />
          <span style={{ fontSize: '12px' }}>
            (Shows board state at selected turn)
          </span>
        </div>
      </div>

      {/* Verification Script */}
      <div style={sectionStyle}>
        <h2 style={{ color: '#ffd700', marginTop: 0 }}>
          Independent Verification
        </h2>
        <p style={{ color: '#888', marginBottom: '20px' }}>
          Download a Python script to independently verify all dice rolls
        </p>
        <button style={buttonStyle} onClick={downloadScript}>
          📥 Download Verification Script
        </button>
        <div style={{ 
          marginTop: '20px',
          backgroundColor: '#0d0d1a',
          padding: '15px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '12px',
          maxHeight: '200px',
          overflow: 'auto'
        }}>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {generatePythonScript().substring(0, 500)}...
          </pre>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ ...sectionStyle, textAlign: 'center' }}>
        <button style={buttonStyle} onClick={() => navigate('/backgammon')}>
          🎲 Play Again
        </button>
        <button 
          style={{ ...buttonStyle, backgroundColor: '#666' }} 
          onClick={() => navigate('/')}
        >
          🏠 Home
        </button>
      </div>
    </div>
  );
};

export default VerificationPage;
