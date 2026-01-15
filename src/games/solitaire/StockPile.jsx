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

  return (
    <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
      {/* Stock Pile */}
      <div
        onClick={handleStockClick}
        style={{
          width: '60px',
          height: '84px',
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
              backgroundColor: '#1a5f7a',
              borderRadius: '5px',
              border: '2px solid #fff',
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.1) 5px, rgba(255,255,255,0.1) 10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
              {stock.length}
            </span>
          </div>
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              border: '2px dashed rgba(255,255,255,0.3)',
              borderRadius: '5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              color: waste.length > 0 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)'
            }}
          >
            {waste.length > 0 ? '↻' : '∅'}
          </div>
        )}
      </div>

      {/* Waste Pile */}
      <div style={{ position: 'relative', width: '90px', height: '84px' }}>
        {visibleWaste.map((card, i) => {
          const isTopCard = i === visibleWaste.length - 1;
          const isSelected = isTopCard && isWasteSelected;

          return (
            <div
              key={card.id}
              onClick={isTopCard ? onWasteCardClick : undefined}
              style={{
                position: 'absolute',
                left: `${i * 12}px`,
                width: '60px',
                height: '84px',
                backgroundColor: '#fff',
                borderRadius: '5px',
                border: '1px solid #ccc',
                cursor: isTopCard ? 'pointer' : 'default',
                boxShadow: isSelected
                  ? '0 0 12px 2px rgba(255, 215, 0, 0.7)'
                  : '0 1px 3px rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '3px',
                boxSizing: 'border-box',
                color: isRedSuit(card.suit) ? '#d32f2f' : '#1a1a1a',
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
