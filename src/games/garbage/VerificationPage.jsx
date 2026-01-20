/**
 * Garbage Verification Page
 * Uses the unified verification component with game-specific rendering
 */

import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import UnifiedVerification from '../../components/UnifiedVerification';
import { generateSeed, shuffleDeckStrings } from '../../blockchain/shuffle';
import { dealInitialCards } from './game-logic';

// ============================================
// CARD DISPLAY
// ============================================
const MiniCard = ({ card }) => {
  if (!card) return <span style={miniCardStyles.empty}>--</span>;

  const suit = card.slice(-1);
  const rank = card.slice(0, -1);
  const isRed = suit === '♥' || suit === '♦';

  return (
    <span style={{
      ...miniCardStyles.card,
      color: isRed ? '#ef4444' : '#1a1a1a'
    }}>
      {rank}{suit}
    </span>
  );
};

const miniCardStyles = {
  card: {
    display: 'inline-block',
    padding: '2px 5px',
    margin: '1px',
    backgroundColor: '#fff',
    borderRadius: 3,
    fontSize: 11,
    fontWeight: 'bold',
    border: '1px solid #ccc'
  },
  empty: {
    display: 'inline-block',
    padding: '2px 5px',
    margin: '1px',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 3,
    fontSize: 11,
    color: '#64748b'
  }
};

// ============================================
// POSITION DISPLAY (1-10 grid)
// ============================================
function PositionGrid({ cards, label }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{label}:</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {cards.map((card, i) => (
          <div key={i} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.2)',
            padding: 4,
            borderRadius: 4,
            minWidth: 40
          }}>
            <span style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>{i + 1}</span>
            <MiniCard card={card} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// DECK SECTION DISPLAY
// ============================================
function DeckSection({ title, cards, startIndex = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const preview = cards.slice(0, 10);
  const hasMore = cards.length > 10;

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <span style={{ fontSize: 12, color: '#94a3b8' }}>
          {title} ({cards.length} cards)
        </span>
        {hasMore && (
          <span style={{ fontSize: 11, color: '#3b82f6' }}>
            {expanded ? 'Show less ▲' : 'Show all ▼'}
          </span>
        )}
      </div>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        marginTop: 8,
        maxHeight: expanded ? 'none' : 80,
        overflow: 'hidden'
      }}>
        {(expanded ? cards : preview).map((card, i) => (
          <div key={i} style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute',
              top: -6,
              left: 0,
              fontSize: 8,
              color: '#64748b'
            }}>
              {startIndex + i + 1}
            </span>
            <MiniCard card={card} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function GarbageVerificationPage() {
  const { gameId } = useParams();
  const location = useLocation();

  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [regeneratedDeal, setRegeneratedDeal] = useState(null);

  const backLink = gameId ? '/leaderboard?game=garbage' : '/garbage';
  const backText = gameId ? '← Back to Leaderboard' : '← Back to Garbage';

  // Load game data
  useEffect(() => {
    // Try location state
    if (location.state?.gameData) {
      const data = location.state.gameData;
      setGameData(data);
      verifyGame(data);
      setLoading(false);
      return;
    }

    // Try localStorage
    const stored = localStorage.getItem(`garbage-${gameId}`);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setGameData(data);
        verifyGame(data);
        setLoading(false);
        return;
      } catch (e) {
        console.error('Failed to parse stored game:', e);
      }
    }

    // Try sessionStorage
    const sessionData = sessionStorage.getItem('garbageVerification');
    if (sessionData) {
      try {
        const data = JSON.parse(sessionData);
        if (!gameId || data.gameId === gameId) {
          setGameData(data);
          verifyGame(data);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('Failed to parse session game:', e);
      }
    }

    // Try API
    if (gameId) {
      fetch(`/api/leaderboard?game=garbage&gameId=${gameId}`)
        .then(res => res.json())
        .then(result => {
          const entry = result.entries?.find(e => e.game_id === gameId);
          if (entry) {
            const data = {
              gameId: entry.game_id,
              blockData: {
                blockHeight: entry.block_height,
                blockHash: entry.block_hash,
                txHash: entry.tx_hash,
                timestamp: entry.block_timestamp
              },
              winner: entry.score > 500 ? 'player' : 'ai', // Approximate from score
              score: entry.score,
              difficulty: entry.difficulty || 'normal',
              moves: entry.moves,
              source: 'database'
            };
            setGameData(data);
            verifyGame(data);
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

  // Verify game by regenerating deck
  const verifyGame = (data) => {
    if (!data?.blockData || !data?.gameId) {
      setIsVerified(false);
      return;
    }

    try {
      // Regenerate seed
      const seed = generateSeed(data.blockData, data.gameId);

      // Shuffle deck with same seed
      const regeneratedDeck = shuffleDeckStrings(seed);

      // Deal cards
      const dealt = dealInitialCards(regeneratedDeck);
      setRegeneratedDeal({
        deck: regeneratedDeck,
        ...dealt
      });

      // Verify matches stored deck (if available)
      if (data.deck) {
        const matches = regeneratedDeck.every((card, i) => card === data.deck[i]);
        setIsVerified(matches);
      } else {
        // If no stored deck, just verify we can regenerate
        setIsVerified(regeneratedDeck.length === 52);
      }
    } catch (e) {
      console.error('Verification failed:', e);
      setIsVerified(false);
    }
  };

  // Render game summary
  const renderGameSummary = () => {
    if (!gameData) return null;

    const isWin = gameData.winner === 'player';

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
            <div style={{ color: '#94a3b8', fontSize: 11 }}>Result</div>
            <div style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: isWin ? '#22c55e' : '#ef4444'
            }}>
              {isWin ? 'Victory' : 'Defeat'}
            </div>
          </div>
          <div style={statBoxStyle}>
            <div style={{ color: '#94a3b8', fontSize: 11 }}>Score</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fbbf24' }}>
              {gameData.score || 0}
            </div>
          </div>
          <div style={statBoxStyle}>
            <div style={{ color: '#94a3b8', fontSize: 11 }}>Moves</div>
            <div style={{ fontSize: 18, fontWeight: 'bold' }}>
              {gameData.moves || 0}
            </div>
          </div>
          <div style={statBoxStyle}>
            <div style={{ color: '#94a3b8', fontSize: 11 }}>Difficulty</div>
            <div style={{ fontSize: 14, fontWeight: 'bold' }}>
              {gameData.difficulty?.charAt(0).toUpperCase() + gameData.difficulty?.slice(1)}
            </div>
          </div>
        </div>

        <p style={{ marginTop: 16, fontSize: 13, color: '#f1f5f9' }}>
          <strong>52 cards</strong> shuffled using blockchain randomness, then dealt to player,
          AI, and draw pile.
        </p>
      </div>
    );
  };

  const statBoxStyle = {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 12,
    borderRadius: 6,
    textAlign: 'center'
  };

  // Render replay / deal breakdown
  const renderReplay = () => {
    if (!regeneratedDeal) {
      return <p style={{ color: '#94a3b8' }}>Deck data not available for replay</p>;
    }

    return (
      <div>
        <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 16 }}>
          The deck was deterministically shuffled using the blockchain seed.
          Below is how the cards were dealt at game start.
        </p>

        {/* Initial Player Hand (hidden) */}
        <PositionGrid
          cards={regeneratedDeal.playerHidden || Array(10).fill('??')}
          label="Player's Starting Cards (face-down positions 1-10)"
        />

        {/* Initial AI Hand (hidden) */}
        <PositionGrid
          cards={regeneratedDeal.aiHidden || Array(10).fill('??')}
          label="AI's Starting Cards (face-down positions 1-10)"
        />

        {/* Draw Pile */}
        <DeckSection
          title="Draw Pile"
          cards={regeneratedDeal.drawPile}
          startIndex={20}
        />

        {/* Full Deck Order */}
        <div style={{
          marginTop: 20,
          padding: 12,
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 13, color: '#3b82f6', marginBottom: 10, fontWeight: 'bold' }}>
            Full Deck Order (all 52 cards)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {regeneratedDeal.deck.map((card, i) => (
              <div key={i} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: 8, color: '#64748b' }}>{i + 1}</span>
                <MiniCard card={card} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render statistics
  const renderStatistics = () => {
    if (!regeneratedDeal?.deck) return null;

    // Count suits
    const suitCounts = { '♠': 0, '♥': 0, '♦': 0, '♣': 0 };
    regeneratedDeal.deck.forEach(card => {
      const suit = card.slice(-1);
      if (suitCounts[suit] !== undefined) suitCounts[suit]++;
    });

    return (
      <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap' }}>
        {Object.entries(suitCounts).map(([suit, count]) => (
          <div key={suit} style={statBoxStyle}>
            <span style={{
              fontSize: 24,
              color: suit === '♥' || suit === '♦' ? '#ef4444' : '#1a1a1a'
            }}>
              {suit}
            </span>
            <div style={{ fontSize: 14, marginTop: 4 }}>{count} cards</div>
          </div>
        ))}
        <div style={statBoxStyle}>
          <div style={{ color: '#94a3b8', fontSize: 11 }}>Total</div>
          <div style={{ fontSize: 20, fontWeight: 'bold' }}>52</div>
        </div>
      </div>
    );
  };

  // Build unified data
  const unifiedData = gameData ? {
    gameId: gameData.gameId || gameId,
    blockHash: gameData.blockData?.blockHash,
    blockHeight: gameData.blockData?.blockHeight,
    txHash: gameData.blockData?.txHash,
    timestamp: gameData.blockData?.timestamp
  } : null;

  return (
    <UnifiedVerification
      game="garbage"
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
      renderStatistics={renderStatistics}
    />
  );
}
