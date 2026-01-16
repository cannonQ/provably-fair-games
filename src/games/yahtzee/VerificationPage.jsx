/**
 * VerificationPage Component for Yahtzee
 * Displays blockchain verification proof for all dice rolls
 */

import React, { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import CryptoJS from 'crypto-js';
import { generateSeedFromSource, calculateDieValue } from './diceLogic';

const EXPLORER_BASE = 'https://explorer.ergoplatform.com/en';

function VerificationPage() {
  const { gameId: urlGameId } = useParams();
  const [searchParams] = useSearchParams();
  const queryGameId = searchParams.get('gameId');
  const targetGameId = urlGameId || queryGameId;

  const [gameData, setGameData] = useState(null);
  const [expandedTurns, setExpandedTurns] = useState({});
  const [verificationResults, setVerificationResults] = useState({});
  const [showScript, setShowScript] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load game data from sessionStorage or API
  useEffect(() => {
    const loadGameData = async () => {
      setLoading(true);
      setError(null);

      // Try sessionStorage first (for games played in current session)
      const stored = sessionStorage.getItem('yahtzeeVerification');
      if (stored) {
        const data = JSON.parse(stored);
        if (!targetGameId || data.gameId === targetGameId) {
          setGameData(data);
          setExpandedTurns({ 1: true });
          setLoading(false);
          return;
        }
      }

      // If gameId provided but not in sessionStorage, show helpful error
      if (targetGameId) {
        setError('Verification data not found in current session. Yahtzee verification requires roll-by-roll data that is only available during the game session. Play a new game and click "Verify Rolls" to see full verification.');
      } else {
        setError('No game ID provided. Play a Yahtzee game and click "Verify Rolls" to see blockchain proof for every dice roll.');
      }

      setLoading(false);
    };

    loadGameData();
  }, [targetGameId]);

  // Group rolls by turn
  const getRollsByTurn = () => {
    if (!gameData?.rollHistory) return {};
    const byTurn = {};
    gameData.rollHistory.forEach(roll => {
      if (!byTurn[roll.turn]) byTurn[roll.turn] = [];
      byTurn[roll.turn].push(roll);
    });
    return byTurn;
  };

  // Verify a single roll
  const verifyRoll = (roll) => {
    const rollSource = {
      blockHash: roll.blockHash,
      txHash: roll.txHash,
      timestamp: roll.timestamp,
      txIndex: roll.txIndex
    };
    
    const seed = generateSeedFromSource(rollSource, gameData.gameId, roll.turn, roll.roll);
    const calculatedDice = [0, 1, 2, 3, 4].map(i => calculateDieValue(seed, i));
    
    const matches = JSON.stringify(calculatedDice) === JSON.stringify(roll.diceValues);
    
    setVerificationResults(prev => ({
      ...prev,
      [`${roll.turn}-${roll.roll}`]: { matches, calculated: calculatedDice, seed }
    }));
  };

  // Toggle turn expansion
  const toggleTurn = (turn) => {
    setExpandedTurns(prev => ({ ...prev, [turn]: !prev[turn] }));
  };

  // Truncate hash for display
  const truncateHash = (hash, len = 12) => {
    if (!hash) return 'N/A';
    return `${hash.slice(0, len)}...${hash.slice(-6)}`;
  };

  // Format timestamp
  const formatTimestamp = (ts) => {
    return new Date(ts).toLocaleString();
  };

  // Get source icon and color
  const getSourceStyle = (source) => {
    switch (source) {
      case 'anchor':
        return { icon: '🔵', color: '#1976d2', label: 'Anchor Block' };
      case 'trace':
        return { icon: '🟢', color: '#388e3c', label: 'Traced Block' };
      case 'restart':
        return { icon: '🟡', color: '#f57c00', label: 'Restart Block' };
      default:
        return { icon: '⚪', color: '#666', label: 'Unknown' };
    }
  };

  // Generate Python verification script
  const generatePythonScript = () => {
    return `#!/usr/bin/env python3
"""
Yahtzee Verification Script
Game ID: ${gameData?.gameId}
Generated: ${new Date().toISOString()}

This script verifies the dice rolls from a provably fair Yahtzee game
by recalculating seeds and dice values from blockchain data.
"""

import hashlib
import json
import requests

GAME_ID = "${gameData?.gameId}"
ANCHOR_BLOCK_HEIGHT = ${gameData?.anchor?.blockHeight}
ANCHOR_BLOCK_HASH = "${gameData?.anchor?.blockHash}"

# Roll history from the game
ROLL_HISTORY = ${JSON.stringify(gameData?.rollHistory || [], null, 2)}

def sha256(data: str) -> str:
    """Calculate SHA256 hash of string"""
    return hashlib.sha256(data.encode()).hexdigest()

def generate_seed(block_hash: str, tx_hash: str, timestamp: int, 
                  game_id: str, tx_index: int, turn: int, roll: int) -> str:
    """Generate seed from blockchain data (matches diceLogic.js)"""
    turn_roll = f"T{turn}R{roll}"
    seed_input = f"{block_hash}{tx_hash}{timestamp}{game_id}{tx_index}{turn_roll}"
    return sha256(seed_input)

def calculate_die_value(seed: str, die_index: int) -> int:
    """Calculate single die value from seed (matches diceLogic.js)"""
    die_hash = sha256(seed + str(die_index))
    numeric_value = int(die_hash[:8], 16)
    return (numeric_value % 6) + 1

def verify_roll(roll_data: dict) -> dict:
    """Verify a single roll against blockchain data"""
    seed = generate_seed(
        roll_data['blockHash'],
        roll_data['txHash'],
        roll_data['timestamp'],
        GAME_ID,
        roll_data['txIndex'],
        roll_data['turn'],
        roll_data['roll']
    )
    
    calculated_dice = [calculate_die_value(seed, i) for i in range(5)]
    recorded_dice = roll_data['diceValues']
    
    return {
        'turn': roll_data['turn'],
        'roll': roll_data['roll'],
        'source': roll_data['source'],
        'seed_matches': seed == roll_data.get('seed', seed),
        'dice_match': calculated_dice == recorded_dice,
        'calculated': calculated_dice,
        'recorded': recorded_dice,
        'block_height': roll_data['blockHeight']
    }

def fetch_block(block_hash: str) -> dict:
    """Fetch block data from Ergo explorer API"""
    url = f"https://api.ergoplatform.com/api/v1/blocks/{block_hash}"
    response = requests.get(url)
    return response.json() if response.ok else None

def verify_anchor_block() -> bool:
    """Verify anchor block exists and matches"""
    print(f"\\nVerifying anchor block #{ANCHOR_BLOCK_HEIGHT}...")
    block = fetch_block(ANCHOR_BLOCK_HASH)
    if block and block['header']['height'] == ANCHOR_BLOCK_HEIGHT:
        print(f"  ✓ Anchor block verified")
        return True
    print(f"  ✗ Anchor block verification failed")
    return False

def main():
    print("=" * 60)
    print(f"YAHTZEE VERIFICATION - Game {GAME_ID}")
    print("=" * 60)
    
    # Verify anchor
    verify_anchor_block()
    
    # Verify each roll
    print(f"\\nVerifying {len(ROLL_HISTORY)} rolls...\\n")
    
    all_valid = True
    for roll_data in ROLL_HISTORY:
        result = verify_roll(roll_data)
        status = "✓" if result['dice_match'] else "✗"
        source_icon = {'anchor': '🔵', 'trace': '🟢', 'restart': '🟡'}.get(result['source'], '⚪')
        
        print(f"Turn {result['turn']}, Roll {result['roll']} {source_icon}")
        print(f"  Block: #{result['block_height']}")
        print(f"  Calculated: {result['calculated']}")
        print(f"  Recorded:   {result['recorded']}")
        print(f"  Status: {status} {'VALID' if result['dice_match'] else 'MISMATCH'}")
        print()
        
        if not result['dice_match']:
            all_valid = False
    
    print("=" * 60)
    if all_valid:
        print("✓ ALL ROLLS VERIFIED - Game is provably fair!")
    else:
        print("✗ VERIFICATION FAILED - Some rolls don't match")
    print("=" * 60)

if __name__ == "__main__":
    main()
`;
  };

  // Download script
  const downloadScript = () => {
    const script = generatePythonScript();
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yahtzee_verify_${gameData?.gameId}.py`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Styles - Dark theme to match app
  const containerStyle = {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace',
    color: '#eee'
  };

  const headerStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#fff'
  };

  const boxStyle = {
    backgroundColor: '#16213e',
    border: '1px solid #2a3a5e',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '20px',
    color: '#eee'
  };

  const anchorBoxStyle = {
    ...boxStyle,
    backgroundColor: '#1a3a5c',
    borderColor: '#4a9eff'
  };

  const turnHeaderStyle = (isExpanded) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 15px',
    backgroundColor: isExpanded ? '#1a3a5c' : '#16213e',
    border: '1px solid #2a3a5e',
    borderRadius: isExpanded ? '8px 8px 0 0' : '8px',
    cursor: 'pointer',
    marginTop: '10px',
    color: '#eee'
  });

  const turnContentStyle = {
    border: '1px solid #2a3a5e',
    borderTop: 'none',
    borderRadius: '0 0 8px 8px',
    padding: '15px',
    backgroundColor: '#0d1525',
    color: '#eee'
  };

  const rollBoxStyle = (source) => {
    const style = getSourceStyle(source);
    return {
      backgroundColor: '#16213e',
      border: `2px solid ${style.color}`,
      borderRadius: '8px',
      padding: '15px',
      marginBottom: '15px',
      color: '#eee'
    };
  };

  const codeBlockStyle = {
    backgroundColor: '#263238',
    color: '#aed581',
    padding: '12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontFamily: 'monospace',
    overflowX: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all'
  };

  const linkStyle = {
    color: '#64b5f6',
    textDecoration: 'none',
    fontSize: '12px'
  };

  const buttonStyle = {
    backgroundColor: '#1976d2',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    marginRight: '10px'
  };

  const verifyButtonStyle = (result) => ({
    ...buttonStyle,
    backgroundColor: result?.matches ? '#4caf50' : result?.matches === false ? '#f44336' : '#1976d2'
  });

  // Loading state
  if (loading) {
    return (
      <div style={containerStyle}>
        <Link to="/yahtzee" style={linkStyle}>← Back to Yahtzee</Link>
        <div style={{ ...boxStyle, marginTop: '20px', textAlign: 'center' }}>
          <h2>Loading verification data...</h2>
          <p>Please wait while we load the game data.</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={containerStyle}>
        <Link to="/yahtzee" style={linkStyle}>← Back to Yahtzee</Link>
        <div style={{ ...boxStyle, marginTop: '20px', textAlign: 'center' }}>
          <h2>❌ Verification Error</h2>
          <p style={{ color: '#f44336' }}>{error}</p>
          <Link to="/yahtzee">
            <button style={buttonStyle}>Play Yahtzee</button>
          </Link>
        </div>
      </div>
    );
  }

  // No data state
  if (!gameData) {
    return (
      <div style={containerStyle}>
        <Link to="/yahtzee" style={linkStyle}>← Back to Yahtzee</Link>
        <div style={{ ...boxStyle, marginTop: '20px', textAlign: 'center' }}>
          <h2>No Verification Data Found</h2>
          <p>Play a game of Yahtzee to generate verification data.</p>
          <Link to="/yahtzee">
            <button style={buttonStyle}>Play Yahtzee</button>
          </Link>
        </div>
      </div>
    );
  }

  const rollsByTurn = getRollsByTurn();
  const totalRolls = gameData.rollHistory?.length || 0;
  const totalTurns = Object.keys(rollsByTurn).length;

  return (
    <div style={containerStyle}>
      {/* Navigation */}
      <div style={{ marginBottom: '20px' }}>
        <Link to="/yahtzee" style={linkStyle}>← Back to Yahtzee</Link>
      </div>

      {/* Header */}
      <h1 style={headerStyle}>
        🔍 Yahtzee Verification
      </h1>
      <div style={{ color: '#aaa', marginBottom: '20px' }}>
        Game ID: <code style={{ color: '#64b5f6' }}>{gameData.gameId}</code> | 
        Player: {gameData.playerName} | 
        Final Score: <strong style={{ color: '#4ade80' }}>{gameData.finalScore}</strong>
      </div>

      {/* Anchor Block Info */}
      <div style={anchorBoxStyle}>
        <h3 style={{ margin: '0 0 10px 0' }}>🔵 Anchor Block (Game Start)</h3>
        <div style={{ fontSize: '14px' }}>
          <div><strong>Block Height:</strong> #{gameData.anchor?.blockHeight?.toLocaleString()}</div>
          <div>
            <strong>Block Hash:</strong>{' '}
            <code>{truncateHash(gameData.anchor?.blockHash, 20)}</code>
            <a 
              href={`${EXPLORER_BASE}/blocks/${gameData.anchor?.blockHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...linkStyle, marginLeft: '10px' }}
            >
              View on Explorer ↗
            </a>
          </div>
          <div><strong>Timestamp:</strong> {formatTimestamp(gameData.anchor?.timestamp)}</div>
          <div><strong>Transactions:</strong> {gameData.anchor?.txList?.length || 0} available for tracing</div>
        </div>
      </div>

      {/* Summary */}
      <div style={boxStyle}>
        <h3 style={{ margin: '0 0 10px 0' }}>📊 Game Summary</h3>
        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
          <div><strong>Total Turns:</strong> {totalTurns}</div>
          <div><strong>Total Rolls:</strong> {totalRolls}</div>
          <div><strong>Final Score:</strong> {gameData.finalScore}</div>
        </div>
      </div>

      {/* Anti-Spoofing Explanation */}
      <div style={{ ...boxStyle, backgroundColor: '#2a2a1e', borderColor: '#ff9800' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#ffb74d' }}>🔒 Anti-Spoofing Mechanism</h3>
        <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#eee' }}>
          This game uses <strong>block traversal</strong> instead of fetching new blocks for each roll:
        </p>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#ccc' }}>
          <li><strong>Roll 1:</strong> Uses the anchor block (committed at game start)</li>
          <li><strong>Roll 2-3:</strong> Traces backwards through transaction inputs to find historical blocks</li>
          <li><strong>Dead ends:</strong> If a coinbase TX is hit, a fresh block with now() timestamp is used</li>
        </ul>
        <p style={{ margin: '10px 0 0 0', fontSize: '13px', color: '#4ade80' }}>
          Players cannot manipulate results because: (1) anchor is committed before rolling, 
          (2) trace path is deterministic, (3) restart timing is unpredictable.
        </p>
      </div>

      {/* Turn-by-Turn Verification */}
      <h2 style={{ marginTop: '30px', marginBottom: '10px' }}>📋 Roll-by-Roll Verification</h2>
      
      {Object.entries(rollsByTurn).map(([turn, rolls]) => (
        <div key={turn}>
          <div 
            style={turnHeaderStyle(expandedTurns[turn])}
            onClick={() => toggleTurn(turn)}
          >
            <span>
              <strong>Turn {turn}</strong>
              <span style={{ color: '#aaa', marginLeft: '15px' }}>
                {rolls.length} roll{rolls.length > 1 ? 's' : ''}
              </span>
            </span>
            <span>{expandedTurns[turn] ? '▼' : '▶'}</span>
          </div>

          {expandedTurns[turn] && (
            <div style={turnContentStyle}>
              {rolls.map((roll, idx) => {
                const sourceStyle = getSourceStyle(roll.source);
                const verifyKey = `${roll.turn}-${roll.roll}`;
                const verifyResult = verificationResults[verifyKey];

                return (
                  <div key={idx} style={rollBoxStyle(roll.source)}>
                    {/* Roll Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span>
                        <strong style={{ color: sourceStyle.color }}>
                          {sourceStyle.icon} Roll {roll.roll}
                        </strong>
                        <span style={{ marginLeft: '10px', fontSize: '13px', color: '#666' }}>
                          {sourceStyle.label}
                        </span>
                      </span>
                      <span style={{ fontSize: '13px' }}>
                        Trace Depth: {roll.traceDepth}
                      </span>
                    </div>

                    {/* Restart Warning */}
                    {roll.source === 'restart' && (
                      <div style={{ 
                        backgroundColor: '#3d2a1a', 
                        padding: '10px', 
                        borderRadius: '6px',
                        marginBottom: '10px',
                        fontSize: '13px',
                        color: '#ffb74d',
                        border: '1px solid #ff9800'
                      }}>
                        ⚠️ <strong>Restart occurred:</strong> Coinbase transaction hit (no inputs to trace).
                        Fresh block fetched with player's click timestamp for unpredictable entropy.
                      </div>
                    )}

                    {/* Block Info */}
                    <div style={{ fontSize: '13px', marginBottom: '10px' }}>
                      <div>
                        <strong>Block:</strong> #{roll.blockHeight?.toLocaleString()}
                        <a 
                          href={`${EXPLORER_BASE}/blocks/${roll.blockHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ ...linkStyle, marginLeft: '10px' }}
                        >
                          View ↗
                        </a>
                      </div>
                      <div>
                        <strong>TX:</strong> {truncateHash(roll.txHash)} (index: {roll.txIndex})
                        <a 
                          href={`${EXPLORER_BASE}/transactions/${roll.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ ...linkStyle, marginLeft: '10px' }}
                        >
                          View ↗
                        </a>
                      </div>
                      {roll.parentTxHash && (
                        <div>
                          <strong>Traced from:</strong> {truncateHash(roll.parentTxHash)}
                          <a 
                            href={`${EXPLORER_BASE}/transactions/${roll.parentTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ ...linkStyle, marginLeft: '10px' }}
                          >
                            View ↗
                          </a>
                        </div>
                      )}
                      <div>
                        <strong>Timestamp:</strong> {formatTimestamp(roll.timestamp)}
                        {roll.nowTimestamp && (
                          <span style={{ color: '#f57c00', marginLeft: '10px' }}>
                            (player click time)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Seed Formula */}
                    <div style={codeBlockStyle}>
{`Seed = SHA256(
  blockHash:  "${truncateHash(roll.blockHash, 16)}"
  + txHash:   "${truncateHash(roll.txHash, 16)}"
  + timestamp: "${roll.timestamp}"
  + gameId:   "${gameData.gameId}"
  + txIndex:  "${roll.txIndex}"
  + turnRoll: "T${roll.turn}R${roll.roll}"
)
= ${truncateHash(roll.seed, 24)}`}
                    </div>

                    {/* Dice Values */}
                    <div style={{ marginTop: '10px' }}>
                      <strong>Dice Values:</strong>{' '}
                      <span style={{ 
                        fontFamily: 'monospace', 
                        backgroundColor: '#1a3d1a',
                        color: '#4ade80',
                        padding: '4px 8px',
                        borderRadius: '4px'
                      }}>
                        [{roll.diceValues?.join(', ')}]
                      </span>
                    </div>

                    {/* Verify Button */}
                    <div style={{ marginTop: '15px' }}>
                      <button 
                        style={verifyButtonStyle(verifyResult)}
                        onClick={() => verifyRoll(roll)}
                      >
                        {verifyResult?.matches ? '✓ Verified!' : 
                         verifyResult?.matches === false ? '✗ Mismatch' : 
                         'Recalculate & Verify'}
                      </button>
                      {verifyResult && (
                        <span style={{ fontSize: '12px', marginLeft: '10px', color: '#aaa' }}>
                          Calculated: [{verifyResult.calculated?.join(', ')}]
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* Verification Script */}
      <div style={{ ...boxStyle, marginTop: '30px' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>🐍 Python Verification Script</h3>
        <p style={{ fontSize: '14px', marginBottom: '15px' }}>
          Download and run this script to independently verify all dice rolls:
        </p>
        <button style={buttonStyle} onClick={downloadScript}>
          Download verify_{gameData.gameId}.py
        </button>
        <button 
          style={{ ...buttonStyle, backgroundColor: '#666' }}
          onClick={() => setShowScript(!showScript)}
        >
          {showScript ? 'Hide Script' : 'View Script'}
        </button>
        
        {showScript && (
          <pre style={{ ...codeBlockStyle, marginTop: '15px', maxHeight: '400px', overflow: 'auto' }}>
            {generatePythonScript()}
          </pre>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '30px', color: '#999', fontSize: '13px' }}>
        Verified using Ergo blockchain data | 
        <a href="https://ergoplatform.org" target="_blank" rel="noopener noreferrer" style={linkStyle}>
          {' '}Learn about Ergo
        </a>
      </div>
    </div>
  );
}

export default VerificationPage;
