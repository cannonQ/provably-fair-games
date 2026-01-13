/**
 * GameBoard.jsx - Game Board Layout Component
 * 
 * Displays the full game board with AI area, center piles, and player area.
 * Handles layout and passes click events up to parent.
 * 
 * Usage:
 *   <GameBoard
 *     playerCards={playerCards}
 *     aiCards={aiCards}
 *     drawPile={drawPile}
 *     discardPile={discardPile}
 *     currentTurn="player"
 *     onDrawPile={() => {}}
 *     onTakeDiscard={() => {}}
 *     onPlayerCardClick={(index) => {}}
 *   />
 */

import React from 'react';
import Card from './Card';

function GameBoard({
  playerCards = [],
  playerHidden = [],
  aiCards = [],
  aiHidden = [],
  drawPile = [],
  discardPile = [],
  currentTurn = 'player',
  heldCard = null,
  onDrawPile,
  onTakeDiscard,
  onPlayerCardClick,
  onDiscard
}) {
  const isPlayerTurn = currentTurn === 'player';
  const topDiscard = discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;
  
  // Count filled positions
  const playerFilled = playerCards.filter(c => c !== null).length;
  const aiFilled = aiCards.filter(c => c !== null).length;

  /**
   * Render a row of 5 card slots
   */
  const renderCardRow = (cards, hidden, startIndex, isPlayer, onCardClick) => {
    return (
      <div style={styles.cardRow}>
        {[0, 1, 2, 3, 4].map(i => {
          const index = startIndex + i;
          const position = index + 1;
          const card = cards[index];
          const hiddenCard = hidden[index];
          const isEmpty = card === null;
          const isClickable = isPlayer && isPlayerTurn && heldCard && isEmpty;
          
          return (
            <div 
              key={index} 
              style={{
                ...styles.cardSlot,
                border: isClickable ? '2px dashed #4ade80' : '2px solid #333',
                cursor: isClickable ? 'pointer' : 'default'
              }}
              onClick={() => isClickable && onCardClick && onCardClick(position)}
            >
              <span style={styles.positionLabel}>{position}</span>
              {card ? (
                <Card card={card} faceUp={true} />
              ) : hiddenCard ? (
                <Card card={hiddenCard} faceUp={false} />
              ) : (
                <div style={styles.emptySlot} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={styles.board}>
      {/* AI Area */}
      <div style={styles.playerArea}>
        <div style={styles.areaHeader}>
          <span style={styles.areaLabel}>
            🤖 AI Opponent
            {currentTurn === 'ai' && <span style={styles.turnIndicator}> (thinking...)</span>}
          </span>
          <span style={styles.cardCount}>{aiFilled}/10 filled</span>
        </div>
        <div style={styles.cardGrid}>
          {renderCardRow(aiCards, aiHidden, 0, false)}
          {renderCardRow(aiCards, aiHidden, 5, false)}
        </div>
      </div>

      {/* Center Area - Draw & Discard Piles */}
      <div style={styles.centerArea}>
        {/* Draw Pile */}
        <div 
          style={{
            ...styles.pile,
            cursor: isPlayerTurn && !heldCard ? 'pointer' : 'default',
            opacity: isPlayerTurn && !heldCard ? 1 : 0.7
          }}
          onClick={() => isPlayerTurn && !heldCard && onDrawPile && onDrawPile()}
        >
          <Card card="back" faceUp={false} />
          <span style={styles.pileLabel}>Draw ({drawPile.length})</span>
        </div>

        {/* Turn Indicator */}
        <div style={styles.turnDisplay}>
          {heldCard ? (
            <div style={styles.heldCardDisplay}>
              <span>Holding:</span>
              <Card card={heldCard} faceUp={true} small />
              {onDiscard && (
                <button onClick={onDiscard} style={styles.discardButton}>
                  Discard
                </button>
              )}
            </div>
          ) : (
            <span style={styles.turnText}>
              {isPlayerTurn ? "Your Turn" : "AI's Turn"}
            </span>
          )}
        </div>

        {/* Discard Pile */}
        <div 
          style={{
            ...styles.pile,
            cursor: isPlayerTurn && !heldCard && topDiscard ? 'pointer' : 'default',
            opacity: isPlayerTurn && !heldCard && topDiscard ? 1 : 0.7
          }}
          onClick={() => isPlayerTurn && !heldCard && topDiscard && onTakeDiscard && onTakeDiscard()}
        >
          {topDiscard ? (
            <Card card={topDiscard} faceUp={true} />
          ) : (
            <div style={styles.emptyPile}>
              <span>Empty</span>
            </div>
          )}
          <span style={styles.pileLabel}>Discard ({discardPile.length})</span>
        </div>
      </div>

      {/* Player Area */}
      <div style={styles.playerArea}>
        <div style={styles.cardGrid}>
          {renderCardRow(playerCards, playerHidden, 0, true, onPlayerCardClick)}
          {renderCardRow(playerCards, playerHidden, 5, true, onPlayerCardClick)}
        </div>
        <div style={styles.areaHeader}>
          <span style={styles.areaLabel}>
            👤 You
            {currentTurn === 'player' && <span style={styles.turnIndicator}> (your turn)</span>}
          </span>
          <span style={styles.cardCount}>{playerFilled}/10 filled</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  board: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '1rem'
  },
  playerArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  areaHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 0.5rem'
  },
  areaLabel: {
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#ddd'
  },
  turnIndicator: {
    color: '#4ade80',
    fontWeight: 'normal',
    fontSize: '0.875rem'
  },
  cardCount: {
    fontSize: '0.875rem',
    color: '#888'
  },
  cardGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  cardRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.5rem'
  },
  cardSlot: {
    position: 'relative',
    width: '68px',
    height: '92px',
    backgroundColor: '#1a1a2e',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  positionLabel: {
    position: 'absolute',
    bottom: '2px',
    right: '4px',
    fontSize: '0.6rem',
    color: '#555',
    fontWeight: 'bold'
  },
  emptySlot: {
    width: '60px',
    height: '84px',
    border: '2px dashed #333',
    borderRadius: '6px'
  },
  centerArea: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1.5rem',
    padding: '1rem',
    backgroundColor: '#0d1a0d',
    borderRadius: '12px',
    margin: '0.5rem 0'
  },
  pile: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem'
  },
  pileLabel: {
    fontSize: '0.75rem',
    color: '#888'
  },
  emptyPile: {
    width: '60px',
    height: '84px',
    border: '2px dashed #444',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#444',
    fontSize: '0.75rem'
  },
  turnDisplay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '100px'
  },
  turnText: {
    fontSize: '0.875rem',
    color: '#4ade80',
    fontWeight: 'bold'
  },
  heldCardDisplay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.75rem',
    color: '#aaa'
  },
  discardButton: {
    padding: '0.25rem 0.5rem',
    fontSize: '0.7rem',
    backgroundColor: '#666',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '0.25rem'
  }
};

export default GameBoard;
