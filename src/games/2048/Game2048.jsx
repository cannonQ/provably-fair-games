/**
 * 2048 Main Game Component - Anchor/Fanning pattern for provably fair spawns
 * @module Game2048
 *
 * Only fetches blockchain data ONCE at game start.
 * All subsequent spawns use the same anchor block.
 *
 * Mobile-optimized with:
 * - touch-action: none to prevent browser gestures
 * - 100dvh for proper mobile viewport
 * - Cleaner compact layout
 */

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGameState, encodeMoveHistory, getHighestTile } from './gameState';
import Grid from './Grid';
import GameControls from './GameControls';
import { getLatestBlock } from '../../blockchain/ergo-api';
import { submitScore } from '../../services/leaderboard';

/**
 * Main 2048 Game Component
 */
const Game2048 = () => {
  const {
    state,
    initGame,
    move,
    continueAfterWin,
    newGame
  } = useGameState();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [submittedRank, setSubmittedRank] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const touchStartRef = useRef(null);
  const gameContainerRef = useRef(null);

  /**
   * Fetch blockchain data for randomness (only called at game start)
   */
  const fetchBlockData = useCallback(async () => {
    try {
      const blockData = await getLatestBlock();
      setError(null);
      return blockData;
    } catch (err) {
      console.error('Failed to fetch blockchain data:', err);
      setError('Failed to fetch blockchain data. Using fallback randomness.');
      return {
        blockHeight: Date.now(),
        blockHash: Date.now().toString(16) + Math.random().toString(16).slice(2),
        timestamp: Date.now()
      };
    }
  }, []);

  /**
   * Initialize game on mount
   */
  useEffect(() => {
    const startGame = async () => {
      if (state.gameId) return;
      setIsLoading(true);
      const blockData = await fetchBlockData();
      initGame(blockData);
      setIsLoading(false);
    };
    startGame();
  }, []);

  /**
   * Prevent default touch behavior on the whole page when game is active
   */
  useEffect(() => {
    const preventDefault = (e) => {
      if (e.target.closest('[data-game-area]')) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', preventDefault, { passive: false });
    return () => document.removeEventListener('touchmove', preventDefault);
  }, []);

  /**
   * Handle move
   */
  const handleMove = useCallback((direction) => {
    if (isLoading) return;
    if (state.gameStatus === 'lost') return;
    if (state.gameStatus === 'won' && !state.canContinue) return;
    move(direction);
  }, [isLoading, state.gameStatus, state.canContinue, move]);

  /**
   * Handle new game
   */
  const handleNewGame = useCallback(async () => {
    setIsLoading(true);
    setScoreSubmitted(false);
    setSubmittedRank(null);
    setPlayerName('');
    newGame();
    const blockData = await fetchBlockData();
    initGame(blockData);
    setIsLoading(false);
  }, [newGame, initGame, fetchBlockData]);

  /**
   * Handle score submission
   */
  const handleSubmitScore = useCallback(async () => {
    if (isSubmitting || scoreSubmitted) return;
    if (!state.anchorBlock?.blockHash) return;

    setIsSubmitting(true);
    try {
      const elapsedMs = Date.now() - (state.startTime || Date.now());
      const elapsedSeconds = Math.floor(elapsedMs / 1000);

      const result = await submitScore({
        game: '2048',
        gameId: state.gameId,
        playerName: playerName.trim() || 'Anonymous',
        score: state.score,
        timeSeconds: elapsedSeconds,
        moves: state.moveHistory.length,
        blockHeight: state.anchorBlock.blockHeight,
        blockHash: state.anchorBlock.blockHash,
        blockTimestamp: state.anchorBlock.timestamp,
        moveHistory: encodeMoveHistory(state.moveHistory),
        highestTile: getHighestTile(state.grid)
      });

      setScoreSubmitted(true);
      setSubmittedRank(result.rank);
    } catch (err) {
      console.error('Failed to submit score:', err);
      setError('Failed to submit score. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, scoreSubmitted, state, playerName]);

  /**
   * Keyboard controls
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeElement = document.activeElement;
      const isTyping = activeElement?.tagName === 'INPUT' ||
                       activeElement?.tagName === 'TEXTAREA' ||
                       activeElement?.isContentEditable;

      if (isTyping) return;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': handleMove('up'); break;
        case 'ArrowDown': case 's': case 'S': handleMove('down'); break;
        case 'ArrowLeft': case 'a': case 'A': handleMove('left'); break;
        case 'ArrowRight': case 'd': case 'D': handleMove('right'); break;
        case 'n': case 'N': case 'r': case 'R': handleNewGame(); break;
        default: break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove, handleNewGame]);

  /**
   * Touch/swipe controls - improved for mobile
   */
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Require minimum distance and max time for swipe
    const minSwipeDistance = 30;
    const maxSwipeTime = 500;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (deltaTime > maxSwipeTime || Math.max(absX, absY) < minSwipeDistance) {
      touchStartRef.current = null;
      return;
    }

    if (absX > absY) {
      handleMove(deltaX > 0 ? 'right' : 'left');
    } else {
      handleMove(deltaY > 0 ? 'down' : 'up');
    }

    touchStartRef.current = null;
  }, [handleMove]);

  const handleVerify = () => {
    const verifyData = {
      gameId: state.gameId,
      score: state.score,
      spawnHistory: state.spawnHistory,
      moveHistory: state.moveHistory,
      gameStatus: state.gameStatus,
      anchorBlock: state.anchorBlock
    };
    localStorage.setItem('2048_verify_data', JSON.stringify(verifyData));
    window.open('/2048/verify', '_blank');
  };

  return (
    <div style={styles.container}>
      <div style={styles.gameWrapper}>
        {/* Compact Header */}
        <div style={styles.header}>
          <div style={styles.titleSection}>
            <button style={styles.menuBtn} onClick={() => setShowMenu(!showMenu)}>☰</button>
            <h1 style={styles.title}>2048</h1>
            <span style={styles.badge}>provably fair</span>
          </div>
          <button style={styles.refreshBtn} onClick={handleNewGame} title="New Game">↻</button>
        </div>

        {/* Dropdown Menu */}
        {showMenu && (
          <div style={styles.menu}>
            <Link to="/2048/tutorial" style={styles.menuItem} onClick={() => setShowMenu(false)}>
              📖 How to Play
            </Link>
            <button style={styles.menuItem} onClick={() => { handleVerify(); setShowMenu(false); }}>
              ✓ Verify Game
            </button>
            <Link to="/leaderboard?game=2048" style={styles.menuItem} onClick={() => setShowMenu(false)}>
              🏆 Leaderboard
            </Link>
            <Link to="/" style={styles.menuItem} onClick={() => setShowMenu(false)}>
              🏠 Home
            </Link>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={styles.errorBox}>
            <span>{error}</span>
            <button style={styles.errorClose} onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* Score Section - Compact */}
        <GameControls
          score={state.score}
          highScore={state.highScore}
          moveCount={state.moveHistory.length}
          gameStatus={state.gameStatus}
          canContinue={state.canContinue}
          onNewGame={handleNewGame}
          onContinue={continueAfterWin}
          onMove={handleMove}
          gameId={state.gameId}
          anchorBlock={state.anchorBlock}
        />

        {/* Grid Section - Touch enabled */}
        <div
          data-game-area
          style={styles.gridSection}
          ref={gameContainerRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <Grid
            grid={state.grid}
            newTiles={new Set()}
            mergedTiles={new Set()}
          />

          {isLoading && (
            <div style={styles.loadingOverlay}>
              <span style={styles.loadingText}>Loading...</span>
            </div>
          )}
        </div>

        {/* Minimal Footer */}
        <div style={styles.footer}>
          <span>Ergo Blockchain Verified</span>
          {state.anchorBlock?.blockHeight > 0 && (
            <span style={styles.blockInfo}>
              Block #{state.anchorBlock.blockHeight}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Styles - Mobile-optimized dark theme
const styles = {
  container: {
    minHeight: '100vh',
    minHeight: '100dvh',
    backgroundColor: '#0f172a',
    padding: '12px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    touchAction: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTouchCallout: 'none'
  },
  gameWrapper: {
    maxWidth: '420px',
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    flex: 1
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
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
    fontSize: 'clamp(1.75rem, 8vw, 2.25rem)',
    fontWeight: 'bold',
    color: '#f1f5f9',
    fontFamily: 'system-ui, sans-serif',
    margin: 0,
    letterSpacing: '-0.5px'
  },
  badge: {
    fontSize: '0.55rem',
    padding: '3px 6px',
    backgroundColor: '#22c55e',
    color: '#fff',
    borderRadius: '4px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.3px'
  },
  refreshBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: '1.5rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  menu: {
    backgroundColor: '#1e293b',
    borderRadius: '8px',
    marginBottom: '12px',
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
  gridSection: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    touchAction: 'none',
    minHeight: 0,
    padding: '8px 0'
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
    zIndex: 100
  },
  loadingText: {
    fontSize: '1rem',
    color: '#3b82f6',
    fontFamily: 'system-ui, sans-serif'
  },
  errorBox: {
    backgroundColor: '#ef4444',
    color: '#fff',
    padding: '10px 12px',
    borderRadius: '8px',
    marginBottom: '12px',
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

export default Game2048;
