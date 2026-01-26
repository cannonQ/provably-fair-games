/**
 * GarbageGame.jsx - Main Garbage Card Game Component (Mobile-optimized)
 *
 * Complete game with blockchain-verified shuffling and leaderboard.
 * Player vs AI with provably fair deck ordering.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { shuffleDeckStrings } from '../../blockchain/shuffle';
import { startSecureGame, getSecureRandom, endSecureSession } from '../../blockchain/secureRng';
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

  // Secure RNG session
  const [sessionId, setSessionId] = useState(null);
  const [secretHash, setSecretHash] = useState(null);

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
  const [showMenu, setShowMenu] = useState(false);

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

    let score = filledPositions * 100;

    if (timeSeconds < 60) score += 500;
    else if (timeSeconds < 120) score += 300;
    else if (timeSeconds < 180) score += 100;

    if (moves < 20) score += 200;
    else if (moves < 30) score += 100;

    if (winner === 'player') score += 500;

    return score;
  }, [startTime, endTime, playerCards, moves, winner]);

  const getElapsedSeconds = useCallback(() => {
    if (!startTime) return 0;
    const end = endTime || Date.now();
    return Math.floor((end - startTime) / 1000);
  }, [startTime, endTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // End secure session and reveal secret when game ends
  useEffect(() => {
    if (gameState === 'finished' && sessionId && blockData) {
      const timeSeconds = getElapsedSeconds();
      endSecureSession(sessionId, {
        gameId: gameId,
        winner: winner,
        moves: moves,
        timeSeconds: timeSeconds,
        playerFilledPositions: countFilledPositions(playerCards),
        score: winner === 'player' ? calculateScore() : 0
      }).then(revealData => {
        console.log('✅ Game session ended and verified:', revealData);
        if (revealData.verified) {
          console.log('🔐 Server secret revealed and verified!');
        }
      }).catch(error => {
        console.error('❌ Failed to end secure session:', error);
      });
    }
  }, [gameState, sessionId, blockData, gameId, winner, moves, getElapsedSeconds, playerCards, calculateScore]);

  /**
   * Start a new game
   */
  const startNewGame = useCallback(async () => {
    setGameState('shuffling');
    setError(null);
    setMessage('Initializing secure session...');
    setSubmitted(false);
    setSubmitError(null);
    setSubmitRank(null);
    setMoves(0);
    setEndTime(null);
    setShowMenu(false);

    try {
      // Initialize secure session (server commits secret, then get blockchain data)
      const { sessionId, secretHash, blockData: block } = await startSecureGame('garbage');
      setMessage(`Block #${block.blockHeight} loaded. Shuffling...`);

      const newGameId = generateGameId();
      setGameId(newGameId);

      // Get secure random value for deck shuffle
      const seed = await getSecureRandom(sessionId, 'deck-shuffle');
      const shuffledDeck = shuffleDeckStrings(seed);
      setDeck(shuffledDeck);

      const blockDataWithSession = {
        ...block,
        sessionId,      // Add session ID
        secretHash,     // Add commitment hash
        gameId: newGameId
      };
      setBlockData(blockDataWithSession);

      // Store session info
      setSessionId(sessionId);
      setSecretHash(secretHash);

      const dealt = dealInitialCards(shuffledDeck);
      setPlayerCards(dealt.playerCards);
      setPlayerHidden(dealt.playerHidden);
      setAiCards(dealt.aiCards);
      setAiHidden(dealt.aiHidden);
      setDrawPile(dealt.drawPile);
      setDiscardPile([]);

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
        setMessage(`Drew ${card} - Tap position ${positions.join(' or ')}.`);
      } else {
        setMessage(`Drew ${card} - No valid position.`);
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
      setMessage("Can't take garbage from discard.");
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
    setMessage(`Took ${card} - Tap position ${positions.join(' or ')}.`);
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
      setMessage('You win!');
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
          setMessage(`Flipped ${hiddenCard} - Place in ${nextPositions.join(' or ')}!`);
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

    let aiMessage = result.action === 'take_discard' ? 'AI took discard. ' : 'AI drew. ';

    if (result.placements.length > 0) {
      aiMessage += `Placed ${result.placements.length} cards. `;
    }

    if (result.endedWith === 'complete') {
      setWinner('ai');
      setGameState('finished');
      setEndTime(Date.now());
      setMessage('AI wins!');
      return;
    }

    setMessage(aiMessage + "Your turn!");
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
          border: isClickable ? '2px dashed #4ade80' : '2px solid #334155'
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

  // Menu state
  if (gameState === 'menu') {
    return (
      <div style={styles.container}>
        <div style={styles.gameWrapper}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.titleSection}>
              <button style={styles.menuBtn} onClick={() => setShowMenu(!showMenu)}>☰</button>
              <h1 style={styles.title}>Garbage</h1>
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
              <h2 style={styles.startTitle}>🃏 Garbage</h2>
              <p style={styles.startSubtitle}>Blockchain Card Game</p>

              <div style={styles.difficultyBox}>
                <label style={styles.diffLabel}>Difficulty:</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  style={styles.diffSelect}
                >
                  <option value="easy">Easy</option>
                  <option value="normal">Normal</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div style={styles.rulesBox}>
                <div style={styles.rulesTitle}>How to Play:</div>
                <div>• Fill positions 1-10 with matching cards</div>
                <div>• A=1, 2=2, ... J=Wild, Q/K=Garbage</div>
                <div>• First to fill all 10 wins!</div>
              </div>

              {error && <div style={styles.errorBox}>{error}</div>}

              <button onClick={startNewGame} style={styles.startBtn}>
                Start Game
              </button>

              <button
                onClick={() => setShowLeaderboard(!showLeaderboard)}
                style={styles.leaderboardBtn}
              >
                🏆 {showLeaderboard ? 'Hide' : 'Leaderboard'}
              </button>

              {showLeaderboard && <Leaderboard game="garbage" />}
            </div>
          </div>

          <div style={styles.footer}>
            <span>Ergo Blockchain Verified</span>
          </div>
        </div>
      </div>
    );
  }

  // Shuffling state
  if (gameState === 'shuffling') {
    return (
      <div style={styles.container}>
        <div style={styles.gameWrapper}>
          <div style={styles.header}>
            <div style={styles.titleSection}>
              <h1 style={styles.title}>Garbage</h1>
              <span style={styles.badge}>provably fair</span>
            </div>
          </div>
          <div style={styles.loadingScreen}>
            <div style={styles.spinner}>🔀</div>
            <p style={styles.loadingText}>{message}</p>
          </div>
        </div>
      </div>
    );
  }

  // Playing or Finished state
  return (
    <div style={styles.container}>
      <div style={styles.gameWrapper}>
        {/* Compact Header */}
        <div style={styles.header}>
          <div style={styles.titleSection}>
            <button style={styles.menuBtn} onClick={() => setShowMenu(!showMenu)}>☰</button>
            <h1 style={styles.title}>
              {gameState === 'finished' ? (winner === 'player' ? 'You Win!' : 'AI Wins') : 'Garbage'}
            </h1>
            <span style={styles.badge}>provably fair</span>
          </div>
          <button style={styles.refreshBtn} onClick={startNewGame} title="New Game">↻</button>
        </div>

        {/* Dropdown Menu */}
        {showMenu && (
          <div style={styles.menu}>
            {gameState === 'finished' && (
              <button style={styles.menuItem} onClick={() => { setShowVerification(!showVerification); setShowMenu(false); }}>
                ✓ Verify Shuffle
              </button>
            )}
            <button style={styles.menuItem} onClick={() => { setShowLeaderboard(!showLeaderboard); setShowMenu(false); }}>
              🏆 Leaderboard
            </button>
            <Link to="/" style={styles.menuItem} onClick={() => setShowMenu(false)}>
              🏠 Home
            </Link>
          </div>
        )}

        {/* Stats Bar */}
        <div style={styles.statsBar}>
          <div style={styles.stat}>
            <span style={styles.statValue}>{formatTime(getElapsedSeconds())}</span>
            <span style={styles.statLabel}>time</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statValue}>{moves}</span>
            <span style={styles.statLabel}>moves</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statValue}>{currentTurn === 'player' ? 'YOU' : 'AI'}</span>
            <span style={styles.statLabel}>turn</span>
          </div>
          {gameState === 'finished' && winner === 'player' && (
            <div style={styles.stat}>
              <span style={{ ...styles.statValue, color: '#4ade80' }}>{calculateScore()}</span>
              <span style={styles.statLabel}>score</span>
            </div>
          )}
        </div>

        {/* Leaderboard Panel */}
        {showLeaderboard && <Leaderboard game="garbage" currentGameId={gameId} />}

        {/* Game Area */}
        <div style={styles.gameArea}>
          {/* AI Area */}
          <div style={styles.playerArea}>
            <div style={styles.areaLabel}>AI {currentTurn === 'ai' && '(thinking...)'}</div>
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
                  cursor: currentTurn === 'player' && !heldCard ? 'pointer' : 'default',
                  opacity: currentTurn === 'player' && !heldCard ? 1 : 0.6
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
                <span style={{ color: '#94a3b8' }}>Holding: </span>
                <Card card={heldCard} faceUp={true} small />
                <button onClick={discardHeldCard} style={styles.discardBtn}>
                  Discard
                </button>
              </div>
            )}
          </div>

          {/* Player Area */}
          <div style={styles.playerArea}>
            <div style={styles.areaLabel}>You {currentTurn === 'player' && '(your turn)'}</div>
            <div style={styles.cardGrid}>
              {[0,1,2,3,4,5,6,7,8,9].map(renderPlayerSlot)}
            </div>
          </div>
        </div>

        {/* Message */}
        <div style={styles.messageBox}>{message}</div>

        {/* Footer */}
        <div style={styles.footer}>
          <span>Ergo Blockchain Verified</span>
          {blockData?.blockHeight > 0 && (
            <span style={styles.blockInfo}>Block #{blockData.blockHeight}</span>
          )}
        </div>
      </div>

      {/* Win Modal */}
      {gameState === 'finished' && winner === 'player' && !showVerification && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>🎉 You Won!</h2>

            <div style={styles.modalScore}>
              <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#4ade80' }}>
                {calculateScore()}
              </span>
              <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>points</span>
            </div>

            <div style={styles.modalStats}>
              <div style={styles.modalStat}>
                <span style={styles.modalStatValue}>{formatTime(getElapsedSeconds())}</span>
                <span style={styles.modalStatLabel}>Time</span>
              </div>
              <div style={styles.modalStat}>
                <span style={styles.modalStatValue}>{moves}</span>
                <span style={styles.modalStatLabel}>Moves</span>
              </div>
            </div>

            {/* Submission Form */}
            {!submitted ? (
              <div style={styles.submitSection}>
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={20}
                  style={styles.nameInput}
                />
                <button
                  onClick={handleSubmitScore}
                  disabled={submitting}
                  style={{ ...styles.submitBtn, opacity: submitting ? 0.5 : 1 }}
                >
                  {submitting ? 'Submitting...' : 'Submit Score'}
                </button>
                {submitError && <p style={styles.submitError}>{submitError}</p>}
              </div>
            ) : (
              <div style={styles.submitSuccess}>
                ✓ Submitted! Ranked #{submitRank}
              </div>
            )}

            <div style={styles.modalActions}>
              <button onClick={startNewGame} style={styles.playAgainBtn}>Play Again</button>
              <button onClick={() => setShowVerification(true)} style={styles.verifyBtn}>Verify</button>
            </div>
          </div>
        </div>
      )}

      {/* Verification panel */}
      {showVerification && blockData && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxWidth: '600px' }}>
            <button onClick={() => setShowVerification(false)} style={styles.modalClose}>×</button>
            <Verification
              blockData={blockData}
              gameId={gameId}
              deck={deck}
              winner={winner}
            />
          </div>
        </div>
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
    maxWidth: '1100px', // Wider: increased from 600px to spread side to side
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
    fontSize: 'clamp(1rem, 4vw, 1.25rem)',
    fontWeight: 'bold',
    color: '#f1f5f9',
    fontFamily: 'system-ui, sans-serif',
    margin: 0
  },
  badge: {
    fontSize: '0.5rem',
    padding: '2px 5px',
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
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: '#f1f5f9'
  },
  statLabel: {
    fontSize: '0.6rem',
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
    fontSize: '1.75rem',
    margin: '0 0 4px 0',
    color: '#fff'
  },
  startSubtitle: {
    fontSize: '0.875rem',
    color: '#94a3b8',
    margin: '0 0 20px 0'
  },
  difficultyBox: {
    marginBottom: '16px'
  },
  diffLabel: {
    color: '#94a3b8',
    fontSize: '0.8rem',
    marginRight: '8px'
  },
  diffSelect: {
    padding: '8px',
    fontSize: '0.9rem',
    borderRadius: '6px',
    border: '1px solid #334155',
    backgroundColor: '#0f172a',
    color: '#f1f5f9'
  },
  rulesBox: {
    backgroundColor: '#0f172a',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '0.75rem',
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
    cursor: 'pointer',
    marginBottom: '10px'
  },
  leaderboardBtn: {
    width: '100%',
    padding: '10px',
    fontSize: '0.9rem',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    border: '1px solid #334155',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  loadingScreen: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px'
  },
  spinner: {
    fontSize: '3rem'
  },
  loadingText: {
    color: '#94a3b8'
  },
  gameArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minHeight: 0,
    overflowY: 'auto'
  },
  playerArea: {
    marginBottom: '4px'
  },
  areaLabel: {
    fontSize: '0.75rem',
    color: '#64748b',
    marginBottom: '4px',
    textAlign: 'center'
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(10, 1fr)', // Cypherpunk: single row of 10 cards (was 2 rows of 5)
    gap: 'clamp(4px, 1vw, 8px)', // Slightly larger gap for readability
    maxWidth: '100%'
  },
  slot: {
    position: 'relative',
    aspectRatio: '2.5/3.5',
    backgroundColor: '#1e293b',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  slotNumber: {
    position: 'absolute',
    top: '2px',
    left: '4px',
    fontSize: '0.6rem',
    color: '#475569'
  },
  centerArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#1e293b', // Cypherpunk: dark slate (was green felt #166534)
    borderRadius: '8px',
    marginBottom: '4px',
    border: '1px solid #6366f1' // Cypherpunk: indigo accent border
  },
  pileContainer: {
    display: 'flex',
    gap: '24px',
    marginBottom: '8px'
  },
  pile: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  pileLabel: {
    fontSize: '0.65rem',
    color: '#94a3b8', // Cypherpunk: muted slate-400 (was bright green #86efac)
    marginTop: '2px'
  },
  emptyPile: {
    width: '50px',
    height: '70px',
    border: '2px dashed #22c55e',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#22c55e',
    fontSize: '0.65rem'
  },
  heldCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 10px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: '6px'
  },
  discardBtn: {
    padding: '4px 10px',
    fontSize: '0.7rem',
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  messageBox: {
    padding: '8px',
    textAlign: 'center',
    color: '#4ade80',
    fontSize: '0.85rem',
    minHeight: '2rem'
  },
  errorBox: {
    backgroundColor: '#ef4444',
    color: '#fff',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '12px',
    fontSize: '0.85rem'
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 4px',
    color: '#64748b',
    fontSize: '0.65rem',
    fontFamily: 'system-ui, sans-serif'
  },
  blockInfo: {
    color: '#475569'
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px'
  },
  modal: {
    backgroundColor: '#1e293b',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '400px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    position: 'relative',
    textAlign: 'center'
  },
  modalClose: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: '1.5rem',
    cursor: 'pointer'
  },
  modalTitle: {
    fontSize: '1.5rem',
    margin: '0 0 16px 0',
    color: '#f1f5f9'
  },
  modalScore: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '16px'
  },
  modalStats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '32px',
    marginBottom: '20px'
  },
  modalStat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  modalStatValue: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#f1f5f9'
  },
  modalStatLabel: {
    fontSize: '0.75rem',
    color: '#64748b'
  },
  submitSection: {
    backgroundColor: '#0f172a',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px'
  },
  nameInput: {
    width: '100%',
    padding: '12px',
    fontSize: '0.9rem',
    borderRadius: '6px',
    border: '1px solid #334155',
    backgroundColor: '#1e293b',
    color: '#f1f5f9',
    marginBottom: '10px',
    boxSizing: 'border-box'
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
    fontSize: '0.9rem',
    fontWeight: '600',
    backgroundColor: '#22c55e',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  submitError: {
    color: '#f87171',
    fontSize: '0.8rem',
    marginTop: '8px'
  },
  submitSuccess: {
    backgroundColor: '#166534',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
    color: '#4ade80',
    fontWeight: '600'
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center'
  },
  playAgainBtn: {
    padding: '12px 24px',
    fontSize: '0.9rem',
    fontWeight: '600',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  verifyBtn: {
    padding: '12px 24px',
    fontSize: '0.9rem',
    fontWeight: '600',
    backgroundColor: '#f59e0b',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  }
};

export default GarbageGame;
