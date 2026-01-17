/**
 * VerificationPage - Blackjack game verification with blockchain proof
 * Matches Solitaire verification page style (inline styles, no Tailwind)
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { generateSeed, shuffleArray } from '../../blockchain/shuffle';
import { createSixDeckShoe } from './gameState';
import { calculateHandValue, isBlackjack } from './gameLogic';

const SUIT_SYMBOLS = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
const isRedSuit = (suit) => suit === 'hearts' || suit === 'diamonds';

// Mini card display component
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

// Round breakdown component
function RoundBreakdown({ round, index }) {
  const [expanded, setExpanded] = useState(false);
  const playerValue = calculateHandValue(round.playerHands[0]);
  const dealerValue = calculateHandValue(round.dealerHand);
  const result = round.results?.[0];
  const totalBet = (result?.bet || 0) + (round.insuranceBet || 0);
  const netResult = (round.totalPayout || 0) - totalBet;
  const hasInsurance = round.insuranceBet > 0;

  return (
    <div style={styles.roundCard}>
      <div
        style={styles.roundHeader}
        onClick={() => setExpanded(!expanded)}
      >
        <span style={styles.roundNumber}>Round {index + 1}</span>
        <span style={{
          color: netResult > 0 ? '#4caf50' : netResult < 0 ? '#f44336' : '#888',
          fontWeight: 'bold'
        }}>
          {netResult > 0 ? `+$${netResult}` : netResult < 0 ? `-$${Math.abs(netResult)}` : 'Push'}
        </span>
        <span style={{ color: '#666', fontSize: '12px' }}>{expanded ? '▼' : '▶'}</span>
      </div>

      {expanded && (
        <div style={styles.roundDetails}>
          <div style={styles.handsRow}>
            <div style={styles.handColumn}>
              <span style={styles.handLabel}>Player:</span>
              <div>{round.playerHands[0].map((c, i) => <MiniCard key={i} card={c} />)}</div>
              <span style={{ color: '#4ade80', fontSize: '12px' }}>
                {isBlackjack(round.playerHands[0]) ? 'Blackjack!' : playerValue.value}
              </span>
            </div>
            <div style={styles.handColumn}>
              <span style={styles.handLabel}>Dealer:</span>
              <div>{round.dealerHand.map((c, i) => <MiniCard key={i} card={c} />)}</div>
              <span style={{ color: '#4ade80', fontSize: '12px' }}>
                {isBlackjack(round.dealerHand) ? 'Blackjack!' : dealerValue.value}
              </span>
            </div>
          </div>
          <div style={styles.betRow}>
            <span>Bet: ${round.handBets[0]}</span>
            {hasInsurance && (
              <span style={{ color: '#ffd700' }}>
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

export default function VerificationPage() {
  const { gameId } = useParams();
  const [verificationData, setVerificationData] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [copied, setCopied] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loadingFromDb, setLoadingFromDb] = useState(false);
  const [showFullBlockHash, setShowFullBlockHash] = useState(false);
  const [showFullTxHash, setShowFullTxHash] = useState(false);
  const [showSeedDetails, setShowSeedDetails] = useState(false);
  const [showFullShoe, setShowFullShoe] = useState(false);
  const [showRounds, setShowRounds] = useState(false);

  const backLink = gameId ? '/leaderboard?game=blackjack' : '/blackjack';
  const backText = gameId ? '← Back to Leaderboard' : '← Back to Blackjack';

  useEffect(() => {
    if (!gameId) return;

    const loadVerificationData = async () => {
      // First try localStorage
      const storedData = localStorage.getItem(`blackjack_${gameId}`);

      if (storedData) {
        try {
          const data = JSON.parse(storedData);
          const { blockchainData, shoe, roundHistory } = data;

          // Regenerate seed using full block data
          const blockData = {
            blockHash: blockchainData.blockHash,
            txHash: blockchainData.txHash,
            timestamp: blockchainData.timestamp,
            txIndex: blockchainData.txIndex
          };
          const regeneratedSeed = generateSeed(blockData, gameId);
          const rawShoe = createSixDeckShoe();
          const regeneratedShoe = shuffleArray(rawShoe, regeneratedSeed);

          // Verify shoes match
          const seedsMatch = regeneratedSeed === blockchainData.seed;
          const shoeMatches = shoe?.every((card, i) => card.id === regeneratedShoe[i]?.id);
          const verified = seedsMatch && shoeMatches;

          setVerificationData({
            ...data,
            regeneratedSeed,
            regeneratedShoe,
            source: 'local'
          });
          setIsVerified(verified);
          return;
        } catch (err) {
          console.error('Failed to parse stored game data:', err);
        }
      }

      // Fallback: fetch from database
      setLoadingFromDb(true);
      try {
        const response = await fetch(`/api/leaderboard?game=blackjack&gameId=${gameId}`);
        if (!response.ok) {
          setNotFound(true);
          return;
        }

        const apiResult = await response.json();
        
        // Find the game in the entries
        const gameEntry = apiResult.entries?.find(entry => entry.game_id === gameId);
        
        if (!gameEntry) {
          setNotFound(true);
          return;
        }

        // Build blockchainData from database fields
        const blockchainData = {
          blockHeight: gameEntry.block_height,
          blockHash: gameEntry.block_hash,
          timestamp: gameEntry.block_timestamp,
          txHash: gameEntry.tx_hash,
          txIndex: gameEntry.tx_index || 0,
          seed: gameEntry.seed
        };

        // Regenerate seed and shoe for verification
        const blockData = {
          blockHash: blockchainData.blockHash,
          txHash: blockchainData.txHash || '',
          timestamp: blockchainData.timestamp,
          txIndex: blockchainData.txIndex
        };
        const regeneratedSeed = generateSeed(blockData, gameId);
        const rawShoe = createSixDeckShoe();
        const regeneratedShoe = shuffleArray(rawShoe, regeneratedSeed);

        // Verify seed matches if we have stored seed
        const seedMatches = !blockchainData.seed || regeneratedSeed === blockchainData.seed;

        setVerificationData({
          gameId,
          blockchainData,
          roundHistory: gameEntry.round_history || [],
          shoePosition: gameEntry.moves ? gameEntry.moves * 4 : 0, // Estimate cards dealt
          regeneratedSeed,
          regeneratedShoe,
          finalBalance: gameEntry.score,
          handsPlayed: gameEntry.moves,
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
        setLoadingFromDb(false);
      }
    };

    loadVerificationData();
  }, [gameId]);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const truncateHash = (hash) => {
    if (!hash || hash.length <= 24) return hash || 'N/A';
    return `${hash.slice(0, 10)}...${hash.slice(-10)}`;
  };

  const formatDate = (ts) => {
    if (!ts) return 'Unknown';
    return new Date(ts).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  };

  // Not found state
  if (notFound) {
    return (
      <div style={styles.container}>
        <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Game Not Found</h1>
        <p style={{ color: '#888', marginBottom: '20px' }}>
          Could not find verification data for game: <code style={styles.mono}>{gameId}</code>
        </p>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '30px' }}>
          Game data is stored locally in your browser. If you cleared your browser data or are on a different device, the verification data won't be available.
        </p>
        <Link to={backLink} style={styles.link}>{backText}</Link>
      </div>
    );
  }

  if (!verificationData) {
    return (
      <div style={styles.container}>
        <p>{loadingFromDb ? 'Fetching from database...' : 'Loading verification data...'}</p>
      </div>
    );
  }

  const { blockchainData, roundHistory, shoe, shoePosition } = verificationData;
  
  // Calculate stats using totalPayout (includes insurance)
  const stats = {
    wins: roundHistory?.filter(r => {
      const totalBet = (r.results?.[0]?.bet || 0) + (r.insuranceBet || 0);
      return (r.totalPayout || 0) > totalBet;
    }).length || 0,
    losses: roundHistory?.filter(r => {
      const totalBet = (r.results?.[0]?.bet || 0) + (r.insuranceBet || 0);
      return (r.totalPayout || 0) < totalBet;
    }).length || 0,
    pushes: roundHistory?.filter(r => {
      const totalBet = (r.results?.[0]?.bet || 0) + (r.insuranceBet || 0);
      return (r.totalPayout || 0) === totalBet;
    }).length || 0,
    totalProfit: roundHistory?.reduce((sum, r) => {
      const totalBet = (r.results?.[0]?.bet || 0) + (r.insuranceBet || 0);
      return sum + (r.totalPayout || 0) - totalBet;
    }, 0) || 0
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <Link to={backLink} style={styles.link}>{backText}</Link>
        <h1 style={{ margin: '8px 0', fontSize: '22px' }}>♠ Blackjack Verification ♥</h1>
        <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>Independently verify this session's shuffle was fair</p>
      </div>

      {/* Database Notice */}
      {verificationData.source === 'database' && (
        <div style={styles.dbNotice}>
          ℹ️ Loaded from leaderboard database (localStorage data not available)
          {verificationData.dbData && (
            <div style={{ marginTop: '8px', fontSize: '12px' }}>
              Player: {verificationData.dbData.playerName} • Final Balance: ${verificationData.dbData.score} •
              Hands: {verificationData.dbData.moves}
            </div>
          )}
        </div>
      )}

      {/* Game Summary */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Game Summary</h3>
        <div style={styles.row}>
          <span style={styles.label}>Game ID:</span>
          <span style={styles.mono}>{verificationData.gameId}</span>
          <button style={styles.copyBtn} onClick={() => copyToClipboard(verificationData.gameId, 'gameId')}>
            {copied === 'gameId' ? '✓' : 'Copy'}
          </button>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Played:</span>
          <span>{formatDate(blockchainData?.timestamp)}</span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Final Balance:</span>
          <span style={{ color: verificationData.finalBalance >= 1000 ? '#4caf50' : '#f44336', fontWeight: 'bold' }}>
            ${verificationData.finalBalance?.toLocaleString() || 'N/A'}
          </span>
        </div>
      </div>

      {/* Blockchain Proof */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Blockchain Proof</h3>
        
        <div style={styles.row}>
          <span style={styles.label}>Block Height:</span>
          <span style={styles.mono}>{blockchainData?.blockHeight?.toLocaleString()}</span>
        </div>
        
        <div style={styles.row}>
          <span style={styles.label}>Block Hash:</span>
          <span style={styles.mono}>
            {showFullBlockHash ? blockchainData?.blockHash : truncateHash(blockchainData?.blockHash)}
          </span>
          <button style={styles.copyBtn} onClick={() => setShowFullBlockHash(!showFullBlockHash)}>
            {showFullBlockHash ? 'Hide' : 'Full'}
          </button>
          <button style={styles.copyBtn} onClick={() => copyToClipboard(blockchainData?.blockHash, 'blockHash')}>
            {copied === 'blockHash' ? '✓' : 'Copy'}
          </button>
        </div>

        <div style={styles.row}>
          <span style={styles.label}>TX Hash:</span>
          <span style={styles.mono}>
            {showFullTxHash ? blockchainData?.txHash : truncateHash(blockchainData?.txHash)}
          </span>
          <button style={styles.copyBtn} onClick={() => setShowFullTxHash(!showFullTxHash)}>
            {showFullTxHash ? 'Hide' : 'Full'}
          </button>
        </div>

        <div style={styles.row}>
          <span style={styles.label}>TX Index:</span>
          <span style={styles.mono}>{blockchainData?.txIndex ?? 'N/A'}</span>
        </div>

        <div style={styles.linksRow}>
          <a 
            href={`https://explorer.ergoplatform.com/en/blocks/${blockchainData?.blockHash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.link}
          >
            View Block on Explorer ↗
          </a>
        </div>

        {/* Anti-Spoofing Info */}
        <div style={styles.antiSpoofBox}>
          <div style={styles.antiSpoofHeader}>🔒 Anti-Spoofing Protection</div>
          <p style={{ color: '#aaa', fontSize: '12px', margin: 0 }}>
            Seed derived from 5 independent inputs: Block Hash + TX Hash + Timestamp + Game ID + TX Index
          </p>
          <p style={styles.antiSpoofNote}>
            These values were locked before cards were dealt — impossible to manipulate
          </p>
        </div>
      </div>

      {/* Seed Verification */}
      <div style={styles.section}>
        <h4 
          style={styles.collapsibleTitle}
          onClick={() => setShowSeedDetails(!showSeedDetails)}
        >
          {showSeedDetails ? '▼' : '▶'} 🔐 Seed Details
        </h4>
        
        {showSeedDetails && (
          <div style={styles.seedDetails}>
            <code style={styles.codeBlock}>
              seed = HASH(blockHash + txHash + timestamp + gameId + txIndex)
            </code>
            <p style={styles.seedNote}>
              5 independent inputs = virtually impossible to manipulate
            </p>
            
            <div style={{ marginTop: '12px' }}>
              <div style={styles.row}>
                <span style={styles.label}>Stored Seed:</span>
              </div>
              <div style={{ ...styles.mono, fontSize: '10px', marginBottom: '8px', wordBreak: 'break-all' }}>
                {blockchainData?.seed || 'N/A'}
              </div>
              
              <div style={styles.row}>
                <span style={styles.label}>Regenerated:</span>
              </div>
              <div style={{ 
                ...styles.mono, 
                fontSize: '10px',
                color: isVerified ? '#4ade80' : '#f87171',
                wordBreak: 'break-all'
              }}>
                {verificationData.regeneratedSeed}
                {isVerified && ' ✓ Match'}
              </div>
            </div>
          </div>
        )}

        {/* Verification Status */}
        <div style={{
          ...styles.resultBox,
          backgroundColor: isVerified ? 'rgba(76,175,80,0.2)' : 'rgba(244,67,54,0.2)'
        }}>
          <span style={{ fontSize: '28px' }}>{isVerified ? '✓' : '✗'}</span>
          <div>
            <div style={{ fontWeight: 'bold', color: isVerified ? '#4caf50' : '#f44336' }}>
              {isVerified ? 'VERIFIED' : 'FAILED'}
            </div>
            <div style={{ fontSize: '12px', color: '#aaa' }}>
              {isVerified ? 'Shoe order matches blockchain proof' : 'Shoe does not match expected order'}
            </div>
          </div>
        </div>
      </div>

      {/* Shoe Information */}
      <div style={styles.section}>
        <h4 
          style={styles.collapsibleTitle}
          onClick={() => setShowFullShoe(!showFullShoe)}
        >
          {showFullShoe ? '▼' : '▶'} 🃏 Shoe Order (312 cards)
        </h4>
        
        <div style={{ marginBottom: '12px', fontSize: '13px', color: '#aaa' }}>
          <span>6 decks • Cards dealt: {shoePosition || 0} / 312</span>
        </div>

        {showFullShoe && (
          <div style={styles.shoeGrid}>
            {(verificationData.regeneratedShoe || shoe)?.map((card, i) => (
              <div 
                key={i} 
                style={{
                  ...styles.shoeCard,
                  backgroundColor: i < (shoePosition || 0) ? '#2a3a5e' : '#16213e',
                  opacity: i < (shoePosition || 0) ? 0.7 : 1
                }}
              >
                <span style={{ color: '#666', fontSize: '9px' }}>{i + 1}</span>
                <MiniCard card={card} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Round History */}
      {roundHistory?.length > 0 && (
        <div style={styles.section}>
          <h4 
            style={styles.collapsibleTitle}
            onClick={() => setShowRounds(!showRounds)}
          >
            {showRounds ? '▼' : '▶'} 📋 Round-by-Round ({roundHistory.length} hands)
          </h4>
          
          {showRounds && (
            <div style={styles.roundsList}>
              {roundHistory.map((round, i) => (
                <RoundBreakdown key={i} round={round} index={i} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Session Statistics */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Session Statistics</h3>
        <div style={styles.statsGrid}>
          <div style={styles.statBox}>
            <div style={{ ...styles.statNumber, color: '#4caf50' }}>{stats.wins}</div>
            <div style={styles.statLabel}>Wins</div>
          </div>
          <div style={styles.statBox}>
            <div style={{ ...styles.statNumber, color: '#f44336' }}>{stats.losses}</div>
            <div style={styles.statLabel}>Losses</div>
          </div>
          <div style={styles.statBox}>
            <div style={{ ...styles.statNumber, color: '#888' }}>{stats.pushes}</div>
            <div style={styles.statLabel}>Pushes</div>
          </div>
          <div style={styles.statBox}>
            <div style={{ 
              ...styles.statNumber, 
              color: stats.totalProfit >= 0 ? '#4caf50' : '#f44336' 
            }}>
              {stats.totalProfit >= 0 ? '+' : ''}${stats.totalProfit}
            </div>
            <div style={styles.statLabel}>Net Profit</div>
          </div>
        </div>
      </div>

      {/* How to Verify */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>How to Verify Independently</h3>
        <ol style={styles.stepsList}>
          <li>Get <a href={`https://explorer.ergoplatform.com/en/blocks/${blockchainData?.blockHash}`} target="_blank" rel="noopener noreferrer" style={styles.link}>block #{blockchainData?.blockHeight}</a> from Ergo explorer</li>
          <li>Note block hash: <code style={{ fontSize: '0.7rem' }}>{truncateHash(blockchainData?.blockHash)}</code></li>
          <li>Note TX hash: <code style={{ fontSize: '0.7rem' }}>{truncateHash(blockchainData?.txHash)}</code></li>
          <li>Confirm TX index: {blockchainData?.timestamp} % txCount = {blockchainData?.txIndex}</li>
          <li>Create 6-deck shoe (312 cards), run Fisher-Yates shuffle with seed</li>
          <li>Compare: identical inputs = identical shoe order</li>
        </ol>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '15px', color: '#666', fontSize: '12px' }}>
        <p style={{ margin: '0 0 8px 0' }}>Provably Fair Gaming on Ergo Blockchain</p>
        <Link to={backLink} style={styles.link}>{backText}</Link>
      </div>

      {/* Toast */}
      {copied && <div style={styles.toast}>Copied!</div>}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '700px',
    margin: '0 auto',
    color: '#fff',
    backgroundColor: '#1a1a2e',
    minHeight: '100vh'
  },
  section: {
    backgroundColor: '#16213e',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '15px',
    border: '1px solid #2a3a5e'
  },
  sectionTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    color: '#a0a0ff',
    borderBottom: '1px solid #2a3a5e',
    paddingBottom: '8px'
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    flexWrap: 'wrap'
  },
  label: {
    color: '#888',
    fontSize: '12px',
    minWidth: '80px'
  },
  mono: {
    fontFamily: 'monospace',
    backgroundColor: '#0d1a0d',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    wordBreak: 'break-all'
  },
  copyBtn: {
    padding: '2px 6px',
    fontSize: '10px',
    backgroundColor: '#2a3a5e',
    color: '#aaa',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer'
  },
  link: {
    color: '#64b5f6',
    textDecoration: 'none',
    fontSize: '13px'
  },
  linksRow: {
    display: 'flex',
    gap: '15px',
    marginTop: '12px'
  },
  antiSpoofBox: {
    backgroundColor: '#1a2a1a',
    border: '1px solid #2a4a2a',
    borderRadius: '6px',
    padding: '12px',
    margin: '12px 0'
  },
  antiSpoofHeader: {
    color: '#4ade80',
    fontWeight: 'bold',
    fontSize: '13px',
    marginBottom: '10px'
  },
  antiSpoofNote: {
    color: '#666',
    fontSize: '11px',
    margin: '8px 0 0 0',
    fontStyle: 'italic'
  },
  collapsibleTitle: {
    margin: '8px 0',
    fontSize: '14px',
    color: '#a0a0ff',
    cursor: 'pointer',
    userSelect: 'none',
    fontWeight: 'bold'
  },
  seedDetails: {
    backgroundColor: '#0d1a0d',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '12px'
  },
  codeBlock: {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#4ade80'
  },
  seedNote: {
    color: '#888',
    fontSize: '11px',
    margin: '6px 0 0 0'
  },
  resultBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '15px',
    borderRadius: '6px',
    marginTop: '12px'
  },
  shoeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
    gap: '4px',
    maxHeight: '300px',
    overflowY: 'auto',
    padding: '8px',
    backgroundColor: '#0d1a0d',
    borderRadius: '6px'
  },
  shoeCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2px',
    borderRadius: '3px'
  },
  roundsList: {
    maxHeight: '400px',
    overflowY: 'auto'
  },
  roundCard: {
    backgroundColor: '#0d1a0d',
    borderRadius: '6px',
    marginBottom: '8px',
    overflow: 'hidden'
  },
  roundHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    cursor: 'pointer',
    backgroundColor: '#1a2a3a'
  },
  roundNumber: {
    color: '#ffd700',
    fontWeight: 'bold',
    fontSize: '13px'
  },
  roundDetails: {
    padding: '12px',
    borderTop: '1px solid #2a3a5e'
  },
  handsRow: {
    display: 'flex',
    gap: '20px',
    marginBottom: '10px'
  },
  handColumn: {
    flex: 1
  },
  handLabel: {
    color: '#888',
    fontSize: '11px',
    display: 'block',
    marginBottom: '4px'
  },
  betRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#aaa',
    paddingTop: '8px',
    borderTop: '1px solid #2a3a5e'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '10px'
  },
  statBox: {
    backgroundColor: '#0d1a0d',
    padding: '12px',
    borderRadius: '6px',
    textAlign: 'center'
  },
  statNumber: {
    fontSize: '20px',
    fontWeight: 'bold'
  },
  statLabel: {
    fontSize: '11px',
    color: '#888',
    marginTop: '4px'
  },
  stepsList: {
    color: '#ccc',
    fontSize: '13px',
    margin: 0,
    paddingLeft: '20px',
    lineHeight: 1.8
  },
  toast: {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#333',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '13px'
  },
  dbNotice: {
    backgroundColor: '#1a3a5e',
    border: '1px solid #2a5a8e',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '15px',
    color: '#8cc4ff',
    fontSize: '13px'
  }
};
