/**
 * Yahtzee Verification Page - Commit-Reveal System
 * Verifies dice rolls using server secret + blockchain data
 */

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import CryptoJS from 'crypto-js';
import { calculateDieValue } from './diceLogic';

// ============================================
// DICE DISPLAY HELPERS
// ============================================
const DiceValue = ({ value }) => (
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    margin: '2px',
    backgroundColor: '#fff',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    border: '2px solid #334155'
  }}>
    {value}
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
// ROLL BREAKDOWN COMPONENT
// ============================================
function RollBreakdown({ roll, serverSecret, blockHash, timestamp, onVerify, verificationResult }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={rollStyles.container}>
      <div style={rollStyles.header} onClick={() => setExpanded(!expanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#22c55e', fontSize: 16 }}>🎲</span>
          <span style={{ color: '#94a3b8', fontSize: 12 }}>
            Turn {roll.turn}, Roll {roll.roll}
          </span>
          <div>
            {roll.diceValues?.map((v, i) => <DiceValue key={i} value={v} />)}
          </div>
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
        <div style={rollStyles.details}>
          <div style={rollStyles.row}>
            <span style={rollStyles.label}>Purpose:</span>
            <span style={rollStyles.mono}>{roll.purpose || `turn-${roll.turn}-roll-${roll.roll}`}</span>
          </div>
          <div style={rollStyles.row}>
            <span style={rollStyles.label}>Session ID:</span>
            <span style={rollStyles.mono}>{truncateHash(roll.sessionId)}</span>
          </div>

          {/* Seed Formula */}
          <div style={rollStyles.formula}>
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
                cursor: 'pointer',
                fontWeight: 'bold'
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
// TURN GROUP COMPONENT
// ============================================
function TurnGroup({ turn, rolls, serverSecret, blockHash, timestamp, verificationResults, onVerifyRoll }) {
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
              serverSecret={serverSecret}
              blockHash={blockHash}
              timestamp={timestamp}
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
  const [commitmentVerified, setCommitmentVerified] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verificationResults, setVerificationResults] = useState({});

  const backLink = '/yahtzee';
  const backText = '← Back to Yahtzee';

  // Load verification data
  useEffect(() => {
    const loadData = async () => {
      // Try sessionStorage
      const stored = sessionStorage.getItem('yahtzeeVerification');
      if (stored) {
        const data = JSON.parse(stored);
        setVerificationData(data);

        // Verify commitment if we have the server secret
        if (data.serverSecret && data.secretHash) {
          const verified = verifySecretCommitment(data.serverSecret, data.secretHash);
          setCommitmentVerified(verified);
        }
        setLoading(false);
        return;
      }

      setNotFound(true);
      setLoading(false);
    };

    loadData();
  }, [gameId]);

  // Verify a single roll
  const verifyRoll = (roll) => {
    if (!verificationData.serverSecret) {
      alert('Server secret not available for verification');
      return;
    }

    const purpose = roll.purpose || `turn-${roll.turn}-roll-${roll.roll}`;
    const seed = generateCommitRevealSeed(
      verificationData.serverSecret,
      verificationData.anchor.blockHash,
      verificationData.anchor.timestamp,
      purpose
    );

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

  const rollsByTurn = getRollsByTurn();
  const totalRolls = verificationData.rollHistory?.length || 0;
  const totalTurns = Object.keys(rollsByTurn).length;

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>🎲 Yahtzee Verification</h1>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div style={styles.statBox}>
              <div style={{ color: '#fbbf24', fontSize: 28, fontWeight: 'bold' }}>{totalTurns}</div>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>Turns</div>
            </div>
            <div style={styles.statBox}>
              <div style={{ color: '#3b82f6', fontSize: 28, fontWeight: 'bold' }}>{totalRolls}</div>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>Total Rolls</div>
            </div>
            <div style={styles.statBox}>
              <div style={{ color: '#22c55e', fontSize: 28, fontWeight: 'bold' }}>{verificationData.finalScore}</div>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>Final Score</div>
            </div>
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

        {/* Roll History */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🎯 Roll History</h2>
          <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 15 }}>
            Click any turn to expand and verify individual rolls.
          </p>

          {Object.entries(rollsByTurn).map(([turn, rolls]) => (
            <TurnGroup
              key={turn}
              turn={parseInt(turn)}
              rolls={rolls}
              serverSecret={verificationData.serverSecret}
              blockHash={verificationData.anchor?.blockHash}
              timestamp={verificationData.anchor?.timestamp}
              verificationResults={verificationResults}
              onVerifyRoll={verifyRoll}
            />
          ))}
        </div>

        {/* How It Works */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🔐 How Commit-Reveal Works</h2>
          <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.8 }}>
            <ol style={{ paddingLeft: 20, margin: 0 }}>
              <li><strong>Commit Phase:</strong> Server generates secret and commits SHA256(secret) before game starts</li>
              <li><strong>Play Phase:</strong> Each roll combines: secret + blockchain + timestamp + purpose</li>
              <li><strong>Reveal Phase:</strong> After game ends, server reveals secret for verification</li>
              <li><strong>Verification:</strong> Anyone can verify SHA256(secret) matches commitment and recalculate all rolls</li>
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
