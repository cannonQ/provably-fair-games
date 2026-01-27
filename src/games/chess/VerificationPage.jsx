/**
 * Chess Verification Page
 * Uses the unified verification component with game-specific rendering
 */

import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import CryptoJS from 'crypto-js';
import UnifiedVerification from '../../components/UnifiedVerification';
import { verifyColorAssignment } from './blockchain/color-assignment';
import { verifyCommitment } from './blockchain/ai-commitment';

// ============================================
// MOVE DISPLAY
// ============================================
function MovePair({ moveNumber, whiteMove, blackMove }) {
  return (
    <div style={moveStyles.pair}>
      <span style={moveStyles.number}>{moveNumber}.</span>
      <span style={moveStyles.white}>{whiteMove}</span>
      {blackMove && <span style={moveStyles.black}>{blackMove}</span>}
    </div>
  );
}

const moveStyles = {
  pair: {
    display: 'flex',
    gap: 8,
    padding: '4px 8px',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 4,
    marginBottom: 4,
    fontSize: 13
  },
  number: {
    color: '#94a3b8',
    minWidth: 30
  },
  white: {
    color: '#f1f5f9',
    minWidth: 60,
    fontFamily: 'monospace'
  },
  black: {
    color: '#94a3b8',
    minWidth: 60,
    fontFamily: 'monospace'
  }
};

// ============================================
// VERIFICATION ITEM
// ============================================
function VerificationItem({ label, value, verified, details, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div style={{
      backgroundColor: verified === undefined ? 'rgba(0,0,0,0.2)' :
                       verified ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
      border: verified === undefined ? '1px solid rgba(255,255,255,0.1)' :
              verified ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: 8,
      padding: 12,
      marginBottom: 10
    }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: details ? 'pointer' : 'default' }}
        onClick={() => details && setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {verified !== undefined && (
            <span style={{ color: verified ? '#22c55e' : '#ef4444', fontSize: 16 }}>
              {verified ? '✓' : '✗'}
            </span>
          )}
          <span style={{ color: '#f1f5f9', fontWeight: 'bold', fontSize: 13 }}>{label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>
          {details && <span style={{ color: '#64748b', fontSize: 12 }}>{expanded ? '▼' : '▶'}</span>}
        </div>
      </div>
      {expanded && details && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {details}
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function ChessVerificationPage() {
  const { gameId } = useParams();
  const location = useLocation();

  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [verificationResults, setVerificationResults] = useState({
    colorVerified: null,
    commitmentVerified: null
  });

  const backLink = gameId ? '/leaderboard?game=chess' : '/chess';
  const backText = gameId ? '← Back to Leaderboard' : '← Back to Chess';

  // Load game data
  useEffect(() => {
    // Try from location state first
    if (location.state?.gameData) {
      const data = location.state.gameData;
      setGameData(data);
      runVerification(data);
      setLoading(false);
      return;
    }

    // Try localStorage
    const stored = localStorage.getItem(`chess-${gameId}`);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setGameData(data);
        runVerification(data);
        setLoading(false);
        return;
      } catch (e) {
        console.error('Failed to parse stored game:', e);
      }
    }

    // Try sessionStorage (for games just played)
    const sessionData = sessionStorage.getItem('chessVerification');
    if (sessionData) {
      try {
        const data = JSON.parse(sessionData);
        if (!gameId || data.gameId === gameId) {
          setGameData(data);
          runVerification(data);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('Failed to parse session game:', e);
      }
    }

    // Try API if we have a gameId
    if (gameId) {
      fetch(`/api/leaderboard?game=chess&gameId=${gameId}`)
        .then(res => res.json())
        .then(result => {
          const entry = result.entries?.find(e => e.game_id === gameId);
          if (entry) {
            const data = {
              gameId: entry.game_id,
              playerColor: entry.player_color,
              result: {
                result: entry.game_result,
                winner: entry.winner,
                reason: entry.result_reason,
                gameOver: true
              },
              aiSettings: {
                targetElo: entry.opponent_elo,
                skillLevel: entry.ai_skill_level
              },
              moves: entry.move_history || [],
              blockHash: entry.block_hash,
              blockHeight: entry.block_height,
              timestamp: entry.block_timestamp,
              score: entry.score,
              source: 'database'
            };
            setGameData(data);
            setLoading(false);
          } else {
            setNotFound(true);
            setLoading(false);
          }
        })
        .catch(err => {
          console.error('Failed to fetch game:', err);
          setNotFound(true);
          setLoading(false);
        });
    } else {
      setNotFound(true);
      setLoading(false);
    }
  }, [gameId, location.state]);

  // Run verification checks
  const runVerification = (data) => {
    const results = {
      colorVerified: null,
      commitmentVerified: null
    };

    // Verify color assignment
    if (data.colorAssignment) {
      const colorResult = verifyColorAssignment(
        data.colorAssignment.blockHash,
        data.colorAssignment.userSeed,
        data.playerColor
      );
      results.colorVerified = colorResult.isValid;
    }

    // Verify AI commitment
    if (data.aiCommitment && data.aiSettings) {
      const commitResult = verifyCommitment(
        data.aiCommitment.commitment,
        data.aiSettings,
        data.aiCommitment.blockHash,
        data.aiCommitment.playerSeed
      );
      results.commitmentVerified = commitResult.isValid;
    }

    setVerificationResults(results);
  };

  // Get result text
  const getResultText = () => {
    if (!gameData?.result?.gameOver) return 'In Progress';
    if (!gameData.result.winner) return 'Draw';
    return gameData.result.winner === gameData.playerColor ? 'Victory' : 'Defeat';
  };

  const isVerified = verificationResults.colorVerified !== false &&
                     verificationResults.commitmentVerified !== false;

  // Render game summary
  const renderGameSummary = () => {
    if (!gameData) return null;

    return (
      <div>
        {gameData.source === 'database' && (
          <div style={{ marginBottom: 12, padding: 12, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
              Loaded from leaderboard database
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 10 }}>
          <div style={statBoxStyle}>
            <div style={{ color: '#94a3b8', fontSize: 11 }}>You Played</div>
            <div style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: gameData.playerColor === 'white' ? '#f1f5f9' : '#64748b'
            }}>
              {gameData.playerColor?.charAt(0).toUpperCase() + gameData.playerColor?.slice(1)}
            </div>
          </div>
          <div style={statBoxStyle}>
            <div style={{ color: '#94a3b8', fontSize: 11 }}>Opponent ELO</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#fbbf24' }}>
              {gameData.aiSettings?.targetElo || 'N/A'}
            </div>
          </div>
          <div style={statBoxStyle}>
            <div style={{ color: '#94a3b8', fontSize: 11 }}>Result</div>
            <div style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: getResultText() === 'Victory' ? '#22c55e' :
                     getResultText() === 'Defeat' ? '#ef4444' : '#fbbf24'
            }}>
              {getResultText()}
            </div>
          </div>
          <div style={statBoxStyle}>
            <div style={{ color: '#94a3b8', fontSize: 11 }}>Moves</div>
            <div style={{ fontSize: 18, fontWeight: 'bold' }}>
              {gameData.moves?.length || 0}
            </div>
          </div>
          {gameData.score !== undefined && (
            <div style={statBoxStyle}>
              <div style={{ color: '#94a3b8', fontSize: 11 }}>Score</div>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#22c55e' }}>
                {gameData.score}
              </div>
            </div>
          )}
        </div>

        {gameData.result?.reason && (
          <div style={{ marginTop: 12, fontSize: 13, color: '#94a3b8' }}>
            Ended by: <strong style={{ color: '#f1f5f9' }}>
              {gameData.result.reason.charAt(0).toUpperCase() + gameData.result.reason.slice(1)}
            </strong>
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

  // Render verification details
  const renderReplay = () => {
    if (!gameData) return null;

    // Group moves into pairs (white, black)
    const movePairs = [];
    const moves = gameData.moves || [];
    for (let i = 0; i < moves.length; i += 2) {
      movePairs.push({
        number: Math.floor(i / 2) + 1,
        white: moves[i],
        black: moves[i + 1] || null
      });
    }

    return (
      <div>
        {/* Color Assignment Verification */}
        <VerificationItem
          label="Color Assignment"
          value={gameData.playerColor?.charAt(0).toUpperCase() + gameData.playerColor?.slice(1)}
          verified={verificationResults.colorVerified}
          defaultExpanded
          details={gameData.colorAssignment && (
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              <div style={{ marginBottom: 8 }}>
                <strong>Block Hash:</strong>
                <code style={{ display: 'block', marginTop: 4, fontSize: 10, wordBreak: 'break-all', color: '#a5b4fc' }}>
                  {gameData.colorAssignment.blockHash}
                </code>
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>User Seed:</strong> {gameData.colorAssignment.userSeed}
              </div>
              <div>
                <strong>Formula:</strong> SUM(charCode(blockHash + userSeed)) mod 2 = {gameData.playerColor === 'white' ? '0' : '1'}
              </div>
            </div>
          )}
        />

        {/* AI Commitment Verification */}
        <VerificationItem
          label="AI Settings Commitment"
          value={gameData.aiCommitment ? `🔒 ${gameData.aiCommitment.commitment?.substring(0, 12)}...` : 'Not available'}
          verified={verificationResults.commitmentVerified}
          details={gameData.aiCommitment && gameData.aiSettings && (
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              <div style={{ marginBottom: 8 }}>
                <strong>Commitment Hash:</strong>
                <code style={{ display: 'block', marginTop: 4, fontSize: 10, wordBreak: 'break-all', color: '#a5b4fc' }}>
                  {gameData.aiCommitment.commitment}
                </code>
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>AI Settings:</strong>
                <pre style={{
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  padding: 8,
                  borderRadius: 4,
                  marginTop: 4,
                  fontSize: 10,
                  color: '#22c55e',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(gameData.aiSettings, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Formula:</strong> SHA256(settings | blockHash | playerSeed)
              </div>
            </div>
          )}
        />

        {/* Move History */}
        <h4 style={{ color: '#3b82f6', fontSize: 14, marginTop: 20, marginBottom: 12 }}>
          Move History ({moves.length} moves)
        </h4>
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {movePairs.map((pair) => (
            <MovePair
              key={pair.number}
              moveNumber={pair.number}
              whiteMove={pair.white}
              blackMove={pair.black}
            />
          ))}
        </div>
      </div>
    );
  };

  // Build unified data
  const unifiedData = gameData ? {
    gameId: gameData.gameId || gameId,
    // Support both session-based (new) and legacy formats
    blockHash: gameData.blockchainData?.blockHash || gameData.colorAssignment?.blockHash || gameData.blockHash,
    blockHeight: gameData.blockchainData?.blockHeight || gameData.colorAssignment?.blockHeight || gameData.blockHeight,
    timestamp: gameData.blockchainData?.timestamp || gameData.colorAssignment?.timestamp || gameData.timestamp,
    txHash: gameData.blockchainData?.txHash,
    txIndex: gameData.blockchainData?.txIndex,
    // Include session data if available
    sessionId: gameData.blockchainData?.sessionId,
    secretHash: gameData.blockchainData?.secretHash,
    // Include color assignment data for Python verification script
    userSeed: gameData.colorAssignment?.userSeed
  } : null;

  return (
    <UnifiedVerification
      game="chess"
      gameId={gameData?.gameId || gameId}
      data={unifiedData}
      verified={isVerified}
      eventCount={1}
      backLink={backLink}
      backText={backText}
      loading={loading}
      notFound={notFound}
      renderGameSummary={renderGameSummary}
      renderReplay={renderReplay}
    />
  );
}
