/**
 * BlackjackGame - Main game component orchestrating all game flow
 */

import React, { useReducer, useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import './blackjack.css';
import { getLatestBlock } from '../../blockchain/ergo-api';
import { generateSeed, shuffleArray } from '../../blockchain/shuffle';
import { blackjackReducer, initialState, createSixDeckShoe, dealCard } from './gameState';
import { 
  shouldDealerHit, isBlackjack, isBust, calculateHandValue,
  compareHands, calculatePayout, calculateInsurancePayout 
} from './gameLogic';
import BlackjackTable from './BlackjackTable';
import BettingControls from './BettingControls';
import GameOverModal from './GameOverModal';

export default function BlackjackGame() {
  const [state, dispatch] = useReducer(blackjackReducer, initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showGameOver, setShowGameOver] = useState(false);
  const [insuranceDeclined, setInsuranceDeclined] = useState(false);
  
  // Use ref to avoid stale closure in dealer auto-play
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Initialize game with blockchain data
  const initGame = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const block = await getLatestBlock();
      const newGameId = `BJK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Use full anti-spoofing seed generation (matches Solitaire)
      const blockData = {
        blockHash: block.blockHash,
        txHash: block.txHash,
        timestamp: block.timestamp,
        txIndex: block.txIndex
      };
      const seed = generateSeed(blockData, newGameId);
      const rawShoe = createSixDeckShoe();
      const shuffledShoe = shuffleArray(rawShoe, seed);
      
      const blockchainData = {
        blockHeight: block.blockHeight,
        blockHash: block.blockHash,
        timestamp: block.timestamp,
        txHash: block.txHash,
        txIndex: block.txIndex,
        txCount: block.txCount,
        seed
      };
      
      dispatch({
        type: 'INIT_SHOE',
        payload: {
          shuffledShoe,
          blockchainData,
          gameId: newGameId
        }
      });
      dispatch({ type: 'START_SESSION' });
    } catch (err) {
      setError('Failed to fetch blockchain data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { initGame(); }, [initGame]);

  // Session timer
  useEffect(() => {
    if (state.phase === 'sessionOver' || !state.sessionStartTime) return;
    const interval = setInterval(() => dispatch({ type: 'UPDATE_TIMER' }), 1000);
    return () => clearInterval(interval);
  }, [state.phase, state.sessionStartTime]);

  // Show game over modal when session ends
  useEffect(() => {
    if (state.phase === 'sessionOver') {
      setShowGameOver(true);
      
      // Save game data to localStorage for verification
      if (state.gameId) {
        const verificationData = {
          gameId: state.gameId,
          shoe: state.shoe,
          shoePosition: state.shoePosition,
          roundHistory: state.roundHistory,
          blockchainData: state.blockchainData,
          finalBalance: state.chipBalance,
          peakBalance: state.peakBalance,
          handsPlayed: state.handsPlayed,
          handsWon: state.handsWon,
          blackjacksHit: state.blackjacksHit,
          startingBalance: state.startingBalance,
          savedAt: Date.now()
        };
        try {
          localStorage.setItem(`blackjack_${state.gameId}`, JSON.stringify(verificationData));
        } catch (err) {
          console.error('Failed to save verification data:', err);
        }
      }
    }
  }, [state.phase, state.gameId, state.shoe, state.shoePosition, state.roundHistory, 
      state.blockchainData, state.chipBalance, state.peakBalance, state.handsPlayed,
      state.handsWon, state.blackjacksHit, state.startingBalance]);

  // Resolve round and calculate payouts
  const resolveRound = useCallback((finalDealerHand, currentState) => {
    const s = currentState || stateRef.current;
    const dealerHand = finalDealerHand || s.dealerHand;
    const dealerBJ = isBlackjack(dealerHand);
    
    let totalPayout = 0;
    let blackjackCount = 0;
    
    const results = s.playerHands.map((hand, idx) => {
      const bet = s.handBets[idx] || 0;
      const result = compareHands(hand, dealerHand);
      const payout = calculatePayout(result, bet);
      
      if (result === 'player_blackjack') blackjackCount++;
      totalPayout += payout;

      return {
        handIndex: idx,
        outcome: result.replace('player_', '').replace('dealer_', 'lose'),
        bet,
        payout
      };
    });

    // Insurance payout
    let insurancePayout = 0;
    if (s.insuranceBet > 0) {
      insurancePayout = calculateInsurancePayout(dealerBJ, s.insuranceBet);
      totalPayout += insurancePayout;
    }

    dispatch({ type: 'RESOLVE_ROUND', payload: {
      results,
      totalPayout,
      blackjackCount,
      insuranceBet: s.insuranceBet,
      insurancePayout
    } });
  }, []);

  // Dealer auto-play - using ref to get current state
  useEffect(() => {
    if (state.phase !== 'dealerTurn') return;
    
    const playDealer = async () => {
      // Use ref to get current state values
      const currentState = stateRef.current;
      let dealerHand = [...currentState.dealerHand];
      let pos = currentState.shoePosition;

      // Step 1: Reveal hole card with delay
      await new Promise(r => setTimeout(r, 800));
      dealerHand = dealerHand.map((c, i) => i === 1 ? { ...c, faceUp: true } : c);
      dispatch({ type: 'DEALER_PLAY', payload: { dealerHand, shoePosition: pos } });

      // Check if all player hands busted - dealer doesn't need to draw
      const allBusted = currentState.playerHands.every(hand => isBust(hand));
      
      if (!allBusted) {
        // Step 2: Dealer draws cards one at a time with delays
        while (shouldDealerHit(dealerHand)) {
          await new Promise(r => setTimeout(r, 1000)); // 1 second between cards
          const { card, newPosition } = dealCard(currentState.shoe, pos);
          dealerHand = [...dealerHand, card];
          pos = newPosition;
          // Dispatch after each card so UI updates
          dispatch({ type: 'DEALER_PLAY', payload: { dealerHand, shoePosition: pos } });
        }
      }

      // Step 3: Resolve round after final delay
      await new Promise(r => setTimeout(r, 800));
      resolveRound(dealerHand, currentState);
    };

    const timer = setTimeout(playDealer, 500);
    return () => clearTimeout(timer);
  }, [state.phase, resolveRound]);

  // Check for immediate blackjack resolution after deal
  // This runs after deal when insurance isn't offered (dealer doesn't show Ace)
  useEffect(() => {
    if (state.phase !== 'playerTurn') return;
    if (state.playerHands[0]?.length !== 2) return; // Only check on initial deal
    
    const playerBJ = isBlackjack(state.playerHands[0]);
    const dealerShowsAce = state.dealerHand[0]?.rank === 'A';
    const dealerBJ = isBlackjack(state.dealerHand);
    
    // If dealer shows Ace, wait for insurance decision
    if (dealerShowsAce && !insuranceDeclined) return;
    
    // Auto-resolve if either has blackjack
    if (playerBJ || dealerBJ) {
      // Small delay for visual feedback
      const timer = setTimeout(() => {
        dispatch({ type: 'STAND' });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [state.phase, state.playerHands, state.dealerHand, insuranceDeclined]);

  // Handlers
  const handleBetChange = (amount) => {
    dispatch({ type: 'PLACE_BET', payload: { amount } });
  };

  const handleDeal = () => {
    setInsuranceDeclined(false);
    dispatch({ type: 'DEAL_INITIAL' });
  };

  const handleHit = () => {
    dispatch({ type: 'HIT' });
  };

  // Auto-stand on bust or 21
  useEffect(() => {
    if (state.phase !== 'playerTurn') return;
    const hand = state.playerHands[state.activeHandIndex];
    if (!hand || hand.length < 2) return;
    
    // Don't auto-stand on blackjack (handled separately)
    if (hand.length === 2 && isBlackjack(hand)) return;
    
    const { value } = calculateHandValue(hand);
    if (value >= 21) {
      setTimeout(() => dispatch({ type: 'STAND' }), 300);
    }
  }, [state.playerHands, state.activeHandIndex, state.phase]);

  const handleStand = () => dispatch({ type: 'STAND' });
  const handleDoubleDown = () => dispatch({ type: 'DOUBLE_DOWN' });
  const handleSplit = () => dispatch({ type: 'SPLIT' });

  const handleInsurance = (take) => {
    if (take) {
      dispatch({ type: 'TAKE_INSURANCE' });
    }
    setInsuranceDeclined(true);
    // Blackjack check will be triggered by the useEffect watching insuranceDeclined
  };

  const handleNewRound = async () => {
    const needsReshuffle = state.shoePosition >= state.cutCardPosition;
    
    if (needsReshuffle) {
      setLoading(true);
      try {
        const block = await getLatestBlock();
        const seed = generateSeed(block.hash, block.height);
        const rawShoe = createSixDeckShoe();
        const shuffledShoe = shuffleArray(rawShoe, seed);
        
        dispatch({
          type: 'RESHUFFLE',
          payload: {
            shuffledShoe,
            blockchainData: { blockHeight: block.height, blockHash: block.hash, timestamp: block.timestamp }
          }
        });
      } catch (err) {
        setError('Failed to reshuffle. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    dispatch({ type: 'NEW_ROUND' });
  };

  const handleNewSession = () => {
    setShowGameOver(false);
    initGame();
  };

  const handleCashOut = () => {
    dispatch({ type: 'CASH_OUT' });
  };

  const handleExtendSession = () => {
    dispatch({ type: 'EXTEND_SESSION' });
  };

  // Format time helper
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="blackjack-game" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div className="loading-spinner"></div>
          <p>Fetching blockchain data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="blackjack-game" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#fff', background: '#c62828', padding: '2rem', borderRadius: '12px' }}>
          <p style={{ marginBottom: '1rem' }}>{error}</p>
          <button onClick={initGame} className="deal-button" style={{ width: 'auto' }}>Retry</button>
        </div>
      </div>
    );
  }

  const timerClass = state.timeRemaining < 60 ? 'critical' : state.timeRemaining < 300 ? 'warning' : '';

  return (
    <div className="blackjack-game">
      {/* Header */}
      <header className="game-header">
        <h1>♠ Blackjack ♥</h1>
        <div className="header-stats">
          <span className={`session-timer ${timerClass}`}>{formatTime(state.timeRemaining)}</span>
          <span className="balance-display">${state.chipBalance.toLocaleString()}</span>
        </div>
        <nav className="header-nav">
          <Link to="/">Home</Link>
          {state.gameId && <Link to={`/verify/blackjack/${state.gameId}`}>Verify</Link>}
          <button
            onClick={handleCashOut}
            className="header-cash-out"
            disabled={state.phase !== 'betting'}
          >
            Cash Out
          </button>
        </nav>
      </header>

      {/* Main Game Area */}
      <div className="game-container">
        <BlackjackTable
          state={state}
          onHit={handleHit}
          onStand={handleStand}
          onDoubleDown={handleDoubleDown}
          onSplit={handleSplit}
          onInsurance={handleInsurance}
        />

        {state.phase === 'betting' && state.chipBalance >= 5 && (
          <BettingControls
            chipBalance={state.chipBalance}
            currentBet={state.currentBet}
            onBetChange={handleBetChange}
            onDeal={handleDeal}
            onExtendSession={handleExtendSession}
            disabled={false}
            timeRemaining={state.timeRemaining}
            extensionsUsed={state.extensionsUsed}
          />
        )}

        {state.phase === 'betting' && state.chipBalance < 5 && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <p style={{ color: '#f44336', fontSize: '1.5rem', marginBottom: '1rem' }}>Out of chips!</p>
            <button 
              onClick={handleNewSession} 
              className="deal-button" 
              style={{ width: 'auto', padding: '1rem 3rem' }}
            >
              Start New Session
            </button>
          </div>
        )}

        {state.phase === 'payout' && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
            <button onClick={handleNewRound} className="deal-button" style={{ width: 'auto', padding: '1rem 3rem' }}>
              {state.shoePosition >= state.cutCardPosition ? 'Reshuffle & Deal' : 'Next Hand'}
            </button>
          </div>
        )}
      </div>

      {/* Game Over Modal */}
      {showGameOver && (
        <GameOverModal
          gameId={state.gameId}
          finalBalance={state.chipBalance}
          peakBalance={state.peakBalance}
          handsPlayed={state.handsPlayed}
          handsWon={state.handsWon}
          blackjacksHit={state.blackjacksHit}
          timePlayed={state.sessionDuration - state.timeRemaining}
          startingBalance={state.startingBalance}
          blockchainData={state.blockchainData}
          roundHistory={state.roundHistory}
          shoe={state.shoe}
          shoePosition={state.shoePosition}
          onPlayAgain={handleNewSession}
          onClose={() => setShowGameOver(false)}
        />
      )}
    </div>
  );
}
