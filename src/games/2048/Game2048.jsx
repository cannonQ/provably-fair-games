/**
 * 2048 Main Game Component - Full game integration with controls and blockchain
 * @module Game2048
 */

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGameState } from './gameState';
import Grid from './Grid';
import GameControls from './GameControls';
import { getLatestBlock } from '../../blockchain/ergo-api';

/**
 * Main 2048 Game Component
 */
const Game2048 = () => {
  const {
    state,
    initGame,
    move,
    spawnNewTile,
    continueAfterWin,
    newGame
  } = useGameState();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [newTiles, setNewTiles] = useState(new Set());
  const [mergedTiles, setMergedTiles] = useState(new Set());
  
  const touchStartRef = useRef(null);
  const gameContainerRef = useRef(null);

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#faf8ef',
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
      color: '#776e65',
      fontFamily: 'Arial, sans-serif',
      margin: 0
    },
    links: {
      display: 'flex',
      gap: '15px'
    },
    link: {
      color: '#8f7a66',
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
      backgroundColor: 'rgba(250, 248, 239, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '8px',
      zIndex: 100
    },
    loadingText: {
      fontSize: '1.2rem',
      color: '#776e65',
      fontFamily: 'Arial, sans-serif'
    },
    errorBox: {
      backgroundColor: '#f67c5f',
      color: '#f9f6f2',
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
      color: '#f9f6f2',
      fontSize: '1.2rem',
      cursor: 'pointer'
    },
    footer: {
      textAlign: 'center',
      marginTop: '20px',
      color: '#9e948a',
      fontSize: '0.85rem',
      fontFamily: 'Arial, sans-serif'
    }
  };

  /**
   * Fetch blockchain data for randomness
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
      setIsProcessing(true);
      const blockData = await fetchBlockData();
      initGame(blockData);
      setIsProcessing(false);
    };
    
    if (!state.gameId) {
      startGame();
    }
  }, []);

  /**
   * Handle move and spawn sequence
   */
  const handleMove = useCallback(async (direction) => {
    if (isProcessing) return;
    if (state.gameStatus === 'lost') return;
    if (state.gameStatus === 'won' && !state.canContinue) return;

    // Attempt move
    move(direction);
  }, [isProcessing, state.gameStatus, state.canContinue, move]);

  /**
   * Handle tile spawn after valid move
   */
  useEffect(() => {
    const spawnAfterMove = async () => {
      if (!state.pendingSpawn) return;
      
      setIsProcessing(true);
      const blockData = await fetchBlockData();
      
      // Track which tiles are new for animation
      spawnNewTile(blockData);
      
      // Clear animation flags after animation completes
      setTimeout(() => {
        setNewTiles(new Set());
        setMergedTiles(new Set());
      }, 200);
      
      setIsProcessing(false);
    };

    spawnAfterMove();
  }, [state.pendingSpawn]);

  /**
   * Track new and merged tiles for animations
   */
  useEffect(() => {
    if (state.spawnHistory.length > 0) {
      const lastSpawn = state.spawnHistory[state.spawnHistory.length - 1];
      // Find the tile at the spawn position
      const tile = state.grid[lastSpawn.row]?.[lastSpawn.col];
      if (tile && tile.id) {
        setNewTiles(new Set([tile.id]));
      }
    }
  }, [state.spawnHistory.length]);

  /**
   * Handle new game
   */
  const handleNewGame = useCallback(async () => {
    setIsProcessing(true);
    newGame();
    const blockData = await fetchBlockData();
    initGame(blockData);
    setIsProcessing(false);
  }, [newGame, initGame, fetchBlockData]);

  /**
   * Keyboard controls
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
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
            <Link to="/2048/verify" style={styles.link}>Verify</Link>
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
            newTiles={newTiles}
            mergedTiles={mergedTiles}
          />
          
          {/* Loading Overlay */}
          {isProcessing && !state.gameId && (
            <div style={styles.loadingOverlay}>
              <span style={styles.loadingText}>Loading blockchain data...</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <p>Provably fair using Ergo blockchain randomness</p>
          <p>Game ID: {state.gameId ? state.gameId.slice(0, 8) + '...' : 'Loading...'}</p>
        </div>
      </div>
    </div>
  );
};

export default Game2048;
