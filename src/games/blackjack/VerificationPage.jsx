/**
 * Blackjack Verification Page - Commit-Reveal System
 * Verifies card shuffles using server secret + blockchain data
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import CryptoJS from 'crypto-js';
import { shuffleArray } from '../../blockchain/shuffle';
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
// SHUFFLE BREAKDOWN COMPONENT
// ============================================
function ShuffleBreakdown({ shuffle, index, serverSecret, blockHash, timestamp, onVerify, verificationResult }) {
  const [expanded, setExpanded] = useState(false);
  const [showCards, setShowCards] = useState(false);

  const isInitial = shuffle.purpose === 'shoe-shuffle';
  const title = isInitial ? 'Initial Shoe Shuffle' : `Reshuffle #${index}`;

  return (
    <div style={shuffleStyles.container}>
      <div style={shuffleStyles.header} onClick={() => setExpanded(!expanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#22c55e', fontSize: 16 }}>🎴</span>
          <span style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: 14 }}>
            {title}
          </span>
          <span style={{ color: '#94a3b8', fontSize: 12 }}>
            312 cards (6 decks)
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {verificationResult !== undefined && (
            <span style={{
              color: verificationResult.matches ? '#22c55e' : '#ef4444',
              fontSize: 12,
              fontWeight: 'bold'
            }}>
              {verificationResult.matches ? '✓ Verified' : '✗ Mismatch'}
            </span>
          )}
          <span style={{ color: '#64748b', fontSize: 12 }}>{expanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {expanded && (
        <div style={shuffleStyles.details}>
          <div style={shuffleStyles.row}>
            <span style={shuffleStyles.label}>Purpose:</span>
            <span style={shuffleStyles.mono}>{shuffle.purpose}</span>
          </div>
          <div style={shuffleStyles.row}>
            <span style={shuffleStyles.label}>Session ID:</span>
            <span style={shuffleStyles.mono}>{truncateHash(shuffle.sessionId)}</span>
          </div>

          {/* Seed Formula */}
          <div style={shuffleStyles.formula}>
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

          {/* Verify Button */}
          <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              style={{
                padding: '8px 16px',
                fontSize: 12,
                backgroundColor: verificationResult?.matches ? '#22c55e' :
                               verificationResult?.matches === false ? '#ef4444' : '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
              onClick={() => onVerify(shuffle)}
            >
              {verificationResult?.matches ? '✓ Verified!' :
               verificationResult?.matches === false ? '✗ Mismatch' :
               'Recalculate & Verify'}
            </button>
            <button
              style={{
                padding: '8px 16px',
                fontSize: 12,
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                color: '#3b82f6',
                border: '1px solid #3b82f6',
                borderRadius: 6,
                cursor: 'pointer'
              }}
              onClick={() => setShowCards(!showCards)}
            >
              {showCards ? 'Hide' : 'Show'} All 312 Cards
            </button>
          </div>

          {/* Card Grid */}
          {showCards && shuffle.shoe && (
            <div style={{
              marginTop: 12,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
              gap: 4,
              maxHeight: 300,
              overflowY: 'auto',
              padding: 8,
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: 6
            }}>
              {shuffle.shoe.map((card, i) => (
                <div key={i} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: 2
                }}>
                  <span style={{ color: '#64748b', fontSize: 9 }}>{i + 1}</span>
                  <MiniCard card={card} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const shuffleStyles = {
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
    minWidth: 100
  },
  mono: {
    fontFamily: 'monospace',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: '2px 6px',
    borderRadius: 4,
    color: '#a5b4fc',
    fontSize: 11
  },
  formula: {
    marginTop: 12,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 6
  }
};

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
  const [commitmentVerified, setCommitmentVerified] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showReplay, setShowReplay] = useState(false);
  const [showRounds, setShowRounds] = useState(false);
  const [verificationResults, setVerificationResults] = useState({});

  const backLink = '/blackjack';
  const backText = '← Back to Blackjack';

  // Load verification data
  useEffect(() => {
    const loadData = async () => {
      console.log('Loading verification data, gameId:', gameId);

      if (!gameId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Try localStorage
      const stored = localStorage.getItem(`blackjack_${gameId}`);
      console.log('LocalStorage data:', stored ? 'Found' : 'Not found');

      if (stored) {
        try {
          const data = JSON.parse(stored);
          console.log('Parsed data:', data);

          // Build shuffle history from available data
          const shuffleHistory = [];

          // Initial shuffle (always present)
          if (data.shoe) {
            shuffleHistory.push({
              purpose: 'shoe-shuffle',
              sessionId: data.sessionId || data.blockchainData?.sessionId,
              shoe: data.shoe,
              seed: data.blockchainData?.seed
            });
          }

          // Add any reshuffles if they exist
          if (data.shuffleHistory) {
            shuffleHistory.push(...data.shuffleHistory);
          }

          setVerificationData({
            ...data,
            shuffleHistory,
            anchor: {
              blockHeight: data.blockchainData?.blockHeight,
              blockHash: data.blockchainData?.blockHash,
              timestamp: data.blockchainData?.timestamp,
              txHash: data.blockchainData?.txHash,
              txIndex: data.blockchainData?.txIndex
            }
          });

          // Verify commitment if we have the server secret
          if (data.serverSecret && data.secretHash) {
            const verified = verifySecretCommitment(data.serverSecret, data.secretHash);
            setCommitmentVerified(verified);
            console.log('Commitment verified:', verified);
          } else {
            console.warn('Missing serverSecret or secretHash:', {
              hasSecret: !!data.serverSecret,
              hasHash: !!data.secretHash
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

  // Verify a single shuffle
  const verifyShuffle = (shuffle) => {
    if (!verificationData.serverSecret) {
      alert('Server secret not available for verification');
      return;
    }

    const seed = generateCommitRevealSeed(
      verificationData.serverSecret,
      verificationData.anchor.blockHash,
      verificationData.anchor.timestamp,
      shuffle.purpose
    );

    const rawShoe = createSixDeckShoe();
    const calculatedShoe = shuffleArray(rawShoe, seed);
    const matches = shuffle.shoe?.every((card, i) => card.id === calculatedShoe[i]?.id);

    setVerificationResults(prev => ({
      ...prev,
      [shuffle.purpose]: { matches, calculatedShoe, seed }
    }));
  };

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

  const roundHistory = verificationData.roundHistory || [];
  const shuffleHistory = verificationData.shuffleHistory || [];
  const stats = getStats();

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>🃏 Blackjack Verification</h1>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
            <div style={styles.statBox}>
              <div style={{ color: '#22c55e', fontSize: 24, fontWeight: 'bold' }}>{stats.wins}</div>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>Wins</div>
            </div>
            <div style={styles.statBox}>
              <div style={{ color: '#ef4444', fontSize: 24, fontWeight: 'bold' }}>{stats.losses}</div>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>Losses</div>
            </div>
            <div style={styles.statBox}>
              <div style={{ color: '#94a3b8', fontSize: 24, fontWeight: 'bold' }}>{stats.pushes}</div>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>Pushes</div>
            </div>
            <div style={styles.statBox}>
              <div style={{
                color: stats.totalProfit >= 0 ? '#22c55e' : '#ef4444',
                fontSize: 24,
                fontWeight: 'bold'
              }}>
                {stats.totalProfit >= 0 ? '+' : ''}${stats.totalProfit}
              </div>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>Net Profit</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: '#f1f5f9' }}>
            <p style={{ margin: '0 0 8px 0' }}>
              <strong>Final Balance:</strong> ${verificationData.finalBalance || 0}
              <span style={{ color: '#94a3b8', marginLeft: 10 }}>
                (Started with ${verificationData.startingBalance || 1000})
              </span>
            </p>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: 12 }}>
              Cards dealt: {verificationData.shoePosition || 0} / 312
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

        {/* Shuffle History */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🎴 Shuffle History</h2>
          <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 15 }}>
            {shuffleHistory.length} shuffle{shuffleHistory.length !== 1 ? 's' : ''} performed during this game.
            Click to expand and verify each shuffle.
          </p>

          {shuffleHistory.map((shuffle, idx) => (
            <ShuffleBreakdown
              key={idx}
              shuffle={shuffle}
              index={idx}
              serverSecret={verificationData.serverSecret}
              blockHash={verificationData.anchor?.blockHash}
              timestamp={verificationData.anchor?.timestamp}
              onVerify={verifyShuffle}
              verificationResult={verificationResults[shuffle.purpose]}
            />
          ))}
        </div>

        {/* Round History */}
        {roundHistory.length > 0 && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>📊 Round History</h2>

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
              {showReplay && (
                <div style={{ marginTop: 12 }}>
                  <BlackjackReplay
                    roundHistory={roundHistory}
                    finalBalance={verificationData.finalBalance}
                  />
                </div>
              )}
            </div>

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
          </div>
        )}

        {/* How It Works */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🔐 How Commit-Reveal Works</h2>
          <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.8 }}>
            <ol style={{ paddingLeft: 20, margin: 0 }}>
              <li><strong>Commit Phase:</strong> Server generates secret and commits SHA256(secret) before game starts</li>
              <li><strong>Play Phase:</strong> Each shuffle combines: secret + blockchain + timestamp + purpose</li>
              <li><strong>Reveal Phase:</strong> After game ends, server reveals secret for verification</li>
              <li><strong>Verification:</strong> Anyone can verify SHA256(secret) matches commitment and recalculate all shuffles</li>
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
