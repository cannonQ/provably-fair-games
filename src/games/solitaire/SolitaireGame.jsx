/**
 * SolitaireGame Component
 * 
 * Leaderboard ranks by: cards to foundation > time > moves
 * Both wins and losses can be submitted.
 */

import React, { useReducer, useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getLatestBlock } from '../../blockchain/ergo-api';
import { generateSeed, shuffleDeck } from '../../blockchain/shuffle';
import { solitaireReducer, initialState, getFoundationCount } from './gameState';
import { checkWinCondition, canAutoComplete, getHint, isGameStuck } from './gameLogic';
import { submitScore } from '../../services/leaderboard';
import SolitaireBoard from './SolitaireBoard';
import Leaderboard from '../../components/Leaderboard';

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function SolitaireGame() {
  const [state, dispatch] = useReducer(solitaireReducer, initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [showAutoComplete, setShowAutoComplete] = useState(false);
  const [scoringMode, setScoringMode] = useState('standard');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isStuck, setIsStuck] = useState(false);
  
  // Submission state
  const [playerName, setPlayerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitRank, setSubmitRank] = useState(null);
  const [showGameOver, setShowGameOver] = useState(true);

  // Timer effect
  useEffect(() => {
    if (!state.startTime || state.gameStatus !== 'playing') return;

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - state.startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [state.startTime, state.gameStatus]);

  // Win detection
  useEffect(() => {
    if (state.gameStatus === 'playing' && checkWinCondition(state.foundations)) {
      dispatch({ type: 'SET_WON' });
    }
  }, [state.foundations, state.gameStatus]);

  // Auto-complete detection (auto-trigger is handled after handleAutoComplete is defined)
  useEffect(() => {
    if (state.gameStatus === 'playing' && state.blockchainData) {
      setShowAutoComplete(canAutoComplete(state));
    } else {
      setShowAutoComplete(false);
    }
  }, [state, state.gameStatus, state.blockchainData]);

  // Stuck detection
  useEffect(() => {
    if (state.gameStatus === 'playing' && state.blockchainData) {
      const stuck = isGameStuck(state);
      setIsStuck(stuck);
      if (stuck) {
        dispatch({ type: 'SET_LOST' });
      }
    }
  }, [state.tableau, state.waste, state.stock, state.foundations, state.gameStatus, state.blockchainData]);

  const foundationCount = getFoundationCount(state.foundations);

  // Start a new game
  const startNewGame = useCallback(async () => {
    setLoading(true);
    setError(null);
    setElapsed(0);
    setShowAutoComplete(false);
    setSubmitted(false);
    setSubmitError(null);
    setSubmitRank(null);
    setIsStuck(false);
    setShowGameOver(true);

    try {
      const block = await getLatestBlock();
      const gameId = `SOL-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const seed = generateSeed(block, gameId);
      const shuffledDeck = shuffleDeck(seed);

      const blockchainData = {
        blockHeight: block.blockHeight,
        blockHash: block.blockHash,
        timestamp: block.timestamp,
        txHash: block.txHash,
        txIndex: block.txIndex,
        txCount: block.txCount,
        seed,
        gameId
      };

      localStorage.setItem(`solitaire-${gameId}`, JSON.stringify(blockchainData));

      dispatch({
        type: 'INIT_GAME',
        payload: {
          shuffledDeck,
          blockchainData,
          scoringMode
        }
      });
    } catch (err) {
      setError('Failed to fetch blockchain data. Please try again.');
      console.error('New game error:', err);
    } finally {
      setLoading(false);
    }
  }, [scoringMode]);

  const handleUndo = () => dispatch({ type: 'UNDO' });

  const handleHint = () => {
    const hint = getHint(state);
    if (hint) {
      dispatch({ type: 'SELECT_CARDS', payload: { cards: hint.cards, source: hint.from } });
      setTimeout(() => dispatch({ type: 'CLEAR_SELECTION' }), 2000);
    } else {
      alert('No moves available. Try drawing from stock or give up.');
    }
  };

  const handleGiveUp = () => {
    if (window.confirm('Are you sure you want to give up?')) {
      dispatch({ type: 'SET_LOST' });
    }
  };

  const handleAutoComplete = useCallback(() => {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    
    const moveNext = () => {
      if (state.gameStatus === 'won') return;

      for (const suit of suits) {
        const foundation = state.foundations[suit];
        
        if (state.waste.length > 0) {
          const wasteTop = state.waste[state.waste.length - 1];
          if (wasteTop.suit === suit) {
            const canPlace = foundation.length === 0 ? wasteTop.rank === 'A' : true;
            if (canPlace) {
              dispatch({ type: 'SELECT_CARDS', payload: { cards: [wasteTop], source: { type: 'waste' } } });
              setTimeout(() => {
                dispatch({ type: 'MOVE_TO_FOUNDATION', payload: { suit } });
                setTimeout(moveNext, 100);
              }, 50);
              return;
            }
          }
        }

        for (let col = 0; col < 7; col++) {
          const column = state.tableau[col];
          if (column.length > 0) {
            const topCard = column[column.length - 1];
            if (topCard.suit === suit && topCard.faceUp) {
              dispatch({ type: 'SELECT_CARDS', payload: { cards: [topCard], source: { type: 'tableau', index: col } } });
              setTimeout(() => {
                dispatch({ type: 'MOVE_TO_FOUNDATION', payload: { suit } });
                setTimeout(moveNext, 100);
              }, 50);
              return;
            }
          }
        }
      }
    };

    moveNext();
  }, [state, dispatch]);

  // Auto-trigger completion when all tableau cards are face-up
  useEffect(() => {
    if (state.gameStatus === 'playing' && state.blockchainData) {
      const allTableauFaceUp = state.tableau.every(column =>
        column.every(card => card.faceUp)
      );

      // Auto-complete when all cards revealed and game not yet won
      if (allTableauFaceUp && !checkWinCondition(state.foundations)) {
        const timer = setTimeout(() => {
          handleAutoComplete();
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [state.tableau, state.foundations, state.gameStatus, state.blockchainData, handleAutoComplete]);

  // Submit score to leaderboard
  const handleSubmitScore = async () => {
    if (!state.blockchainData) return;
    
    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await submitScore({
        game: 'solitaire',
        gameId: state.blockchainData.gameId,
        playerName: playerName.trim() || 'Anonymous',
        score: foundationCount, // Cards to foundation is the primary ranking
        timeSeconds: elapsed,
        moves: state.moves,
        blockHeight: state.blockchainData.blockHeight,
        blockHash: state.blockchainData.blockHash,
        txHash: state.blockchainData.txHash,
        blockTimestamp: state.blockchainData.timestamp
      });

      setSubmitted(true);
      setSubmitRank(result.rank);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const btnStyle = {
    padding: '6px 12px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#2196f3',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '13px'
  };

  const btnDisabled = { ...btnStyle, backgroundColor: '#555', cursor: 'not-allowed' };

  const isGameOver = state.gameStatus === 'won' || state.gameStatus === 'lost';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1b5e20', color: '#fff' }}>
      {/* Header */}
      <header style={{
        padding: '10px 15px',
        backgroundColor: 'rgba(0,0,0,0.2)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px'
      }}>
        <h1 style={{ margin: 0, fontSize: '18px' }}>♠ Solitaire</h1>
        
        <div style={{ display: 'flex', gap: '15px', fontSize: '14px', alignItems: 'center' }}>
          <span>⏱ {formatTime(elapsed)}</span>
          <span>Moves: {state.moves}</span>
          <span style={{ color: '#4caf50', fontWeight: 'bold' }}>
            🃏 {foundationCount}/52
          </span>
          {state.blockchainData && (
            <span style={{ color: state.score >= 0 ? '#8bc34a' : '#ff9800' }}>
              {state.scoringMode === 'vegas' 
                ? (state.score >= 0 ? `+$${state.score}` : `-$${Math.abs(state.score)}`)
                : `${state.score} pts`
              }
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={startNewGame} style={btnStyle}>New</button>
          <button onClick={handleUndo} disabled={state.moveHistory.length === 0}
            style={state.moveHistory.length === 0 ? btnDisabled : btnStyle}>Undo</button>
          <button onClick={handleHint} style={btnStyle}>Hint</button>
          {showAutoComplete && (
            <button onClick={handleAutoComplete} style={{ ...btnStyle, backgroundColor: '#4caf50' }}>Auto</button>
          )}
          {state.gameStatus === 'playing' && state.blockchainData && (
            <button onClick={handleGiveUp} style={{ ...btnStyle, backgroundColor: '#f44336' }}>Give Up</button>
          )}
          <button onClick={() => setShowLeaderboard(!showLeaderboard)} 
            style={{ ...btnStyle, backgroundColor: showLeaderboard ? '#ff9800' : '#9c27b0' }}>
            🏆 {showLeaderboard ? 'Hide' : 'Ranks'}
          </button>
          {state.blockchainData && (
            <Link to={`/verify/solitaire/${state.blockchainData.gameId}`} style={{ ...btnStyle, textDecoration: 'none' }}>
              Verify
            </Link>
          )}
        </div>
      </header>

      {/* Leaderboard Panel */}
      {showLeaderboard && (
        <Leaderboard game="solitaire" currentGameId={state.blockchainData?.gameId} />
      )}

      {/* Game Area */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', fontSize: '16px' }}>
          Shuffling with blockchain data...
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#ffcdd2' }}>
          {error}
          <br />
          <button onClick={startNewGame} style={{ ...btnStyle, marginTop: '15px' }}>Try Again</button>
        </div>
      ) : !state.blockchainData ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ fontSize: '18px', marginBottom: '20px' }}>Welcome to Provably Fair Solitaire!</p>
          
          {/* Scoring Mode Selection */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ marginRight: '10px', fontSize: '14px' }}>Display Mode:</label>
            <select 
              value={scoringMode} 
              onChange={(e) => setScoringMode(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '14px', borderRadius: '4px', border: 'none',
                backgroundColor: '#2e7d32', color: '#fff', cursor: 'pointer' }}
            >
              <option value="standard">Standard (Points)</option>
              <option value="vegas">Vegas ($52 buy-in)</option>
            </select>
          </div>

          <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px',
            maxWidth: '350px', margin: '0 auto 25px', fontSize: '13px', textAlign: 'left' }}>
            
            {scoringMode === 'standard' ? (
              <>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>🎯 Standard Scoring:</div>
                <div>• Waste → Tableau: +5</div>
                <div>• Card to Foundation: +10</div>
                <div>• Flip card: +5</div>
                <div>• Foundation → Tableau: -15</div>
                <div>• Recycle stock: -20</div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>💰 Vegas Scoring:</div>
                <div>• Buy-in: -$52</div>
                <div>• Each card to foundation: +$5</div>
                <div>• Max win: $208</div>
              </>
            )}
            
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>🏆 Leaderboard Ranking:</div>
              <div style={{ color: '#aaa', fontSize: '12px' }}>
                All modes compete together:<br/>
                Cards → Time → Moves
              </div>
            </div>
          </div>

          <button onClick={startNewGame} style={{ ...btnStyle, fontSize: '16px', padding: '12px 24px' }}>
            Start New Game
          </button>
        </div>
      ) : (
        <SolitaireBoard state={state} dispatch={dispatch} />
      )}

      {/* Game Over Modal (Win or Loss) */}
      {isGameOver && showGameOver && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff', color: '#333', padding: '30px', borderRadius: '12px',
            textAlign: 'center', maxWidth: '600px', width: '95%', maxHeight: '90vh', overflowY: 'auto',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setShowGameOver(false)}
              style={{
                position: 'absolute', top: '10px', right: '10px',
                background: 'none', border: 'none', fontSize: '24px',
                cursor: 'pointer', color: '#999', padding: '5px',
                lineHeight: 1
              }}
              aria-label="Close"
            >
              ✕
            </button>
            <h2 style={{ fontSize: '28px', marginBottom: '15px' }}>
              {state.gameStatus === 'won' ? '🎉 You Won!' : (isStuck ? '😔 No Moves Left' : '🏳️ Game Over')}
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                fontSize: '48px', 
                fontWeight: 'bold', 
                color: foundationCount === 52 ? '#4caf50' : '#2196f3',
                margin: '10px 0'
              }}>
                {foundationCount}/52
              </div>
              <p style={{ fontSize: '14px', color: '#666', margin: '4px 0' }}>Cards to Foundation</p>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '15px' }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{formatTime(elapsed)}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>Time</div>
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{state.moves}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>Moves</div>
                </div>
              </div>
            </div>

            {/* Submission Form */}
            {!submitted ? (
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                <p style={{ fontSize: '14px', marginBottom: '10px', color: '#666' }}>
                  Submit to Leaderboard:
                </p>
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={20}
                  style={{
                    width: '100%', padding: '10px', fontSize: '14px', borderRadius: '4px',
                    border: '1px solid #ddd', marginBottom: '10px', boxSizing: 'border-box'
                  }}
                />
                <button
                  onClick={handleSubmitScore}
                  disabled={submitting}
                  style={{
                    ...btnStyle,
                    width: '100%',
                    padding: '12px',
                    fontSize: '15px',
                    backgroundColor: submitting ? '#ccc' : '#4caf50'
                  }}
                >
                  {submitting ? 'Submitting...' : '📤 Submit Score'}
                </button>
                {submitError && (
                  <p style={{ color: '#f44336', fontSize: '13px', marginTop: '8px' }}>{submitError}</p>
                )}
              </div>
            ) : (
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '8px' }}>
                <p style={{ fontSize: '16px', color: '#2e7d32', fontWeight: 'bold' }}>
                  ✓ Submitted! You're ranked #{submitRank}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <button onClick={startNewGame} style={btnStyle}>Play Again</button>
                <select 
                  value={scoringMode} 
                  onChange={(e) => setScoringMode(e.target.value)}
                  style={{ 
                    padding: '6px 8px', fontSize: '12px', borderRadius: '4px', border: 'none',
                    backgroundColor: '#2196f3', color: '#fff', cursor: 'pointer'
                  }}
                >
                  <option value="standard">Standard</option>
                  <option value="vegas">Vegas</option>
                </select>
              </div>
              <button 
                onClick={() => window.open(`/verify/solitaire/${state.blockchainData?.gameId}`, '_blank')} 
                style={{ ...btnStyle, backgroundColor: '#ff9800' }}
              >
                Verify ↗
              </button>
            </div>
            
            {/* Inline Leaderboard */}
            <div style={{ marginTop: '20px', maxHeight: '200px', overflowY: 'auto' }}>
              <Leaderboard game="solitaire" currentGameId={state.blockchainData?.gameId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
