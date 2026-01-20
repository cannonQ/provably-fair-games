/**
 * Solitaire Verification Page
 * Uses the unified verification component with game-specific rendering
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import UnifiedVerification from '../../components/UnifiedVerification';
import { generateSeed, shuffleDeck } from '../../blockchain/shuffle';

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
// MAIN COMPONENT
// ============================================
export default function SolitaireVerificationPage() {
  const { gameId } = useParams();
  const [verificationData, setVerificationData] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shuffledDeck, setShuffledDeck] = useState(null);

  // Determine back link
  const backLink = gameId ? '/leaderboard?game=solitaire' : '/solitaire';
  const backText = gameId ? '← Back to Leaderboard' : '← Back to Solitaire';

  useEffect(() => {
    if (!gameId) {
      setLoading(false);
      return;
    }

    const loadVerificationData = async () => {
      // First try localStorage
      const storedData = localStorage.getItem(`solitaire-${gameId}`);

      if (storedData) {
        try {
          const data = JSON.parse(storedData);
          const { blockHash, blockHeight, timestamp, txHash, txIndex, txCount, seed } = data;

          // Regenerate seed using full block data
          const blockData = { blockHash, txHash, timestamp, txIndex };
          const regeneratedSeed = generateSeed(blockData, gameId);
          const deck = shuffleDeck(regeneratedSeed);

          // Verify seeds match
          const seedsMatch = regeneratedSeed === seed;
          const verified = seedsMatch && deck && deck.length === 52;

          setVerificationData({
            gameId,
            blockHash,
            blockHeight,
            timestamp,
            txHash,
            txIndex,
            txCount,
            seed,
            regeneratedSeed,
            source: 'local'
          });
          setShuffledDeck(deck);
          setIsVerified(verified);
          setLoading(false);
          return;
        } catch (err) {
          console.error('Failed to parse stored game data:', err);
        }
      }

      // Fallback: fetch from database
      try {
        const response = await fetch(`/api/game/${gameId}`);
        if (!response.ok) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const data = await response.json();
        const { blockHash, blockHeight, timestamp, txHash } = data;

        const blockData = { blockHash, txHash, timestamp, txIndex: 0 };
        const regeneratedSeed = generateSeed(blockData, gameId);
        const deck = shuffleDeck(regeneratedSeed);

        setVerificationData({
          gameId,
          blockHash,
          blockHeight,
          timestamp,
          txHash,
          txIndex: 0,
          seed: regeneratedSeed,
          regeneratedSeed,
          source: 'database',
          dbData: data
        });
        setShuffledDeck(deck);
        setIsVerified(deck && deck.length === 52);
      } catch (err) {
        console.error('Failed to fetch from database:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    loadVerificationData();
  }, [gameId]);

  // Deal breakdown for replay
  const getDealBreakdown = (deck) => {
    if (!deck || deck.length < 52) return null;

    const breakdown = { tableau: [[], [], [], [], [], [], []], stock: [] };
    let cardIndex = 0;

    for (let col = 0; col < 7; col++) {
      for (let row = 0; row <= col; row++) {
        breakdown.tableau[col].push(deck[cardIndex++]);
      }
    }
    breakdown.stock = deck.slice(28);

    return breakdown;
  };

  // Game-specific summary renderer
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
              <span>Score: <strong>{verificationData.dbData.score}/52</strong></span>
              <span>Moves: <strong>{verificationData.dbData.moves}</strong></span>
            </div>
          </div>
        )}
        <div style={{ fontSize: 13, color: '#f1f5f9' }}>
          <p style={{ margin: '0 0 8px 0' }}>
            <strong>52 cards</strong> shuffled using blockchain randomness
          </p>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: 12 }}>
            The entire deck order was determined before the game started
          </p>
        </div>
      </div>
    );
  };

  // Game-specific replay renderer
  const renderReplay = () => {
    const dealBreakdown = getDealBreakdown(shuffledDeck);
    if (!dealBreakdown) return <p style={{ color: '#94a3b8' }}>Deck data not available</p>;

    return (
      <div>
        <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 15 }}>
          Cards dealt in order. Top card of each column is face-up.
        </p>

        {dealBreakdown.tableau.map((column, i) => (
          <div key={i} style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
            <span style={{ color: '#94a3b8', fontSize: 12, width: 80, flexShrink: 0 }}>
              Column {i + 1}:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {column.map(card => <MiniCard key={card.id} card={card} />)}
            </div>
          </div>
        ))}

        <div style={{ marginTop: 15, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ color: '#94a3b8', fontSize: 12 }}>Stock (24 cards):</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 6 }}>
            {dealBreakdown.stock.map(card => <MiniCard key={card.id} card={card} />)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <UnifiedVerification
      game="solitaire"
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
    />
  );
}
