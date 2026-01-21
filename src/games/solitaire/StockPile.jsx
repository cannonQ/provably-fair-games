/**
 * StockPile Component
 * 
 * Renders stock pile (draw pile) and waste pile side by side.
 * Handles drawing cards and recycling waste back to stock.
 */

import React from 'react';

const SUIT_SYMBOLS = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠'
};

const isRedSuit = (suit) => suit === 'hearts' || suit === 'diamonds';

export default function StockPile({
  stock,
  waste,
  onDrawClick,
  onRecycleClick,
  onWasteCardClick,
  selectedCards
}) {
  const handleStockClick = () => {
    if (stock.length > 0) {
      onDrawClick();
    } else if (waste.length > 0) {
      onRecycleClick();
    }
  };

  const isWasteSelected = selectedCards?.source?.type === 'waste';
  const visibleWaste = waste.slice(-3);

  // Responsive sizing - larger for desktop, smaller for mobile
  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 768;
  const cardWidth = isSmallScreen ? 'clamp(45px, 7vmin, 60px)' : '75px';
  const cardHeight = isSmallScreen ? 'clamp(63px, 10vmin, 84px)' : '105px';

  return (
    <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
      {/* Stock Pile */}
      <div
        onClick={handleStockClick}
        style={{
          width: cardWidth,
          height: cardHeight,
          borderRadius: '5px',
          cursor: stock.length > 0 || waste.length > 0 ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {stock.length > 0 ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#1e3a8a', // Cypherpunk: blue-900
              borderRadius: '5px',
              border: '2px solid #3b82f6', // Cypherpunk: blue-500
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(59, 130, 246, 0.15) 5px, rgba(59, 130, 246, 0.15) 10px)', // Blue pattern
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span style={{ color: '#f1f5f9', fontSize: '16px', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
              {stock.length}
            </span>
          </div>
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              border: '2px dashed #334155', // Cypherpunk: slate-700
              borderRadius: '5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              backgroundColor: '#1e293b', // Cypherpunk: lighter slate background
              color: waste.length > 0 ? '#94a3b8' : '#64748b' // Cypherpunk: slate-400 / slate-500
            }}
          >
            {waste.length > 0 ? '↻' : '∅'}
          </div>
        )}
      </div>

      {/* Waste Pile */}
      <div style={{ position: 'relative', width: 'calc(1.5 * ' + cardWidth + ')', height: cardHeight }}>
        {visibleWaste.map((card, i) => {
          const isTopCard = i === visibleWaste.length - 1;
          const isSelected = isTopCard && isWasteSelected;

          return (
            <div
              key={card.id}
              onClick={isTopCard ? onWasteCardClick : undefined}
              style={{
                position: 'absolute',
                left: `calc(${i} * ${isSmallScreen ? '0.2 * ' + cardWidth : '15px'})`,
                width: cardWidth,
                height: cardHeight,
                backgroundColor: '#f8fafc', // Cypherpunk: off-white slate-50
                borderRadius: '5px',
                border: '1px solid #cbd5e1', // Cypherpunk: slate-300
                cursor: isTopCard ? 'pointer' : 'default',
                boxShadow: isSelected
                  ? '0 0 20px rgba(139, 92, 246, 0.6)' // Cypherpunk: violet glow when selected
                  : '0 1px 3px rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '3px',
                boxSizing: 'border-box',
                color: isRedSuit(card.suit) ? '#dc2626' : '#0f172a', // Cypherpunk: red-600 / slate-900
                zIndex: i,
                transition: 'box-shadow 0.15s'
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
          );
        })}
      </div>
    </div>
  );
}
