/**
 * YahtzeeGame - Main Game Component
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
      // Reset trace state for new turn (will use new anchor tx)
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
   * Open verification page in new tab (preserves current game)
   */
  const handleViewVerification = () => {
    // Store game data for verification page
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
    
    // Open in new tab so game isn't lost
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
  };

  // Calculate elapsed time
  const getElapsedSeconds = () => {
    if (!startTime) return 0;
    return Math.floor((Date.now() - startTime) / 1000);
  };

  // Styles
  const containerStyle = {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '10px'
  };

  const titleStyle = {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0
  };

  const infoStyle = {
    display: 'flex',
    gap: '20px',
    fontSize: '16px',
    color: '#666'
  };

  const navStyle = {
    display: 'flex',
    gap: '15px',
    marginBottom: '20px'
  };

  const linkStyle = {
    color: '#1976d2',
    textDecoration: 'none',
    fontSize: '14px'
  };

  const startScreenStyle = {
    textAlign: 'center',
    padding: '40px 20px',
    backgroundColor: '#f5f5f5',
    borderRadius: '12px',
    maxWidth: '400px',
    margin: '40px auto'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 15px',
    fontSize: '16px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    marginBottom: '15px',
    boxSizing: 'border-box'
  };

  const startButtonStyle = {
    backgroundColor: '#4caf50',
    color: '#fff',
    border: 'none',
    padding: '14px 32px',
    fontSize: '18px',
    fontWeight: 'bold',
    borderRadius: '8px',
    cursor: isLoading ? 'wait' : 'pointer',
    opacity: isLoading ? 0.7 : 1
  };

  const errorStyle = {
    color: '#d32f2f',
    backgroundColor: '#ffebee',
    padding: '10px 15px',
    borderRadius: '6px',
    marginBottom: '15px',
    fontSize: '14px'
  };

  const gameAreaStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '25px'
  };

  const blockInfoStyle = {
    fontSize: '12px',
    color: '#999',
    textAlign: 'center',
    marginTop: '10px'
  };

  // Render start screen
  if (phase === 'ready') {
    return (
      <div style={containerStyle}>
        <div style={navStyle}>
          <Link to="/" style={linkStyle}>← Back to Games</Link>
        </div>
        
        <div style={startScreenStyle}>
          <h1 style={{ ...titleStyle, marginBottom: '10px' }}>🎲 Yahtzee</h1>
          <p style={{ color: '#666', marginBottom: '25px' }}>
            Provably fair dice game powered by Ergo blockchain
          </p>

          {/* Quick Tips */}
          <div style={{
            backgroundColor: '#f5f5f5',
            padding: '15px',
            borderRadius: '8px',
            maxWidth: '350px',
            margin: '0 auto 25px',
            fontSize: '13px',
            textAlign: 'left',
            border: '1px solid #ddd'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>🎯 Quick Tips:</div>
            <div style={{ color: '#555' }}>• 13 rounds, 3 rolls per turn</div>
            <div style={{ color: '#555' }}>• Click dice to hold between rolls</div>
            <div style={{ color: '#555' }}>• Upper bonus: 63+ points = +35</div>
            <div style={{ color: '#555' }}>• Yahtzee (5 of a kind) = 50 pts</div>

            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #ddd' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#333' }}>🏆 Leaderboard:</div>
              <div style={{ color: '#666', fontSize: '12px' }}>
                Score → Time<br/>
                250+ excellent, 300+ amazing!
              </div>
            </div>
          </div>

          {error && <div style={errorStyle}>{error}</div>}

          <button
            onClick={startGame}
            style={startButtonStyle}
            disabled={isLoading}
          >
            {isLoading ? 'Connecting to Blockchain...' : 'Start Game'}
          </button>

          <p style={{ fontSize: '13px', color: '#999', marginTop: '20px' }}>
            Each dice roll is verified using blockchain data.<br />
            No manipulation possible!
          </p>
        </div>
      </div>
    );
  }

  // Render game screen
  return (
    <div style={containerStyle}>
      {/* Navigation */}
      <div style={navStyle}>
        <Link to="/" style={linkStyle}>← Home</Link>
        <a href="/yahtzee/rules" target="_blank" rel="noopener noreferrer" style={linkStyle}>Rules</a>
        {rollHistory.length > 0 && (
          <button
            onClick={handleViewVerification}
            style={{ ...linkStyle, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Verify Rolls
          </button>
        )}
      </div>

      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>🎲 Yahtzee</h1>
        <div style={infoStyle}>
          <span><strong>Turn:</strong> {currentTurn}/13</span>
          <span><strong>Player:</strong> {playerName}</span>
          {startTime && (
            <span><strong>Time:</strong> {Math.floor(getElapsedSeconds() / 60)}:{String(getElapsedSeconds() % 60).padStart(2, '0')}</span>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && <div style={errorStyle}>{error}</div>}

      {/* Game area */}
      <div style={gameAreaStyle}>
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

        {/* Block info */}
        {anchor && (
          <div style={blockInfoStyle}>
            Anchor Block: #{anchor.blockHeight} | 
            Game ID: {gameId}
          </div>
        )}
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
          onClose={handleGameOverClose}
          onNewGame={handleNewGame}
          onViewVerification={handleViewVerification}
        />
      )}
    </div>
  );
}

export default YahtzeeGame;
