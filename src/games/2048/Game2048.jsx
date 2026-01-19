/**
 * 2048 Main Game Component - Anchor/Fanning pattern for provably fair spawns
 * @module Game2048
 *
 * Only fetches blockchain data ONCE at game start.
 * All subsequent spawns use the same anchor block.
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

  const touchStartRef = useRef(null);
  const gameContainerRef = useRef(null);

  // Styles - Dark theme to match site
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#1a1a2e',
      padding: '20px',
      boxSizing: 'border-box'
    },
    gameWrapper: {
      maxWidth: '500px',
      margin: '0 auto'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      color: '#fff',
      fontFamily: 'Arial, sans-serif',
      margin: 0
    },
    links: {
      display: 'flex',
      gap: '15px'
    },
    link: {
      color: '#4ade80',
      textDecoration: 'none',
      fontSize: '0.9rem',
      fontFamily: 'Arial, sans-serif'
    },
    gridSection: {
      marginBottom: '20px',
      position: 'relative'
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(26, 26, 46, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '8px',
      zIndex: 100
    },
    loadingText: {
      fontSize: '1.2rem',
      color: '#4ade80',
      fontFamily: 'Arial, sans-serif'
    },
    errorBox: {
      backgroundColor: '#f44336',
      color: '#fff',
      padding: '10px 15px',
      borderRadius: '6px',
      marginBottom: '15px',
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    errorClose: {
      background: 'none',
      border: 'none',
      color: '#fff',
      fontSize: '1.2rem',
      cursor: 'pointer'
    },
    footer: {
      textAlign: 'center',
      marginTop: '20px',
      color: '#888',
      fontSize: '0.85rem',
      fontFamily: 'Arial, sans-serif'
    },
    anchorInfo: {
      backgroundColor: '#16213e',
      padding: '10px',
      borderRadius: '6px',
      marginTop: '10px',
      fontSize: '0.75rem',
      color: '#aaa',
      border: '1px solid #2a3a5e'
    }
  };

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
      // Fallback: use timestamp-based pseudo-random (less secure but functional)
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
      if (state.gameId) return; // Already initialized

      setIsLoading(true);
      const blockData = await fetchBlockData();
      initGame(blockData);
      setIsLoading(false);
    };

    startGame();
  }, []);

  /**
   * Handle move - spawns are now synchronous (no API call needed!)
   */
  const handleMove = useCallback((direction) => {
    if (isLoading) return;
    if (state.gameStatus === 'lost') return;
    if (state.gameStatus === 'won' && !state.canContinue) return;

    move(direction);
  }, [isLoading, state.gameStatus, state.canContinue, move]);

  /**
   * Handle new game - fetch fresh anchor block
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
   * Handle score submission to leaderboard
   */
  const handleSubmitScore = useCallback(async () => {
    if (isSubmitting || scoreSubmitted) return;
    if (!state.anchorBlock?.blockHash) return;

    setIsSubmitting(true);
    try {
      // Calculate elapsed time in seconds
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
      // Ignore keyboard shortcuts when typing in an input field
      const activeElement = document.activeElement;
      const isTyping = activeElement?.tagName === 'INPUT' ||
                       activeElement?.tagName === 'TEXTAREA' ||
                       activeElement?.isContentEditable;

      if (isTyping) return;

      // Prevent default for arrow keys to stop page scrolling
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          handleMove('up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          handleMove('down');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          handleMove('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          handleMove('right');
          break;
        case 'n':
        case 'N':
        case 'r':
        case 'R':
          handleNewGame();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove, handleNewGame]);

  /**
   * Touch/swipe controls
   */
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY
    };
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const minSwipeDistance = 30;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (Math.max(absX, absY) < minSwipeDistance) {
      touchStartRef.current = null;
      return;
    }

    if (absX > absY) {
      // Horizontal swipe
      handleMove(deltaX > 0 ? 'right' : 'left');
    } else {
      // Vertical swipe
      handleMove(deltaY > 0 ? 'down' : 'up');
    }

    touchStartRef.current = null;
  }, [handleMove]);

  const handleTouchMove = useCallback((e) => {
    // Prevent scrolling while swiping on the game
    if (touchStartRef.current) {
      e.preventDefault();
    }
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.gameWrapper}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>2048</h1>
          <div style={styles.links}>
            <Link to="/2048/tutorial" style={styles.link}>How to Play</Link>
            <span
              style={{ ...styles.link, cursor: 'pointer' }}
              onClick={() => {
                // Store game state for verify page
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
              }}
            >
              Verify ↗
            </span>
            <Link to="/" style={styles.link}>Home</Link>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={styles.errorBox}>
            <span>{error}</span>
            <button
              style={styles.errorClose}
              onClick={() => setError(null)}
              aria-label="Close error"
            >
              ×
            </button>
          </div>
        )}

        {/* Game Controls (Score, Status, Buttons) */}
        <GameControls
          score={state.score}
          highScore={state.highScore}
          moveCount={state.moveHistory.length}
          gameStatus={state.gameStatus}
          canContinue={state.canContinue}
          onNewGame={handleNewGame}
          onContinue={continueAfterWin}
          onMove={handleMove}
          onSubmitScore={handleSubmitScore}
          scoreSubmitted={scoreSubmitted}
          submittedRank={submittedRank}
          playerName={playerName}
          onPlayerNameChange={setPlayerName}
        />

        {/* Grid Section */}
        <div
          style={styles.gridSection}
          ref={gameContainerRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
        >
          <Grid
            grid={state.grid}
            newTiles={new Set()}
            mergedTiles={new Set()}
          />

          {/* Loading Overlay */}
          {isLoading && (
            <div style={styles.loadingOverlay}>
              <span style={styles.loadingText}>Loading blockchain data...</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <p>Provably fair using Ergo blockchain</p>
          <p>Game ID: {state.gameId ? state.gameId.slice(0, 20) + '...' : 'Loading...'}</p>
          {state.anchorBlock?.blockHeight > 0 && (
            <div style={styles.anchorInfo}>
              <strong>Anchor Block:</strong> #{state.anchorBlock.blockHeight} |
              Spawns: {state.spawnHistory.length} |
              Moves: {state.moveHistory.length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Game2048;
