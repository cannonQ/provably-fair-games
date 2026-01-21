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
  const suitColor = isRedSuit(suit) ? '#dc2626' : '#0f172a'; // Cypherpunk: red-600 / slate-900

  // Responsive sizing - larger for desktop, smaller for mobile
  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 768;
  const cardWidth = isSmallScreen ? 'clamp(45px, 7vmin, 60px)' : '75px';
  const cardHeight = isSmallScreen ? 'clamp(63px, 10vmin, 84px)' : '105px';

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
          ? '0 0 12px rgba(34, 197, 94, 0.4)' // Cypherpunk: green glow for valid drop
          : isComplete
          ? '0 0 10px rgba(34, 197, 94, 0.6)' // Cypherpunk: green glow when complete
          : 'none',
        transition: 'box-shadow 0.2s'
      }}
    >
      {isEmpty ? (
        <div
          style={{
            width: '100%',
            height: '100%',
            border: '2px dashed #334155', // Cypherpunk: slate-700 dashed
            borderRadius: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1e293b' // Cypherpunk: lighter slate background
          }}
        >
          <span style={{ fontSize: '28px', color: isRedSuit(suit) ? 'rgba(220, 38, 38, 0.4)' : '#94a3b8' }}>
            {SUIT_SYMBOLS[suit]}
          </span>
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: isComplete ? '#f0fdf4' : '#f8fafc', // Cypherpunk: green-50 / slate-50
            borderRadius: '5px',
            border: isComplete ? '2px solid #22c55e' : '1px solid #cbd5e1', // Cypherpunk: green-500 / slate-300
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
            color: isComplete ? '#22c55e' : '#94a3b8', // Cypherpunk: green-500 / slate-400
            fontWeight: isComplete ? 'bold' : 'normal'
          }}
        >
          {cards.length}/13
        </div>
      )}
    </div>
  );
}
