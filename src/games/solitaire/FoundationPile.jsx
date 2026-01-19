/**
 * FoundationPile Component
 * 
 * Renders a single foundation pile where cards build from Ace to King.
 * Shows suit symbol when empty, top card when filled.
 */

import React from 'react';

const SUIT_SYMBOLS = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠'
};

const isRedSuit = (suit) => suit === 'hearts' || suit === 'diamonds';

export default function FoundationPile({
  cards,
  suit,
  onDrop,
  isValidDropTarget
}) {
  const isEmpty = cards.length === 0;
  const isComplete = cards.length === 13;
  const topCard = cards[cards.length - 1];
  const suitColor = isRedSuit(suit) ? '#d32f2f' : '#1a1a1a';

  // Responsive sizing for landscape mode
  const isLandscape = typeof window !== 'undefined' && window.innerHeight < window.innerWidth;
  const cardWidth = isLandscape ? 'clamp(45px, 7vmin, 60px)' : '60px';
  const cardHeight = isLandscape ? 'clamp(63px, 10vmin, 84px)' : '84px';

  const handleClick = () => {
    if (isValidDropTarget) {
      onDrop(suit);
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        width: cardWidth,
        height: cardHeight,
        borderRadius: '5px',
        margin: '0 2px',
        cursor: isValidDropTarget ? 'pointer' : 'default',
        position: 'relative',
        boxShadow: isValidDropTarget
          ? '0 0 12px 2px rgba(255, 215, 0, 0.7)'
          : isComplete
          ? '0 0 10px 2px rgba(76, 175, 80, 0.6)'
          : 'none',
        transition: 'box-shadow 0.2s'
      }}
    >
      {isEmpty ? (
        <div
          style={{
            width: '100%',
            height: '100%',
            border: '2px dashed rgba(255,255,255,0.3)',
            borderRadius: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.05)'
          }}
        >
          <span style={{ fontSize: '28px', color: isRedSuit(suit) ? 'rgba(211,47,47,0.4)' : 'rgba(255,255,255,0.3)' }}>
            {SUIT_SYMBOLS[suit]}
          </span>
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: isComplete ? '#e8f5e9' : '#fff',
            borderRadius: '5px',
            border: isComplete ? '2px solid #4caf50' : '1px solid #ccc',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '3px',
            boxSizing: 'border-box',
            color: suitColor
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 'bold', lineHeight: 1 }}>
            {topCard.rank}
            <span style={{ fontSize: '10px', marginLeft: '1px' }}>{SUIT_SYMBOLS[suit]}</span>
          </div>
          <div style={{ fontSize: '20px', textAlign: 'center' }}>{SUIT_SYMBOLS[suit]}</div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', lineHeight: 1, alignSelf: 'flex-end', transform: 'rotate(180deg)' }}>
            {topCard.rank}
            <span style={{ fontSize: '10px', marginLeft: '1px' }}>{SUIT_SYMBOLS[suit]}</span>
          </div>
        </div>
      )}

      {!isEmpty && (
        <div
          style={{
            position: 'absolute',
            bottom: '-16px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '9px',
            color: isComplete ? '#4caf50' : 'rgba(255,255,255,0.6)',
            fontWeight: isComplete ? 'bold' : 'normal'
          }}
        >
          {cards.length}/13
        </div>
      )}
    </div>
  );
}
