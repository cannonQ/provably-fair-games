/**
 * Blackjack Verification Page
 * Uses the unified verification component with game-specific rendering
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import UnifiedVerification from '../../components/UnifiedVerification';
import { generateSeed, shuffleArray } from '../../blockchain/shuffle';
import { createSixDeckShoe } from './gameState';
import { calculateHandValue, isBlackjack } from './gameLogic';
import BlackjackReplay from './BlackjackReplay';

// ============================================
// CARD DISPLAY HELPERS
// ============================================
const SUIT_SYMBOLS = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
const isRedSuit = (suit) => suit === 'hearts' || suit === 'diamonds';

const MiniCard = ({ card }) => (
  <span style={{
    display: 'inline-block',
    padding: '2px 5px',
    margin: '1px',
    backgroundColor: '#fff',
    borderRadius: '3px',
    fontSize: '11px',
    fontWeight: 'bold',
    color: isRedSuit(card.suit) ? '#d32f2f' : '#1a1a1a',
    border: '1px solid #ccc'
  }}>
    {card.rank}{SUIT_SYMBOLS[card.suit]}
  </span>
);

// ============================================
// ROUND BREAKDOWN COMPONENT
// ============================================
function RoundBreakdown({ round, index }) {
  const [expanded, setExpanded] = useState(false);
  const playerValue = calculateHandValue(round.playerHands[0]);
  const dealerValue = calculateHandValue(round.dealerHand);
  const result = round.results?.[0];
  const totalBet = (result?.bet || 0) + (round.insuranceBet || 0);
  const netResult = (round.totalPayout || 0) - totalBet;
  const hasInsurance = round.insuranceBet > 0;

  return (
    <div style={roundStyles.card}>
      <div style={roundStyles.header} onClick={() => setExpanded(!expanded)}>
        <span style={roundStyles.number}>Round {index + 1}</span>
        <span style={{
          color: netResult > 0 ? '#22c55e' : netResult < 0 ? '#ef4444' : '#94a3b8',
          fontWeight: 'bold'
        }}>
          {netResult > 0 ? `+$${netResult}` : netResult < 0 ? `-$${Math.abs(netResult)}` : 'Push'}
        </span>
        <span style={{ color: '#64748b', fontSize: '12px' }}>{expanded ? '▼' : '▶'}</span>
      </div>

      {expanded && (
        <div style={roundStyles.details}>
          <div style={roundStyles.handsRow}>
            <div style={roundStyles.handColumn}>
              <span style={roundStyles.handLabel}>Player:</span>
              <div>{round.playerHands[0].map((c, i) => <MiniCard key={i} card={c} />)}</div>
              <span style={{ color: '#22c55e', fontSize: '12px' }}>
                {isBlackjack(round.playerHands[0]) ? 'Blackjack!' : playerValue.value}
              </span>
            </div>
            <div style={roundStyles.handColumn}>
              <span style={roundStyles.handLabel}>Dealer:</span>
              <div>{round.dealerHand.map((c, i) => <MiniCard key={i} card={c} />)}</div>
              <span style={{ color: '#22c55e', fontSize: '12px' }}>
                {isBlackjack(round.dealerHand) ? 'Blackjack!' : dealerValue.value}
              </span>
            </div>
          </div>
          <div style={roundStyles.betRow}>
            <span>Bet: ${round.handBets[0]}</span>
            {hasInsurance && (
              <span style={{ color: '#fbbf24' }}>
                Insurance: ${round.insuranceBet} → ${round.insurancePayout}
              </span>
            )}
            <span>Payout: ${round.totalPayout || 0}</span>
          </div>
        </div>
      )}
    </div>
  );
}

const roundStyles = {
  card: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px', marginBottom: '8px', overflow: 'hidden' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', cursor: 'pointer', backgroundColor: 'rgba(0,0,0,0.2)' },
  number: { color: '#fbbf24', fontWeight: 'bold', fontSize: '13px' },
  details: { padding: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' },
  handsRow: { display: 'flex', gap: '20px', marginBottom: '10px' },
  handColumn: { flex: 1 },
  handLabel: { color: '#94a3b8', fontSize: '11px', display: 'block', marginBottom: '4px' },
  betRow: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)' }
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function BlackjackVerificationPage() {
  const { gameId } = useParams();
  const [verificationData, setVerificationData] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showReplay, setShowReplay] = useState(false);
  const [showFullShoe, setShowFullShoe] = useState(false);
  const [showRounds, setShowRounds] = useState(false);

  const backLink = gameId ? '/leaderboard?game=blackjack' : '/blackjack';
  const backText = gameId ? '← Back to Leaderboard' : '← Back to Blackjack';

  useEffect(() => {
    if (!gameId) {
      setLoading(false);
      return;
    }

    const loadVerificationData = async () => {
      // First try localStorage
      const storedData = localStorage.getItem(`blackjack_${gameId}`);

      if (storedData) {
        try {
          const data = JSON.parse(storedData);
          const { blockchainData, shoe, roundHistory } = data;

          // Support both session-based (new) and legacy formats
          // blockchainData could be nested (session-based) or at top level (legacy)
          const bcData = blockchainData || data;

          const blockData = {
            blockHash: bcData.blockHash,
            txHash: bcData.txHash,
            timestamp: bcData.timestamp,
            txIndex: bcData.txIndex
          };
          const regeneratedSeed = generateSeed(blockData, gameId);
          const rawShoe = createSixDeckShoe();
          const regeneratedShoe = shuffleArray(rawShoe, regeneratedSeed);

          const seedsMatch = regeneratedSeed === bcData.seed;
          const shoeMatches = shoe?.every((card, i) => card.id === regeneratedShoe[i]?.id);
          const verified = seedsMatch && shoeMatches;

          setVerificationData({
            ...data,
            gameId,
            blockHash: bcData.blockHash,
            blockHeight: bcData.blockHeight,
            timestamp: bcData.timestamp,
            txHash: bcData.txHash,
            txIndex: bcData.txIndex,
            seed: bcData.seed,
            regeneratedSeed,
            regeneratedShoe,
            source: 'local',
            // Include session data if available
            sessionId: bcData.sessionId,
            secretHash: bcData.secretHash
          });
          setIsVerified(verified);
          setLoading(false);
          return;
        } catch (err) {
          console.error('Failed to parse stored game data:', err);
        }
      }

      // Fallback: fetch from database
      try {
        const response = await fetch(`/api/leaderboard?game=blackjack&gameId=${gameId}`);
        if (!response.ok) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const apiResult = await response.json();
        const gameEntry = apiResult.entries?.find(entry => entry.game_id === gameId);

        if (!gameEntry) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const blockData = {
          blockHash: gameEntry.block_hash,
          txHash: gameEntry.tx_hash || '',
          timestamp: gameEntry.block_timestamp,
          txIndex: gameEntry.tx_index || 0
        };
        const regeneratedSeed = generateSeed(blockData, gameId);
        const rawShoe = createSixDeckShoe();
        const regeneratedShoe = shuffleArray(rawShoe, regeneratedSeed);

        const seedMatches = !gameEntry.seed || regeneratedSeed === gameEntry.seed;

        setVerificationData({
          gameId,
          blockHash: gameEntry.block_hash,
          blockHeight: gameEntry.block_height,
          timestamp: gameEntry.block_timestamp,
          txHash: gameEntry.tx_hash,
          txIndex: gameEntry.tx_index || 0,
          seed: regeneratedSeed,
          regeneratedSeed,
          regeneratedShoe,
          roundHistory: gameEntry.round_history || [],
          shoePosition: gameEntry.moves ? gameEntry.moves * 4 : 0,
          finalBalance: gameEntry.score,
          source: 'database',
          dbData: {
            playerName: gameEntry.player_name,
            score: gameEntry.score,
            moves: gameEntry.moves
          }
        });
        setIsVerified(seedMatches && regeneratedShoe.length === 312);
      } catch (err) {
        console.error('Failed to fetch from database:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    loadVerificationData();
  }, [gameId]);

  // Calculate statistics
  const getStats = () => {
    const roundHistory = verificationData?.roundHistory || [];
    return {
      wins: roundHistory.filter(r => {
        const totalBet = (r.results?.[0]?.bet || 0) + (r.insuranceBet || 0);
        return (r.totalPayout || 0) > totalBet;
      }).length,
      losses: roundHistory.filter(r => {
        const totalBet = (r.results?.[0]?.bet || 0) + (r.insuranceBet || 0);
        return (r.totalPayout || 0) < totalBet;
      }).length,
      pushes: roundHistory.filter(r => {
        const totalBet = (r.results?.[0]?.bet || 0) + (r.insuranceBet || 0);
        return (r.totalPayout || 0) === totalBet;
      }).length,
      totalProfit: roundHistory.reduce((sum, r) => {
        const totalBet = (r.results?.[0]?.bet || 0) + (r.insuranceBet || 0);
        return sum + (r.totalPayout || 0) - totalBet;
      }, 0)
    };
  };

  // Game summary renderer
  const renderGameSummary = () => {
    if (!verificationData) return null;

    return (
      <div>
        {verificationData.source === 'database' && verificationData.dbData && (
          <div style={{ marginBottom: 12, padding: 12, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
              Loaded from leaderboard database
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13 }}>
              <span>Player: <strong>{verificationData.dbData.playerName}</strong></span>
              <span>Final Balance: <strong style={{ color: verificationData.dbData.score >= 1000 ? '#22c55e' : '#ef4444' }}>${verificationData.dbData.score}</strong></span>
              <span>Hands: <strong>{verificationData.dbData.moves}</strong></span>
            </div>
          </div>
        )}
        <div style={{ fontSize: 13, color: '#f1f5f9' }}>
          <p style={{ margin: '0 0 8px 0' }}>
            <strong>312 cards</strong> (6 decks) shuffled using blockchain randomness
          </p>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: 12 }}>
            Cards dealt: {verificationData.shoePosition || 0} / 312
          </p>
        </div>
      </div>
    );
  };

  // Replay renderer
  const renderReplay = () => {
    const roundHistory = verificationData?.roundHistory || [];

    return (
      <div>
        {/* Watch Replay Button */}
        {roundHistory.length > 0 && (
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
            {showReplay && (
              <div style={{ marginTop: 12 }}>
                <BlackjackReplay
                  roundHistory={roundHistory}
                  finalBalance={verificationData.finalBalance}
                />
              </div>
            )}
          </div>
        )}

        {/* Round-by-Round */}
        <div>
          <h4
            style={{ color: '#3b82f6', cursor: 'pointer', margin: '12px 0', fontSize: 14 }}
            onClick={() => setShowRounds(!showRounds)}
          >
            {showRounds ? '▼' : '▶'} Round-by-Round ({roundHistory.length} hands)
          </h4>
          {showRounds && (
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {roundHistory.map((round, i) => (
                <RoundBreakdown key={i} round={round} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Full Shoe */}
        <div>
          <h4
            style={{ color: '#3b82f6', cursor: 'pointer', margin: '12px 0', fontSize: 14 }}
            onClick={() => setShowFullShoe(!showFullShoe)}
          >
            {showFullShoe ? '▼' : '▶'} Full Shoe Order (312 cards)
          </h4>
          {showFullShoe && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
              gap: 4,
              maxHeight: 300,
              overflowY: 'auto',
              padding: 8,
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: 6
            }}>
              {verificationData.regeneratedShoe?.map((card, i) => (
                <div key={i} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: 2,
                  borderRadius: 3,
                  backgroundColor: i < (verificationData.shoePosition || 0) ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                  opacity: i < (verificationData.shoePosition || 0) ? 0.6 : 1
                }}>
                  <span style={{ color: '#64748b', fontSize: 9 }}>{i + 1}</span>
                  <MiniCard card={card} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Statistics renderer
  const renderStatistics = () => {
    const stats = getStats();

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 10
      }}>
        <div style={statStyles.box}>
          <div style={{ ...statStyles.number, color: '#22c55e' }}>{stats.wins}</div>
          <div style={statStyles.label}>Wins</div>
        </div>
        <div style={statStyles.box}>
          <div style={{ ...statStyles.number, color: '#ef4444' }}>{stats.losses}</div>
          <div style={statStyles.label}>Losses</div>
        </div>
        <div style={statStyles.box}>
          <div style={{ ...statStyles.number, color: '#94a3b8' }}>{stats.pushes}</div>
          <div style={statStyles.label}>Pushes</div>
        </div>
        <div style={statStyles.box}>
          <div style={{ ...statStyles.number, color: stats.totalProfit >= 0 ? '#22c55e' : '#ef4444' }}>
            {stats.totalProfit >= 0 ? '+' : ''}${stats.totalProfit}
          </div>
          <div style={statStyles.label}>Net Profit</div>
        </div>
      </div>
    );
  };

  const statStyles = {
    box: { backgroundColor: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 6, textAlign: 'center' },
    number: { fontSize: 20, fontWeight: 'bold' },
    label: { fontSize: 11, color: '#94a3b8', marginTop: 4 }
  };

  return (
    <UnifiedVerification
      game="blackjack"
      gameId={gameId}
      data={verificationData}
      verified={isVerified}
      eventCount={1}
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
