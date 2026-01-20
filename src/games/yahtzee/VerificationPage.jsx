/**
 * Yahtzee Verification Page
 * Uses the unified verification component with game-specific rendering
 */

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import UnifiedVerification from '../../components/UnifiedVerification';
import { generateSeedFromSource, calculateDieValue } from './diceLogic';

// ============================================
// DICE DISPLAY HELPERS
// ============================================
const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

const DiceValue = ({ value }) => (
  <span style={{
    display: 'inline-block',
    padding: '4px 8px',
    margin: '2px',
    backgroundColor: '#fff',
    borderRadius: '4px',
    fontSize: '16px',
    color: '#1a1a1a'
  }}>
    {DICE_FACES[value - 1] || value}
  </span>
);

// ============================================
// SOURCE STYLES
// ============================================
const getSourceStyle = (source) => {
  switch (source) {
    case 'anchor':
      return { icon: '🔵', color: '#3b82f6', label: 'Anchor Block' };
    case 'trace':
      return { icon: '🟢', color: '#22c55e', label: 'Traced Block' };
    case 'restart':
      return { icon: '🟡', color: '#f59e0b', label: 'Restart Block' };
    default:
      return { icon: '⚪', color: '#94a3b8', label: 'Unknown' };
  }
};

// ============================================
// ROLL BREAKDOWN COMPONENT
// ============================================
function RollBreakdown({ roll, gameId, onVerify, verificationResult }) {
  const [expanded, setExpanded] = useState(false);
  const sourceStyle = getSourceStyle(roll.source);

  return (
    <div style={rollStyles.container}>
      <div style={rollStyles.header} onClick={() => setExpanded(!expanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: sourceStyle.color, fontSize: 16 }}>{sourceStyle.icon}</span>
          <span style={{ color: '#94a3b8', fontSize: 12 }}>Roll {roll.roll}</span>
          <div>
            {roll.diceValues?.map((v, i) => <DiceValue key={i} value={v} />)}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {verificationResult !== undefined && (
            <span style={{
              color: verificationResult.matches ? '#22c55e' : '#ef4444',
              fontSize: 12
            }}>
              {verificationResult.matches ? '✓ Verified' : '✗ Mismatch'}
            </span>
          )}
          <span style={{ color: '#64748b', fontSize: 12 }}>{expanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {expanded && (
        <div style={rollStyles.details}>
          {roll.source === 'restart' && (
            <div style={rollStyles.restartWarning}>
              ⚠️ <strong>Restart occurred:</strong> Coinbase transaction hit (no inputs to trace).
              Fresh block fetched with player's click timestamp.
            </div>
          )}

          <div style={rollStyles.row}>
            <span style={rollStyles.label}>Source:</span>
            <span style={{ color: sourceStyle.color }}>{sourceStyle.label}</span>
          </div>
          <div style={rollStyles.row}>
            <span style={rollStyles.label}>Block:</span>
            <span style={rollStyles.mono}>#{roll.blockHeight?.toLocaleString()}</span>
            <a
              href={`https://explorer.ergoplatform.com/en/blocks/${roll.blockHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={rollStyles.link}
            >
              View ↗
            </a>
          </div>
          <div style={rollStyles.row}>
            <span style={rollStyles.label}>TX Hash:</span>
            <span style={rollStyles.mono}>{truncateHash(roll.txHash)}</span>
            <span style={{ color: '#64748b', fontSize: 11 }}>(index: {roll.txIndex})</span>
          </div>
          <div style={rollStyles.row}>
            <span style={rollStyles.label}>Trace Depth:</span>
            <span style={rollStyles.mono}>{roll.traceDepth}</span>
          </div>

          {/* Seed Formula */}
          <div style={rollStyles.formula}>
            <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 6 }}>Seed Formula:</div>
            <code style={{ color: '#22c55e', fontSize: 11 }}>
              SHA256(blockHash + txHash + timestamp + gameId + txIndex + "T{roll.turn}R{roll.roll}")
            </code>
          </div>

          {/* Verify Button */}
          <div style={{ marginTop: 12 }}>
            <button
              style={{
                padding: '8px 16px',
                fontSize: 12,
                backgroundColor: verificationResult?.matches ? '#22c55e' :
                               verificationResult?.matches === false ? '#ef4444' : '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer'
              }}
              onClick={() => onVerify(roll)}
            >
              {verificationResult?.matches ? '✓ Verified!' :
               verificationResult?.matches === false ? '✗ Mismatch' :
               'Recalculate & Verify'}
            </button>
            {verificationResult && (
              <span style={{ marginLeft: 12, color: '#94a3b8', fontSize: 11 }}>
                Calculated: [{verificationResult.calculated?.join(', ')}]
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const truncateHash = (hash, len = 12) => {
  if (!hash) return 'N/A';
  return `${hash.slice(0, len)}...${hash.slice(-6)}`;
};

const rollStyles = {
  container: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 6,
    marginBottom: 8,
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    cursor: 'pointer',
    backgroundColor: 'rgba(0,0,0,0.2)'
  },
  details: {
    padding: 12,
    borderTop: '1px solid rgba(255,255,255,0.1)'
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    fontSize: 12
  },
  label: {
    color: '#94a3b8',
    minWidth: 80
  },
  mono: {
    fontFamily: 'monospace',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: '2px 6px',
    borderRadius: 4,
    color: '#a5b4fc'
  },
  link: {
    color: '#3b82f6',
    textDecoration: 'none',
    fontSize: 11
  },
  formula: {
    marginTop: 12,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 6
  },
  restartWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    border: '1px solid #f59e0b',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    fontSize: 12,
    color: '#fbbf24'
  }
};

// ============================================
// TURN GROUP COMPONENT
// ============================================
function TurnGroup({ turn, rolls, gameId, verificationResults, onVerifyRoll }) {
  const [expanded, setExpanded] = useState(turn === 1);

  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 15px',
          backgroundColor: expanded ? 'rgba(59, 130, 246, 0.2)' : 'rgba(0,0,0,0.2)',
          borderRadius: expanded ? '8px 8px 0 0' : 8,
          cursor: 'pointer'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <span>
          <strong style={{ color: '#fbbf24' }}>Turn {turn}</strong>
          <span style={{ color: '#94a3b8', marginLeft: 15, fontSize: 13 }}>
            {rolls.length} roll{rolls.length > 1 ? 's' : ''}
          </span>
        </span>
        <span style={{ color: '#64748b' }}>{expanded ? '▼' : '▶'}</span>
      </div>

      {expanded && (
        <div style={{
          borderRadius: '0 0 8px 8px',
          padding: 12,
          backgroundColor: 'rgba(0,0,0,0.1)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderTop: 'none'
        }}>
          {rolls.map((roll, idx) => (
            <RollBreakdown
              key={idx}
              roll={roll}
              gameId={gameId}
              onVerify={onVerifyRoll}
              verificationResult={verificationResults[`${roll.turn}-${roll.roll}`]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function YahtzeeVerificationPage() {
  const { gameId: urlGameId } = useParams();
  const [searchParams] = useSearchParams();
  const queryGameId = searchParams.get('gameId');
  const gameId = urlGameId || queryGameId;

  const [verificationData, setVerificationData] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verificationResults, setVerificationResults] = useState({});

  const backLink = gameId ? '/leaderboard?game=yahtzee' : '/yahtzee';
  const backText = gameId ? '← Back to Leaderboard' : '← Back to Yahtzee';

  // Load verification data
  useEffect(() => {
    if (!gameId) {
      // Try sessionStorage
      const stored = sessionStorage.getItem('yahtzeeVerification');
      if (stored) {
        const data = JSON.parse(stored);
        setVerificationData(data);
        setIsVerified(true);
      }
      setLoading(false);
      return;
    }

    const loadData = async () => {
      // Try sessionStorage first
      const stored = sessionStorage.getItem('yahtzeeVerification');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.gameId === gameId) {
          setVerificationData(data);
          setIsVerified(true);
          setLoading(false);
          return;
        }
      }

      // Fetch from API
      try {
        const response = await fetch(`/api/leaderboard?game=yahtzee&gameId=${gameId}`);
        if (!response.ok) throw new Error('Not found');

        const apiResult = await response.json();
        const entry = apiResult.entries?.find(e => e.game_id === gameId);

        if (!entry || !entry.roll_history) {
          throw new Error('No roll history');
        }

        setVerificationData({
          gameId: entry.game_id,
          playerName: entry.player_name,
          finalScore: entry.score,
          anchor: {
            blockHeight: entry.block_height,
            blockHash: entry.block_hash,
            txHash: entry.tx_hash,
            timestamp: entry.block_timestamp
          },
          rollHistory: entry.roll_history,
          source: 'database'
        });
        setIsVerified(true);
      } catch (err) {
        console.error('Failed to load game data:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [gameId]);

  // Verify a single roll
  const verifyRoll = (roll) => {
    const rollSource = {
      blockHash: roll.blockHash,
      txHash: roll.txHash,
      timestamp: roll.timestamp,
      txIndex: roll.txIndex
    };

    const seed = generateSeedFromSource(rollSource, verificationData.gameId, roll.turn, roll.roll);
    const calculatedDice = [0, 1, 2, 3, 4].map(i => calculateDieValue(seed, i));
    const matches = JSON.stringify(calculatedDice) === JSON.stringify(roll.diceValues);

    setVerificationResults(prev => ({
      ...prev,
      [`${roll.turn}-${roll.roll}`]: { matches, calculated: calculatedDice, seed }
    }));
  };

  // Group rolls by turn
  const getRollsByTurn = () => {
    if (!verificationData?.rollHistory) return {};
    const byTurn = {};
    verificationData.rollHistory.forEach(roll => {
      if (!byTurn[roll.turn]) byTurn[roll.turn] = [];
      byTurn[roll.turn].push(roll);
    });
    return byTurn;
  };

  // Calculate statistics
  const getStats = () => {
    const rollHistory = verificationData?.rollHistory || [];
    const totalRolls = rollHistory.length;
    const turns = Object.keys(getRollsByTurn()).length;

    // Count by source type
    const sources = { anchor: 0, trace: 0, restart: 0 };
    rollHistory.forEach(r => {
      if (sources[r.source] !== undefined) sources[r.source]++;
    });

    return { totalRolls, turns, sources };
  };

  // Render game summary
  const renderGameSummary = () => {
    if (!verificationData) return null;

    const stats = getStats();

    return (
      <div>
        {verificationData.source === 'database' && (
          <div style={{ marginBottom: 12, padding: 12, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
              Loaded from leaderboard database
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13 }}>
              <span>Player: <strong>{verificationData.playerName}</strong></span>
              <span>Final Score: <strong style={{ color: '#22c55e' }}>{verificationData.finalScore}</strong></span>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <div style={summaryBoxStyle}>
            <div style={{ color: '#fbbf24', fontSize: 24, fontWeight: 'bold' }}>{stats.turns}</div>
            <div style={{ color: '#94a3b8', fontSize: 11 }}>Turns</div>
          </div>
          <div style={summaryBoxStyle}>
            <div style={{ color: '#fbbf24', fontSize: 24, fontWeight: 'bold' }}>{stats.totalRolls}</div>
            <div style={{ color: '#94a3b8', fontSize: 11 }}>Total Rolls</div>
          </div>
          <div style={summaryBoxStyle}>
            <div style={{ color: '#22c55e', fontSize: 24, fontWeight: 'bold' }}>{verificationData.finalScore}</div>
            <div style={{ color: '#94a3b8', fontSize: 11 }}>Final Score</div>
          </div>
        </div>

        {/* Anti-Spoofing Note */}
        <div style={{
          marginTop: 16,
          padding: 12,
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 8
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#fbbf24', fontSize: 13 }}>🔒 Anti-Spoofing Mechanism</h4>
          <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
            This game uses <strong style={{ color: '#f1f5f9' }}>block traversal</strong> instead of fetching
            new blocks for each roll. The anchor block is committed at game start, subsequent rolls
            trace backwards through transaction inputs. Players cannot manipulate results.
          </p>
        </div>
      </div>
    );
  };

  const summaryBoxStyle = {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 12,
    borderRadius: 6,
    textAlign: 'center'
  };

  // Render replay/history
  const renderReplay = () => {
    const rollsByTurn = getRollsByTurn();
    const totalTurns = Object.keys(rollsByTurn).length;

    if (totalTurns === 0) {
      return <p style={{ color: '#94a3b8' }}>No roll history available</p>;
    }

    return (
      <div>
        <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 15 }}>
          Click any turn to expand and see detailed blockchain proof for each roll.
        </p>

        {Object.entries(rollsByTurn).map(([turn, rolls]) => (
          <TurnGroup
            key={turn}
            turn={parseInt(turn)}
            rolls={rolls}
            gameId={verificationData.gameId}
            verificationResults={verificationResults}
            onVerifyRoll={verifyRoll}
          />
        ))}
      </div>
    );
  };

  // Render statistics
  const renderStatistics = () => {
    const stats = getStats();

    return (
      <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap' }}>
        <div style={statStyle}>
          <span style={{ color: '#3b82f6' }}>🔵</span>
          <span style={{ marginLeft: 8 }}>Anchor: {stats.sources.anchor}</span>
        </div>
        <div style={statStyle}>
          <span style={{ color: '#22c55e' }}>🟢</span>
          <span style={{ marginLeft: 8 }}>Traced: {stats.sources.trace}</span>
        </div>
        <div style={statStyle}>
          <span style={{ color: '#f59e0b' }}>🟡</span>
          <span style={{ marginLeft: 8 }}>Restart: {stats.sources.restart}</span>
        </div>
      </div>
    );
  };

  const statStyle = {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: '8px 12px',
    borderRadius: 6,
    fontSize: 13,
    display: 'flex',
    alignItems: 'center'
  };

  // Build data for unified component
  const unifiedData = verificationData ? {
    gameId: verificationData.gameId,
    blockHash: verificationData.anchor?.blockHash,
    blockHeight: verificationData.anchor?.blockHeight,
    timestamp: verificationData.anchor?.timestamp,
    txHash: verificationData.anchor?.txHash,
    rollHistory: verificationData.rollHistory
  } : null;

  return (
    <UnifiedVerification
      game="yahtzee"
      gameId={verificationData?.gameId || gameId}
      data={unifiedData}
      verified={isVerified}
      eventCount={verificationData?.rollHistory?.length || 0}
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
