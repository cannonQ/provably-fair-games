/**
 * 2048 Verification Page - Blockchain proof for all tile spawns
 * @module VerificationPage
 */

import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { verifySpawn, generateMasterSeed } from './spawnLogic';
import { formatScore } from './scoreLogic';
import CryptoJS from 'crypto-js';

/**
 * Generate Python verification script
 */
const generatePythonScript = (gameId, spawnHistory) => {
  const spawnsJson = JSON.stringify(spawnHistory.map(s => ({
    moveNumber: s.moveNumber,
    blockHash: s.blockHash,
    row: s.row,
    col: s.col,
    value: s.value,
    emptyCells: s.emptyCells.map(c => [c.row, c.col])
  })), null, 2);

  return `#!/usr/bin/env python3
"""
2048 Provably Fair Verification Script
Game ID: ${gameId}
Generated: ${new Date().toISOString()}
"""

import hashlib

def verify_2048_spawn(block_hash, game_id, move_number, empty_cells, expected_row, expected_col, expected_value):
    """Verify a single tile spawn using blockchain randomness."""
    # Generate master seed
    input_str = f"{block_hash}{game_id}{move_number}"
    master_seed = hashlib.sha256(input_str.encode()).hexdigest()
    
    # Calculate position
    position_seed = hashlib.sha256(f"{master_seed}position".encode()).hexdigest()
    position_index = int(position_seed[:8], 16) % len(empty_cells)
    calc_row, calc_col = empty_cells[position_index]
    
    # Calculate value (90% = 2, 10% = 4)
    value_seed = hashlib.sha256(f"{master_seed}value".encode()).hexdigest()
    value_roll = int(value_seed[:8], 16) % 100
    calc_value = 2 if value_roll < 90 else 4
    
    match = (calc_row == expected_row and calc_col == expected_col and calc_value == expected_value)
    return {
        'match': match,
        'master_seed': master_seed,
        'position_seed': position_seed,
        'value_seed': value_seed,
        'position_index': position_index,
        'value_roll': value_roll,
        'calculated': (calc_row, calc_col, calc_value),
        'expected': (expected_row, expected_col, expected_value)
    }

# Game data
game_id = "${gameId}"
spawns = ${spawnsJson}

# Verify each spawn
print(f"Verifying {len(spawns)} spawns for game {game_id[:8]}...\\n")
all_match = True

for spawn in spawns:
    result = verify_2048_spawn(
        spawn['blockHash'],
        game_id,
        spawn['moveNumber'],
        spawn['emptyCells'],
        spawn['row'],
        spawn['col'],
        spawn['value']
    )
    
    status = "✓ MATCH" if result['match'] else "✗ MISMATCH"
    print(f"Move {spawn['moveNumber']}: {status}")
    print(f"  Block: {spawn['blockHash'][:16]}...")
    print(f"  Position: ({result['calculated'][0]},{result['calculated'][1]}) = {result['calculated'][2]}")
    
    if not result['match']:
        all_match = False
        print(f"  Expected: ({result['expected'][0]},{result['expected'][1]}) = {result['expected'][2]}")
    print()

print("=" * 50)
if all_match:
    print("✓ ALL SPAWNS VERIFIED - Game is provably fair!")
else:
    print("✗ VERIFICATION FAILED - Some spawns don't match!")
`;
};

/**
 * VerificationPage Component
 */
const VerificationPage = () => {
  const location = useLocation();
  const { gameId, score, spawnHistory, moveHistory, gameStatus } = location.state || {};
  
  const [expandedSpawns, setExpandedSpawns] = useState(new Set());
  const [copiedSeed, setCopiedSeed] = useState(null);

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#faf8ef',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    },
    wrapper: {
      maxWidth: '900px',
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
    section: {
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    sectionTitle: {
      fontSize: '1.2rem',
      fontWeight: 'bold',
      color: '#776e65',
      marginTop: 0,
      marginBottom: '15px'
    },
    summaryGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '15px'
    },
    summaryItem: {
      textAlign: 'center',
      padding: '15px',
      backgroundColor: '#bbada0',
      borderRadius: '6px'
    },
    summaryLabel: {
      fontSize: '0.75rem',
      color: '#eee4da',
      textTransform: 'uppercase',
      marginBottom: '5px'
    },
    summaryValue: {
      fontSize: '1.4rem',
      fontWeight: 'bold',
      color: '#ffffff'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    th: {
      textAlign: 'left',
      padding: '12px 8px',
      borderBottom: '2px solid #bbada0',
      color: '#776e65',
      fontSize: '0.85rem'
    },
    td: {
      padding: '12px 8px',
      borderBottom: '1px solid #eee4da',
      fontSize: '0.9rem',
      color: '#776e65'
    },
    expandButton: {
      background: 'none',
      border: 'none',
      color: '#8f7a66',
      cursor: 'pointer',
      fontSize: '1rem'
    },
    detailsBox: {
      backgroundColor: '#f5f5f5',
      padding: '15px',
      borderRadius: '6px',
      marginTop: '10px',
      fontSize: '0.85rem'
    },
    detailRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '5px 0',
      borderBottom: '1px solid #e0e0e0',
      flexWrap: 'wrap',
      gap: '10px'
    },
    detailLabel: {
      color: '#888',
      minWidth: '120px'
    },
    detailValue: {
      fontFamily: 'monospace',
      wordBreak: 'break-all',
      flex: 1,
      textAlign: 'right'
    },
    matchBadge: {
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '0.8rem',
      fontWeight: 'bold'
    },
    matchSuccess: {
      backgroundColor: '#4caf50',
      color: 'white'
    },
    matchFail: {
      backgroundColor: '#f44336',
      color: 'white'
    },
    copyButton: {
      background: 'none',
      border: '1px solid #bbada0',
      borderRadius: '4px',
      padding: '2px 8px',
      cursor: 'pointer',
      fontSize: '0.75rem',
      marginLeft: '8px',
      color: '#8f7a66'
    },
    downloadButton: {
      display: 'inline-block',
      padding: '12px 24px',
      backgroundColor: '#8f7a66',
      color: '#f9f6f2',
      textDecoration: 'none',
      borderRadius: '6px',
      fontWeight: 'bold',
      border: 'none',
      cursor: 'pointer',
      fontSize: '1rem'
    },
    explorerLink: {
      color: '#8f7a66',
      textDecoration: 'underline'
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px',
      color: '#9e948a'
    },
    mobileCard: {
      display: 'none'
    }
  };

  // Verify all spawns
  const verificationResults = useMemo(() => {
    if (!spawnHistory) return [];
    
    return spawnHistory.map(spawn => {
      const result = verifySpawn(
        spawn.blockHash,
        gameId,
        spawn.moveNumber,
        spawn.row,
        spawn.col,
        spawn.value,
        spawn.emptyCells
      );
      return { spawn, ...result };
    });
  }, [spawnHistory, gameId]);

  const allValid = verificationResults.every(r => r.valid);

  const toggleExpand = (index) => {
    const newExpanded = new Set(expandedSpawns);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSpawns(newExpanded);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedSeed(id);
    setTimeout(() => setCopiedSeed(null), 2000);
  };

  const downloadScript = () => {
    const script = generatePythonScript(gameId, spawnHistory);
    const blob = new Blob([script], { type: 'text/python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verify_2048_${gameId.slice(0, 8)}.py`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // No game data
  if (!gameId || !spawnHistory) {
    return (
      <div style={styles.container}>
        <div style={styles.wrapper}>
          <div style={styles.header}>
            <h1 style={styles.title}>🔍 Verification</h1>
            <Link to="/2048" style={styles.backLink}>← Back to Game</Link>
          </div>
          <div style={{ ...styles.section, ...styles.emptyState }}>
            <p>No game data to verify.</p>
            <p>Play a game first, then return here to verify the spawns.</p>
            <Link to="/2048" style={{ ...styles.downloadButton, marginTop: '20px', display: 'inline-block' }}>
              Play 2048
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>🔍 Verification</h1>
          <Link to="/2048" style={styles.backLink}>← Back to Game</Link>
        </div>

        {/* Game Summary */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Game Summary</h2>
          <div style={styles.summaryGrid}>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Final Score</div>
              <div style={styles.summaryValue}>{formatScore(score)}</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Moves</div>
              <div style={styles.summaryValue}>{moveHistory?.length || 0}</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Tiles Spawned</div>
              <div style={styles.summaryValue}>{spawnHistory.length}</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Status</div>
              <div style={styles.summaryValue}>
                {gameStatus === 'won' ? '🏆 Won' : gameStatus === 'lost' ? '💀 Lost' : '▶️ Playing'}
              </div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Verification</div>
              <div style={styles.summaryValue}>
                {allValid ? '✓ Valid' : '✗ Invalid'}
              </div>
            </div>
          </div>
          <p style={{ marginTop: '15px', fontSize: '0.85rem', color: '#9e948a' }}>
            Game ID: <code style={{ fontFamily: 'monospace' }}>{gameId}</code>
          </p>
        </div>

        {/* Spawn History */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Spawn History ({spawnHistory.length} tiles)</h2>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Move</th>
                  <th style={styles.th}>Block</th>
                  <th style={styles.th}>Tile</th>
                  <th style={styles.th}>Seed</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {verificationResults.map((result, index) => (
                  <React.Fragment key={index}>
                    <tr>
                      <td style={styles.td}>#{result.spawn.moveNumber}</td>
                      <td style={styles.td}>
                        <a
                          href={`https://explorer.ergoplatform.com/en/blocks/${result.spawn.blockHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.explorerLink}
                        >
                          {result.spawn.blockHeight}
                        </a>
                      </td>
                      <td style={styles.td}>
                        ({result.spawn.row},{result.spawn.col}) = {result.spawn.value}
                      </td>
                      <td style={styles.td}>
                        <code style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {result.seed.slice(0, 16)}...
                        </code>
                        <button
                          style={styles.copyButton}
                          onClick={() => copyToClipboard(result.seed, index)}
                        >
                          {copiedSeed === index ? '✓' : 'Copy'}
                        </button>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.matchBadge,
                          ...(result.valid ? styles.matchSuccess : styles.matchFail)
                        }}>
                          {result.valid ? '✓' : '✗'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button
                          style={styles.expandButton}
                          onClick={() => toggleExpand(index)}
                        >
                          {expandedSpawns.has(index) ? '▼' : '▶'}
                        </button>
                      </td>
                    </tr>
                    {expandedSpawns.has(index) && (
                      <tr>
                        <td colSpan="6" style={{ padding: '0 8px 12px' }}>
                          <div style={styles.detailsBox}>
                            <div style={styles.detailRow}>
                              <span style={styles.detailLabel}>Block Hash</span>
                              <span style={styles.detailValue}>{result.spawn.blockHash}</span>
                            </div>
                            <div style={styles.detailRow}>
                              <span style={styles.detailLabel}>Master Seed</span>
                              <span style={styles.detailValue}>{result.seed}</span>
                            </div>
                            <div style={styles.detailRow}>
                              <span style={styles.detailLabel}>Empty Cells</span>
                              <span style={styles.detailValue}>
                                {result.spawn.emptyCellCount} cells: [{result.spawn.emptyCells.map(c => `(${c.row},${c.col})`).join(', ')}]
                              </span>
                            </div>
                            <div style={styles.detailRow}>
                              <span style={styles.detailLabel}>Position Calc</span>
                              <span style={styles.detailValue}>
                                SHA256(seed+"position") mod {result.spawn.emptyCellCount} = index {result.spawn.emptyCells.findIndex(c => c.row === result.spawn.row && c.col === result.spawn.col)}
                              </span>
                            </div>
                            <div style={styles.detailRow}>
                              <span style={styles.detailLabel}>Value Calc</span>
                              <span style={styles.detailValue}>
                                SHA256(seed+"value") mod 100 → {result.spawn.value === 2 ? '< 90 = 2' : '≥ 90 = 4'}
                              </span>
                            </div>
                            <div style={styles.detailRow}>
                              <span style={styles.detailLabel}>Calculated</span>
                              <span style={styles.detailValue}>
                                ({result.calculated?.row},{result.calculated?.col}) = {result.calculated?.value}
                              </span>
                            </div>
                            <div style={styles.detailRow}>
                              <span style={styles.detailLabel}>Recorded</span>
                              <span style={styles.detailValue}>
                                ({result.spawn.row},{result.spawn.col}) = {result.spawn.value}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Download Script */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Independent Verification</h2>
          <p style={{ color: '#776e65', marginBottom: '15px' }}>
            Download a Python script to independently verify all spawns using the Ergo blockchain.
          </p>
          <button style={styles.downloadButton} onClick={downloadScript}>
            Download Python Script
          </button>
          <p style={{ color: '#9e948a', fontSize: '0.8rem', marginTop: '10px' }}>
            Requires Python 3.x. Run: <code>python3 verify_2048_{gameId.slice(0, 8)}.py</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerificationPage;
