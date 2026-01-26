/**
 * 2048 Verification Page
 * Uses the unified verification component with game-specific rendering
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import UnifiedVerification from '../../components/UnifiedVerification';
import { verifySpawn } from './spawnLogic';
import { formatScore } from './scoreLogic';
import GameReplay from './GameReplay';

// ============================================
// TILE DISPLAY
// ============================================
const TileDisplay = ({ value }) => (
  <span style={{
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 4,
    fontWeight: 'bold',
    fontSize: 14,
    backgroundColor: value === 4 ? '#edc850' : '#eee4da',
    color: '#776e65'
  }}>
    {value}
  </span>
);

// ============================================
// SPAWN ROW COMPONENT
// ============================================
function SpawnRow({ spawn, index, result, anchorBlock, gameId }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        style={{ cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <td style={tableStyles.td}>{spawn.moveNumber}</td>
        <td style={tableStyles.td}>
          ({spawn.row}, {spawn.col})
        </td>
        <td style={tableStyles.td}>
          <TileDisplay value={spawn.value} />
        </td>
        <td style={tableStyles.td}>
          <code style={{
            fontFamily: 'monospace',
            fontSize: 11,
            backgroundColor: 'rgba(0,0,0,0.2)',
            padding: '2px 6px',
            borderRadius: 4,
            color: '#a5b4fc'
          }}>
            {result.seed?.slice(0, 12)}...
          </code>
        </td>
        <td style={tableStyles.td}>
          <span style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 'bold',
            backgroundColor: result.valid ? '#22c55e' : '#ef4444',
            color: '#fff'
          }}>
            {result.valid ? '✓' : '✗'}
          </span>
        </td>
        <td style={tableStyles.td}>
          <span style={{ color: '#64748b', fontSize: 12 }}>
            {expanded ? '▼' : '▶'}
          </span>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan="6" style={{ padding: '0 8px 12px' }}>
            <div style={{
              backgroundColor: 'rgba(0,0,0,0.3)',
              padding: 15,
              borderRadius: 6,
              marginTop: 6
            }}>
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>Anchor Block</span>
                <span style={detailValueStyle}>#{anchorBlock?.blockHeight} (same for all)</span>
              </div>
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>Seed Input</span>
                <span style={{ ...detailValueStyle, fontSize: 10 }}>
                  {anchorBlock?.blockHash?.slice(0, 16)}... + {gameId?.slice(0, 8)}... + {spawn.moveNumber}
                </span>
              </div>
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>Master Seed</span>
                <span style={{ ...detailValueStyle, fontSize: 10, wordBreak: 'break-all' }}>
                  {result.seed}
                </span>
              </div>
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>Empty Cells</span>
                <span style={detailValueStyle}>{spawn.emptyCellCount || spawn.emptyCells?.length} available</span>
              </div>
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>Position Calc</span>
                <span style={detailValueStyle}>
                  SHA256(seed+"position") mod {spawn.emptyCellCount || spawn.emptyCells?.length}
                </span>
              </div>
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>Value Calc</span>
                <span style={detailValueStyle}>
                  SHA256(seed+"value") mod 100 → {spawn.value === 2 ? '<90 = 2' : '≥90 = 4'}
                </span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

const tableStyles = {
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left',
    padding: '12px 8px',
    borderBottom: '2px solid rgba(255,255,255,0.1)',
    color: '#94a3b8',
    fontSize: 12
  },
  td: {
    padding: '12px 8px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    fontSize: 13,
    color: '#f1f5f9'
  }
};

const detailRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '6px 0',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  flexWrap: 'wrap',
  gap: 10
};

const detailLabelStyle = {
  color: '#94a3b8',
  minWidth: 120,
  fontWeight: 'bold',
  fontSize: 12
};

const detailValueStyle = {
  fontFamily: 'monospace',
  flex: 1,
  textAlign: 'right',
  color: '#f1f5f9',
  fontSize: 12
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function VerificationPage2048() {
  const { gameId: urlGameId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const isFromLeaderboard = !!urlGameId;

  // Load game data from state or localStorage
  const getGameData = () => {
    if (location.state?.gameId) {
      return location.state;
    }
    try {
      const stored = localStorage.getItem('2048_verify_data');
      if (stored) {
        const data = JSON.parse(stored);
        if (isFromLeaderboard && data.gameId !== urlGameId) {
          return { mismatch: true, requestedGameId: urlGameId };
        }
        return data;
      }
    } catch (e) {
      console.error('Failed to parse stored verify data:', e);
    }
    return isFromLeaderboard ? { mismatch: true, requestedGameId: urlGameId } : null;
  };

  const gameData = getGameData();
  const rawData = gameData?.mismatch ? {} : (gameData || {});

  // Support both session-based (new) and legacy formats
  // Session-based games store blockchain data in blockchainData
  // Legacy games store it in anchorBlock
  const anchorBlock = rawData.blockchainData || rawData.anchorBlock;
  const { gameId, score, spawnHistory, moveHistory, gameStatus } = rawData;

  // Leaderboard data for replay mode
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    if (gameData?.mismatch && urlGameId) {
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
  }, [gameData?.mismatch, urlGameId]);

  // Verify all spawns
  const verificationResults = useMemo(() => {
    if (!spawnHistory || !anchorBlock?.blockHash) return [];

    return spawnHistory.map(spawn => {
      const result = verifySpawn(
        anchorBlock.blockHash,
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

  const backLink = isFromLeaderboard ? '/leaderboard?game=2048' : '/2048';
  const backText = isFromLeaderboard ? '← Back to Leaderboard' : '← Back to Game';

  // Handle leaderboard access (show replay)
  if (gameData?.mismatch) {
    if (fetchLoading) {
      return (
        <UnifiedVerification
          game="2048"
          gameId={urlGameId}
          data={null}
          loading={true}
          backLink={backLink}
          backText={backText}
        />
      );
    }

    if (fetchError || !leaderboardData) {
      return (
        <UnifiedVerification
          game="2048"
          gameId={urlGameId}
          data={null}
          notFound={true}
          backLink={backLink}
          backText={backText}
        />
      );
    }

    // Show replay from leaderboard
    const hasReplayData = leaderboardData.move_history && leaderboardData.block_hash;

    const renderLeaderboardSummary = () => (
      <div>
        <div style={{ marginBottom: 12, padding: 12, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
            Loaded from leaderboard database
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13 }}>
            <span>Player: <strong>{leaderboardData.player_name}</strong></span>
            <span>Score: <strong style={{ color: '#22c55e' }}>{leaderboardData.score?.toLocaleString()}</strong></span>
            <span>Moves: <strong>{leaderboardData.moves}</strong></span>
          </div>
        </div>
        <p style={{ fontSize: 13, color: '#f1f5f9', margin: 0 }}>
          All tile spawns derived from a single anchor block using the fanning pattern.
        </p>
      </div>
    );

    const renderLeaderboardReplay = () => {
      if (!hasReplayData) {
        return (
          <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>
            <p style={{ fontWeight: 'bold', color: '#f1f5f9' }}>Replay Data Not Available</p>
            <p>This game was submitted before replay verification was enabled.</p>
          </div>
        );
      }

      return (
        <GameReplay
          gameId={leaderboardData.game_id}
          anchorBlockHash={leaderboardData.block_hash}
          anchorBlockHeight={leaderboardData.block_height}
          moveHistory={leaderboardData.move_history}
          finalScore={leaderboardData.score}
          playerName={leaderboardData.player_name}
        />
      );
    };

    return (
      <UnifiedVerification
        game="2048"
        gameId={leaderboardData.game_id}
        data={{
          gameId: leaderboardData.game_id,
          blockHash: leaderboardData.block_hash,
          blockHeight: leaderboardData.block_height,
          timestamp: leaderboardData.block_timestamp,
          txHash: leaderboardData.tx_hash,
          txIndex: leaderboardData.tx_index
        }}
        verified={hasReplayData}
        eventCount={leaderboardData.moves || 0}
        backLink={backLink}
        backText={backText}
        renderGameSummary={renderLeaderboardSummary}
        renderReplay={renderLeaderboardReplay}
      />
    );
  }

  // No game data
  if (!gameId || !spawnHistory) {
    return (
      <UnifiedVerification
        game="2048"
        gameId={urlGameId}
        data={null}
        notFound={true}
        backLink={backLink}
        backText={backText}
      />
    );
  }

  // Render game summary
  const renderGameSummary = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 10 }}>
        <div style={statBoxStyle}>
          <div style={{ color: '#94a3b8', fontSize: 11 }}>Score</div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#22c55e' }}>
            {formatScore(score)}
          </div>
        </div>
        <div style={statBoxStyle}>
          <div style={{ color: '#94a3b8', fontSize: 11 }}>Moves</div>
          <div style={{ fontSize: 20, fontWeight: 'bold' }}>
            {moveHistory?.length || 0}
          </div>
        </div>
        <div style={statBoxStyle}>
          <div style={{ color: '#94a3b8', fontSize: 11 }}>Spawns</div>
          <div style={{ fontSize: 20, fontWeight: 'bold' }}>
            {spawnHistory.length}
          </div>
        </div>
        <div style={statBoxStyle}>
          <div style={{ color: '#94a3b8', fontSize: 11 }}>Status</div>
          <div style={{ fontSize: 20 }}>
            {gameStatus === 'won' ? '🏆' : gameStatus === 'lost' ? '💀' : '▶️'}
          </div>
        </div>
        <div style={statBoxStyle}>
          <div style={{ color: '#94a3b8', fontSize: 11 }}>Verified</div>
          <div style={{ fontSize: 20, color: allValid ? '#22c55e' : '#ef4444' }}>
            {allValid ? '✓' : '✗'}
          </div>
        </div>
      </div>

      {/* Anchor Block Note */}
      <div style={{
        marginTop: 16,
        padding: 12,
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        borderRadius: 8
      }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#22c55e', fontSize: 13 }}>⚓ Anchor/Fanning Pattern</h4>
        <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
          All {spawnHistory.length} tile spawns derive from the <strong style={{ color: '#f1f5f9' }}>SAME anchor block</strong>.
          The formula is: <code style={{ color: '#a5b4fc' }}>SHA256(blockHash + gameId + spawnIndex)</code>
        </p>
      </div>
    </div>
  );

  const statBoxStyle = {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 12,
    borderRadius: 6,
    textAlign: 'center'
  };

  // Render spawn verification table
  const renderReplay = () => (
    <div>
      <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 15 }}>
        Click any row to see detailed verification data
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyles.table}>
          <thead>
            <tr>
              <th style={tableStyles.th}>#</th>
              <th style={tableStyles.th}>Position</th>
              <th style={tableStyles.th}>Value</th>
              <th style={tableStyles.th}>Seed (first 12)</th>
              <th style={tableStyles.th}>Status</th>
              <th style={tableStyles.th}></th>
            </tr>
          </thead>
          <tbody>
            {verificationResults.map((result, index) => (
              <SpawnRow
                key={index}
                spawn={result.spawn}
                result={result}
                index={index}
                anchorBlock={anchorBlock}
                gameId={gameId}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render statistics
  const renderStatistics = () => {
    const tileDistribution = { 2: 0, 4: 0 };
    spawnHistory.forEach(s => {
      if (tileDistribution[s.value] !== undefined) tileDistribution[s.value]++;
    });

    const twoPct = ((tileDistribution[2] / spawnHistory.length) * 100).toFixed(1);
    const fourPct = ((tileDistribution[4] / spawnHistory.length) * 100).toFixed(1);

    return (
      <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap' }}>
        <div style={statBoxStyle}>
          <TileDisplay value={2} />
          <div style={{ marginTop: 8, fontSize: 14 }}>{tileDistribution[2]} ({twoPct}%)</div>
          <div style={{ fontSize: 10, color: '#64748b' }}>Expected: ~90%</div>
        </div>
        <div style={statBoxStyle}>
          <TileDisplay value={4} />
          <div style={{ marginTop: 8, fontSize: 14 }}>{tileDistribution[4]} ({fourPct}%)</div>
          <div style={{ fontSize: 10, color: '#64748b' }}>Expected: ~10%</div>
        </div>
        <div style={statBoxStyle}>
          <div style={{ color: '#94a3b8', fontSize: 11 }}>Total Spawns</div>
          <div style={{ fontSize: 24, fontWeight: 'bold' }}>{spawnHistory.length}</div>
        </div>
      </div>
    );
  };

  return (
    <UnifiedVerification
      game="2048"
      gameId={gameId}
      data={{
        gameId,
        blockHash: anchorBlock?.blockHash,
        blockHeight: anchorBlock?.blockHeight,
        timestamp: anchorBlock?.timestamp,
        txHash: anchorBlock?.txHash,
        txIndex: anchorBlock?.txIndex,
        // Include session data if available
        sessionId: anchorBlock?.sessionId,
        secretHash: anchorBlock?.secretHash
      }}
      verified={allValid}
      eventCount={spawnHistory.length}
      backLink={backLink}
      backText={backText}
      renderGameSummary={renderGameSummary}
      renderReplay={renderReplay}
      renderStatistics={renderStatistics}
    />
  );
}
