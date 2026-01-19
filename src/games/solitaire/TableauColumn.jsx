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

  // Responsive card sizing for mobile/landscape
  const isLandscape = typeof window !== 'undefined' && window.innerHeight < window.innerWidth;
  const cardWidth = isLandscape ? 'clamp(45px, 7vmin, 60px)' : '60px';
  const cardHeight = isLandscape ? 'clamp(63px, 10vmin, 84px)' : '84px';
  const cardSpacing = isLandscape ? 'clamp(12px, 2.5vmin, 18px)' : '18px';
  const minColumnHeight = isLandscape ? 'clamp(180px, 35vmin, 260px)' : '260px';

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
              ? '2px solid rgba(255, 215, 0, 0.7)'
              : '2px dashed rgba(255,255,255,0.3)',
            borderRadius: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isValidDropTarget ? 'rgba(255, 215, 0, 0.9)' : 'rgba(255,255,255,0.3)',
            fontSize: '20px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: isValidDropTarget ? '0 0 10px 2px rgba(255, 215, 0, 0.5)' : 'none'
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
              ? '0 0 12px 2px rgba(255, 215, 0, 0.7)'
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
                backgroundColor: '#fff',
                borderRadius: '5px',
                border: '1px solid #ccc',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '3px',
                boxSizing: 'border-box',
                color: isRedSuit(card.suit) ? '#d32f2f' : '#1a1a1a'
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
                backgroundColor: '#1a5f7a',
                borderRadius: '5px',
                border: '2px solid #fff',
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.1) 5px, rgba(255,255,255,0.1) 10px)'
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
