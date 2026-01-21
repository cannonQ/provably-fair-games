/**
 * Backgammon Verification Page
 * Uses the unified verification component with game-specific rendering
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import CryptoJS from 'crypto-js';
import UnifiedVerification from '../../components/UnifiedVerification';
import BackgammonReplay from './BackgammonReplay';

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
// ROLL VERIFICATION
// ============================================
const generateRollVerification = (roll, index, gameId) => {
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

// ============================================
// ROLL ITEM COMPONENT
// ============================================
function RollItem({ roll, index, gameId }) {
  const [expanded, setExpanded] = useState(false);
  const verification = generateRollVerification(roll, index, gameId);

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
          <span style={{
            color: verification.verified ? '#22c55e' : '#ef4444',
            fontSize: 12
          }}>
            {verification.verified ? '✓ Verified' : '✗ Mismatch'}
          </span>
          <span style={{ color: '#64748b', fontSize: 12 }}>{expanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {expanded && (
        <div style={rollStyles.details}>
          {/* Block Info */}
          <div style={rollStyles.row}>
            <span style={rollStyles.label}>Block Hash:</span>
            <span style={{ ...rollStyles.mono, fontSize: 10, wordBreak: 'break-all' }}>
              {roll.blockHash}
            </span>
          </div>
          <div style={{ marginBottom: 8 }}>
            <a
              href={`https://explorer.ergoplatform.com/blocks/${roll.blockHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={rollStyles.link}
            >
              View on Ergo Explorer →
            </a>
          </div>

          {/* Seed Calculation */}
          <div style={rollStyles.formula}>
            <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 6 }}>Seed Formula:</div>
            <code style={{ color: '#a5b4fc', fontSize: 10, wordBreak: 'break-all' }}>
              SHA256(blockHash + gameId + turnNumber)
            </code>
          </div>

          {/* Dice Calculation */}
          <div style={rollStyles.formula}>
            <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 6 }}>Dice Calculation:</div>
            <div style={{ fontSize: 11, color: '#f1f5f9' }}>
              <div>Byte 1: 0x{verification.hash.substring(0, 2)} = {verification.byte1} → {verification.byte1} mod 6 + 1 = <strong style={{ color: '#22c55e' }}>{verification.die1}</strong></div>
              <div>Byte 2: 0x{verification.hash.substring(2, 4)} = {verification.byte2} → {verification.byte2} mod 6 + 1 = <strong style={{ color: '#22c55e' }}>{verification.die2}</strong></div>
            </div>
          </div>

          {/* Result */}
          <div style={{
            marginTop: 12,
            padding: 10,
            backgroundColor: verification.verified ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            borderRadius: 6,
            border: `1px solid ${verification.verified ? '#22c55e' : '#ef4444'}`
          }}>
            <span style={{ color: verification.verified ? '#22c55e' : '#ef4444', fontSize: 13 }}>
              {verification.verified ? '✓ Dice values match!' : '✗ Verification failed'}
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

  const backLink = gameId ? '/leaderboard?game=backgammon' : '/backgammon';
  const backText = gameId ? '← Back to Leaderboard' : '← Back to Backgammon';

  // Load game data
  useEffect(() => {
    if (location.state?.gameState) {
      setGameData(location.state.gameState);
      setLoading(false);
    } else {
      // Try localStorage
      const saved = localStorage.getItem(`backgammon-${gameId}`);
      if (saved) {
        setGameData(JSON.parse(saved));
        setLoading(false);
      } else {
        setNotFound(true);
        setLoading(false);
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
          Click any roll to see detailed blockchain proof
        </p>

        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {gameData.rollHistory.map((roll, index) => (
            <RollItem key={index} roll={roll} index={index} gameId={gameId} />
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

  // Build unified data
  const unifiedData = gameData ? {
    gameId,
    blockHash: gameData.rollHistory?.[0]?.blockHash,
    blockHeight: gameData.rollHistory?.[0]?.blockHeight,
    timestamp: gameData.gameStartTime
  } : null;

  return (
    <UnifiedVerification
      game="backgammon"
      gameId={gameId}
      data={unifiedData}
      verified={true}
      eventCount={gameData?.rollHistory?.length || 0}
      backLink={backLink}
      backText={backText}
      loading={loading}
      notFound={notFound}
      renderGameSummary={renderGameSummary}
      renderReplay={renderReplay}
      renderStatistics={renderStatistics}
    />
  );
}
