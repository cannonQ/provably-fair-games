/**
 * Backgammon Verification Page - Commit-Reveal System
 * Verifies dice rolls using server secret + blockchain data
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import CryptoJS from 'crypto-js';
import BackgammonReplay from './BackgammonReplay';

// ============================================
// COMMIT-REVEAL VERIFICATION FUNCTIONS
// ============================================

/**
 * Verify that the server secret matches the commitment hash
 */
function verifySecretCommitment(serverSecret, secretHash) {
  const calculatedHash = CryptoJS.SHA256(serverSecret).toString();
  return calculatedHash === secretHash;
}

/**
 * Generate seed using commit-reveal formula
 * Formula: SHA256(serverSecret + blockHash + timestamp + purpose)
 */
function generateCommitRevealSeed(serverSecret, blockHash, timestamp, purpose) {
  const input = serverSecret + blockHash + timestamp.toString() + purpose;
  return CryptoJS.SHA256(input).toString();
}

/**
 * Calculate dice using rejection sampling (matches game logic)
 */
function calculateDiceFromSeed(seed) {
  const dice = [];
  let byteIndex = 0;

  // Use rejection sampling to eliminate modulo bias
  // Reject values >= 252 (252 = 42 * 6, evenly divisible)
  while (dice.length < 2 && byteIndex < seed.length - 1) {
    const byte = parseInt(seed.substring(byteIndex, byteIndex + 2), 16);
    byteIndex += 2;

    // Only accept values that don't introduce bias
    if (byte < 252) {
      dice.push((byte % 6) + 1);
    }
  }

  // Fallback if we run out of bytes (extremely unlikely)
  while (dice.length < 2) {
    const extraHash = CryptoJS.SHA256(seed + dice.length).toString();
    const byte = parseInt(extraHash.substring(0, 2), 16);
    if (byte < 252) {
      dice.push((byte % 6) + 1);
    }
  }

  return [dice[0], dice[1]];
}

const truncateHash = (hash, len = 12) => {
  if (!hash) return 'N/A';
  return `${hash.slice(0, len)}...${hash.slice(-6)}`;
};

// ============================================
// DICE DISPLAY
// ============================================
const DiceDisplay = ({ dice }) => (
  <span style={{
    fontSize: 18,
    padding: '4px 8px',
    backgroundColor: '#fff',
    borderRadius: 4,
    color: '#1a1a1a',
    fontWeight: 'bold'
  }}>
    🎲 [{dice[0]}, {dice[1]}]
    {dice[0] === dice[1] && <span style={{ marginLeft: 4, color: '#f59e0b' }}> Doubles!</span>}
  </span>
);

// ============================================
// ROLL VERIFICATION (COMMIT-REVEAL)
// ============================================
const generateRollVerification = (roll, index, serverSecret, blockHash, timestamp) => {
  if (!serverSecret) {
    return { verified: null, error: 'Server secret not available' };
  }

  // Purpose matches game logic: roll-1, roll-2, roll-3, etc.
  const purpose = `roll-${index + 1}`;
  const seed = generateCommitRevealSeed(serverSecret, blockHash, timestamp, purpose);
  const calculatedDice = calculateDiceFromSeed(seed);

  return {
    purpose,
    seed,
    calculatedDice,
    verified: calculatedDice[0] === roll.dice[0] && calculatedDice[1] === roll.dice[1]
  };
};

// ============================================
// ROLL ITEM COMPONENT
// ============================================
function RollItem({ roll, index, serverSecret, blockHash, timestamp }) {
  const [expanded, setExpanded] = useState(false);
  const verification = generateRollVerification(roll, index, serverSecret, blockHash, timestamp);

  return (
    <div style={rollStyles.container}>
      <div style={rollStyles.header} onClick={() => setExpanded(!expanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#94a3b8', fontSize: 12 }}>Turn {index + 1}</span>
          <span style={{
            color: roll.player === 'white' ? '#f1f5f9' : '#64748b',
            fontSize: 12
          }}>
            {roll.player === 'white' ? 'Player' : 'AI'}
          </span>
          <DiceDisplay dice={roll.dice} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {verification.verified !== null && (
            <span style={{
              color: verification.verified ? '#22c55e' : '#ef4444',
              fontSize: 12,
              fontWeight: 'bold'
            }}>
              {verification.verified ? '✓ Verified' : '✗ Mismatch'}
            </span>
          )}
          <span style={{ color: '#64748b', fontSize: 12 }}>{expanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {expanded && (
        <div style={rollStyles.details}>
          {/* Purpose */}
          <div style={rollStyles.row}>
            <span style={rollStyles.label}>Purpose:</span>
            <span style={rollStyles.mono}>{verification.purpose || `roll-${index + 1}`}</span>
          </div>

          {/* Commit-Reveal Formula */}
          <div style={rollStyles.formula}>
            <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 6 }}>🔐 Commit-Reveal Formula:</div>
            <code style={{ color: '#22c55e', fontSize: 11, display: 'block', marginBottom: 8 }}>
              seed = SHA256(serverSecret + blockHash + timestamp + purpose)
            </code>
            <div style={{ fontSize: 10, color: '#64748b' }}>
              <div>• Server commits hash BEFORE blockchain data</div>
              <div>• Secret revealed after game ends</div>
              <div>• Players cannot manipulate results</div>
            </div>
          </div>

          {/* Dice Calculation */}
          {verification.calculatedDice && (
            <div style={rollStyles.formula}>
              <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 6 }}>Dice Calculation (Rejection Sampling):</div>
              <div style={{ fontSize: 11, color: '#f1f5f9' }}>
                <div>Calculated: <strong style={{ color: '#22c55e' }}>[{verification.calculatedDice[0]}, {verification.calculatedDice[1]}]</strong></div>
                <div style={{ marginTop: 4, color: '#64748b' }}>Using rejection sampling to eliminate modulo bias</div>
              </div>
            </div>
          )}

          {/* Result */}
          <div style={{
            marginTop: 12,
            padding: 10,
            backgroundColor: verification.verified ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            borderRadius: 6,
            border: `1px solid ${verification.verified ? '#22c55e' : '#ef4444'}`
          }}>
            <span style={{ color: verification.verified ? '#22c55e' : '#ef4444', fontSize: 13 }}>
              {verification.verified ? '✓ Dice values match!' : verification.error || '✗ Verification failed'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

const rollStyles = {
  container: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.05)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    cursor: 'pointer'
  },
  details: {
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderTop: '1px solid rgba(255,255,255,0.1)'
  },
  row: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginBottom: 10
  },
  label: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: 'bold'
  },
  mono: {
    fontFamily: 'monospace',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: '4px 8px',
    borderRadius: 4,
    color: '#22c55e'
  },
  link: {
    color: '#3b82f6',
    textDecoration: 'none',
    fontSize: 12
  },
  formula: {
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 6,
    marginTop: 10
  }
};

// ============================================
// DISTRIBUTION BAR
// ============================================
const DistributionBar = ({ value, count, total, expected }) => {
  const percent = ((count / total) * 100).toFixed(1);
  const isClose = Math.abs(parseFloat(percent) - expected) < 3;

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 30, fontWeight: 'bold' }}>{value}:</span>
        <div style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 4, height: 20 }}>
          <div style={{
            height: '100%',
            backgroundColor: isClose ? '#22c55e' : '#f59e0b',
            borderRadius: 4,
            width: `${percent}%`,
            transition: 'width 0.3s ease'
          }} />
        </div>
        <span style={{ width: 80, textAlign: 'right', fontSize: 12 }}>
          {count} ({percent}%)
        </span>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function BackgammonVerificationPage() {
  const { gameId } = useParams();
  const location = useLocation();

  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showReplay, setShowReplay] = useState(false);
  const [commitmentVerified, setCommitmentVerified] = useState(null);

  const backLink = '/backgammon';
  const backText = '← Back to Backgammon';

  // Load game data
  useEffect(() => {
    // First check location.state (passed from game)
    if (location.state?.gameState) {
      const data = {
        ...location.state.gameState,
        serverSecret: location.state.serverSecret,
        secretHash: location.state.secretHash,
        sessionId: location.state.sessionId
      };
      setGameData(data);

      // Verify commitment if we have the server secret
      if (data.serverSecret && data.secretHash) {
        const verified = verifySecretCommitment(data.serverSecret, data.secretHash);
        setCommitmentVerified(verified);
      }
      setLoading(false);
      return;
    }

    // Try localStorage - check verification data first, then game state
    const verifyData = localStorage.getItem(`backgammon_verify_${gameId}`);
    if (verifyData) {
      const data = JSON.parse(verifyData);
      setGameData(data);

      // Verify commitment if available
      if (data.serverSecret && data.secretHash) {
        const verified = verifySecretCommitment(data.serverSecret, data.secretHash);
        setCommitmentVerified(verified);
      }
      setLoading(false);
      return;
    }

    // Fallback to game state storage (uses backgammon_game_ prefix)
    const savedGame = localStorage.getItem(`backgammon_game_${gameId}`);
    if (savedGame) {
      const parsed = JSON.parse(savedGame);
      // Game state is wrapped in { state, savedAt, version }
      setGameData(parsed.state || parsed);
      setLoading(false);
      return;
    }

    setNotFound(true);
    setLoading(false);
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
      isRandom,
      expectedPercent: 16.67
    };
  }, [gameData]);

  // Format duration
  const getDuration = () => {
    if (!gameData?.gameEndTime || !gameData?.gameStartTime) return '--:--';
    const duration = Math.floor((gameData.gameEndTime - gameData.gameStartTime) / 1000);
    return `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;
  };

  // Render game summary
  const renderGameSummary = () => {
    if (!gameData) return null;

    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 10 }}>
          <div style={statBoxStyle}>
            <div style={{ color: '#94a3b8', fontSize: 11 }}>Winner</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: gameData.winner === 'white' ? '#22c55e' : '#ef4444' }}>
              {gameData.winner === 'white' ? 'Player' : 'AI'}
            </div>
          </div>
          <div style={statBoxStyle}>
            <div style={{ color: '#94a3b8', fontSize: 11 }}>Win Type</div>
            <div style={{ fontSize: 14, color: '#fbbf24' }}>
              {gameData.winType?.charAt(0).toUpperCase() + gameData.winType?.slice(1)}
            </div>
          </div>
          <div style={statBoxStyle}>
            <div style={{ color: '#94a3b8', fontSize: 11 }}>Final Score</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fbbf24' }}>
              {gameData.finalScore}
            </div>
          </div>
          <div style={statBoxStyle}>
            <div style={{ color: '#94a3b8', fontSize: 11 }}>Duration</div>
            <div style={{ fontSize: 18 }}>{getDuration()}</div>
          </div>
          <div style={statBoxStyle}>
            <div style={{ color: '#94a3b8', fontSize: 11 }}>Total Turns</div>
            <div style={{ fontSize: 18 }}>{gameData.rollHistory?.length || 0}</div>
          </div>
        </div>

        {/* Difficulty */}
        {gameData.difficulty && (
          <div style={{ marginTop: 12, fontSize: 13, color: '#94a3b8' }}>
            Difficulty: <strong style={{ color: '#f1f5f9' }}>{gameData.difficulty}</strong>
          </div>
        )}
      </div>
    );
  };

  const statBoxStyle = {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 12,
    borderRadius: 6,
    textAlign: 'center'
  };

  // Render replay
  const renderReplay = () => {
    if (!gameData?.rollHistory?.length) {
      return <p style={{ color: '#94a3b8' }}>No roll history available</p>;
    }

    return (
      <div>
        {/* Watch Replay Button */}
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setShowReplay(!showReplay)}
            style={{
              padding: '10px 16px',
              backgroundColor: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13
            }}
          >
            {showReplay ? 'Hide Replay' : '🎬 Watch Animated Replay'}
          </button>
        </div>

        {showReplay && (
          <div style={{ marginBottom: 20 }}>
            <BackgammonReplay
              rollHistory={gameData.rollHistory}
              moveHistory={gameData.moveHistory}
              winner={gameData.winner}
              winType={gameData.winType}
              finalScore={gameData.finalScore}
            />
          </div>
        )}

        {/* Roll-by-Roll */}
        <h4 style={{ color: '#3b82f6', fontSize: 14, marginBottom: 12 }}>
          Roll-by-Roll Verification ({gameData.rollHistory.length} turns)
        </h4>
        <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 15 }}>
          Click any roll to see detailed commit-reveal proof
        </p>

        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {gameData.rollHistory.map((roll, index) => (
            <RollItem
              key={index}
              roll={roll}
              index={index}
              serverSecret={gameData.serverSecret}
              blockHash={gameData.blockchainData?.blockHash}
              timestamp={gameData.blockchainData?.timestamp}
            />
          ))}
        </div>
      </div>
    );
  };

  // Render statistics
  const renderStatistics = () => {
    if (!diceStats) return <p style={{ color: '#94a3b8' }}>Statistics not available</p>;

    return (
      <div>
        {/* Distribution */}
        <h4 style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12 }}>
          Dice Distribution (Expected: 16.67% each)
        </h4>
        {[1, 2, 3, 4, 5, 6].map(die => (
          <DistributionBar
            key={die}
            value={die}
            count={diceStats.distribution[die]}
            total={diceStats.totalDice}
            expected={diceStats.expectedPercent}
          />
        ))}

        {/* Summary Stats */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
          <div style={summaryStatStyle}>
            <div style={{ color: '#94a3b8', fontSize: 11 }}>Total Dice</div>
            <div style={{ fontSize: 18, fontWeight: 'bold' }}>{diceStats.totalDice}</div>
          </div>
          <div style={summaryStatStyle}>
            <div style={{ color: '#94a3b8', fontSize: 11 }}>Doubles</div>
            <div style={{ fontSize: 18, fontWeight: 'bold' }}>
              {diceStats.doublesCount} ({diceStats.doublesPercent}%)
            </div>
            <div style={{ fontSize: 10, color: '#64748b' }}>Expected: ~16.67%</div>
          </div>
          <div style={summaryStatStyle}>
            <div style={{ color: '#94a3b8', fontSize: 11 }}>Chi-Squared</div>
            <div style={{ fontSize: 18, fontWeight: 'bold' }}>{diceStats.chiSquared}</div>
            <div style={{
              fontSize: 10,
              color: diceStats.isRandom ? '#22c55e' : '#ef4444'
            }}>
              {diceStats.isRandom ? '✓ Random (p>0.05)' : '✗ Non-random'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const summaryStatStyle = {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 12,
    borderRadius: 6,
    textAlign: 'center',
    flex: '1 1 100px'
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.wrapper}>
          <p style={{ color: '#94a3b8' }}>Loading verification data...</p>
        </div>
      </div>
    );
  }

  if (notFound || !gameData) {
    return (
      <div style={styles.container}>
        <div style={styles.wrapper}>
          <h2 style={{ color: '#ef4444' }}>Verification Data Not Found</h2>
          <p style={{ color: '#94a3b8' }}>
            No verification data available. Please complete a game first.
          </p>
          <Link to={backLink} style={styles.backLink}>{backText}</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>🎲 Backgammon Verification</h1>
          <Link to={backLink} style={styles.backLink}>{backText}</Link>
        </div>

        {/* Commitment Verification Banner */}
        {gameData.serverSecret && gameData.secretHash && (
          <div style={{
            ...styles.banner,
            backgroundColor: commitmentVerified ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            borderColor: commitmentVerified ? '#22c55e' : '#ef4444'
          }}>
            <h3 style={{
              margin: '0 0 10px 0',
              color: commitmentVerified ? '#22c55e' : '#ef4444',
              fontSize: 14
            }}>
              {commitmentVerified ? '✓ Server Commitment Verified' : '✗ Commitment Verification Failed'}
            </h3>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
              <div><strong>Secret Hash (Commitment):</strong></div>
              <div style={styles.mono}>{gameData.secretHash}</div>
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              <div><strong>Server Secret (Revealed):</strong></div>
              <div style={styles.mono}>{gameData.serverSecret}</div>
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 10 }}>
              SHA256(secret) {commitmentVerified ? '===' : '!=='} hash ✓
            </div>
          </div>
        )}

        {!gameData.serverSecret && (
          <div style={{ ...styles.banner, backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: '#f59e0b' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#f59e0b', fontSize: 14 }}>
              ⚠️ Server Secret Not Available
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
              The server secret has not been revealed yet. Complete the game to enable full verification.
            </p>
          </div>
        )}

        {/* Game Summary */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Game Summary</h2>
          {renderGameSummary()}
        </div>

        {/* Blockchain Anchor */}
        {gameData.blockchainData && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>⚓ Blockchain Anchor</h2>
            <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.8 }}>
              <div><strong>Block Height:</strong> #{gameData.blockchainData.blockHeight?.toLocaleString()}</div>
              <div><strong>Block Hash:</strong> <span style={styles.mono}>{truncateHash(gameData.blockchainData.blockHash, 16)}</span></div>
              <div><strong>Timestamp:</strong> {new Date(gameData.blockchainData.timestamp).toLocaleString()}</div>
              {gameData.sessionId && (
                <div><strong>Session ID:</strong> <span style={styles.mono}>{truncateHash(gameData.sessionId, 16)}</span></div>
              )}
            </div>
            <a
              href={`https://explorer.ergoplatform.com/en/blocks/${gameData.blockchainData.blockHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.explorerLink}
            >
              View on Ergo Explorer ↗
            </a>
          </div>
        )}

        {/* Roll History */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🎯 Roll History & Replay</h2>
          {renderReplay()}
        </div>

        {/* Statistics */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📊 Statistics</h2>
          {renderStatistics()}
        </div>

        {/* How It Works */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🔐 How Commit-Reveal Works</h2>
          <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.8 }}>
            <ol style={{ paddingLeft: 20, margin: 0 }}>
              <li><strong>Commit Phase:</strong> Server generates secret and commits SHA256(secret) before game starts</li>
              <li><strong>Play Phase:</strong> Each roll combines: secret + blockchain + timestamp + purpose</li>
              <li><strong>Reveal Phase:</strong> After game ends, server reveals secret for verification</li>
              <li><strong>Verification:</strong> Anyone can verify SHA256(secret) matches commitment and recalculate all rolls</li>
            </ol>
            <div style={{ marginTop: 12, padding: 10, backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: 6 }}>
              <strong style={{ color: '#22c55e' }}>Why this prevents cheating:</strong> Players cannot manipulate results because
              the secret was committed before the blockchain data was known. The server cannot change the secret after committing.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    color: '#f1f5f9',
    padding: 20
  },
  wrapper: {
    maxWidth: 900,
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    margin: 0
  },
  backLink: {
    color: '#3b82f6',
    textDecoration: 'none',
    fontSize: 14
  },
  banner: {
    padding: 16,
    borderRadius: 8,
    border: '1px solid',
    marginBottom: 24
  },
  section: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 0,
    marginBottom: 16,
    color: '#f1f5f9'
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: 11,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: '2px 6px',
    borderRadius: 4,
    wordBreak: 'break-all'
  },
  explorerLink: {
    display: 'inline-block',
    marginTop: 12,
    color: '#3b82f6',
    textDecoration: 'none',
    fontSize: 13
  }
};
