/**
 * 2048 Verification Page - Anchor/Fanning blockchain proof
 * @module VerificationPage
 *
 * Shows that all spawns derive from a single anchor block.
 * Formula: SHA256(anchorBlockHash + gameId + spawnIndex)
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { verifySpawn, generateMasterSeed } from './spawnLogic';
import { formatScore } from './scoreLogic';
import { encodeMoveHistory } from './gameState';
import GameReplay from './GameReplay';

/**
 * Generate Python verification script for anchor/fanning approach
 */
const generatePythonScript = (gameId, anchorBlock, spawnHistory) => {
  const spawnsJson = JSON.stringify(spawnHistory.map(s => ({
    spawnIndex: s.moveNumber,
    row: s.row,
    col: s.col,
    value: s.value,
    emptyCells: s.emptyCells.map(c => [c.row, c.col])
  })), null, 2);

  return `#!/usr/bin/env python3
"""
2048 Provably Fair Verification Script (Anchor/Fanning Pattern)
Game ID: ${gameId}
Anchor Block: #${anchorBlock?.blockHeight || 'N/A'}
Generated: ${new Date().toISOString()}

All spawns derive from the SAME anchor block hash.
Formula: SHA256(anchorBlockHash + gameId + spawnIndex)
"""

import hashlib

# Game Configuration
GAME_ID = "${gameId}"
ANCHOR_BLOCK_HASH = "${anchorBlock?.blockHash || ''}"
ANCHOR_BLOCK_HEIGHT = ${anchorBlock?.blockHeight || 0}

# Spawn Data
SPAWNS = ${spawnsJson}

def verify_spawn(anchor_hash, game_id, spawn_index, empty_cells, expected_row, expected_col, expected_value):
    """Verify a single tile spawn using anchor/fanning pattern."""
    # Generate master seed: SHA256(anchorBlockHash + gameId + spawnIndex)
    input_str = f"{anchor_hash}{game_id}{spawn_index}"
    master_seed = hashlib.sha256(input_str.encode()).hexdigest()

    # Calculate position: SHA256(masterSeed + "position")
    position_seed = hashlib.sha256(f"{master_seed}position".encode()).hexdigest()
    position_index = int(position_seed[:8], 16) % len(empty_cells)
    calc_row, calc_col = empty_cells[position_index]

    # Calculate value: SHA256(masterSeed + "value") mod 100
    # < 90 = tile value 2, >= 90 = tile value 4
    value_seed = hashlib.sha256(f"{master_seed}value".encode()).hexdigest()
    value_roll = int(value_seed[:8], 16) % 100
    calc_value = 2 if value_roll < 90 else 4

    match = (calc_row == expected_row and calc_col == expected_col and calc_value == expected_value)

    return {
        'match': match,
        'master_seed': master_seed,
        'position_index': position_index,
        'value_roll': value_roll,
        'calculated': (calc_row, calc_col, calc_value),
        'expected': (expected_row, expected_col, expected_value)
    }

def main():
    print("=" * 60)
    print("2048 PROVABLY FAIR VERIFICATION")
    print("=" * 60)
    print(f"Game ID: {GAME_ID}")
    print(f"Anchor Block: #{ANCHOR_BLOCK_HEIGHT}")
    print(f"Anchor Hash: {ANCHOR_BLOCK_HASH[:32]}...")
    print(f"Total Spawns: {len(SPAWNS)}")
    print()
    print("All spawns use the SAME anchor block (fanning pattern)")
    print("-" * 60)

    all_match = True

    for spawn in SPAWNS:
        result = verify_spawn(
            ANCHOR_BLOCK_HASH,
            GAME_ID,
            spawn['spawnIndex'],
            spawn['emptyCells'],
            spawn['row'],
            spawn['col'],
            spawn['value']
        )

        status = "✓" if result['match'] else "✗"
        print(f"Spawn #{spawn['spawnIndex']:3d}: {status} ({result['calculated'][0]},{result['calculated'][1]})={result['calculated'][2]}")

        if not result['match']:
            all_match = False
            print(f"         Expected: ({result['expected'][0]},{result['expected'][1]})={result['expected'][2]}")

    print("-" * 60)
    if all_match:
        print("✓ ALL SPAWNS VERIFIED - Game is provably fair!")
        print()
        print("You can verify the anchor block on Ergo Explorer:")
        print(f"https://explorer.ergoplatform.com/en/blocks/{ANCHOR_BLOCK_HASH}")
    else:
        print("✗ VERIFICATION FAILED - Some spawns don't match!")

    return all_match

if __name__ == "__main__":
    main()
`;
};

/**
 * VerificationPage Component
 */
const VerificationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { gameId: urlGameId } = useParams();

  // Detect if accessed from leaderboard (URL has gameId param)
  const isFromLeaderboard = !!urlGameId;

  // Try location.state first, then localStorage (for new tab opens)
  const getGameData = () => {
    if (location.state?.gameId) {
      return location.state;
    }
    try {
      const stored = localStorage.getItem('2048_verify_data');
      if (stored) {
        const data = JSON.parse(stored);
        // If from leaderboard, check if stored game matches requested game
        if (isFromLeaderboard && data.gameId !== urlGameId) {
          return { mismatch: true, requestedGameId: urlGameId };
        }
        return data;
      }
    } catch (e) {
      console.error('Failed to parse stored verify data:', e);
    }
    return isFromLeaderboard ? { mismatch: true, requestedGameId: urlGameId } : {};
  };

  const gameData = getGameData();
  const { gameId, score, spawnHistory, moveHistory, gameStatus, anchorBlock } = gameData.mismatch ? {} : gameData;

  const [expandedSpawns, setExpandedSpawns] = useState(new Set());
  const [copiedSeed, setCopiedSeed] = useState(null);

  // State for fetching leaderboard data (for replay mode)
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Fetch game data from leaderboard when accessing historical game
  useEffect(() => {
    if (gameData.mismatch && urlGameId) {
      setFetchLoading(true);
      fetch(`/api/leaderboard?game=2048&gameId=${urlGameId}`)
        .then(res => res.json())
        .then(data => {
          if (data.entries && data.entries.length > 0) {
            setLeaderboardData(data.entries[0]);
          } else {
            setFetchError('Game not found in leaderboard');
          }
        })
        .catch(err => {
          console.error('Failed to fetch leaderboard data:', err);
          setFetchError('Failed to fetch game data');
        })
        .finally(() => setFetchLoading(false));
    }
  }, [gameData.mismatch, urlGameId]);

  // Dark theme styles
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#1a1a2e',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#eee'
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
      color: '#fff',
      margin: 0
    },
    backLink: {
      color: '#4ade80',
      textDecoration: 'none',
      fontSize: '0.9rem',
      cursor: 'pointer'
    },
    section: {
      backgroundColor: '#16213e',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
      border: '1px solid #2a3a5e'
    },
    anchorSection: {
      backgroundColor: '#1a3a5c',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
      color: '#eee',
      border: '2px solid #4ade80'
    },
    sectionTitle: {
      fontSize: '1.2rem',
      fontWeight: 'bold',
      color: '#fff',
      marginTop: 0,
      marginBottom: '15px'
    },
    anchorTitle: {
      fontSize: '1.2rem',
      fontWeight: 'bold',
      color: '#4ade80',
      marginTop: 0,
      marginBottom: '15px'
    },
    summaryGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: '15px'
    },
    summaryItem: {
      textAlign: 'center',
      padding: '15px',
      backgroundColor: '#2a3a5e',
      borderRadius: '6px'
    },
    summaryLabel: {
      fontSize: '0.75rem',
      color: '#888',
      textTransform: 'uppercase',
      marginBottom: '5px'
    },
    summaryValue: {
      fontSize: '1.2rem',
      fontWeight: 'bold',
      color: '#4ade80'
    },
    anchorDetail: {
      marginBottom: '10px'
    },
    anchorLabel: {
      fontWeight: 'bold',
      marginRight: '10px',
      color: '#4ade80'
    },
    anchorValue: {
      fontFamily: 'monospace',
      fontSize: '0.9rem',
      wordBreak: 'break-all',
      color: '#aaa'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    th: {
      textAlign: 'left',
      padding: '12px 8px',
      borderBottom: '2px solid #2a3a5e',
      color: '#888',
      fontSize: '0.85rem'
    },
    td: {
      padding: '12px 8px',
      borderBottom: '1px solid #2a3a5e',
      fontSize: '0.9rem',
      color: '#ccc'
    },
    expandButton: {
      background: 'none',
      border: 'none',
      color: '#4ade80',
      cursor: 'pointer',
      fontSize: '1rem'
    },
    detailsBox: {
      backgroundColor: '#0d1525',
      padding: '15px',
      borderRadius: '6px',
      marginTop: '10px',
      fontSize: '0.85rem',
      color: '#aaa',
      border: '1px solid #2a3a5e'
    },
    detailRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '5px 0',
      borderBottom: '1px solid #2a3a5e',
      flexWrap: 'wrap',
      gap: '10px'
    },
    detailLabel: {
      color: '#888',
      minWidth: '120px',
      fontWeight: 'bold'
    },
    detailValue: {
      fontFamily: 'monospace',
      wordBreak: 'break-all',
      flex: 1,
      textAlign: 'right',
      color: '#ccc'
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
      border: '1px solid #2a3a5e',
      borderRadius: '4px',
      padding: '2px 8px',
      cursor: 'pointer',
      fontSize: '0.75rem',
      marginLeft: '8px',
      color: '#4ade80'
    },
    downloadButton: {
      display: 'inline-block',
      padding: '12px 24px',
      backgroundColor: '#4ade80',
      color: '#000',
      textDecoration: 'none',
      borderRadius: '6px',
      fontWeight: 'bold',
      border: 'none',
      cursor: 'pointer',
      fontSize: '1rem',
      marginRight: '10px'
    },
    explorerLink: {
      color: '#64b5f6',
      textDecoration: 'underline'
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px',
      color: '#888'
    },
    compactData: {
      backgroundColor: '#0d1525',
      padding: '10px',
      borderRadius: '6px',
      marginTop: '15px',
      fontSize: '0.8rem',
      fontFamily: 'monospace',
      wordBreak: 'break-all',
      color: '#aaa',
      border: '1px solid #2a3a5e'
    }
  };

  // Verify all spawns using anchor block
  const verificationResults = useMemo(() => {
    if (!spawnHistory || !anchorBlock?.blockHash) return [];

    return spawnHistory.map(spawn => {
      const result = verifySpawn(
        anchorBlock.blockHash,  // Always use anchor block
        gameId,
        spawn.moveNumber,
        spawn.row,
        spawn.col,
        spawn.value,
        spawn.emptyCells
      );
      return { spawn, ...result };
    });
  }, [spawnHistory, gameId, anchorBlock]);

  const allValid = verificationResults.every(r => r.valid);
  const encodedMoves = moveHistory ? encodeMoveHistory(moveHistory) : '';

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
    const script = generatePythonScript(gameId, anchorBlock, spawnHistory);
    const blob = new Blob([script], { type: 'text/python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verify_2048_${gameId?.slice(0, 8) || 'game'}.py`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Leaderboard access - show replay if data available
  if (gameData.mismatch) {
    // Loading state
    if (fetchLoading) {
      return (
        <div style={styles.container}>
          <div style={styles.wrapper}>
            <div style={styles.header}>
              <h1 style={styles.title}>🔍 Verification</h1>
              <Link to="/leaderboard?game=2048" style={styles.backLink}>← Back to Leaderboard</Link>
            </div>
            <div style={{ ...styles.section, textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#4ade80' }}>Loading game data...</p>
            </div>
          </div>
        </div>
      );
    }

    // Error or no data
    if (fetchError || !leaderboardData) {
      return (
        <div style={styles.container}>
          <div style={styles.wrapper}>
            <div style={styles.header}>
              <h1 style={styles.title}>🔍 Verification</h1>
              <Link to="/leaderboard?game=2048" style={styles.backLink}>← Back to Leaderboard</Link>
            </div>
            <div style={{ ...styles.section, ...styles.emptyState }}>
              <p style={{ fontWeight: 'bold', color: '#fff' }}>
                {fetchError || 'Game not found'}
              </p>
              <p style={{ color: '#888', marginTop: '10px' }}>
                Could not load game data for verification.
              </p>
              <Link to="/2048" style={{ ...styles.downloadButton, marginTop: '20px', display: 'inline-block' }}>
                Play 2048
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // Check if we have the necessary data for replay
    const hasReplayData = leaderboardData.move_history && leaderboardData.block_hash;

    if (!hasReplayData) {
      return (
        <div style={styles.container}>
          <div style={styles.wrapper}>
            <div style={styles.header}>
              <h1 style={styles.title}>🔍 Verification</h1>
              <Link to="/leaderboard?game=2048" style={styles.backLink}>← Back to Leaderboard</Link>
            </div>
            <div style={{ ...styles.section, ...styles.emptyState }}>
              <p style={{ fontWeight: 'bold', color: '#fff' }}>Replay Data Not Available</p>
              <p style={{ color: '#888', marginTop: '10px' }}>
                This game was submitted before replay verification was enabled.
              </p>
              <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#0d1525', borderRadius: '6px' }}>
                <p style={{ color: '#888', fontSize: '0.9rem', margin: 0 }}>
                  <strong style={{ color: '#fff' }}>Game Info:</strong><br />
                  Player: {leaderboardData.player_name}<br />
                  Score: {leaderboardData.score?.toLocaleString()}<br />
                  Anchor Block: #{leaderboardData.block_height || 'N/A'}
                </p>
              </div>
              <Link to="/2048" style={{ ...styles.downloadButton, marginTop: '20px', display: 'inline-block' }}>
                Play 2048
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // Show replay
    return (
      <div style={styles.container}>
        <div style={styles.wrapper}>
          <div style={styles.header}>
            <h1 style={styles.title}>🔍 Replay Verification</h1>
            <Link to="/leaderboard?game=2048" style={styles.backLink}>← Back to Leaderboard</Link>
          </div>

          {/* Info Section */}
          <div style={styles.anchorSection}>
            <h2 style={styles.anchorTitle}>⚓ Anchor Block Verification</h2>
            <p style={{ marginTop: 0, marginBottom: '15px', color: '#ccc' }}>
              This replay deterministically recreates all {leaderboardData.moves || 0} moves and tile spawns
              from the anchor block, proving the game was fair.
            </p>
            <div style={styles.anchorDetail}>
              <span style={styles.anchorLabel}>Player:</span>
              <span style={{ ...styles.anchorValue, color: '#fff' }}>{leaderboardData.player_name}</span>
            </div>
            <div style={styles.anchorDetail}>
              <span style={styles.anchorLabel}>Block Height:</span>
              <a
                href={`https://explorer.ergoplatform.com/en/blocks/${leaderboardData.block_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#64b5f6', fontWeight: 'bold' }}
              >
                #{leaderboardData.block_height}
              </a>
            </div>
            <div style={styles.anchorDetail}>
              <span style={styles.anchorLabel}>Block Hash:</span>
              <span style={styles.anchorValue}>{leaderboardData.block_hash}</span>
            </div>
          </div>

          {/* Replay Component */}
          <GameReplay
            gameId={leaderboardData.game_id}
            anchorBlockHash={leaderboardData.block_hash}
            anchorBlockHeight={leaderboardData.block_height}
            moveHistory={leaderboardData.move_history}
            finalScore={leaderboardData.score}
            playerName={leaderboardData.player_name}
          />

          {/* Verification Explanation */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>How This Works</h2>
            <div style={{ color: '#aaa', lineHeight: '1.6' }}>
              <p style={{ margin: '0 0 10px' }}>
                <strong style={{ color: '#4ade80' }}>1. Anchor Block:</strong> The blockchain block hash was
                committed when the game started - before any moves were made.
              </p>
              <p style={{ margin: '0 0 10px' }}>
                <strong style={{ color: '#4ade80' }}>2. Deterministic Spawns:</strong> Each tile spawn is calculated as:
                <code style={{ backgroundColor: '#0d1525', padding: '2px 6px', borderRadius: '4px', marginLeft: '5px' }}>
                  SHA256(blockHash + gameId + spawnIndex)
                </code>
              </p>
              <p style={{ margin: 0 }}>
                <strong style={{ color: '#4ade80' }}>3. Verifiable:</strong> Anyone can replay these moves with
                this anchor block and get the exact same tile spawns. The game is provably fair.
              </p>
            </div>
          </div>

          {/* View on Explorer Link */}
          <div style={styles.section}>
            <a
              href={`https://explorer.ergoplatform.com/en/blocks/${leaderboardData.block_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.explorerLink}
            >
              🔗 View Anchor Block on Ergo Explorer
            </a>
          </div>
        </div>
      </div>
    );
  }

  // No game data - show prompt to play
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
            <p>Play a game first, then click "Verify" to see blockchain proof.</p>
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
          <span style={styles.backLink} onClick={() => navigate(-1)}>← Back to Game</span>
        </div>

        {/* Anchor Block Section */}
        <div style={styles.anchorSection}>
          <h2 style={styles.anchorTitle}>⚓ Anchor Block (Single Source of Randomness)</h2>
          <p style={{ marginTop: 0, marginBottom: '15px' }}>
            All {spawnHistory.length} tile spawns derive from this ONE block using the fanning pattern.
          </p>
          <div style={styles.anchorDetail}>
            <span style={styles.anchorLabel}>Block Height:</span>
            <a
              href={`https://explorer.ergoplatform.com/en/blocks/${anchorBlock?.blockHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#776e65', fontWeight: 'bold' }}
            >
              #{anchorBlock?.blockHeight}
            </a>
          </div>
          <div style={styles.anchorDetail}>
            <span style={styles.anchorLabel}>Block Hash:</span>
            <span style={styles.anchorValue}>{anchorBlock?.blockHash}</span>
          </div>
          <div style={styles.anchorDetail}>
            <span style={styles.anchorLabel}>Formula:</span>
            <code style={{ backgroundColor: 'rgba(255,255,255,0.5)', padding: '2px 6px', borderRadius: '4px' }}>
              SHA256(blockHash + gameId + spawnIndex)
            </code>
          </div>
        </div>

        {/* Game Summary */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Game Summary</h2>
          <div style={styles.summaryGrid}>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Score</div>
              <div style={styles.summaryValue}>{formatScore(score)}</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Moves</div>
              <div style={styles.summaryValue}>{moveHistory?.length || 0}</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Spawns</div>
              <div style={styles.summaryValue}>{spawnHistory.length}</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Status</div>
              <div style={styles.summaryValue}>
                {gameStatus === 'won' ? '🏆' : gameStatus === 'lost' ? '💀' : '▶️'}
              </div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Verified</div>
              <div style={styles.summaryValue}>
                {allValid ? '✓' : '✗'}
              </div>
            </div>
          </div>
          <p style={{ marginTop: '15px', fontSize: '0.85rem', color: '#9e948a' }}>
            Game ID: <code style={{ fontFamily: 'monospace' }}>{gameId}</code>
          </p>

          {/* Compact data for leaderboard */}
          <div style={styles.compactData}>
            <strong>Leaderboard Data (~{Math.ceil((gameId?.length || 0) + (anchorBlock?.blockHash?.length || 0) + encodedMoves.length) / 1024} KB):</strong>
            <br />
            <span style={{ color: '#666', fontWeight: 'bold' }}>Moves: </span>{encodedMoves.slice(0, 50)}{encodedMoves.length > 50 ? '...' : ''}
            <br />
            <span style={{ color: '#666' }}>({encodedMoves.length} chars = {Math.ceil(encodedMoves.length / 4)} bytes compressed)</span>
          </div>
        </div>

        {/* Spawn History */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Spawn Verification ({spawnHistory.length} tiles)</h2>

          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Position</th>
                  <th style={styles.th}>Value</th>
                  <th style={styles.th}>Seed (first 12)</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {verificationResults.map((result, index) => (
                  <React.Fragment key={index}>
                    <tr>
                      <td style={styles.td}>{result.spawn.moveNumber}</td>
                      <td style={styles.td}>
                        ({result.spawn.row}, {result.spawn.col})
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          backgroundColor: result.spawn.value === 4 ? '#edc850' : '#eee4da',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: 'bold'
                        }}>
                          {result.spawn.value}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <code style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {result.seed?.slice(0, 12)}...
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
                              <span style={styles.detailLabel}>Anchor Block</span>
                              <span style={styles.detailValue}>#{anchorBlock?.blockHeight} (same for all)</span>
                            </div>
                            <div style={styles.detailRow}>
                              <span style={styles.detailLabel}>Seed Input</span>
                              <span style={styles.detailValue}>
                                {anchorBlock?.blockHash?.slice(0, 16)}... + {gameId?.slice(0, 8)}... + {result.spawn.moveNumber}
                              </span>
                            </div>
                            <div style={styles.detailRow}>
                              <span style={styles.detailLabel}>Master Seed</span>
                              <span style={styles.detailValue}>{result.seed}</span>
                            </div>
                            <div style={styles.detailRow}>
                              <span style={styles.detailLabel}>Empty Cells</span>
                              <span style={styles.detailValue}>
                                {result.spawn.emptyCellCount} available
                              </span>
                            </div>
                            <div style={styles.detailRow}>
                              <span style={styles.detailLabel}>Position Calc</span>
                              <span style={styles.detailValue}>
                                SHA256(seed+"position") mod {result.spawn.emptyCellCount}
                              </span>
                            </div>
                            <div style={styles.detailRow}>
                              <span style={styles.detailLabel}>Value Calc</span>
                              <span style={styles.detailValue}>
                                SHA256(seed+"value") mod 100 → {result.spawn.value === 2 ? '<90 = 2' : '≥90 = 4'}
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

        {/* Download & Actions */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Independent Verification</h2>
          <p style={{ color: '#776e65', marginBottom: '15px' }}>
            Download a Python script to independently verify all spawns using the Ergo blockchain.
          </p>
          <button style={styles.downloadButton} onClick={downloadScript}>
            📥 Download Python Script
          </button>
          <a
            href={`https://explorer.ergoplatform.com/en/blocks/${anchorBlock?.blockHash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...styles.downloadButton, backgroundColor: '#bbada0' }}
          >
            🔗 View Block on Explorer
          </a>
        </div>
      </div>
    </div>
  );
};

export default VerificationPage;
