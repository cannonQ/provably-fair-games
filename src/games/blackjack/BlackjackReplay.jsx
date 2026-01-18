/**
 * Blackjack Game Replay Component
 * Replays rounds from roundHistory with step-by-step dealing visualization
 */

import React, { useState, useEffect, useRef } from 'react';
import { calculateHandValue, isBlackjack } from './gameLogic';

const SUIT_SYMBOLS = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
const isRedSuit = (suit) => suit === 'hearts' || suit === 'diamonds';

// Card component for replay
const Card = ({ card, faceDown = false, small = false }) => {
  const size = small ? { padding: '4px 8px', fontSize: '14px' } : { padding: '8px 12px', fontSize: '18px' };

  if (faceDown) {
    return (
      <span style={{
        display: 'inline-block',
        ...size,
        margin: '2px',
        backgroundColor: '#1a4a8a',
        borderRadius: '6px',
        fontWeight: 'bold',
        color: '#fff',
        border: '2px solid #2a5a9a',
        minWidth: small ? '30px' : '40px',
        textAlign: 'center'
      }}>
        🂠
      </span>
    );
  }

  return (
    <span style={{
      display: 'inline-block',
      ...size,
      margin: '2px',
      backgroundColor: '#fff',
      borderRadius: '6px',
      fontWeight: 'bold',
      color: isRedSuit(card.suit) ? '#d32f2f' : '#1a1a1a',
      border: '2px solid #ccc',
      minWidth: small ? '30px' : '40px',
      textAlign: 'center'
    }}>
      {card.rank}{SUIT_SYMBOLS[card.suit]}
    </span>
  );
};

/**
 * Generate replay steps from a round's data
 * Returns an array of steps showing the progression of the hand
 */
const generateRoundSteps = (round, roundIndex) => {
  const steps = [];
  const playerFinalHand = round.playerHands[0] || [];
  const dealerFinalHand = round.dealerHand || [];
  const hasSplit = round.playerHands.length > 1;
  const result = round.results?.[0];

  // Step 1: Initial bet
  steps.push({
    type: 'bet',
    description: `Bet: $${round.handBets[0]}`,
    playerCards: [],
    dealerCards: [],
    dealerHidden: false
  });

  // Step 2: First card to player
  if (playerFinalHand.length >= 1) {
    steps.push({
      type: 'deal',
      description: 'First card dealt to player',
      playerCards: [playerFinalHand[0]],
      dealerCards: [],
      dealerHidden: false
    });
  }

  // Step 3: First card to dealer (face up)
  if (dealerFinalHand.length >= 1) {
    steps.push({
      type: 'deal',
      description: 'First card dealt to dealer',
      playerCards: playerFinalHand.slice(0, 1),
      dealerCards: [dealerFinalHand[0]],
      dealerHidden: false
    });
  }

  // Step 4: Second card to player
  if (playerFinalHand.length >= 2) {
    steps.push({
      type: 'deal',
      description: 'Second card dealt to player',
      playerCards: playerFinalHand.slice(0, 2),
      dealerCards: dealerFinalHand.slice(0, 1),
      dealerHidden: false
    });
  }

  // Step 5: Second card to dealer (face down)
  if (dealerFinalHand.length >= 2) {
    steps.push({
      type: 'deal',
      description: 'Second card dealt to dealer (face down)',
      playerCards: playerFinalHand.slice(0, 2),
      dealerCards: dealerFinalHand.slice(0, 2),
      dealerHidden: true
    });
  }

  // Check for player blackjack
  const initialPlayerHand = playerFinalHand.slice(0, 2);
  const playerHasBlackjack = isBlackjack(initialPlayerHand);

  if (playerHasBlackjack) {
    steps.push({
      type: 'blackjack',
      description: 'BLACKJACK!',
      playerCards: playerFinalHand.slice(0, 2),
      dealerCards: dealerFinalHand,
      dealerHidden: false,
      highlight: 'player'
    });
  } else {
    // Insurance check (if dealer shows Ace)
    if (round.insuranceBet > 0) {
      steps.push({
        type: 'insurance',
        description: `Insurance taken: $${round.insuranceBet}`,
        playerCards: playerFinalHand.slice(0, 2),
        dealerCards: dealerFinalHand.slice(0, 2),
        dealerHidden: true
      });
    }

    // Handle splits
    if (hasSplit) {
      steps.push({
        type: 'split',
        description: 'Player SPLITS',
        playerCards: playerFinalHand.slice(0, 2),
        dealerCards: dealerFinalHand.slice(0, 2),
        dealerHidden: true,
        splitHands: round.playerHands
      });

      // Show final split hands
      round.playerHands.forEach((hand, handIdx) => {
        const handValue = calculateHandValue(hand);
        steps.push({
          type: 'split_result',
          description: `Hand ${handIdx + 1}: ${handValue.display}`,
          playerCards: hand,
          dealerCards: dealerFinalHand.slice(0, 2),
          dealerHidden: true,
          handIndex: handIdx
        });
      });
    } else {
      // Player actions (hits)
      for (let i = 2; i < playerFinalHand.length; i++) {
        const currentHand = playerFinalHand.slice(0, i + 1);
        const handValue = calculateHandValue(currentHand);
        const busted = handValue.value > 21;

        steps.push({
          type: i === 2 && playerFinalHand.length === 3 && round.handBets[0] > round.handBets[0] ? 'double' : 'hit',
          description: busted ? `HIT - BUST! (${handValue.value})` : `HIT - ${handValue.display}`,
          playerCards: currentHand,
          dealerCards: dealerFinalHand.slice(0, 2),
          dealerHidden: true,
          busted
        });
      }

      // Player stands (if didn't bust)
      const finalPlayerValue = calculateHandValue(playerFinalHand);
      if (finalPlayerValue.value <= 21) {
        steps.push({
          type: 'stand',
          description: `STAND with ${finalPlayerValue.display}`,
          playerCards: playerFinalHand,
          dealerCards: dealerFinalHand.slice(0, 2),
          dealerHidden: true
        });
      }
    }
  }

  // Dealer reveal
  steps.push({
    type: 'reveal',
    description: 'Dealer reveals hole card',
    playerCards: hasSplit ? round.playerHands[0] : playerFinalHand,
    dealerCards: dealerFinalHand.slice(0, 2),
    dealerHidden: false,
    allPlayerHands: hasSplit ? round.playerHands : null
  });

  // Dealer plays (hits)
  for (let i = 2; i < dealerFinalHand.length; i++) {
    const currentDealerHand = dealerFinalHand.slice(0, i + 1);
    const dealerValue = calculateHandValue(currentDealerHand);
    const busted = dealerValue.value > 21;

    steps.push({
      type: 'dealer_hit',
      description: busted ? `Dealer BUSTS! (${dealerValue.value})` : `Dealer hits - ${dealerValue.display}`,
      playerCards: hasSplit ? round.playerHands[0] : playerFinalHand,
      dealerCards: currentDealerHand,
      dealerHidden: false,
      busted,
      allPlayerHands: hasSplit ? round.playerHands : null
    });
  }

  // Final result
  const dealerValue = calculateHandValue(dealerFinalHand);
  const totalBet = (round.handBets[0] || 0) + (round.insuranceBet || 0);
  const netResult = (round.totalPayout || 0) - totalBet;

  steps.push({
    type: 'result',
    description: netResult > 0 ? `WIN +$${netResult}` : netResult < 0 ? `LOSE -$${Math.abs(netResult)}` : 'PUSH',
    playerCards: hasSplit ? round.playerHands[0] : playerFinalHand,
    dealerCards: dealerFinalHand,
    dealerHidden: false,
    outcome: result?.outcome,
    payout: round.totalPayout,
    netResult,
    allPlayerHands: hasSplit ? round.playerHands : null
  });

  return steps;
};

/**
 * BlackjackReplay Component
 */
const BlackjackReplay = ({
  roundHistory = [],
  finalBalance,
  onStepChange
}) => {
  const [currentRound, setCurrentRound] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000);
  const [allSteps, setAllSteps] = useState([]);

  const playIntervalRef = useRef(null);

  // Generate all steps for all rounds
  useEffect(() => {
    if (!roundHistory || roundHistory.length === 0) return;

    const steps = [];
    roundHistory.forEach((round, idx) => {
      const roundSteps = generateRoundSteps(round, idx);
      roundSteps.forEach(step => {
        steps.push({ ...step, roundIndex: idx });
      });
    });
    setAllSteps(steps);
    setCurrentStep(0);
  }, [roundHistory]);

  // Playback control
  useEffect(() => {
    if (isPlaying && currentStep < allSteps.length - 1) {
      playIntervalRef.current = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, playbackSpeed);
    } else if (currentStep >= allSteps.length - 1) {
      setIsPlaying(false);
    }

    return () => {
      if (playIntervalRef.current) {
        clearTimeout(playIntervalRef.current);
      }
    };
  }, [isPlaying, currentStep, allSteps.length, playbackSpeed]);

  // Notify parent of step changes
  useEffect(() => {
    if (onStepChange && allSteps[currentStep]) {
      onStepChange(allSteps[currentStep], currentStep, allSteps.length);
    }
  }, [currentStep, allSteps, onStepChange]);

  const handlePlayPause = () => {
    if (currentStep >= allSteps.length - 1) {
      setCurrentStep(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    setCurrentStep(prev => Math.min(prev + 1, allSteps.length - 1));
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
    setCurrentStep(allSteps.length - 1);
  };

  const jumpToRound = (roundIdx) => {
    setIsPlaying(false);
    const stepIdx = allSteps.findIndex(s => s.roundIndex === roundIdx);
    if (stepIdx !== -1) {
      setCurrentStep(stepIdx);
    }
  };

  if (!roundHistory || roundHistory.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.noData}>No round history available for replay</div>
      </div>
    );
  }

  if (allSteps.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Generating replay...</div>
      </div>
    );
  }

  const step = allSteps[currentStep];
  const progress = allSteps.length > 1 ? (currentStep / (allSteps.length - 1)) * 100 : 0;
  const speedLabel = playbackSpeed <= 500 ? 'Fast' : playbackSpeed <= 1000 ? 'Normal' : 'Slow';

  const playerValue = calculateHandValue(step.playerCards || []);
  const dealerValue = step.dealerHidden
    ? calculateHandValue([step.dealerCards[0]])
    : calculateHandValue(step.dealerCards || []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>♠ Game Replay ♥</h3>
        <div style={styles.roundInfo}>
          Round {step.roundIndex + 1} of {roundHistory.length}
        </div>
      </div>

      {/* Round selector */}
      <div style={styles.roundSelector}>
        {roundHistory.map((_, idx) => (
          <button
            key={idx}
            onClick={() => jumpToRound(idx)}
            style={{
              ...styles.roundBtn,
              backgroundColor: step.roundIndex === idx ? '#4ade80' : '#2a3a5e',
              color: step.roundIndex === idx ? '#000' : '#fff'
            }}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      <div style={styles.progress}>
        Step {currentStep + 1} of {allSteps.length}
      </div>

      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>

      {/* Action description */}
      <div style={{
        ...styles.actionBox,
        backgroundColor: step.type === 'result'
          ? (step.netResult > 0 ? 'rgba(76,175,80,0.3)' : step.netResult < 0 ? 'rgba(244,67,54,0.3)' : 'rgba(136,136,136,0.3)')
          : step.type === 'blackjack' ? 'rgba(255,215,0,0.3)' : '#0d1525'
      }}>
        <span style={styles.actionText}>{step.description}</span>
      </div>

      {/* Cards display */}
      <div style={styles.tableArea}>
        {/* Dealer hand */}
        <div style={styles.handSection}>
          <div style={styles.handLabel}>
            Dealer {!step.dealerHidden && step.dealerCards.length > 0 && `(${dealerValue.display})`}
          </div>
          <div style={styles.cardsRow}>
            {(step.dealerCards || []).map((card, i) => (
              <Card
                key={i}
                card={card}
                faceDown={step.dealerHidden && i === 1}
              />
            ))}
            {step.dealerCards?.length === 0 && <span style={styles.emptySlot}>—</span>}
          </div>
        </div>

        {/* Player hand(s) */}
        <div style={styles.handSection}>
          <div style={styles.handLabel}>
            Player {step.playerCards?.length > 0 && `(${playerValue.display})`}
          </div>
          {step.allPlayerHands ? (
            // Split hands
            <div style={styles.splitHands}>
              {step.allPlayerHands.map((hand, handIdx) => {
                const hv = calculateHandValue(hand);
                return (
                  <div key={handIdx} style={styles.splitHand}>
                    <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>
                      Hand {handIdx + 1} ({hv.display})
                    </div>
                    <div style={styles.cardsRow}>
                      {hand.map((card, i) => (
                        <Card key={i} card={card} small />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={styles.cardsRow}>
              {(step.playerCards || []).map((card, i) => (
                <Card key={i} card={card} />
              ))}
              {step.playerCards?.length === 0 && <span style={styles.emptySlot}>—</span>}
            </div>
          )}
        </div>
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
  roundInfo: {
    color: '#ffd700',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  roundSelector: {
    display: 'flex',
    gap: '5px',
    flexWrap: 'wrap',
    marginBottom: '15px'
  },
  roundBtn: {
    padding: '5px 10px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
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
    fontSize: '1.3rem',
    fontWeight: 'bold',
    color: '#fff'
  },
  tableArea: {
    backgroundColor: '#0d4a2d',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    border: '3px solid #1a6a4a'
  },
  handSection: {
    marginBottom: '20px',
    textAlign: 'center'
  },
  handLabel: {
    color: '#ffd700',
    fontSize: '14px',
    marginBottom: '10px',
    fontWeight: 'bold'
  },
  cardsRow: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: '5px',
    minHeight: '50px',
    alignItems: 'center'
  },
  emptySlot: {
    color: '#4a7a4a',
    fontSize: '24px'
  },
  splitHands: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    flexWrap: 'wrap'
  },
  splitHand: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: '10px',
    borderRadius: '8px'
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
  loading: {
    textAlign: 'center',
    color: '#888',
    padding: '40px'
  }
};

export default BlackjackReplay;
