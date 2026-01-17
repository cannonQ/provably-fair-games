/**
 * Hand Component - Displays a single blackjack hand (player or dealer)
 * Uses CSS classes from blackjack.css
 */

import React from 'react';
import { formatHandValue } from './gameLogic';

const SUIT_SYMBOLS = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
const RESULT_TEXT = { blackjack: 'BLACKJACK!', win: 'WIN', lose: 'LOSE', push: 'PUSH' };

function Card({ card, index }) {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  
  if (!card.faceUp) {
    return (
      <div className="card-wrapper" style={{ marginLeft: index > 0 ? '8px' : '0' }}>
        <div className="card card-back" />
      </div>
    );
  }

  return (
    <div className="card-wrapper" style={{ marginLeft: index > 0 ? '8px' : '0' }}>
      <div className={`card card-face ${isRed ? 'red' : 'black'}`}>
        <span className="card-rank">{card.rank}</span>
        <span className="card-suit">{SUIT_SYMBOLS[card.suit]}</span>
      </div>
    </div>
  );
}

export default function Hand({ 
  cards = [], 
  isDealer = false, 
  isActive = false, 
  result = null, 
  label = '', 
  showValue = true 
}) {
  const getDisplayValue = () => {
    if (cards.length === 0) return '';
    
    if (isDealer && cards.length >= 2 && !cards[1].faceUp) {
      const visibleCard = cards[0];
      const value = visibleCard.rank === 'A' ? 11 : 
                    ['J', 'Q', 'K'].includes(visibleCard.rank) ? 10 : 
                    parseInt(visibleCard.rank, 10);
      return `${value} + ?`;
    }
    
    return formatHandValue(cards);
  };

  return (
    <div className={`hand ${isActive ? 'active' : ''}`}>
      <div className="hand-label">{label}</div>
      
      <div className="cards-container">
        {cards.map((card, index) => (
          <Card key={card.id} card={card} index={index} />
        ))}
        {cards.length === 0 && <div className="empty-hand" />}
      </div>
      
      {showValue && cards.length > 0 && (
        <div className="hand-value">{getDisplayValue()}</div>
      )}
      
      {result && (
        <div className={`result-badge ${result}`}>
          {RESULT_TEXT[result] || result.toUpperCase()}
        </div>
      )}
    </div>
  );
}
