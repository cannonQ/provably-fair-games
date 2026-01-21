/**
 * TableauColumn Component
 * 
 * Renders a single tableau column with vertically stacked, overlapping cards.
 * Handles card selection and drop target highlighting.
 */

import React from 'react';

// Suit symbols and colors
const SUIT_SYMBOLS = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠'
};

const isRedSuit = (suit) => suit === 'hearts' || suit === 'diamonds';

export default function TableauColumn({
  cards,
  columnIndex,
  onCardClick,
  selectedCards,
  isValidDropTarget
}) {
  const isEmpty = cards.length === 0;

  // Responsive card sizing - larger for desktop, smaller for mobile
  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 768;
  const cardWidth = isSmallScreen ? 'clamp(45px, 7vmin, 60px)' : '75px';
  const cardHeight = isSmallScreen ? 'clamp(63px, 10vmin, 84px)' : '105px';
  const cardSpacing = isSmallScreen ? 'clamp(12px, 2.5vmin, 18px)' : '22px';
  const minColumnHeight = isSmallScreen ? 'clamp(180px, 35vmin, 260px)' : '320px';

  // Check if a card is part of current selection
  const isSelected = (cardIndex) => {
    if (!selectedCards) return false;
    const { source, cards: selCards } = selectedCards;
    if (source.type !== 'tableau' || source.index !== columnIndex) return false;
    const selectionStartIndex = cards.length - selCards.length;
    return cardIndex >= selectionStartIndex;
  };

  const handleClick = (cardIndex) => {
    const card = cards[cardIndex];
    if (!card.faceUp) return;
    onCardClick(cardIndex, columnIndex);
  };

  const handleEmptyClick = () => {
    onCardClick(-1, columnIndex);
  };

  return (
    <div
      style={{
        position: 'relative',
        width: cardWidth,
        minHeight: minColumnHeight,
        margin: '0 2px',
        flexShrink: 0
      }}
    >
      {/* Empty column placeholder */}
      {isEmpty && (
        <div
          onClick={handleEmptyClick}
          style={{
            width: cardWidth,
            height: cardHeight,
            border: isValidDropTarget
              ? '2px solid #22c55e' // Cypherpunk: green for valid drop
              : '2px dashed #334155', // Cypherpunk: slate-700 dashed border
            borderRadius: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isValidDropTarget ? '#22c55e' : '#94a3b8', // Green or muted
            fontSize: '20px',
            fontWeight: 'bold',
            cursor: 'pointer',
            backgroundColor: '#1e293b', // Lighter slate background
            boxShadow: isValidDropTarget ? '0 0 12px rgba(34, 197, 94, 0.4)' : 'none' // Green glow
          }}
        >
          K
        </div>
      )}

      {/* Stacked cards */}
      {cards.map((card, index) => (
        <div
          key={card.id}
          onClick={() => handleClick(index)}
          style={{
            position: 'absolute',
            top: `calc(${index} * ${cardSpacing})`,
            width: cardWidth,
            height: cardHeight,
            borderRadius: '5px',
            cursor: card.faceUp ? 'pointer' : 'default',
            transform: isSelected(index) ? 'translateX(4px)' : 'none',
            boxShadow: isSelected(index)
              ? '0 0 20px rgba(139, 92, 246, 0.6)' // Cypherpunk: violet glow when selected
              : '0 1px 3px rgba(0,0,0,0.3)',
            transition: 'transform 0.15s, box-shadow 0.15s',
            zIndex: index
          }}
        >
          {card.faceUp ? (
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#f8fafc', // Cypherpunk: off-white slate-50
                borderRadius: '5px',
                border: '1px solid #cbd5e1', // Cypherpunk: slate-300
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '3px',
                boxSizing: 'border-box',
                color: isRedSuit(card.suit) ? '#dc2626' : '#0f172a' // Cypherpunk: red-600 / slate-900
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 'bold', lineHeight: 1 }}>
                {card.rank}
                <span style={{ fontSize: '10px', marginLeft: '1px' }}>{SUIT_SYMBOLS[card.suit]}</span>
              </div>
              <div style={{ fontSize: '20px', textAlign: 'center' }}>{SUIT_SYMBOLS[card.suit]}</div>
              <div style={{ fontSize: '11px', fontWeight: 'bold', lineHeight: 1, alignSelf: 'flex-end', transform: 'rotate(180deg)' }}>
                {card.rank}
                <span style={{ fontSize: '10px', marginLeft: '1px' }}>{SUIT_SYMBOLS[card.suit]}</span>
              </div>
            </div>
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#1e3a8a', // Cypherpunk: blue-900
                borderRadius: '5px',
                border: '2px solid #3b82f6', // Cypherpunk: blue-500
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(59, 130, 246, 0.15) 5px, rgba(59, 130, 246, 0.15) 10px)' // Blue pattern
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
