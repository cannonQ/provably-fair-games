/**
 * 2048 Game Replay Component
 * Replays a game from move history with verifiable spawns
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createEmptyGrid, cloneGrid, slideGrid, getEmptyCells, canMove, hasWon } from './gridLogic';
import { generateMasterSeed, calculateSpawnPosition, calculateSpawnValue } from './spawnLogic';
import Grid from './Grid';

/**
 * Simulate spawning a tile deterministically
 */
const simulateSpawn = (grid, blockHash, gameId, spawnIndex) => {
  const emptyCells = getEmptyCells(grid);
  if (emptyCells.length === 0) return { grid, spawn: null };

  const seed = generateMasterSeed(blockHash, gameId, spawnIndex);
  const position = calculateSpawnPosition(seed, emptyCells);
  const value = calculateSpawnValue(seed);

  const newGrid = cloneGrid(grid);
  newGrid[position.row][position.col] = {
    row: position.row,
    col: position.col,
    value,
    id: Date.now() + spawnIndex,
    isNew: true
  };

  return {
    grid: newGrid,
    spawn: { row: position.row, col: position.col, value, seed, emptyCells: emptyCells.length }
  };
};

/**
 * Decode move history string (e.g., "UDLR" -> ['up', 'down', 'left', 'right'])
 */
const decodeMoveHistory = (encoded) => {
  if (!encoded) return [];
  const dirMap = { U: 'up', D: 'down', L: 'left', R: 'right' };
  return encoded.split('').map(c => dirMap[c]).filter(Boolean);
};

/**
 * GameReplay Component
 */
const GameReplay = ({
  gameId,
  anchorBlockHash,
  anchorBlockHeight,
  moveHistory,
  finalScore,
  playerName,
  onStepChange
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1200); // ms per step (higher = slower)
  const [gameStates, setGameStates] = useState([]);
  const [error, setError] = useState(null);

  const playIntervalRef = useRef(null);

  // Generate all game states from move history
  useEffect(() => {
    if (!anchorBlockHash || !gameId) return;

    try {
      const moves = decodeMoveHistory(moveHistory);
      const states = [];
      let grid = createEmptyGrid();
      let score = 0;
      let spawnIndex = 0;

      // Initial state (empty)
      states.push({
        grid: cloneGrid(grid),
        score: 0,
        move: null,
        spawn: null,
        stepType: 'init',
        spawnIndex: -1
      });

      // First spawn (spawnIndex 0)
      const spawn1 = simulateSpawn(grid, anchorBlockHash, gameId, spawnIndex++);
      grid = spawn1.grid;
      states.push({
        grid: cloneGrid(grid),
        score: 0,
        move: null,
        spawn: spawn1.spawn,
        stepType: 'spawn',
        spawnIndex: 0
      });

      // Second spawn (spawnIndex 1)
      const spawn2 = simulateSpawn(grid, anchorBlockHash, gameId, spawnIndex++);
      grid = spawn2.grid;
      states.push({
        grid: cloneGrid(grid),
        score: 0,
        move: null,
        spawn: spawn2.spawn,
        stepType: 'spawn',
        spawnIndex: 1
      });

      // Process each move
      for (let i = 0; i < moves.length; i++) {
        const direction = moves[i];
        const { grid: movedGrid, score: moveScore, moved } = slideGrid(grid, direction);

        if (moved) {
          score += moveScore;
          grid = movedGrid;

          // State after move (before spawn)
          states.push({
            grid: cloneGrid(grid),
            score,
            move: direction,
            spawn: null,
            stepType: 'move',
            moveIndex: i
          });

          // Spawn new tile
          const spawnResult = simulateSpawn(grid, anchorBlockHash, gameId, spawnIndex++);
          grid = spawnResult.grid;

          states.push({
            grid: cloneGrid(grid),
            score,
            move: null,
            spawn: spawnResult.spawn,
            stepType: 'spawn',
            spawnIndex: spawnIndex - 1
          });
        }
      }

      // Final state
      states.push({
        grid: cloneGrid(grid),
        score,
        move: null,
        spawn: null,
        stepType: 'final',
        gameOver: !canMove(grid),
        won: hasWon(grid)
      });

      setGameStates(states);
      setCurrentStep(states.length - 1); // Start at end
      setError(null);
    } catch (err) {
      console.error('Replay generation failed:', err);
      setError('Failed to generate replay: ' + err.message);
    }
  }, [anchorBlockHash, gameId, moveHistory]);

  // Playback control
  useEffect(() => {
    if (isPlaying && currentStep < gameStates.length - 1) {
      playIntervalRef.current = setTimeout(() => {
        setCurrentStep(prev => Math.min(prev + 1, gameStates.length - 1));
      }, playbackSpeed);
    } else if (currentStep >= gameStates.length - 1) {
      setIsPlaying(false);
    }

    return () => {
      if (playIntervalRef.current) {
        clearTimeout(playIntervalRef.current);
      }
    };
  }, [isPlaying, currentStep, gameStates.length, playbackSpeed]);

  // Notify parent of step changes
  useEffect(() => {
    if (onStepChange && gameStates[currentStep]) {
      onStepChange(gameStates[currentStep], currentStep, gameStates.length);
    }
  }, [currentStep, gameStates, onStepChange]);

  const handlePlayPause = () => {
    if (currentStep >= gameStates.length - 1) {
      setCurrentStep(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    setCurrentStep(prev => Math.min(prev + 1, gameStates.length - 1));
  };

  const handleStepBack = () => {
    setIsPlaying(false);
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const handleSkipToEnd = () => {
    setIsPlaying(false);
    setCurrentStep(gameStates.length - 1);
  };

  const currentState = gameStates[currentStep] || { grid: createEmptyGrid(), score: 0 };

  // Styles
  const styles = {
    container: {
      backgroundColor: '#16213e',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
      border: '1px solid #2a3a5e'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '15px',
      flexWrap: 'wrap',
      gap: '10px'
    },
    title: {
      fontSize: '1.2rem',
      fontWeight: 'bold',
      color: '#fff',
      margin: 0
    },
    scoreDisplay: {
      display: 'flex',
      gap: '20px',
      alignItems: 'center'
    },
    scoreBox: {
      backgroundColor: '#2a3a5e',
      padding: '8px 15px',
      borderRadius: '6px',
      textAlign: 'center'
    },
    scoreLabel: {
      fontSize: '0.7rem',
      color: '#888',
      textTransform: 'uppercase'
    },
    scoreValue: {
      fontSize: '1.2rem',
      fontWeight: 'bold',
      color: '#4ade80'
    },
    gridContainer: {
      maxWidth: '350px',
      margin: '0 auto 15px'
    },
    controls: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '15px',
      flexWrap: 'wrap'
    },
    button: {
      padding: '10px 15px',
      backgroundColor: '#2a3a5e',
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '45px'
    },
    playButton: {
      backgroundColor: '#4ade80',
      color: '#000',
      padding: '10px 20px'
    },
    speedControl: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px',
      backgroundColor: '#0d1525',
      borderRadius: '6px'
    },
    speedLabel: {
      fontSize: '0.8rem',
      color: '#888'
    },
    speedSlider: {
      width: '100px',
      cursor: 'pointer'
    },
    progress: {
      textAlign: 'center',
      color: '#888',
      fontSize: '0.9rem',
      marginBottom: '10px'
    },
    progressBar: {
      width: '100%',
      height: '6px',
      backgroundColor: '#0d1525',
      borderRadius: '3px',
      overflow: 'hidden',
      marginBottom: '15px'
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#4ade80',
      transition: 'width 0.1s ease'
    },
    stepInfo: {
      textAlign: 'center',
      padding: '10px',
      backgroundColor: '#0d1525',
      borderRadius: '6px',
      fontSize: '0.85rem'
    },
    moveTag: {
      display: 'inline-block',
      padding: '3px 8px',
      backgroundColor: '#2a3a5e',
      borderRadius: '4px',
      marginRight: '8px',
      color: '#4ade80'
    },
    spawnTag: {
      display: 'inline-block',
      padding: '3px 8px',
      backgroundColor: '#1a3a5c',
      borderRadius: '4px',
      color: '#64b5f6'
    },
    error: {
      backgroundColor: '#f44336',
      color: '#fff',
      padding: '15px',
      borderRadius: '6px',
      textAlign: 'center'
    }
  };

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  if (gameStates.length === 0) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', color: '#888', padding: '40px' }}>
          Loading replay...
        </div>
      </div>
    );
  }

  const progress = gameStates.length > 1 ? (currentStep / (gameStates.length - 1)) * 100 : 0;
  const speedLabel = playbackSpeed <= 400 ? 'Fast' : playbackSpeed <= 800 ? 'Normal' : 'Slow';

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Game Replay</h3>
        <div style={styles.scoreDisplay}>
          <div style={styles.scoreBox}>
            <div style={styles.scoreLabel}>Score</div>
            <div style={styles.scoreValue}>{currentState.score.toLocaleString()}</div>
          </div>
          <div style={styles.scoreBox}>
            <div style={styles.scoreLabel}>Final</div>
            <div style={{ ...styles.scoreValue, color: '#fff' }}>{finalScore?.toLocaleString() || '—'}</div>
          </div>
        </div>
      </div>

      <div style={styles.progress}>
        Step {currentStep + 1} of {gameStates.length}
        {currentState.stepType === 'move' && ` — Move: ${currentState.move?.toUpperCase()}`}
        {currentState.stepType === 'spawn' && ` — Spawn #${currentState.spawnIndex}`}
        {currentState.stepType === 'final' && ` — ${currentState.won ? 'Won!' : currentState.gameOver ? 'Game Over' : 'Final'}`}
      </div>

      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>

      <div style={styles.gridContainer}>
        <Grid
          grid={currentState.grid}
          newTiles={new Set()}
          mergedTiles={new Set()}
        />
      </div>

      <div style={styles.controls}>
        <button style={styles.button} onClick={handleReset} title="Reset">
          ⏮
        </button>
        <button style={styles.button} onClick={handleStepBack} title="Step Back">
          ◀
        </button>
        <button
          style={{ ...styles.button, ...styles.playButton }}
          onClick={handlePlayPause}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button style={styles.button} onClick={handleStepForward} title="Step Forward">
          ▶
        </button>
        <button style={styles.button} onClick={handleSkipToEnd} title="Skip to End">
          ⏭
        </button>
      </div>

      <div style={styles.speedControl}>
        <span style={styles.speedLabel}>Speed: {speedLabel}</span>
        <input
          type="range"
          min="100"
          max="1800"
          step="100"
          value={1900 - playbackSpeed}
          onChange={(e) => setPlaybackSpeed(1900 - parseInt(e.target.value))}
          style={styles.speedSlider}
        />
      </div>

      {currentState.spawn && (
        <div style={styles.stepInfo}>
          <span style={styles.spawnTag}>
            Spawn #{currentState.spawnIndex}: ({currentState.spawn.row}, {currentState.spawn.col}) = {currentState.spawn.value}
          </span>
          <div style={{ marginTop: '5px', color: '#666', fontSize: '0.75rem', fontFamily: 'monospace' }}>
            Seed: {currentState.spawn.seed?.substring(0, 16)}... | Empty cells: {currentState.spawn.emptyCells}
          </div>
        </div>
      )}

      {currentState.stepType === 'move' && (
        <div style={styles.stepInfo}>
          <span style={styles.moveTag}>
            Move: {currentState.move?.toUpperCase()}
          </span>
          <span style={{ color: '#888' }}>
            +{(currentState.score - (gameStates[currentStep - 1]?.score || 0)).toLocaleString()} points
          </span>
        </div>
      )}
    </div>
  );
};

export default GameReplay;
