/**
 * Backgammon Game Replay Component
 * Replays game turn-by-turn with board visualization
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';

// Initial board setup (same as gameState.js)
const createInitialBoard = () => {
  const points = Array(24).fill(null).map(() => ({ checkers: 0, color: null }));

  // White checkers (moves from 24 → 1)
  points[23] = { checkers: 2, color: 'white' };  // Point 24
  points[12] = { checkers: 5, color: 'white' };  // Point 13
  points[7] = { checkers: 3, color: 'white' };   // Point 8
  points[5] = { checkers: 5, color: 'white' };   // Point 6

  // Black checkers (moves from 1 → 24)
  points[0] = { checkers: 2, color: 'black' };   // Point 1
  points[11] = { checkers: 5, color: 'black' };  // Point 12
  points[16] = { checkers: 3, color: 'black' };  // Point 17
  points[18] = { checkers: 5, color: 'black' };  // Point 19

  return points;
};

// Deep clone board state
const cloneBoard = (board) => board.map(p => ({ ...p }));

// Apply a single move to the board
const applyMove = (board, bar, bearOff, move) => {
  const newBoard = cloneBoard(board);
  const newBar = { ...bar };
  const newBearOff = { ...bearOff };
  const { from, to, player, wasHit } = move;
  const opponent = player === 'white' ? 'black' : 'white';

  // Remove checker from source
  if (from === 'bar') {
    newBar[player]--;
  } else {
    newBoard[from].checkers--;
    if (newBoard[from].checkers === 0) {
      newBoard[from].color = null;
    }
  }

  // Place checker at destination
  if (to === 'bearOff') {
    newBearOff[player]++;
  } else {
    // Handle hitting opponent
    if (wasHit && newBoard[to].color === opponent) {
      newBar[opponent]++;
      newBoard[to].checkers = 0;
    }
    newBoard[to].checkers++;
    newBoard[to].color = player;
  }

  return { board: newBoard, bar: newBar, bearOff: newBearOff };
};

// Generate game states from roll and move history
const generateGameStates = (rollHistory, moveHistory) => {
  const states = [];
  let board = createInitialBoard();
  let bar = { white: 0, black: 0 };
  let bearOff = { white: 0, black: 0 };
  let moveIndex = 0;

  // Initial state
  states.push({
    type: 'initial',
    description: 'Game Start',
    board: cloneBoard(board),
    bar: { ...bar },
    bearOff: { ...bearOff },
    dice: null,
    player: null
  });

  // Process each roll
  rollHistory.forEach((roll, rollIdx) => {
    // State: Dice rolled
    states.push({
      type: 'roll',
      description: `${roll.player === 'white' ? 'Player' : 'AI'} rolls [${roll.dice[0]}, ${roll.dice[1]}]${roll.dice[0] === roll.dice[1] ? ' (Doubles!)' : ''}`,
      board: cloneBoard(board),
      bar: { ...bar },
      bearOff: { ...bearOff },
      dice: roll.dice,
      player: roll.player,
      turnNumber: rollIdx + 1
    });

    // Find all moves for this turn (based on timestamp proximity)
    const turnMoves = [];
    while (moveIndex < moveHistory.length) {
      const move = moveHistory[moveIndex];
      // Check if this move belongs to the current turn
      if (move.player === roll.player &&
          (!turnMoves.length || Math.abs(move.timestamp - turnMoves[0].timestamp) < 30000)) {
        turnMoves.push(move);
        moveIndex++;
      } else {
        break;
      }
    }

    // Apply each move
    turnMoves.forEach((move, idx) => {
      const result = applyMove(board, bar, bearOff, move);
      board = result.board;
      bar = result.bar;
      bearOff = result.bearOff;

      const fromLabel = move.from === 'bar' ? 'Bar' : `Point ${move.from + 1}`;
      const toLabel = move.to === 'bearOff' ? 'Bear Off' : `Point ${move.to + 1}`;

      states.push({
        type: 'move',
        description: `${move.player === 'white' ? 'Player' : 'AI'}: ${fromLabel} → ${toLabel}${move.wasHit ? ' (Hit!)' : ''} [${move.dieUsed}]`,
        board: cloneBoard(board),
        bar: { ...bar },
        bearOff: { ...bearOff },
        dice: roll.dice,
        player: roll.player,
        move: move,
        turnNumber: rollIdx + 1
      });
    });
  });

  // Final state
  states.push({
    type: 'final',
    description: 'Game End',
    board: cloneBoard(board),
    bar: { ...bar },
    bearOff: { ...bearOff },
    dice: null,
    player: null
  });

  return states;
};

// Simple board visualization component
const MiniBoard = ({ board, bar, bearOff }) => {
  // Render a simplified top-down view
  const renderPoint = (index, isTop) => {
    const point = board[index];
    const pointNum = index + 1;
    const hasCheckers = point.checkers > 0;

    return (
      <div
        key={index}
        style={{
          width: '28px',
          height: '60px',
          display: 'flex',
          flexDirection: isTop ? 'column' : 'column-reverse',
          alignItems: 'center',
          backgroundColor: index % 2 === 0 ? '#8b4513' : '#d2691e',
          borderRadius: isTop ? '0 0 14px 14px' : '14px 14px 0 0',
          padding: '2px 0',
          position: 'relative'
        }}
      >
        {hasCheckers && (
          <>
            <div style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: point.color === 'white' ? '#f5f5f5' : '#1a1a1a',
              border: `2px solid ${point.color === 'white' ? '#ccc' : '#444'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 'bold',
              color: point.color === 'white' ? '#333' : '#fff'
            }}>
              {point.checkers > 1 ? point.checkers : ''}
            </div>
          </>
        )}
        <div style={{
          position: 'absolute',
          [isTop ? 'top' : 'bottom']: '-16px',
          fontSize: '8px',
          color: '#666'
        }}>
          {pointNum}
        </div>
      </div>
    );
  };

  // Top row: points 13-24 (left to right for display)
  const topPoints = [];
  for (let i = 12; i < 24; i++) {
    topPoints.push(renderPoint(i, true));
  }

  // Bottom row: points 12-1 (left to right for display)
  const bottomPoints = [];
  for (let i = 11; i >= 0; i--) {
    bottomPoints.push(renderPoint(i, false));
  }

  return (
    <div style={{
      backgroundColor: '#2d1810',
      padding: '20px 10px',
      borderRadius: '8px',
      display: 'inline-block'
    }}>
      {/* Bar and bear-off info */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '10px',
        fontSize: '11px'
      }}>
        <div>
          <span style={{ color: '#f5f5f5' }}>⬤ Bar: {bar.white}</span>
          {' | '}
          <span style={{ color: '#666' }}>⬤ Bar: {bar.black}</span>
        </div>
        <div>
          <span style={{ color: '#f5f5f5' }}>⬤ Off: {bearOff.white}</span>
          {' | '}
          <span style={{ color: '#666' }}>⬤ Off: {bearOff.black}</span>
        </div>
      </div>

      {/* Top row */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '15px' }}>
        {topPoints.slice(0, 6)}
        <div style={{ width: '30px' }} /> {/* Bar space */}
        {topPoints.slice(6)}
      </div>

      {/* Bottom row */}
      <div style={{ display: 'flex', gap: '2px', marginTop: '15px' }}>
        {bottomPoints.slice(0, 6)}
        <div style={{ width: '30px' }} /> {/* Bar space */}
        {bottomPoints.slice(6)}
      </div>

      {/* Legend */}
      <div style={{
        marginTop: '15px',
        fontSize: '10px',
        color: '#888',
        textAlign: 'center'
      }}>
        <span style={{ color: '#f5f5f5' }}>⬤ Player (White)</span>
        {' | '}
        <span style={{ color: '#1a1a1a', backgroundColor: '#666', padding: '0 4px', borderRadius: '2px' }}>⬤ AI (Black)</span>
      </div>
    </div>
  );
};

/**
 * BackgammonReplay Component
 */
const BackgammonReplay = ({
  rollHistory = [],
  moveHistory = [],
  winner,
  winType,
  finalScore,
  onStepChange
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1200);

  const playIntervalRef = useRef(null);

  // Generate all game states
  const gameStates = useMemo(() => {
    if (!rollHistory || rollHistory.length === 0) return [];
    return generateGameStates(rollHistory, moveHistory || []);
  }, [rollHistory, moveHistory]);

  // Playback control
  useEffect(() => {
    if (isPlaying && currentStep < gameStates.length - 1) {
      playIntervalRef.current = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
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

  if (gameStates.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.noData}>No game data available for replay</div>
      </div>
    );
  }

  const step = gameStates[currentStep];
  const progress = gameStates.length > 1 ? (currentStep / (gameStates.length - 1)) * 100 : 0;
  const speedLabel = playbackSpeed <= 500 ? 'Fast' : playbackSpeed <= 1000 ? 'Normal' : 'Slow';

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>🎲 Game Replay</h3>
        {step.turnNumber && (
          <div style={styles.turnInfo}>Turn {step.turnNumber}</div>
        )}
      </div>

      <div style={styles.progress}>
        Step {currentStep + 1} of {gameStates.length}
      </div>

      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>

      {/* Action description */}
      <div style={{
        ...styles.actionBox,
        backgroundColor: step.type === 'roll' ? 'rgba(255,215,0,0.2)' :
                        step.type === 'move' ? 'rgba(76,175,80,0.2)' :
                        '#0d1525'
      }}>
        <span style={styles.actionText}>{step.description}</span>
        {step.dice && (
          <div style={styles.diceDisplay}>
            <span style={styles.die}>{step.dice[0]}</span>
            <span style={styles.die}>{step.dice[1]}</span>
          </div>
        )}
      </div>

      {/* Board visualization */}
      <div style={styles.boardContainer}>
        <MiniBoard
          board={step.board}
          bar={step.bar}
          bearOff={step.bearOff}
        />
      </div>

      {/* Controls */}
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

      {/* Final result */}
      {step.type === 'final' && winner && (
        <div style={styles.resultBox}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>
            {winner === 'white' ? '🏆 Player Wins!' : '🤖 AI Wins!'}
          </div>
          <div style={{ color: '#ffd700' }}>
            {winType?.charAt(0).toUpperCase() + winType?.slice(1)} • Score: {finalScore}
          </div>
        </div>
      )}
    </div>
  );
};

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
    marginBottom: '15px'
  },
  title: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#fff',
    margin: 0
  },
  turnInfo: {
    color: '#ffd700',
    fontSize: '14px',
    fontWeight: 'bold'
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
  actionBox: {
    textAlign: 'center',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  actionText: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    color: '#fff'
  },
  diceDisplay: {
    marginTop: '10px',
    display: 'flex',
    justifyContent: 'center',
    gap: '10px'
  },
  die: {
    display: 'inline-block',
    width: '36px',
    height: '36px',
    backgroundColor: '#fff',
    color: '#333',
    borderRadius: '6px',
    fontSize: '20px',
    fontWeight: 'bold',
    lineHeight: '36px',
    textAlign: 'center'
  },
  boardContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
    overflow: 'auto'
  },
  controls: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '15px'
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
    justifyContent: 'center',
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
  noData: {
    textAlign: 'center',
    color: '#888',
    padding: '40px'
  },
  resultBox: {
    textAlign: 'center',
    padding: '20px',
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: '8px',
    marginTop: '15px'
  }
};

export default BackgammonReplay;
