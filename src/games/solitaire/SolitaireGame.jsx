/**
 * SolitaireGame Component - Mobile-optimized
 *
 * Leaderboard ranks by: cards to foundation > time > moves
 * Both wins and losses can be submitted.
 */

import React, { useReducer, useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getLatestBlock } from '../../blockchain/ergo-api';
import { generateSeed, shuffleDeck } from '../../blockchain/shuffle';
import { solitaireReducer, initialState, getFoundationCount } from './gameState';
import { checkWinCondition, canAutoComplete, getHint, isGameStuck } from './gameLogic';
import { submitScore } from '../../services/leaderboard';
import SolitaireBoard from './SolitaireBoard';
import Leaderboard from '../../components/Leaderboard';

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function SolitaireGame() {
  const [state, dispatch] = useReducer(solitaireReducer, initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [showAutoComplete, setShowAutoComplete] = useState(false);
  const [scoringMode, setScoringMode] = useState('standard');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isStuck, setIsStuck] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Submission state
  const [playerName, setPlayerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitRank, setSubmitRank] = useState(null);
  const [showGameOver, setShowGameOver] = useState(true);
  const [showVerification, setShowVerification] = useState(false);
  const [showFullBlockHash, setShowFullBlockHash] = useState(false);
  const [showFullTxHash, setShowFullTxHash] = useState(false);
  const [showSeedDetails, setShowSeedDetails] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');

  const gameAreaRef = useRef(null);

  // Prevent default touch behavior on game area
  useEffect(() => {
    const preventDefault = (e) => {
      if (e.target.closest('[data-game-area]')) {
        e.preventDefault();
      }
    };
    document.addEventListener('touchmove', preventDefault, { passive: false });
    return () => document.removeEventListener('touchmove', preventDefault);
  }, []);

  // Timer effect
  useEffect(() => {
    if (!state.startTime || state.gameStatus !== 'playing') return;

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - state.startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [state.startTime, state.gameStatus]);

  // Win detection
  useEffect(() => {
    if (state.gameStatus === 'playing' && checkWinCondition(state.foundations)) {
      dispatch({ type: 'SET_WON' });
    }
  }, [state.foundations, state.gameStatus]);

  // Auto-complete detection
  useEffect(() => {
    if (state.gameStatus === 'playing' && state.blockchainData) {
      setShowAutoComplete(canAutoComplete(state));
    } else {
      setShowAutoComplete(false);
    }
  }, [state, state.gameStatus, state.blockchainData]);

  // Stuck detection
  useEffect(() => {
    if (state.gameStatus === 'playing' && state.blockchainData) {
      const stuck = isGameStuck(state);
      setIsStuck(stuck);
      if (stuck) {
        dispatch({ type: 'SET_LOST' });
      }
    }
  }, [state.tableau, state.waste, state.stock, state.foundations, state.gameStatus, state.blockchainData]);

  const foundationCount = getFoundationCount(state.foundations);

  // Helper functions for verification modal
  const truncateHash = (hash) => {
    if (!hash || hash.length <= 24) return hash || 'N/A';
    return `${hash.slice(0, 10)}...${hash.slice(-10)}`;
  };

  const formatDate = (ts) => {
    if (!ts) return 'Unknown';
    return new Date(ts).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  };

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(`${label} copied!`);
      setTimeout(() => setCopyFeedback(''), 2000);
    } catch (err) {
      setCopyFeedback('Copy failed');
      setTimeout(() => setCopyFeedback(''), 2000);
    }
  };

  // Start a new game
  const startNewGame = useCallback(async () => {
    setLoading(true);
    setError(null);
    setElapsed(0);
    setShowAutoComplete(false);
    setSubmitted(false);
    setSubmitError(null);
    setSubmitRank(null);
    setIsStuck(false);
    setShowGameOver(true);
    setShowMenu(false);

    try {
      const block = await getLatestBlock();
      const gameId = `SOL-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const seed = generateSeed(block, gameId);
      const shuffledDeck = shuffleDeck(seed);

      const blockchainData = {
        blockHeight: block.blockHeight,
        blockHash: block.blockHash,
        timestamp: block.timestamp,
        txHash: block.txHash,
        txIndex: block.txIndex,
        txCount: block.txCount,
        seed,
        gameId
      };

      localStorage.setItem(`solitaire-${gameId}`, JSON.stringify(blockchainData));

      dispatch({
        type: 'INIT_GAME',
        payload: {
          shuffledDeck,
          blockchainData,
          scoringMode
        }
      });
    } catch (err) {
      setError('Failed to fetch blockchain data. Please try again.');
      console.error('New game error:', err);
    } finally {
      setLoading(false);
    }
  }, [scoringMode]);

  const handleUndo = () => dispatch({ type: 'UNDO' });

  const handleHint = () => {
    const hint = getHint(state);
    if (hint) {
      dispatch({ type: 'SELECT_CARDS', payload: { cards: hint.cards, source: hint.from } });
      setTimeout(() => dispatch({ type: 'CLEAR_SELECTION' }), 2000);
    } else {
      alert('No moves available. Try drawing from stock or give up.');
    }
  };

  const handleGiveUp = () => {
    if (window.confirm('Are you sure you want to give up?')) {
      dispatch({ type: 'SET_LOST' });
    }
    setShowMenu(false);
  };

  const handleAutoComplete = useCallback(() => {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];

    const moveNext = () => {
      if (state.gameStatus === 'won') return;

      for (const suit of suits) {
        const foundation = state.foundations[suit];

        if (state.waste.length > 0) {
          const wasteTop = state.waste[state.waste.length - 1];
          if (wasteTop.suit === suit) {
            const canPlace = foundation.length === 0 ? wasteTop.rank === 'A' : true;
            if (canPlace) {
              dispatch({ type: 'SELECT_CARDS', payload: { cards: [wasteTop], source: { type: 'waste' } } });
              setTimeout(() => {
                dispatch({ type: 'MOVE_TO_FOUNDATION', payload: { suit } });
                setTimeout(moveNext, 100);
              }, 50);
              return;
            }
          }
        }

        for (let col = 0; col < 7; col++) {
          const column = state.tableau[col];
          if (column.length > 0) {
            const topCard = column[column.length - 1];
            if (topCard.suit === suit && topCard.faceUp) {
              dispatch({ type: 'SELECT_CARDS', payload: { cards: [topCard], source: { type: 'tableau', index: col } } });
              setTimeout(() => {
                dispatch({ type: 'MOVE_TO_FOUNDATION', payload: { suit } });
                setTimeout(moveNext, 100);
              }, 50);
              return;
            }
          }
        }
      }
    };

    moveNext();
  }, [state, dispatch]);

  // Auto-trigger completion when all tableau cards are face-up
  useEffect(() => {
    if (state.gameStatus === 'playing' && state.blockchainData) {
      const allTableauFaceUp = state.tableau.every(column =>
        column.every(card => card.faceUp)
      );

      if (allTableauFaceUp && !checkWinCondition(state.foundations)) {
        const timer = setTimeout(() => {
          handleAutoComplete();
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [state.tableau, state.foundations, state.gameStatus, state.blockchainData, handleAutoComplete]);

  // Submit score to leaderboard
  const handleSubmitScore = async () => {
    if (!state.blockchainData) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await submitScore({
        game: 'solitaire',
        gameId: state.blockchainData.gameId,
        playerName: playerName.trim() || 'Anonymous',
        score: foundationCount,
        timeSeconds: elapsed,
        moves: state.moves,
        blockHeight: state.blockchainData.blockHeight,
        blockHash: state.blockchainData.blockHash,
        txHash: state.blockchainData.txHash,
        blockTimestamp: state.blockchainData.timestamp
      });

      setSubmitted(true);
      setSubmitRank(result.rank);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isGameOver = state.gameStatus === 'won' || state.gameStatus === 'lost';

  return (
    <div style={styles.container}>
      <div style={styles.gameWrapper}>
        {/* Compact Header */}
        <div style={styles.header}>
          <div style={styles.titleSection}>
            <button style={styles.menuBtn} onClick={() => setShowMenu(!showMenu)}>☰</button>
            <h1 style={styles.title}>Solitaire</h1>
            <span style={styles.badge}>provably fair</span>
          </div>
          <button style={styles.refreshBtn} onClick={startNewGame} title="New Game">↻</button>
        </div>

        {/* Dropdown Menu */}
        {showMenu && (
          <div style={styles.menu}>
            <button style={styles.menuItem} onClick={handleUndo} disabled={state.moveHistory?.length === 0}>
              ↶ Undo
            </button>
            <button style={styles.menuItem} onClick={handleHint}>
              💡 Hint
            </button>
            {showAutoComplete && (
              <button style={styles.menuItem} onClick={() => { handleAutoComplete(); setShowMenu(false); }}>
                ⚡ Auto Complete
              </button>
            )}
            {state.gameStatus === 'playing' && state.blockchainData && (
              <button style={styles.menuItem} onClick={handleGiveUp}>
                🏳️ Give Up
              </button>
            )}
            {state.blockchainData && (
              <Link
                to={`/verify/solitaire/${state.blockchainData.gameId}`}
                style={styles.menuItem}
                onClick={() => setShowMenu(false)}
              >
                ✓ Verify Game
              </Link>
            )}
            <button style={styles.menuItem} onClick={() => { setShowLeaderboard(!showLeaderboard); setShowMenu(false); }}>
              🏆 Leaderboard
            </button>
            <Link to="/" style={styles.menuItem} onClick={() => setShowMenu(false)}>
              🏠 Home
            </Link>
          </div>
        )}

        {/* Stats Bar */}
        {state.blockchainData && (
          <div style={styles.statsBar}>
            <div style={styles.stat}>
              <span style={styles.statValue}>{foundationCount}/52</span>
              <span style={styles.statLabel}>cards</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statValue}>{formatTime(elapsed)}</span>
              <span style={styles.statLabel}>time</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statValue}>{state.moves}</span>
              <span style={styles.statLabel}>moves</span>
            </div>
            <div style={styles.stat}>
              <span style={{ ...styles.statValue, color: state.score >= 0 ? '#4ade80' : '#fb923c' }}>
                {state.scoringMode === 'vegas'
                  ? (state.score >= 0 ? `+$${state.score}` : `-$${Math.abs(state.score)}`)
                  : state.score
                }
              </span>
              <span style={styles.statLabel}>{state.scoringMode === 'vegas' ? 'cash' : 'pts'}</span>
            </div>
          </div>
        )}

        {/* Leaderboard Panel */}
        {showLeaderboard && (
          <div style={styles.leaderboardPanel}>
            <Leaderboard game="solitaire" currentGameId={state.blockchainData?.gameId} />
          </div>
        )}

        {/* Game Area */}
        <div data-game-area ref={gameAreaRef} style={styles.gameArea}>
          {loading ? (
            <div style={styles.loadingState}>
              <div style={styles.spinner}></div>
              <span>Shuffling with blockchain...</span>
            </div>
          ) : error ? (
            <div style={styles.errorState}>
              <span>{error}</span>
              <button onClick={startNewGame} style={styles.actionBtn}>Try Again</button>
            </div>
          ) : !state.blockchainData ? (
            <div style={styles.startScreen}>
              <div style={styles.startContent}>
                <h2 style={styles.startTitle}>♠ Solitaire</h2>
                <p style={styles.startSubtitle}>Provably Fair</p>

                <div style={styles.modeSelector}>
                  <label style={styles.modeLabel}>Scoring Mode:</label>
                  <select
                    value={scoringMode}
                    onChange={(e) => setScoringMode(e.target.value)}
                    style={styles.modeSelect}
                  >
                    <option value="standard">Standard (Points)</option>
                    <option value="vegas">Vegas ($52 buy-in)</option>
                  </select>
                </div>

                <div style={styles.rulesBox}>
                  {scoringMode === 'standard' ? (
                    <>
                      <div style={styles.rulesTitle}>Standard Scoring:</div>
                      <div>Waste → Tableau: +5</div>
                      <div>To Foundation: +10</div>
                      <div>Flip card: +5</div>
                    </>
                  ) : (
                    <>
                      <div style={styles.rulesTitle}>Vegas Scoring:</div>
                      <div>Buy-in: -$52</div>
                      <div>Each card to foundation: +$5</div>
                    </>
                  )}
                </div>

                <button onClick={startNewGame} style={styles.startBtn}>
                  Start Game
                </button>
              </div>
            </div>
          ) : (
            <SolitaireBoard state={state} dispatch={dispatch} />
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <span>Ergo Blockchain Verified</span>
          {state.blockchainData?.blockHeight > 0 && (
            <span style={styles.blockInfo}>Block #{state.blockchainData.blockHeight}</span>
          )}
        </div>
      </div>

      {/* Game Over Modal */}
      {isGameOver && showGameOver && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <button onClick={() => setShowGameOver(false)} style={styles.modalClose}>×</button>

            <h2 style={styles.modalTitle}>
              {state.gameStatus === 'won' ? '🎉 You Won!' : (isStuck ? '😔 No Moves Left' : '🏳️ Game Over')}
            </h2>

            <div style={styles.modalScore}>
              <span style={{ fontSize: '3rem', fontWeight: 'bold', color: foundationCount === 52 ? '#4ade80' : '#3b82f6' }}>
                {foundationCount}/52
              </span>
              <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Cards to Foundation</span>
            </div>

            <div style={styles.modalStats}>
              <div style={styles.modalStat}>
                <span style={styles.modalStatValue}>{formatTime(elapsed)}</span>
                <span style={styles.modalStatLabel}>Time</span>
              </div>
              <div style={styles.modalStat}>
                <span style={styles.modalStatValue}>{state.moves}</span>
                <span style={styles.modalStatLabel}>Moves</span>
              </div>
            </div>

            {/* Submission Form */}
            {!submitted ? (
              <div style={styles.submitSection}>
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={20}
                  style={styles.nameInput}
                />
                <button
                  onClick={handleSubmitScore}
                  disabled={submitting}
                  style={{ ...styles.submitBtn, opacity: submitting ? 0.5 : 1 }}
                >
                  {submitting ? 'Submitting...' : 'Submit Score'}
                </button>
                {submitError && <p style={styles.submitError}>{submitError}</p>}
              </div>
            ) : (
              <div style={styles.submitSuccess}>
                ✓ Submitted! Ranked #{submitRank}
              </div>
            )}

            <div style={styles.modalActions}>
              <button onClick={startNewGame} style={styles.playAgainBtn}>Play Again</button>
              <button onClick={() => setShowVerification(true)} style={styles.verifyBtn}>
                Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {showVerification && state.blockchainData && (
        <div style={styles.verifyOverlay}>
          <div style={styles.verifyModal}>
            <button style={styles.verifyCloseBtn} onClick={() => setShowVerification(false)}>×</button>

            {/* Game Summary */}
            <div style={styles.verifySection}>
              <h3 style={styles.verifySectionTitle}>Game Summary</h3>
              <div style={styles.verifyRow}>
                <span style={styles.verifyLabel}>Game ID:</span>
                <span style={styles.verifyMono}>{state.blockchainData.gameId}</span>
                <button style={styles.verifyCopyBtn} onClick={() => copyToClipboard(state.blockchainData.gameId, 'Game ID')}>Copy</button>
              </div>
              <div style={styles.verifyRow}>
                <span style={styles.verifyLabel}>Result:</span>
                <span style={state.gameStatus === 'won' ? styles.verifyWin : styles.verifyLoss}>
                  {state.gameStatus === 'won' ? '🏆 Victory!' : '📉 Game Over'}
                </span>
              </div>
              <div style={styles.verifyRow}>
                <span style={styles.verifyLabel}>Cards:</span>
                <span>{foundationCount}/52 to foundation</span>
              </div>
              <div style={styles.verifyRow}>
                <span style={styles.verifyLabel}>Played:</span>
                <span>{formatDate(state.blockchainData.timestamp)}</span>
              </div>
            </div>

            {/* Blockchain Proof */}
            <div style={styles.verifySection}>
              <h3 style={styles.verifySectionTitle}>Blockchain Proof</h3>
              <div style={styles.verifyRow}>
                <span style={styles.verifyLabel}>Block Height:</span>
                <span style={styles.verifyMono}>{state.blockchainData.blockHeight?.toLocaleString()}</span>
              </div>
              <div style={styles.verifyRow}>
                <span style={styles.verifyLabel}>Block Hash:</span>
                <span style={styles.verifyMono}>
                  {showFullBlockHash ? state.blockchainData.blockHash : truncateHash(state.blockchainData.blockHash)}
                </span>
                <button style={styles.verifyCopyBtn} onClick={() => setShowFullBlockHash(!showFullBlockHash)}>
                  {showFullBlockHash ? 'Hide' : 'Full'}
                </button>
                <button style={styles.verifyCopyBtn} onClick={() => copyToClipboard(state.blockchainData.blockHash, 'Block Hash')}>
                  Copy
                </button>
              </div>

              {/* Anti-Spoofing Box */}
              <div style={styles.antiSpoofBox}>
                <div style={styles.antiSpoofHeader}>🛡️ Anti-Spoofing Data</div>
                <div style={styles.verifyRow}>
                  <span style={styles.verifyLabel}>TX Hash:</span>
                  <span style={styles.verifyMono}>
                    {showFullTxHash ? state.blockchainData.txHash : truncateHash(state.blockchainData.txHash)}
                  </span>
                  {state.blockchainData.txHash && (
                    <>
                      <button style={styles.verifyCopyBtn} onClick={() => setShowFullTxHash(!showFullTxHash)}>
                        {showFullTxHash ? 'Hide' : 'Full'}
                      </button>
                      <button style={styles.verifyCopyBtn} onClick={() => copyToClipboard(state.blockchainData.txHash, 'TX Hash')}>
                        Copy
                      </button>
                    </>
                  )}
                </div>
                <div style={styles.verifyRow}>
                  <span style={styles.verifyLabel}>TX Index:</span>
                  <span style={styles.verifyMono}>{state.blockchainData.txIndex} of {state.blockchainData.txCount || '?'}</span>
                </div>
                <div style={styles.verifyRow}>
                  <span style={styles.verifyLabel}>Timestamp:</span>
                  <span style={styles.verifyMono}>{state.blockchainData.timestamp}</span>
                </div>
                <p style={styles.antiSpoofNote}>TX selected deterministically: index = timestamp % txCount</p>
              </div>

              {/* Explorer Links */}
              <div style={styles.explorerLinks}>
                <a
                  href={`https://explorer.ergoplatform.com/en/blocks/${state.blockchainData.blockHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.explorerLink}
                >
                  🔗 View Block
                </a>
                {state.blockchainData.txHash && (
                  <a
                    href={`https://explorer.ergoplatform.com/en/transactions/${state.blockchainData.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.explorerLink}
                  >
                    🔗 View Transaction
                  </a>
                )}
              </div>
            </div>

            {/* Shuffle Verification */}
            <div style={styles.verifySection}>
              <h3 style={styles.verifySectionTitle}>Shuffle Verification</h3>
              <p style={styles.verifyInfo}>
                The deck shuffle combines block hash + transaction hash + timestamp + game ID.
                An attacker would need to control all these simultaneously — practically impossible.
              </p>

              <div
                style={styles.collapsibleTitle}
                onClick={() => setShowSeedDetails(!showSeedDetails)}
              >
                {showSeedDetails ? '▼' : '▶'} View Seed Formula
              </div>
              {showSeedDetails && (
                <div style={styles.seedDetails}>
                  <code style={styles.codeBlock}>
                    seed = HASH(blockHash + txHash + timestamp + gameId + txIndex)
                  </code>
                  <p style={styles.seedNote}>5 independent inputs = virtually impossible to manipulate</p>
                </div>
              )}
            </div>

            {/* Full Verification Link */}
            <div style={styles.fullVerifyLink}>
              <Link to={`/verify/solitaire/${state.blockchainData.gameId}`}>
                View Full Verification Page →
              </Link>
            </div>

            {/* Copy Toast */}
            {copyFeedback && <div style={styles.copyToast}>{copyFeedback}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// Mobile-optimized styles with dark theme matching 2048
const styles = {
  container: {
    minHeight: '100vh',
    minHeight: '100dvh',
    backgroundColor: '#0f172a',
    color: '#f1f5f9',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    touchAction: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTouchCallout: 'none'
  },
  gameWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '1050px', // Wider: increased from 700px to spread out
    width: '100%',
    margin: '0 auto',
    padding: '12px',
    boxSizing: 'border-box'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    padding: '0 4px'
  },
  titleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  menuBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: '1.25rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 'clamp(1.25rem, 5vw, 1.5rem)',
    fontWeight: 'bold',
    color: '#f1f5f9',
    fontFamily: 'system-ui, sans-serif',
    margin: 0
  },
  badge: {
    fontSize: '0.55rem',
    padding: '3px 6px',
    backgroundColor: '#22c55e',
    color: '#fff',
    borderRadius: '4px',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  refreshBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: '1.5rem',
    cursor: 'pointer'
  },
  menu: {
    backgroundColor: '#1e293b',
    borderRadius: '8px',
    marginBottom: '8px',
    padding: '4px',
    border: '1px solid #334155'
  },
  menuItem: {
    display: 'block',
    width: '100%',
    padding: '10px 12px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    color: '#f1f5f9',
    fontSize: '0.9rem',
    textDecoration: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'system-ui, sans-serif'
  },
  statsBar: {
    display: 'flex',
    justifyContent: 'space-around',
    backgroundColor: '#1e293b',
    borderRadius: '8px',
    padding: '8px',
    marginBottom: '8px'
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  statValue: {
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#f1f5f9'
  },
  statLabel: {
    fontSize: '0.65rem',
    color: '#64748b',
    textTransform: 'uppercase'
  },
  leaderboardPanel: {
    marginBottom: '8px'
  },
  gameArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    touchAction: 'none',
    backgroundColor: '#1e293b', // Cypherpunk: dark slate (was green felt #166534)
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #334155' // Subtle border
  },
  loadingState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    color: '#d1fae5'
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid rgba(255,255,255,0.2)',
    borderTopColor: '#4ade80',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  errorState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    color: '#fecaca',
    padding: '20px'
  },
  startScreen: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  startContent: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center',
    maxWidth: '320px',
    width: '100%'
  },
  startTitle: {
    fontSize: '2rem',
    margin: '0 0 4px 0',
    color: '#fff'
  },
  startSubtitle: {
    fontSize: '0.875rem',
    color: '#86efac',
    margin: '0 0 20px 0'
  },
  modeSelector: {
    marginBottom: '16px'
  },
  modeLabel: {
    display: 'block',
    fontSize: '0.75rem',
    color: '#a7f3d0',
    marginBottom: '6px'
  },
  modeSelect: {
    width: '100%',
    padding: '10px',
    fontSize: '0.9rem',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#15803d',
    color: '#fff',
    cursor: 'pointer'
  },
  rulesBox: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '0.8rem',
    color: '#d1fae5',
    marginBottom: '20px',
    textAlign: 'left'
  },
  rulesTitle: {
    fontWeight: 'bold',
    marginBottom: '6px',
    color: '#fff'
  },
  startBtn: {
    width: '100%',
    padding: '14px 24px',
    fontSize: '1rem',
    fontWeight: '600',
    backgroundColor: '#22c55e',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  actionBtn: {
    padding: '10px 20px',
    backgroundColor: '#22c55e',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem'
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 4px',
    color: '#64748b',
    fontSize: '0.7rem',
    fontFamily: 'system-ui, sans-serif'
  },
  blockInfo: {
    color: '#475569'
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px'
  },
  modal: {
    backgroundColor: '#1e293b',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '400px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    position: 'relative',
    textAlign: 'center'
  },
  modalClose: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '4px'
  },
  modalTitle: {
    fontSize: '1.5rem',
    margin: '0 0 16px 0',
    color: '#f1f5f9'
  },
  modalScore: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '16px'
  },
  modalStats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '32px',
    marginBottom: '20px'
  },
  modalStat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  modalStatValue: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#f1f5f9'
  },
  modalStatLabel: {
    fontSize: '0.75rem',
    color: '#64748b'
  },
  submitSection: {
    backgroundColor: '#0f172a',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px'
  },
  nameInput: {
    width: '100%',
    padding: '12px',
    fontSize: '0.9rem',
    borderRadius: '6px',
    border: '1px solid #334155',
    backgroundColor: '#1e293b',
    color: '#f1f5f9',
    marginBottom: '10px',
    boxSizing: 'border-box'
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
    fontSize: '0.9rem',
    fontWeight: '600',
    backgroundColor: '#22c55e',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  submitError: {
    color: '#f87171',
    fontSize: '0.8rem',
    marginTop: '8px'
  },
  submitSuccess: {
    backgroundColor: '#166534',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
    color: '#4ade80',
    fontWeight: '600'
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center'
  },
  playAgainBtn: {
    padding: '12px 24px',
    fontSize: '0.9rem',
    fontWeight: '600',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  verifyBtn: {
    padding: '12px 24px',
    fontSize: '0.9rem',
    fontWeight: '600',
    backgroundColor: '#f59e0b',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  // Verification Modal Styles
  verifyOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.95)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1100,
    padding: '16px'
  },
  verifyModal: {
    backgroundColor: '#1e293b',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    position: 'relative'
  },
  verifyCloseBtn: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: '1.5rem',
    cursor: 'pointer',
    lineHeight: 1,
    padding: '4px 8px',
    borderRadius: '4px'
  },
  verifySection: {
    backgroundColor: '#16213e',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem',
    border: '1px solid #2a3a5e'
  },
  verifySectionTitle: {
    margin: '0 0 0.75rem 0',
    fontSize: '1rem',
    color: '#a0a0ff',
    borderBottom: '1px solid #2a3a5e',
    paddingBottom: '0.5rem'
  },
  verifyRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
    flexWrap: 'wrap'
  },
  verifyLabel: {
    color: '#888',
    minWidth: '90px',
    fontSize: '0.85rem'
  },
  verifyMono: {
    fontFamily: 'monospace',
    backgroundColor: '#0d1a0d',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.8rem',
    wordBreak: 'break-all',
    color: '#a5b4fc'
  },
  verifyCopyBtn: {
    padding: '0.2rem 0.4rem',
    fontSize: '0.65rem',
    backgroundColor: '#2a3a5e',
    color: '#aaa',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  verifyWin: {
    color: '#4ade80',
    fontWeight: 'bold'
  },
  verifyLoss: {
    color: '#f87171'
  },
  antiSpoofBox: {
    backgroundColor: '#1a2a1a',
    border: '1px solid #2a4a2a',
    borderRadius: '6px',
    padding: '0.75rem',
    margin: '0.75rem 0'
  },
  antiSpoofHeader: {
    color: '#4ade80',
    fontWeight: 'bold',
    fontSize: '0.85rem',
    marginBottom: '0.5rem'
  },
  antiSpoofNote: {
    color: '#666',
    fontSize: '0.7rem',
    margin: '0.5rem 0 0 0',
    fontStyle: 'italic'
  },
  explorerLinks: {
    display: 'flex',
    gap: '1rem',
    marginTop: '0.75rem',
    flexWrap: 'wrap'
  },
  explorerLink: {
    color: '#60a5fa',
    textDecoration: 'none',
    fontSize: '0.85rem'
  },
  verifyInfo: {
    color: '#aaa',
    fontSize: '0.85rem',
    margin: '0 0 0.75rem 0',
    lineHeight: 1.5
  },
  collapsibleTitle: {
    margin: '0.5rem 0',
    fontSize: '0.95rem',
    color: '#a0a0ff',
    cursor: 'pointer',
    userSelect: 'none',
    fontWeight: 'bold'
  },
  seedDetails: {
    backgroundColor: '#0d1a0d',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '0.75rem'
  },
  codeBlock: {
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    color: '#4ade80',
    display: 'block'
  },
  seedNote: {
    color: '#888',
    fontSize: '0.7rem',
    margin: '0.5rem 0 0 0'
  },
  fullVerifyLink: {
    textAlign: 'center',
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #2a3a5e'
  },
  copyToast: {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#333',
    color: '#fff',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    fontSize: '0.875rem',
    zIndex: 1200
  }
};
