/**
 * Backgammon Game Component
 * 
 * Main game orchestration including:
 * - Blockchain integration for provably fair dice
 * - AI opponent automation
 * - Win detection and scoring
 * - Timer tracking for leaderboard
 */

import React, { useReducer, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Game logic imports
import { gameReducer, initialState, actions, selectors } from './gameState';
import { 
  rollDiceValues, 
  isDoubles, 
  checkGameOver, 
  detectWinType,
  generateVerificationData 
} from './gameLogic';
import { getAllLegalMoves, isTurnComplete, applyMove } from './moveValidation';
import { selectMove, selectTurnSequence, shouldDouble, shouldAcceptDouble, getThinkingDelay } from './ai';

// Component imports
import BackgammonBoard from './BackgammonBoard';
import Dice from './Dice';
import DoublingCube from './DoublingCube';
import GameOverModal from './GameOverModal';
import RotatePrompt from './RotatePrompt';

// Blockchain API
import { getLatestBlock } from '../../blockchain/ergo-api';

// Storage (localStorage persistence)
import { saveGameState, loadGameState, clearGameState } from './storage';


const BackgammonGame = () => {
  const navigate = useNavigate();
  
  // Game state
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  // Local UI state
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState('normal');
  const [isRolling, setIsRolling] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showGameOver, setShowGameOver] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [validMoves, setValidMoves] = useState([]);

  // Refs for cleanup
  const aiTimeoutRef = useRef(null);
  const aiCooldownRef = useRef(null);  // Separate ref for aiThinking cooldown to avoid cleanup conflicts
  const turnNumberRef = useRef(null);
  const stateRef = useRef(state);  // Ref to always have latest state for AI callbacks

  // Keep stateRef in sync with current state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // AI make move - uses stateRef to always access latest state
  const handleAIMove = useCallback(async () => {
    try {
      const currentState = stateRef.current;
      const legalMoves = getAllLegalMoves(currentState);

      if (legalMoves.length === 0) {
        dispatch(actions.completeTurn());
        setAiThinking(false);
        return;
      }

      const selectedMove = await selectMove(legalMoves, currentState, currentState.aiDifficulty);

      if (selectedMove) {
        dispatch(actions.moveChecker(selectedMove.from, selectedMove.to));

        // Short delay then allow next move check
        // Use separate ref to avoid useEffect cleanup clearing this timeout
        aiCooldownRef.current = setTimeout(() => {
          setAiThinking(false);
        }, 400);
      } else {
        dispatch(actions.completeTurn());
        setAiThinking(false);
      }
    } catch (error) {
      console.error('AI move error:', error);
      dispatch(actions.completeTurn());
      setAiThinking(false);
    }
  }, [dispatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
      }
      if (aiCooldownRef.current) {
        clearTimeout(aiCooldownRef.current);
      }
    };
  }, []);

  // Save game state to localStorage whenever it changes
  useEffect(() => {
    if (state.gameId && gameStarted && state.phase !== 'gameOver') {
      saveGameState(state.gameId, state);
    }
  }, [state, gameStarted]);

  // Load saved game state on mount
  useEffect(() => {
    // Only run once on mount
    const savedState = loadGameState('current');
    if (savedState && savedState.gameId) {
      dispatch({ type: 'RESTORE_STATE', payload: savedState });
      setGameStarted(true);
      setDifficulty(savedState.aiDifficulty);
    }
  }, []); // Empty dependency array = runs once on mount

  // Clear localStorage when game ends
  useEffect(() => {
    if (state.phase === 'gameOver' && state.gameId) {
      // Wait a bit before clearing (allows player to see final state)
      const clearTimer = setTimeout(() => {
        clearGameState(state.gameId);
      }, 1000);

      return () => clearTimeout(clearTimer);
    }
  }, [state.phase, state.gameId]);

  // Calculate valid moves when selection changes
  useEffect(() => {
    if (selectedPoint !== null && state.phase === 'moving') {
      const moves = getAllLegalMoves(state);
      const movesFromSelected = moves.filter(m => m.from === selectedPoint);
      setValidMoves(movesFromSelected);
    } else {
      setValidMoves([]);
    }
  }, [selectedPoint, state]);

  // Check for game over
  useEffect(() => {
    if (state.phase === 'moving') {
      const { isOver, winner } = checkGameOver(state);
      if (isOver && winner) {
        const loser = winner === 'white' ? 'black' : 'white';
        const winType = detectWinType(state, loser);
        dispatch(actions.endGame(winner, winType));
      }
    }
  }, [state.bearOff.white, state.bearOff.black, state.phase]);

  // Show game over modal
  useEffect(() => {
    if (state.phase === 'gameOver' && state.winner) {
      setShowGameOver(true);
    }
  }, [state.phase, state.winner]);

  // AI turn automation
  useEffect(() => {
    if (!gameStarted || state.phase === 'gameOver') return;
    if (state.currentPlayer !== 'black') return;

    // Handle AI doubling decision
    if (state.phase === 'rolling') {
      const shouldOfferDouble = shouldDouble(state, 'black', state.aiDifficulty);
      if (shouldOfferDouble) {
        aiTimeoutRef.current = setTimeout(() => {
          dispatch(actions.offerDouble());
        }, 1000);
        return;
      }

      // AI rolls
      aiTimeoutRef.current = setTimeout(() => {
        handleAIRoll();
      }, 1000);
      return;
    }

    // Handle AI moving
    if (state.phase === 'moving' && !aiThinking) {
      // Use stateRef to get the most current state for legal move calculation
      const currentState = stateRef.current;
      const legalMoves = getAllLegalMoves(currentState);

      if (legalMoves.length === 0) {
        aiTimeoutRef.current = setTimeout(() => {
          dispatch(actions.completeTurn());
        }, 500);
        return;
      }

      setAiThinking(true);
      const delay = getThinkingDelay(state.aiDifficulty, legalMoves.length);

      aiTimeoutRef.current = setTimeout(() => {
        handleAIMove();
      }, delay);
      return;
    }

    // Handle AI response to double offer
    if (state.phase === 'doubleOffered' && state.currentPlayer === 'black') {
      aiTimeoutRef.current = setTimeout(() => {
        const currentState = stateRef.current;
        const accepts = shouldAcceptDouble(currentState, 'black', currentState.aiDifficulty);
        if (accepts) {
          dispatch(actions.acceptDouble());
        } else {
          dispatch(actions.declineDouble());
        }
      }, 1500);
    }

    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
      }
    };
  }, [state.currentPlayer, state.phase, state.dice, state.diceUsed, gameStarted, aiThinking, state.aiDifficulty, dispatch, handleAIMove]);

  // Start new game
  const handleStartGame = async () => {
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      // Get blockchain data and start game
      const block = await getLatestBlock();
      const blockchainData = {
        blockHeight: block.height,
        blockHash: block.id,
        timestamp: block.timestamp
      };

      dispatch(actions.initGame(difficulty, blockchainData));
      setGameStarted(true);
      turnNumberRef.current = 0;
    } catch (error) {
      console.error('Failed to fetch blockchain data:', error);
      setErrorMessage('Failed to connect to blockchain. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Roll dice using blockchain
  const handleRollDice = async () => {
    if (state.phase !== 'rolling' || isRolling) return;
    
    setIsRolling(true);
    setErrorMessage(null);

    try {
      const block = await getLatestBlock();
      turnNumberRef.current++;
      
      const dice = rollDiceValues(block.id, state.gameId, turnNumberRef.current);
      
      // Store verification data
      const verificationData = generateVerificationData(
        block.id,
        state.gameId,
        turnNumberRef.current,
        dice
      );

      dispatch(actions.rollDice(dice, block.id));

      // Check if any moves are possible
      setTimeout(() => {
        const newState = {
          ...state,
          dice: isDoubles(dice) ? [dice[0], dice[0], dice[0], dice[0]] : dice,
          diceUsed: isDoubles(dice) ? [false, false, false, false] : [false, false],
          phase: 'moving'
        };
        const legalMoves = getAllLegalMoves(newState);
        
        if (legalMoves.length === 0) {
          // No legal moves, end turn
          setTimeout(() => {
            dispatch(actions.completeTurn());
          }, 1000);
        }
      }, 100);

    } catch (error) {
      console.error('Failed to roll dice:', error);
      setErrorMessage('Failed to fetch blockchain data for dice roll.');
    } finally {
      setIsRolling(false);
    }
  };

  // AI roll dice
  const handleAIRoll = async () => {
    setIsRolling(true);

    try {
      const currentState = stateRef.current;
      const block = await getLatestBlock();
      turnNumberRef.current++;

      const dice = rollDiceValues(block.id, currentState.gameId, turnNumberRef.current);
      dispatch(actions.rollDice(dice, block.id));

      // Check for no legal moves after roll
      // Use setTimeout to allow state to update, then check using stateRef
      setTimeout(() => {
        const stateAfterRoll = stateRef.current;
        // Only check if we're still in moving phase (state might have changed)
        if (stateAfterRoll.phase === 'moving' && stateAfterRoll.currentPlayer === 'black') {
          const legalMoves = getAllLegalMoves(stateAfterRoll);

          if (legalMoves.length === 0) {
            setTimeout(() => {
              dispatch(actions.completeTurn());
              setAiThinking(false);
            }, 1000);
          }
        }
      }, 100);

    } catch (error) {
      console.error('AI roll failed:', error);
      setErrorMessage('AI failed to roll. Retrying...');
      setTimeout(handleAIRoll, 2000);
    } finally {
      setIsRolling(false);
    }
  };

  // Handle point click (for destination)
  const handlePointClick = (pointIndex) => {
    if (state.currentPlayer !== 'white' || state.phase !== 'moving') return;

    // If clicking a valid destination
    const moveToExecute = validMoves.find(m => m.to === pointIndex);
    if (moveToExecute) {
      executeMove(moveToExecute);
      return;
    }

    // Clear selection if clicking elsewhere
    setSelectedPoint(null);
    setValidMoves([]);
  };

  // Handle checker click (for selection)
  const handleCheckerClick = (pointIndex) => {
    if (state.currentPlayer !== 'white' || state.phase !== 'moving') return;

    const allMoves = getAllLegalMoves(state);
    const canMoveFrom = allMoves.some(m => m.from === pointIndex);

    if (canMoveFrom) {
      setSelectedPoint(pointIndex);
    }
  };

  // Handle bar click
  const handleBarClick = (player) => {
    if (player !== 'white' || state.currentPlayer !== 'white') return;
    if (state.phase !== 'moving') return;

    const allMoves = getAllLegalMoves(state);
    const canMoveFromBar = allMoves.some(m => m.from === 'bar');

    if (canMoveFromBar) {
      setSelectedPoint('bar');
    }
  };

  // Execute a move
  const executeMove = (move) => {
    dispatch(actions.moveChecker(move.from, move.to));
    setSelectedPoint(null);
    setValidMoves([]);

    // Check if turn is complete
    const newState = applyMove(state, move);
    if (isTurnComplete(newState)) {
      setTimeout(() => {
        dispatch(actions.completeTurn());
      }, 300);
    }
  };

  // Handle doubling
  const handleOfferDouble = () => {
    if (state.currentPlayer === 'white' && state.phase === 'rolling') {
      dispatch(actions.offerDouble());
    }
  };

  const handleAcceptDouble = () => {
    dispatch(actions.acceptDouble());
  };

  const handleDeclineDouble = () => {
    dispatch(actions.declineDouble());
  };

  // End turn manually
  const handleEndTurn = () => {
    if (state.phase === 'moving' && state.currentPlayer === 'white') {
      const legalMoves = getAllLegalMoves(state);
      if (legalMoves.length === 0) {
        dispatch(actions.completeTurn());
      }
    }
  };

  // New game
  const handleNewGame = () => {
    setShowGameOver(false);
    setGameStarted(false);
    setSelectedPoint(null);
    setValidMoves([]);
    setAiThinking(false);
    dispatch(actions.newGame());
  };

  // View verification
  const handleViewVerification = () => {
    navigate(`/verify/backgammon/${state.gameId}`, {
      state: {
        gameState: state,
        rollHistory: state.rollHistory
      }
    });
  };

  // Styles
  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: '#1a1a2e',
    color: '#fff',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '20px'
  };

  const titleStyle = {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#ffd700',
    marginBottom: '10px',
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
  };

  const startScreenStyle = {
    maxWidth: '400px',
    margin: '100px auto',
    padding: '40px',
    backgroundColor: '#2a2a4a',
    borderRadius: '16px',
    textAlign: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
  };

  const difficultyButtonStyle = (selected) => ({
    padding: '12px 24px',
    margin: '5px',
    fontSize: '16px',
    fontWeight: selected ? 'bold' : 'normal',
    backgroundColor: selected ? '#4CAF50' : '#444',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  });

  const startButtonStyle = {
    padding: '16px 48px',
    marginTop: '30px',
    fontSize: '20px',
    fontWeight: 'bold',
    backgroundColor: '#1976D2',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: isProcessing ? 'not-allowed' : 'pointer',
    opacity: isProcessing ? 0.7 : 1
  };

  const gameAreaStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: '30px',
    flexWrap: 'wrap'
  };

  const sidebarStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    padding: '20px',
    backgroundColor: '#2a2a4a',
    borderRadius: '12px',
    minWidth: '200px'
  };

  const statusStyle = {
    padding: '15px',
    backgroundColor: '#333',
    borderRadius: '8px',
    textAlign: 'center'
  };

  const turnIndicatorStyle = {
    fontSize: '18px',
    fontWeight: 'bold',
    color: state.currentPlayer === 'white' ? '#f0f0f0' : '#666',
    marginBottom: '10px'
  };

  const errorStyle = {
    padding: '10px',
    backgroundColor: '#f44336',
    color: '#fff',
    borderRadius: '8px',
    marginTop: '10px'
  };

  // Start screen
  if (!gameStarted) {
    return (
      <div style={containerStyle}>
        <div style={startScreenStyle}>
          <h1 style={titleStyle}>🎲 Backgammon</h1>
          <p style={{ color: '#aaa', marginBottom: '30px' }}>
            Provably Fair • Blockchain Verified
          </p>

          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '15px' }}>Select Difficulty</h3>
            {['easy', 'normal', 'hard'].map(d => (
              <div key={d} style={{ marginBottom: '5px' }}>
                <button
                  style={difficultyButtonStyle(difficulty === d)}
                  onClick={() => setDifficulty(d)}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              </div>
            ))}
          </div>

          <div style={{ fontSize: '14px', color: '#888', marginBottom: '20px' }}>
            <p>Score multiplier: {{ easy: '1x', normal: '2x', hard: '3x' }[difficulty]}</p>
          </div>

          <button
            style={startButtonStyle}
            onClick={handleStartGame}
            disabled={isProcessing}
          >
            {isProcessing ? 'Connecting to Blockchain...' : 'Start Game'}
          </button>

          {errorMessage && (
            <div style={errorStyle}>{errorMessage}</div>
          )}
        </div>
      </div>
    );
  }

  // Check if player can roll
  const canRoll = state.currentPlayer === 'white' && 
                  state.phase === 'rolling' && 
                  !isRolling;

  // Check if player can double
  const canDouble = state.currentPlayer === 'white' &&
                    state.phase === 'rolling' &&
                    (state.doublingCube.owner === null || state.doublingCube.owner === 'white') &&
                    state.doublingCube.value < 64;

  // Check if double is offered to player
  const isDoubleOffered = state.phase === 'doubleOffered' && state.currentPlayer === 'white';

  return (
    <div style={containerStyle}>
      <RotatePrompt gameName="Backgammon" />
      
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>🎲 Backgammon</h1>
        <p style={{ color: '#888', fontSize: '14px' }}>
          Game: {state.gameId} | Difficulty: {state.aiDifficulty}
        </p>
      </div>

      {/* Game area */}
      <div style={gameAreaStyle}>
        {/* Left sidebar - Dice & Controls */}
        <div style={sidebarStyle}>
          <div style={statusStyle}>
            <div style={turnIndicatorStyle}>
              {state.currentPlayer === 'white' ? "Your Turn" : "AI's Turn"}
            </div>
            <div style={{ color: '#888', fontSize: '14px' }}>
              Phase: {state.phase}
            </div>
            {aiThinking && (
              <div style={{ color: '#ffd700', marginTop: '10px' }}>
                🤔 AI is thinking...
              </div>
            )}
          </div>

          <Dice
            dice={state.dice}
            diceUsed={state.diceUsed}
            isDoubles={state.dice && isDoubles([state.dice[0], state.dice[1]])}
            isRolling={isRolling}
            canRoll={canRoll}
            onRoll={handleRollDice}
          />

          {/* End turn button when no moves available */}
          {state.phase === 'moving' && 
           state.currentPlayer === 'white' && 
           getAllLegalMoves(state).length === 0 && (
            <button
              style={{
                padding: '10px 20px',
                backgroundColor: '#ff9800',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
              onClick={handleEndTurn}
            >
              No Moves - End Turn
            </button>
          )}

          {errorMessage && (
            <div style={errorStyle}>{errorMessage}</div>
          )}
        </div>

        {/* Board */}
        <BackgammonBoard
          gameState={state}
          onPointClick={handlePointClick}
          onCheckerClick={handleCheckerClick}
          onBarClick={handleBarClick}
          selectedPoint={selectedPoint}
          validMoves={validMoves}
        />

        {/* Right sidebar - Doubling Cube & Info */}
        <div style={sidebarStyle}>
          <DoublingCube
            value={state.doublingCube.value}
            owner={state.doublingCube.owner}
            canDouble={canDouble}
            isOffered={isDoubleOffered}
            currentPlayer={state.currentPlayer}
            onOfferDouble={handleOfferDouble}
            onAcceptDouble={handleAcceptDouble}
            onDeclineDouble={handleDeclineDouble}
          />

          {/* Score info */}
          <div style={statusStyle}>
            <h4 style={{ marginBottom: '10px', color: '#ffd700' }}>Stakes</h4>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {state.doublingCube.value}x
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
              Base points
            </div>
          </div>

          {/* Pip count */}
          <div style={statusStyle}>
            <h4 style={{ marginBottom: '10px' }}>Pip Count</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>You: {selectors.getCheckersOnBoard(state, 'white') > 0 ? 
                '...' : state.bearOff.white}</span>
              <span>AI: {selectors.getCheckersOnBoard(state, 'black') > 0 ? 
                '...' : state.bearOff.black}</span>
            </div>
          </div>

          {/* Timer */}
          <div style={statusStyle}>
            <h4 style={{ marginBottom: '10px' }}>Time</h4>
            <div style={{ fontSize: '20px', fontFamily: 'monospace' }}>
              {selectors.getFormattedDuration(state)}
            </div>
          </div>

          {/* Verify link */}
          <button
            style={{
              padding: '10px',
              backgroundColor: 'transparent',
              color: '#4CAF50',
              border: '1px solid #4CAF50',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            onClick={handleViewVerification}
          >
            🔗 View Blockchain Proof
          </button>
        </div>
      </div>

      {/* Game Over Modal */}
      {showGameOver && (
        <GameOverModal
          winner={state.winner}
          winType={state.winType}
          finalScore={state.finalScore}
          cubeValue={state.doublingCube.value}
          difficulty={state.aiDifficulty}
          duration={selectors.getGameDuration(state)}
          gameId={state.gameId}
          onNewGame={handleNewGame}
          onViewVerification={handleViewVerification}
        />
      )}

    </div>
  );
};

export default BackgammonGame;
