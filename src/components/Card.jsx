/**
 * Card.jsx - Playing Card Component
 * 
 * Renders a playing card face-up or face-down.
 * Red for hearts/diamonds, black for spades/clubs.
 * 
 * Usage:
 *   <Card card="A♠" faceUp={true} />
 *   <Card card="7♥" faceUp={false} onClick={() => {}} />
 */

import React from 'react';

function Card({ card, faceUp = false, onClick, small = false }) {
  // Parse card string (e.g., "A♠" → rank="A", suit="♠")
  const suit = card ? card.slice(-1) : '';
  const rank = card ? card.slice(0, -1) : '';
  
  // Determine color based on suit
  const isRed = suit === '♥' || suit === '♦';
  const color = isRed ? '#dc2626' : '#1a1a1a';
  
  // Size based on small prop
  const width = small ? 45 : 60;
  const height = small ? 63 : 84;
  const fontSize = small ? '0.7rem' : '0.9rem';
  const suitSize = small ? '1.2rem' : '1.5rem';

  // Card back (face down)
  if (!faceUp || !card) {
    return (
      <div 
        onClick={onClick}
        style={{
          ...styles.card,
          width,
          height,
          backgroundColor: '#1e3a5f',
          backgroundImage: 'repeating-linear-gradient(45deg, #1e3a5f, #1e3a5f 5px, #2d4a6f 5px, #2d4a6f 10px)',
          cursor: onClick ? 'pointer' : 'default'
        }}
      >
        <div style={styles.backDesign}>🂠</div>
      </div>
    );
  }

  // Card face (face up)
  return (
    <div 
      onClick={onClick}
      style={{
        ...styles.card,
        width,
        height,
        backgroundColor: '#fff',
        color,
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      {/* Top-left corner */}
      <div style={{ ...styles.corner, ...styles.topLeft, fontSize }}>
        <div>{rank}</div>
        <div>{suit}</div>
      </div>
      
      {/* Center suit */}
      <div style={{ ...styles.center, fontSize: suitSize }}>
        {suit}
      </div>
      
      {/* Bottom-right corner (upside down) */}
      <div style={{ ...styles.corner, ...styles.bottomRight, fontSize, transform: 'rotate(180deg)' }}>
        <div>{rank}</div>
        <div>{suit}</div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    position: 'relative',
    borderRadius: '6px',
    border: '1px solid #333',
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Georgia, serif',
    userSelect: 'none'
  },
  corner: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    lineHeight: 1
  },
  topLeft: {
    top: '3px',
    left: '4px'
  },
  bottomRight: {
    bottom: '3px',
    right: '4px'
  },
  center: {
    fontWeight: 'bold'
  },
  backDesign: {
    fontSize: '2rem',
    opacity: 0.3
  }
};

export default Card;
