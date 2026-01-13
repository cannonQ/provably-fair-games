/**
 * GarbageGame.jsx - Main Garbage Card Game Component
 * 
 * Complete game with blockchain-verified shuffling.
 * Player vs AI with provably fair deck ordering.
 * 
 * Enhanced anti-spoofing: Uses block hash + TX hash + timestamp
 */

import React, { useState, useCallback } from 'react';
import { getLatestBlock } from '../../blockchain/ergo-api';
import { generateSeed, shuffleDeck } from '../../blockchain/shuffle';
import { 
  dealInitialCards, 
  getValidPositions, 
  isGarbage, 
  isWild,
  checkWin 
} from './game-logic';
import { makeMove } from './ai';
import Card from '../../components/Card';
import Verification from '../../components/Verification';

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

  /**
   * Start a new game - fetch block, shuffle, deal
   */
  const startNewGame = useCallback(async () => {
    setGameState('shuffling');
    setError(null);
    setMessage('Fetching blockchain data...');
    
    try {
      // 1. Get latest Ergo block (now includes TX data)
      const block = await getLatestBlock();
      setBlockData(block);
      setMessage(`Block #${block.blockHeight} + TX loaded. Shuffling...`);
      
      // 2. Generate game ID
      const newGameId = generateGameId();
      setGameId(newGameId);
      
      // 3. Generate seed using FULL block data (enhanced anti-spoofing)
      // Combines: blockHash + txHash + timestamp + gameId + txIndex
      const seed = generateSeed(block, newGameId);
      
      // 4. Shuffle deck
      const shuffledDeck = shuffleDeck(seed);
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
    
    // Can't take garbage from discard
    if (isGarbage(card)) {
      setMessage("Can't take garbage cards from discard.");
      return;
    }
    
    // Check if we can use it
    const positions = getValidPositions(card, playerCards);
    if (positions.length === 0) {
      setMessage(`Can't use ${card} - no valid position.`);
      return;
    }
    
    setDiscardPile(prev => prev.slice(0, -1));
    setHeldCard(card);
    setMessage(`Took ${card} - Click position ${positions.join(' or ')} to place it.`);
  }, [currentTurn, heldCard, discardPile, playerCards]);

  /**
   * Player clicks a position to place held card
   */
  const handlePositionClick = useCallback((position) => {
    if (currentTurn !== 'player' || !heldCard) return;
    
    // Check if placement is valid
    const positions = getValidPositions(heldCard, playerCards);
    
    // For wild cards, let player choose any empty position
    if (isWild(heldCard) && !playerCards[position - 1]) {
      // Valid wild placement
    } else if (!positions.includes(position)) {
      setMessage(`Can't place ${heldCard} in position ${position}.`);
      return;
    }
    
    // Place the card
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
    
    // Check for win
    const newPlayerCards = [...playerCards];
    newPlayerCards[index] = heldCard;
    
    if (checkWin(newPlayerCards)) {
      setWinner('player');
      setGameState('finished');
      setMessage('🎉 You win! All positions filled!');
      setHeldCard(null);
      return;
    }
    
    // Continue chain with flipped card
    if (hiddenCard) {
      setHeldCard(hiddenCard);
      if (isGarbage(hiddenCard)) {
        setMessage(`Flipped ${hiddenCard} - Garbage! Turn ends.`);
      } else {
        const nextPositions = getValidPositions(hiddenCard, newPlayerCards);
        if (nextPositions.length > 0) {
          setMessage(`Flipped ${hiddenCard} - Place in position ${nextPositions.join(' or ')}!`);
          return; // Continue player's turn
        } else {
          setMessage(`Flipped ${hiddenCard} - No valid position.`);
        }
      }
    }
    
    // End turn - discard held card
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
    
    // AI takes turn after short delay
    setTimeout(executeAITurn, 1000);
  }, [heldCard]);

  /**
   * Discard held card (if can't place)
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
    
    // Update state from AI result
    setAiCards(result.newAiCards);
    setAiHidden(result.newAiHidden);
    setDrawPile(result.newDrawPile);
    setDiscardPile(result.newDiscardPile);
    
    // Build message about AI's turn
    let aiMessage = '';
    if (result.action === 'take_discard') {
      aiMessage = 'AI took from discard. ';
    } else {
      aiMessage = 'AI drew a card. ';
    }
    
    if (result.placements.length > 0) {
      const placementStr = result.placements.map(p => `${p.card} → ${p.position}`).join(', ');
      aiMessage += `Placed: ${placementStr}. `;
    }
    
    if (result.discarded) {
      aiMessage += `Discarded ${result.discarded}.`;
    }
    
    // Check for AI win
    if (result.endedWith === 'complete') {
      setWinner('ai');
      setGameState('finished');
      setMessage('AI wins! Better luck next time.');
      return;
    }
    
    setMessage(aiMessage + " Your turn!");
    setCurrentTurn('player');
  }, [aiCards, aiHidden, drawPile, discardPile, difficulty]);

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
        <h1 style={styles.title}>🔗 Shuffling...</h1>
        <p style={styles.message}>{message}</p>
        <div style={styles.spinner}>⏳</div>
      </div>
    );
  }

  // Playing or Finished state
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>
        {gameState === 'finished' ? (winner === 'player' ? '🎉 You Win!' : '😔 AI Wins') : '🃏 Garbage'}
      </h2>
      
      {/* Block info - now shows TX info too */}
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
  title: { fontSize: '2rem', marginBottom: '0.5rem' },
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
  spinner: { fontSize: '3rem', animation: 'spin 1s linear infinite' },
  rules: { marginTop: '2rem', padding: '1rem', backgroundColor: '#222', borderRadius: '8px', textAlign: 'left', maxWidth: '400px', margin: '2rem auto 0' }
};

export default GarbageGame;
