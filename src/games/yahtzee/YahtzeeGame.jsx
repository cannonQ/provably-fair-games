/**
 * YahtzeeGame - Main Game Component (Mobile-optimized)
 * Single player Yahtzee with blockchain-based provably fair RNG
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DiceArea from './DiceArea';
import Scorecard from './Scorecard';
import GameOverModal from './GameOverModal';
import {
  rollDice,
  toggleHold,
  resetDice,
  clearAllHolds,
  getDiceValues
} from './diceLogic';
import {
  createEmptyScorecard,
  calculateCategoryScore,
  calculateGrandTotal,
  isGameComplete,
  isYahtzee
} from './scoringLogic';
import {
  initializeAnchor,
  getSourceForRoll,
  createInitialTraceState,
  buildVerificationTrail
} from './blockTraversal';

/**
 * Generate unique game ID
 */
function generateGameId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);
  return `YAH-${timestamp}-${random}`;
}

function YahtzeeGame() {
  const navigate = useNavigate();

  // Game state
  const [gameId, setGameId] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [dice, setDice] = useState(resetDice());
  const [rollsRemaining, setRollsRemaining] = useState(3);
  const [scorecard, setScorecard] = useState(createEmptyScorecard());
  const [phase, setPhase] = useState('ready'); // ready, rolling, scoring, gameOver

  // Block traversal state
  const [anchor, setAnchor] = useState(null);
  const [traceState, setTraceState] = useState(createInitialTraceState());
  const [rollHistory, setRollHistory] = useState([]);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  /**
   * Initialize game - fetch anchor block
   */
  const startGame = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const newGameId = generateGameId();
      setGameId(newGameId);

      // Fetch anchor block with transaction list
      const anchorBlock = await initializeAnchor();
      setAnchor(anchorBlock);

      // Reset trace state for new game
      setTraceState(createInitialTraceState());

      // Initialize game state
      setCurrentTurn(1);
      setDice(resetDice());
      setRollsRemaining(3);
      setScorecard(createEmptyScorecard());
      setRollHistory([]);
      setStartTime(Date.now());
      setPhase('rolling');

    } catch (err) {
      console.error('Failed to start game:', err);
      setError('Failed to connect to blockchain. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Handle dice roll - uses block traversal for RNG source
   */
  const handleRoll = useCallback(async () => {
    if (rollsRemaining <= 0 || isLoading || !anchor) return;

    setIsLoading(true);
    setError(null);

    try {
      const rollNumber = 4 - rollsRemaining; // 1, 2, or 3

      // Get roll source via block traversal
      const rollSource = await getSourceForRoll(
        anchor,
        traceState,
        currentTurn,
        rollNumber
      );

      // Update React state with mutated traceState
      setTraceState({ ...traceState });

      // Roll the dice using blockchain seed
      const result = rollDice(
        dice,
        rollSource,
        gameId,
        currentTurn,
        rollNumber
      );

      // Record roll in history for verification
      const historyEntry = {
        turn: currentTurn,
        roll: rollNumber,
        source: rollSource.source,
        blockHeight: rollSource.blockHeight,
        blockHash: rollSource.blockHash,
        txHash: rollSource.txHash,
        timestamp: rollSource.timestamp,
        txIndex: rollSource.txIndex,
        traceDepth: rollSource.traceDepth,
        parentTxHash: rollSource.parentTxHash || null,
        nowTimestamp: rollSource.nowTimestamp || false,
        seed: result.seed,
        diceValues: getDiceValues(result.dice)
      };

      setRollHistory(prev => [...prev, historyEntry]);
      setDice(result.dice);
      setRollsRemaining(prev => prev - 1);

    } catch (err) {
      console.error('Roll failed:', err);
      setError('Failed to fetch blockchain data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [rollsRemaining, isLoading, anchor, traceState, currentTurn, dice, gameId]);

  /**
   * Handle toggling dice hold
   */
  const handleToggleHold = useCallback((dieIndex) => {
    if (rollsRemaining === 3 || rollsRemaining === 0) return;
    setDice(prev => toggleHold(prev, dieIndex));
  }, [rollsRemaining]);

  /**
   * Handle scoring a category
   */
  const handleScore = useCallback((category) => {
    if (rollsRemaining === 3) return; // Must roll at least once

    const score = calculateCategoryScore(category, dice);

    setScorecard(prev => {
      const updated = { ...prev, [category]: score };

      // Check for Yahtzee bonus
      if (category !== 'yahtzee' && isYahtzee(dice) && prev.yahtzee === 50) {
        updated.yahtzeeBonusCount = (prev.yahtzeeBonusCount || 0) + 1;
      }

      return updated;
    });

    // Check if game is complete
    const updatedScorecard = { ...scorecard, [category]: score };
    if (isGameComplete(updatedScorecard)) {
      setPhase('gameOver');
      setShowGameOver(true);
    } else {
      // Next turn
      setCurrentTurn(prev => prev + 1);
      setDice(clearAllHolds(resetDice()));
      setRollsRemaining(3);
      // Reset trace state for new turn
      setTraceState(createInitialTraceState());
    }
  }, [rollsRemaining, dice, scorecard]);

  /**
   * Handle game over modal close
   */
  const handleGameOverClose = () => {
    setShowGameOver(false);
  };

  /**
   * Open verification page in new tab
   */
  const handleViewVerification = () => {
    const verificationData = {
      gameId,
      playerName,
      finalScore: calculateGrandTotal(scorecard),
      anchor,
      rollHistory,
      scorecard,
      verificationTrail: buildVerificationTrail(rollHistory)
    };

    sessionStorage.setItem('yahtzeeVerification', JSON.stringify(verificationData));
    window.open('/yahtzee/verify', '_blank');
  };

  /**
   * Start new game
   */
  const handleNewGame = () => {
    setPhase('ready');
    setShowGameOver(false);
    setGameId(null);
    setAnchor(null);
    setTraceState(createInitialTraceState());
    setRollHistory([]);
    setDice(resetDice());
    setRollsRemaining(3);
    setScorecard(createEmptyScorecard());
    setCurrentTurn(1);
    setStartTime(null);
    setShowMenu(false);
  };

  // Calculate elapsed time
  const getElapsedSeconds = () => {
    if (!startTime) return 0;
    return Math.floor((Date.now() - startTime) / 1000);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Render start screen
  if (phase === 'ready') {
    return (
      <div style={styles.container}>
        <div style={styles.gameWrapper}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.titleSection}>
              <button style={styles.menuBtn} onClick={() => setShowMenu(!showMenu)}>☰</button>
              <h1 style={styles.title}>Yahtzee</h1>
              <span style={styles.badge}>provably fair</span>
            </div>
          </div>

          {showMenu && (
            <div style={styles.menu}>
              <Link to="/" style={styles.menuItem} onClick={() => setShowMenu(false)}>
                🏠 Home
              </Link>
            </div>
          )}

          <div style={styles.startScreen}>
            <div style={styles.startContent}>
              <h2 style={styles.startTitle}>🎲 Yahtzee</h2>
              <p style={styles.startSubtitle}>Blockchain-Verified Dice</p>

              <div style={styles.rulesBox}>
                <div style={styles.rulesTitle}>Quick Tips:</div>
                <div>• 13 rounds, 3 rolls per turn</div>
                <div>• Tap dice to hold between rolls</div>
                <div>• Upper bonus: 63+ points = +35</div>
                <div>• Yahtzee (5 of a kind) = 50 pts</div>
              </div>

              {error && <div style={styles.errorBox}>{error}</div>}

              <button
                onClick={startGame}
                style={{ ...styles.startBtn, opacity: isLoading ? 0.7 : 1 }}
                disabled={isLoading}
              >
                {isLoading ? 'Connecting...' : 'Start Game'}
              </button>
            </div>
          </div>

          <div style={styles.footer}>
            <span>Ergo Blockchain Verified</span>
          </div>
        </div>
      </div>
    );
  }

  // Render game screen
  return (
    <div style={styles.container}>
      <div style={styles.gameWrapper}>
        {/* Compact Header */}
        <div style={styles.header}>
          <div style={styles.titleSection}>
            <button style={styles.menuBtn} onClick={() => setShowMenu(!showMenu)}>☰</button>
            <h1 style={styles.title}>Yahtzee</h1>
            <span style={styles.badge}>provably fair</span>
          </div>
          <button style={styles.refreshBtn} onClick={handleNewGame} title="New Game">↻</button>
        </div>

        {/* Dropdown Menu */}
        {showMenu && (
          <div style={styles.menu}>
            {rollHistory.length > 0 && (
              <button style={styles.menuItem} onClick={() => { handleViewVerification(); setShowMenu(false); }}>
                ✓ Verify Rolls
              </button>
            )}
            <Link to="/" style={styles.menuItem} onClick={() => setShowMenu(false)}>
              🏠 Home
            </Link>
          </div>
        )}

        {/* Stats Bar */}
        <div style={styles.statsBar}>
          <div style={styles.stat}>
            <span style={styles.statValue}>{currentTurn}/13</span>
            <span style={styles.statLabel}>turn</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statValue}>{rollsRemaining}</span>
            <span style={styles.statLabel}>rolls</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statValue}>{calculateGrandTotal(scorecard)}</span>
            <span style={styles.statLabel}>score</span>
          </div>
          {startTime && (
            <div style={styles.stat}>
              <span style={styles.statValue}>{formatTime(getElapsedSeconds())}</span>
              <span style={styles.statLabel}>time</span>
            </div>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div style={styles.errorBox}>
            <span>{error}</span>
            <button style={styles.errorClose} onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* Game Area */}
        <div style={styles.gameArea}>
          {/* Dice Area */}
          <DiceArea
            dice={dice}
            rollsRemaining={rollsRemaining}
            onRoll={handleRoll}
            onToggleHold={handleToggleHold}
            disabled={phase === 'gameOver'}
            isLoading={isLoading}
          />

          {/* Scorecard */}
          <Scorecard
            scorecard={scorecard}
            dice={dice}
            onScore={handleScore}
            canScore={rollsRemaining < 3 && phase !== 'gameOver'}
            rollsRemaining={rollsRemaining}
            activePlayer={playerName || 'Player'}
          />
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <span>Ergo Blockchain Verified</span>
          {anchor?.blockHeight > 0 && (
            <span style={styles.blockInfo}>Block #{anchor.blockHeight}</span>
          )}
        </div>
      </div>

      {/* Game Over Modal */}
      {showGameOver && (
        <GameOverModal
          gameId={gameId}
          playerName={playerName}
          scorecard={scorecard}
          finalScore={calculateGrandTotal(scorecard)}
          elapsedSeconds={getElapsedSeconds()}
          anchor={anchor}
          rollHistory={rollHistory}
          onClose={handleGameOverClose}
          onNewGame={handleNewGame}
          onViewVerification={handleViewVerification}
        />
      )}
    </div>
  );
}

// Mobile-optimized styles with dark theme
const styles = {
  container: {
    minHeight: '100vh',
    minHeight: '100dvh',
    backgroundColor: '#0f172a',
    color: '#f1f5f9',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    touchAction: 'pan-y',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTouchCallout: 'none'
  },
  gameWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '600px',
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
  startScreen: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  startContent: {
    backgroundColor: '#1e293b',
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
    color: '#94a3b8',
    margin: '0 0 20px 0'
  },
  rulesBox: {
    backgroundColor: '#0f172a',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '0.8rem',
    color: '#94a3b8',
    marginBottom: '20px',
    textAlign: 'left'
  },
  rulesTitle: {
    fontWeight: 'bold',
    marginBottom: '6px',
    color: '#f1f5f9'
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
  gameArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    minHeight: 0,
    overflowY: 'auto'
  },
  errorBox: {
    backgroundColor: '#ef4444',
    color: '#fff',
    padding: '10px 12px',
    borderRadius: '8px',
    marginBottom: '8px',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '0.85rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  errorClose: {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '0 4px'
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
  }
};

export default YahtzeeGame;
