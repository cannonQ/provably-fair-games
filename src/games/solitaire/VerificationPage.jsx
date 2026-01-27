/**
 * Solitaire Verification Page - Commit-Reveal System
 * Verifies deck shuffle using server secret + blockchain data
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import CryptoJS from 'crypto-js';
import { shuffleDeck } from '../../blockchain/shuffle';

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

const truncateHash = (hash, len = 12) => {
  if (!hash) return 'N/A';
  return `${hash.slice(0, len)}...${hash.slice(-6)}`;
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function SolitaireVerificationPage() {
  const { gameId } = useParams();
  const [verificationData, setVerificationData] = useState(null);
  const [commitmentVerified, setCommitmentVerified] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shuffledDeck, setShuffledDeck] = useState(null);
  const [deckVerified, setDeckVerified] = useState(null);

  const backLink = '/solitaire';
  const backText = '← Back to Solitaire';

  // Load verification data
  useEffect(() => {
    const loadData = async () => {
      if (!gameId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      console.log('Loading verification data, gameId:', gameId);

      // Try localStorage
      const stored = localStorage.getItem(`solitaire-${gameId}`);
      console.log('localStorage data:', stored ? 'Found' : 'Not found');

      if (stored) {
        try {
          const data = JSON.parse(stored);
          console.log('Parsed data:', data);

          // Handle both flat and nested data structures
          const blockchainData = data.blockchainData || data;

          setVerificationData({
            gameId: data.gameId || blockchainData.gameId || gameId,
            serverSecret: data.serverSecret,
            secretHash: data.secretHash || blockchainData.secretHash,
            sessionId: data.sessionId || blockchainData.sessionId,
            anchor: {
              blockHash: blockchainData.blockHash,
              blockHeight: blockchainData.blockHeight,
              timestamp: blockchainData.timestamp
            },
            deck: data.deck || data.shuffledDeck || [],
            finalScore: data.score || data.foundationCount || 0,
            moves: data.moves || 0
          });

          // Verify commitment if we have the server secret
          if (data.serverSecret && (data.secretHash || blockchainData.secretHash)) {
            const hashToVerify = data.secretHash || blockchainData.secretHash;
            const verified = verifySecretCommitment(data.serverSecret, hashToVerify);
            setCommitmentVerified(verified);
            console.log('Commitment verified:', verified);
          } else {
            console.warn('Missing serverSecret or secretHash:', {
              hasSecret: !!data.serverSecret,
              hasHash: !!(data.secretHash || blockchainData.secretHash)
            });
          }

          setLoading(false);
          return;
        } catch (err) {
          console.error('Failed to parse verification data:', err);
        }
      }

      console.error('No verification data found in localStorage');
      setNotFound(true);
      setLoading(false);
    };

    loadData();
  }, [gameId]);

  // Verify deck shuffle
  const verifyDeckShuffle = () => {
    if (!verificationData.serverSecret) {
      alert('Server secret not available for verification');
      return;
    }

    const purpose = 'deck-shuffle';
    const seed = generateCommitRevealSeed(
      verificationData.serverSecret,
      verificationData.anchor.blockHash,
      verificationData.anchor.timestamp,
      purpose
    );

    const calculatedDeck = shuffleDeck(seed);
    const matches = JSON.stringify(calculatedDeck) === JSON.stringify(verificationData.deck);

    setShuffledDeck(calculatedDeck);
    setDeckVerified({ matches, seed });
  };

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

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.wrapper}>
          <p style={{ color: '#94a3b8' }}>Loading verification data...</p>
        </div>
      </div>
    );
  }

  if (notFound || !verificationData) {
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

  const dealBreakdown = getDealBreakdown(shuffledDeck || verificationData.deck);

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>🃏 Solitaire Verification</h1>
          <Link to={backLink} style={styles.backLink}>{backText}</Link>
        </div>

        {/* Commitment Verification Banner */}
        {verificationData.serverSecret && (
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
              <div style={styles.mono}>{verificationData.secretHash}</div>
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              <div><strong>Server Secret (Revealed):</strong></div>
              <div style={styles.mono}>{verificationData.serverSecret}</div>
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 10 }}>
              SHA256(secret) {commitmentVerified ? '===' : '!=='} hash ✓
            </div>
          </div>
        )}

        {!verificationData.serverSecret && (
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <div style={styles.statBox}>
              <div style={{ color: '#22c55e', fontSize: 28, fontWeight: 'bold' }}>
                {verificationData.finalScore || 0}
              </div>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>Cards Scored</div>
            </div>
            <div style={styles.statBox}>
              <div style={{ color: '#3b82f6', fontSize: 28, fontWeight: 'bold' }}>
                {verificationData.moves || 0}
              </div>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>Total Moves</div>
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 13, color: '#f1f5f9' }}>
            <p style={{ margin: '8px 0' }}>
              <strong>52 cards</strong> shuffled using blockchain randomness
            </p>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: 12 }}>
              The entire deck order was determined before the game started
            </p>
          </div>
        </div>

        {/* Blockchain Anchor */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>⚓ Blockchain Anchor</h2>
          <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.8 }}>
            <div><strong>Block Height:</strong> #{verificationData.anchor?.blockHeight?.toLocaleString()}</div>
            <div><strong>Block Hash:</strong> <span style={styles.mono}>{verificationData.anchor?.blockHash}</span></div>
            <div><strong>Timestamp:</strong> {new Date(verificationData.anchor?.timestamp).toLocaleString()}</div>
            <div><strong>Session ID:</strong> <span style={styles.mono}>{verificationData.sessionId}</span></div>
          </div>
          <a
            href={`https://explorer.ergoplatform.com/en/blocks/${verificationData.anchor?.blockHash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.explorerLink}
          >
            View on Ergo Explorer ↗
          </a>
        </div>

        {/* Deck Shuffle Verification */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🎴 Deck Shuffle Verification</h2>

          <div style={{ marginBottom: 15 }}>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
              <div><strong>Purpose:</strong> <span style={styles.mono}>deck-shuffle</span></div>
            </div>

            {/* Seed Formula */}
            <div style={{
              marginTop: 12,
              padding: 10,
              backgroundColor: 'rgba(0,0,0,0.3)',
              borderRadius: 6
            }}>
              <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 6 }}>🔐 Commit-Reveal Formula:</div>
              <code style={{ color: '#22c55e', fontSize: 11, display: 'block', marginBottom: 8 }}>
                seed = SHA256(serverSecret + blockHash + timestamp + 'deck-shuffle')
              </code>
              <div style={{ fontSize: 10, color: '#64748b' }}>
                <div>• Server commits hash BEFORE blockchain data</div>
                <div>• Secret revealed after game ends</div>
                <div>• Players cannot manipulate deck order</div>
              </div>
            </div>

            {/* Verify Button */}
            <div style={{ marginTop: 12 }}>
              <button
                style={{
                  padding: '8px 16px',
                  fontSize: 12,
                  backgroundColor: deckVerified?.matches ? '#22c55e' :
                                 deckVerified?.matches === false ? '#ef4444' : '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
                onClick={verifyDeckShuffle}
              >
                {deckVerified?.matches ? '✓ Deck Verified!' :
                 deckVerified?.matches === false ? '✗ Deck Mismatch' :
                 'Recalculate & Verify Deck'}
              </button>
              {deckVerified !== null && (
                <span style={{
                  marginLeft: 12,
                  color: deckVerified.matches ? '#22c55e' : '#ef4444',
                  fontSize: 12,
                  fontWeight: 'bold'
                }}>
                  {deckVerified.matches ? '✓ Deck matches!' : '✗ Deck does not match'}
                </span>
              )}
            </div>
          </div>

          {/* Deck Display */}
          {dealBreakdown && (
            <div style={{ marginTop: 20 }}>
              <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 15 }}>
                Cards dealt in order. Top card of each column is face-up.
              </p>

              {dealBreakdown.tableau.map((column, i) => (
                <div key={i} style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8', fontSize: 12, width: 80, flexShrink: 0 }}>
                    Column {i + 1}:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {column.map((card, idx) => <MiniCard key={idx} card={card} />)}
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 15, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>Stock (24 cards):</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 6 }}>
                  {dealBreakdown.stock.map((card, idx) => <MiniCard key={idx} card={card} />)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* How It Works */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🔐 How Commit-Reveal Works</h2>
          <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.8 }}>
            <ol style={{ paddingLeft: 20, margin: 0 }}>
              <li><strong>Commit Phase:</strong> Server generates secret and commits SHA256(secret) before game starts</li>
              <li><strong>Play Phase:</strong> Deck shuffle combines: secret + blockchain + timestamp + 'deck-shuffle'</li>
              <li><strong>Reveal Phase:</strong> After game ends, server reveals secret for verification</li>
              <li><strong>Verification:</strong> Anyone can verify SHA256(secret) matches commitment and recalculate the deck</li>
            </ol>
            <div style={{ marginTop: 12, padding: 10, backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: 6 }}>
              <strong style={{ color: '#22c55e' }}>Why this prevents cheating:</strong> Players cannot manipulate results because
              the secret was committed before the blockchain data was known.
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
  statBox: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 16,
    borderRadius: 8,
    textAlign: 'center'
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
