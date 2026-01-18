/**
 * GarbageGame.jsx - Main Garbage Card Game Component
 *
 * Complete game with blockchain-verified shuffling and leaderboard.
 * Player vs AI with provably fair deck ordering.
 */

import React, { useState, useCallback } from 'react';
import { getLatestBlock } from '../../blockchain/ergo-api';
import { generateSeed, shuffleDeckStrings } from '../../blockchain/shuffle';
import {
  dealInitialCards,
  getValidPositions,
  isGarbage,
  isWild,
  checkWin,
  countFilledPositions
} from './game-logic';
import { makeMove } from './ai';
import Card from '../../components/Card';
import Verification from '../../components/Verification';
import Leaderboard from '../../components/Leaderboard';
import { submitScore } from '../../services/leaderboard';

// Generate unique game ID
const generateGameId = () => `GRB-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

function GarbageGame() {
  // Game state
  const [gameState, setGameState] = useState('menu'); // menu | shuffling | playing | finished
  const [blockData, setBlockData] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [deck, setDeck] = useState([]);

  // Player state
  const [playerCards, setPlayerCards] = useState(Array(10).fill(null));
  const [playerHidden, setPlayerHidden] = useState([]);

  // AI state
  const [aiCards, setAiCards] = useState(Array(10).fill(null));
  const [aiHidden, setAiHidden] = useState([]);

  // Shared state
  const [drawPile, setDrawPile] = useState([]);
  const [discardPile, setDiscardPile] = useState([]);
  const [currentTurn, setCurrentTurn] = useState('player');
  const [heldCard, setHeldCard] = useState(null);
  const [winner, setWinner] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [showVerification, setShowVerification] = useState(false);
  const [difficulty, setDifficulty] = useState('normal');
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Game stats
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);

  // Submission state
  const [playerName, setPlayerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitRank, setSubmitRank] = useState(null);

  // Calculate score based on positions filled, moves, and time
  const calculateScore = useCallback(() => {
    if (!startTime || !endTime) return 0;
    const timeSeconds = Math.floor((endTime - startTime) / 1000);
    const filledPositions = countFilledPositions(playerCards);
    
    // Base score: 100 points per position filled
    let score = filledPositions * 100;
    
    // Time bonus: faster = more points (max 500 bonus)
    if (timeSeconds < 60) score += 500;
    else if (timeSeconds < 120) score += 300;
    else if (timeSeconds < 180) score += 100;
    
    // Move efficiency bonus
    if (moves < 20) score += 200;
    else if (moves < 30) score += 100;
    
    // Win bonus
    if (winner === 'player') score += 500;
    
    return score;
  }, [startTime, endTime, playerCards, moves, winner]);

  const getElapsedSeconds = useCallback(() => {
    if (!startTime) return 0;
    const end = endTime || Date.now();
    return Math.floor((end - startTime) / 1000);
  }, [startTime, endTime]);

  /**
   * Start a new game - fetch block, shuffle, deal
   */
  const startNewGame = useCallback(async () => {
    setGameState('shuffling');
    setError(null);
    setMessage('Fetching blockchain data...');
    setSubmitted(false);
    setSubmitError(null);
    setSubmitRank(null);
    setMoves(0);
    setEndTime(null);

    try {
      // 1. Get latest Ergo block (includes TX data)
      const block = await getLatestBlock();
      setBlockData(block);
      setMessage(`Block #${block.blockHeight} + TX loaded. Shuffling...`);

      // 2. Generate game ID
      const newGameId = generateGameId();
      setGameId(newGameId);

      // 3. Generate seed using FULL block data (enhanced anti-spoofing)
      const seed = generateSeed(block, newGameId);

      // 4. Shuffle deck (string format for Garbage)
      const shuffledDeck = shuffleDeckStrings(seed);
      setDeck(shuffledDeck);

      // 5. Deal cards
      const dealt = dealInitialCards(shuffledDeck);
      setPlayerCards(dealt.playerCards);
      setPlayerHidden(dealt.playerHidden);
      setAiCards(dealt.aiCards);
      setAiHidden(dealt.aiHidden);
      setDrawPile(dealt.drawPile);
      setDiscardPile([]);

      // 6. Reset game state
      setCurrentTurn('player');
      setHeldCard(null);
      setWinner(null);
      setShowVerification(false);
      setMessage('Your turn! Draw a card.');
      setGameState('playing');
      setStartTime(Date.now());

    } catch (err) {
      setError(err.message || 'Failed to start game');
      setGameState('menu');
    }
  }, []);

  /**
   * Player draws from draw pile
   */
  const drawFromPile = useCallback(() => {
    if (currentTurn !== 'player' || heldCard || drawPile.length === 0) return;

    const card = drawPile[0];
    setDrawPile(prev => prev.slice(1));
    setHeldCard(card);
    setMoves(m => m + 1);

    if (isGarbage(card)) {
      setMessage(`Drew ${card} - Garbage! Turn ends.`);
    } else {
      const positions = getValidPositions(card, playerCards);
      if (positions.length > 0) {
        setMessage(`Drew ${card} - Click position ${positions.join(' or ')} to place it.`);
      } else {
        setMessage(`Drew ${card} - No valid position. Discarding.`);
      }
    }
  }, [currentTurn, heldCard, drawPile, playerCards]);

  /**
   * Player takes from discard pile
   */
  const takeFromDiscard = useCallback(() => {
    if (currentTurn !== 'player' || heldCard || discardPile.length === 0) return;

    const card = discardPile[discardPile.length - 1];

    if (isGarbage(card)) {
      setMessage("Can't take garbage cards from discard.");
      return;
    }

    const positions = getValidPositions(card, playerCards);
    if (positions.length === 0) {
      setMessage(`Can't use ${card} - no valid position.`);
      return;
    }

    setDiscardPile(prev => prev.slice(0, -1));
    setHeldCard(card);
    setMoves(m => m + 1);
    setMessage(`Took ${card} - Click position ${positions.join(' or ')} to place it.`);
  }, [currentTurn, heldCard, discardPile, playerCards]);

  /**
   * Player clicks a position to place held card
   */
  const handlePositionClick = useCallback((position) => {
    if (currentTurn !== 'player' || !heldCard) return;

    const positions = getValidPositions(heldCard, playerCards);

    if (isWild(heldCard) && !playerCards[position - 1]) {
      // Valid wild placement
    } else if (!positions.includes(position)) {
      setMessage(`Can't place ${heldCard} in position ${position}.`);
      return;
    }

    const index = position - 1;
    const hiddenCard = playerHidden[index];

    setPlayerCards(prev => {
      const updated = [...prev];
      updated[index] = heldCard;
      return updated;
    });

    setPlayerHidden(prev => {
      const updated = [...prev];
      updated[index] = null;
      return updated;
    });

    const newPlayerCards = [...playerCards];
    newPlayerCards[index] = heldCard;

    if (checkWin(newPlayerCards)) {
      setWinner('player');
      setGameState('finished');
      setEndTime(Date.now());
      setMessage('🎉 You win! All positions filled!');
      setHeldCard(null);
      return;
    }

    if (hiddenCard) {
      setHeldCard(hiddenCard);
      if (isGarbage(hiddenCard)) {
        setMessage(`Flipped ${hiddenCard} - Garbage! Turn ends.`);
      } else {
        const nextPositions = getValidPositions(hiddenCard, newPlayerCards);
        if (nextPositions.length > 0) {
          setMessage(`Flipped ${hiddenCard} - Place in position ${nextPositions.join(' or ')}!`);
          return;
        } else {
          setMessage(`Flipped ${hiddenCard} - No valid position.`);
        }
      }
    }

    endPlayerTurn();
  }, [currentTurn, heldCard, playerCards, playerHidden]);

  /**
   * End player turn and discard held card
   */
  const endPlayerTurn = useCallback(() => {
    if (heldCard) {
      setDiscardPile(prev => [...prev, heldCard]);
    }
    setHeldCard(null);
    setCurrentTurn('ai');
    setMessage("AI is thinking...");

    setTimeout(executeAITurn, 1000);
  }, [heldCard]);

  /**
   * Discard held card
   */
  const discardHeldCard = useCallback(() => {
    if (!heldCard) return;
    endPlayerTurn();
  }, [heldCard, endPlayerTurn]);

  /**
   * Execute AI turn
   */
  const executeAITurn = useCallback(() => {
    const result = makeMove(aiCards, aiHidden, drawPile, discardPile, difficulty);

    setAiCards(result.newAiCards);
    setAiHidden(result.newAiHidden);
    setDrawPile(result.newDrawPile);
    setDiscardPile(result.newDiscardPile);

    let aiMessage = result.action === 'take_discard' ? 'AI took from discard. ' : 'AI drew a card. ';

    if (result.placements.length > 0) {
      const placementStr = result.placements.map(p => `${p.card} → ${p.position}`).join(', ');
      aiMessage += `Placed: ${placementStr}. `;
    }

    if (result.discarded) {
      aiMessage += `Discarded ${result.discarded}.`;
    }

    if (result.endedWith === 'complete') {
      setWinner('ai');
      setGameState('finished');
      setEndTime(Date.now());
      setMessage('AI wins! Better luck next time.');
      return;
    }

    setMessage(aiMessage + " Your turn!");
    setCurrentTurn('player');
  }, [aiCards, aiHidden, drawPile, discardPile, difficulty]);

  /**
   * Submit score to leaderboard
   */
  const handleSubmitScore = async () => {
    if (!blockData || winner !== 'player') return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const score = calculateScore();
      const timeSeconds = getElapsedSeconds();

      const result = await submitScore({
        game: 'garbage',
        gameId: gameId,
        playerName: playerName.trim() || 'Anonymous',
        score: score,
        timeSeconds: timeSeconds,
        moves: moves,
        blockHeight: blockData.blockHeight,
        blockHash: blockData.blockHash,
        txHash: blockData.txHash,
        blockTimestamp: blockData.timestamp,
        difficulty: difficulty
      });

      setSubmitted(true);
      setSubmitRank(result.rank);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Render card slot for player area
   */
  const renderPlayerSlot = (index) => {
    const position = index + 1;
    const card = playerCards[index];
    const isClickable = currentTurn === 'player' && heldCard && !card;

    return (
      <div
        key={index}
        onClick={() => isClickable && handlePositionClick(position)}
        style={{
          ...styles.slot,
          cursor: isClickable ? 'pointer' : 'default',
          border: isClickable ? '2px dashed #4ade80' : '2px solid #333'
        }}
      >
        <span style={styles.slotNumber}>{position}</span>
        {card ? (
          <Card card={card} faceUp={true} />
        ) : (
          <Card card={playerHidden[index]} faceUp={false} />
        )}
      </div>
    );
  };

  /**
   * Render card slot for AI area
   */
  const renderAISlot = (index) => {
    const position = index + 1;
    const card = aiCards[index];

    return (
      <div key={index} style={styles.slot}>
        <span style={styles.slotNumber}>{position}</span>
        {card ? (
          <Card card={card} faceUp={true} />
        ) : (
          <Card card={aiHidden[index]} faceUp={false} />
        )}
      </div>
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ===== RENDER =====

  // Menu state
  if (gameState === 'menu') {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>🃏 Garbage</h1>
        <p style={styles.subtitle}>Blockchain-Verified Card Game</p>

        <div style={styles.difficultySelect}>
          <label>Difficulty: </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            style={styles.select}
          >
            <option value="easy">Easy</option>
            <option value="normal">Normal</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <button onClick={startNewGame} style={styles.button}>
          New Game
        </button>

        <button 
          onClick={() => setShowLeaderboard(!showLeaderboard)} 
          style={{ ...styles.buttonSecondary, marginLeft: '10px' }}
        >
          🏆 {showLeaderboard ? 'Hide' : 'Leaderboard'}
        </button>

        {showLeaderboard && <Leaderboard game="garbage" />}

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.rules}>
          <h3>How to Play</h3>
          <p>Fill positions 1-10 with matching cards (A=1, 2=2, etc.)</p>
          <p>Jacks are wild. Queens & Kings are garbage.</p>
          <p>First to fill all 10 wins!</p>
        </div>
      </div>
    );
  }

  // Shuffling state
  if (gameState === 'shuffling') {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>🔀 Shuffling...</h1>
        <p style={styles.message}>{message}</p>
        <div style={styles.spinner}>⏳</div>
      </div>
    );
  }

  // Playing or Finished state
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>
          {gameState === 'finished' ? (winner === 'player' ? '🎉 You Win!' : '😔 AI Wins') : '🃏 Garbage'}
        </h2>
        <div style={styles.stats}>
          <span>⏱ {formatTime(getElapsedSeconds())}</span>
          <span>Moves: {moves}</span>
          {gameState === 'finished' && winner === 'player' && (
            <span style={{ color: '#4ade80', fontWeight: 'bold' }}>🏆 {calculateScore()}</span>
          )}
        </div>
        <button 
          onClick={() => setShowLeaderboard(!showLeaderboard)} 
          style={{ ...styles.smallButton, backgroundColor: showLeaderboard ? '#ff9800' : '#9c27b0' }}
        >
          🏆 {showLeaderboard ? 'Hide' : 'Ranks'}
        </button>
      </div>

      {/* Leaderboard Panel */}
      {showLeaderboard && <Leaderboard game="garbage" currentGameId={gameId} />}

      {/* Block info */}
      {blockData && (
        <p style={styles.blockInfo}>
          Block #{blockData.blockHeight} | TX #{blockData.txIndex + 1} of {blockData.txCount} | Game: {gameId}
        </p>
      )}

      {/* AI Area */}
      <div style={styles.playerArea}>
        <h3 style={styles.areaLabel}>AI {currentTurn === 'ai' && '(thinking...)'}</h3>
        <div style={styles.cardGrid}>
          {[0,1,2,3,4,5,6,7,8,9].map(renderAISlot)}
        </div>
      </div>

      {/* Center - Draw & Discard */}
      <div style={styles.centerArea}>
        <div style={styles.pileContainer}>
          <div
            onClick={drawFromPile}
            style={{
              ...styles.pile,
              cursor: currentTurn === 'player' && !heldCard ? 'pointer' : 'default'
            }}
          >
            <Card card="DECK" faceUp={false} />
            <span style={styles.pileLabel}>Draw ({drawPile.length})</span>
          </div>

          <div
            onClick={takeFromDiscard}
            style={{
              ...styles.pile,
              cursor: currentTurn === 'player' && !heldCard && discardPile.length > 0 ? 'pointer' : 'default'
            }}
          >
            {discardPile.length > 0 ? (
              <Card card={discardPile[discardPile.length - 1]} faceUp={true} />
            ) : (
              <div style={styles.emptyPile}>Empty</div>
            )}
            <span style={styles.pileLabel}>Discard ({discardPile.length})</span>
          </div>
        </div>

        {/* Held card display */}
        {heldCard && (
          <div style={styles.heldCard}>
            <span>Holding: </span>
            <Card card={heldCard} faceUp={true} small />
            <button onClick={discardHeldCard} style={styles.smallButton}>
              Discard
            </button>
          </div>
        )}
      </div>

      {/* Player Area */}
      <div style={styles.playerArea}>
        <h3 style={styles.areaLabel}>You {currentTurn === 'player' && '(your turn)'}</h3>
        <div style={styles.cardGrid}>
          {[0,1,2,3,4,5,6,7,8,9].map(renderPlayerSlot)}
        </div>
      </div>

      {/* Message */}
      <p style={styles.message}>{message}</p>

      {/* Controls */}
      <div style={styles.controls}>
        {gameState === 'finished' && (
          <>
            <button onClick={startNewGame} style={styles.button}>
              Play Again
            </button>
            <button
              onClick={() => setShowVerification(!showVerification)}
              style={styles.buttonSecondary}
            >
              {showVerification ? 'Hide' : 'Verify'} Shuffle
            </button>
          </>
        )}
      </div>

      {/* Win Modal with Score Submission */}
      {gameState === 'finished' && winner === 'player' && !showVerification && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2 style={{ fontSize: '28px', marginBottom: '15px' }}>🎉 You Won!</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '16px', margin: '8px 0' }}>Time: {formatTime(getElapsedSeconds())}</p>
              <p style={{ fontSize: '16px', margin: '8px 0' }}>Moves: {moves}</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#4ade80', margin: '12px 0' }}>
                🏆 {calculateScore()} points
              </p>
            </div>

            {/* Submission Form */}
            {!submitted ? (
              <div style={styles.submitBox}>
                <p style={{ fontSize: '14px', marginBottom: '10px', color: '#aaa' }}>
                  Submit to Leaderboard:
                </p>
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={20}
                  style={styles.input}
                />
                <button
                  onClick={handleSubmitScore}
                  disabled={submitting}
                  style={{
                    ...styles.button,
                    width: '100%',
                    backgroundColor: submitting ? '#555' : '#4ade80'
                  }}
                >
                  {submitting ? 'Submitting...' : '📤 Submit Score'}
                </button>
                {submitError && (
                  <p style={{ color: '#f87171', fontSize: '13px', marginTop: '8px' }}>{submitError}</p>
                )}
              </div>
            ) : (
              <div style={styles.submittedBox}>
                <p style={{ fontSize: '16px', color: '#4ade80', fontWeight: 'bold' }}>
                  ✓ Submitted! You're ranked #{submitRank}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '15px' }}>
              <button onClick={startNewGame} style={styles.button}>Play Again</button>
              <button onClick={() => setShowLeaderboard(true)} style={{ ...styles.button, backgroundColor: '#9c27b0' }}>
                Leaderboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification panel */}
      {showVerification && blockData && (
        <Verification
          blockData={blockData}
          gameId={gameId}
          deck={deck}
          winner={winner}
        />
      )}
    </div>
  );
}

// Styles
const styles = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '1rem', textAlign: 'center' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' },
  stats: { display: 'flex', gap: '15px', fontSize: '14px', color: '#aaa' },
  title: { fontSize: '1.5rem', margin: 0 },
  subtitle: { color: '#888', marginBottom: '2rem' },
  blockInfo: { fontSize: '0.75rem', color: '#666', marginBottom: '1rem' },
  playerArea: { marginBottom: '1.5rem' },
  areaLabel: { marginBottom: '0.5rem', color: '#aaa' },
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', maxWidth: '500px', margin: '0 auto' },
  slot: { position: 'relative', aspectRatio: '2.5/3.5', backgroundColor: '#222', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  slotNumber: { position: 'absolute', top: '2px', left: '6px', fontSize: '0.7rem', color: '#555' },
  centerArea: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#1a2a1a', borderRadius: '12px' },
  pileContainer: { display: 'flex', gap: '2rem', marginBottom: '1rem' },
  pile: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  pileLabel: { fontSize: '0.75rem', color: '#888', marginTop: '0.25rem' },
  emptyPile: { width: '60px', height: '84px', border: '2px dashed #444', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: '0.75rem' },
  heldCard: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: '#2a3a2a', borderRadius: '8px' },
  message: { minHeight: '1.5rem', color: '#4ade80', marginBottom: '1rem' },
  controls: { display: 'flex', gap: '1rem', justifyContent: 'center' },
  button: { padding: '0.75rem 2rem', fontSize: '1rem', backgroundColor: '#4ade80', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  buttonSecondary: { padding: '0.75rem 2rem', fontSize: '1rem', backgroundColor: 'transparent', color: '#4ade80', border: '2px solid #4ade80', borderRadius: '8px', cursor: 'pointer' },
  smallButton: { padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: '#666', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  difficultySelect: { marginBottom: '1rem' },
  select: { padding: '0.5rem', fontSize: '1rem', backgroundColor: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px' },
  error: { color: '#f87171', marginTop: '1rem' },
  spinner: { fontSize: '3rem' },
  rules: { marginTop: '2rem', padding: '1rem', backgroundColor: '#222', borderRadius: '8px', textAlign: 'left', maxWidth: '400px', margin: '2rem auto 0' },
  modal: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#1a1a2e', color: '#fff', padding: '30px', borderRadius: '12px', textAlign: 'center', maxWidth: '400px', width: '90%' },
  submitBox: { padding: '15px', backgroundColor: '#16213e', borderRadius: '8px', marginBottom: '15px' },
  submittedBox: { padding: '15px', backgroundColor: '#1a3a1a', borderRadius: '8px', marginBottom: '15px' },
  input: { width: '100%', padding: '10px', fontSize: '14px', borderRadius: '4px', border: '1px solid #333', backgroundColor: '#0d1117', color: '#fff', marginBottom: '10px', boxSizing: 'border-box' }
};

export default GarbageGame;
