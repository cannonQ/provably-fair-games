/**
 * Dice Component
 * 
 * Displays dice with pips, handles rolling animation,
 * and shows blockchain fetching state.
 */

import React from 'react';

// Pip positions for each die face (relative to 60px die)
const pipPositions = {
  1: [[30, 30]],
  2: [[15, 15], [45, 45]],
  3: [[15, 15], [30, 30], [45, 45]],
  4: [[15, 15], [45, 15], [15, 45], [45, 45]],
  5: [[15, 15], [45, 15], [30, 30], [15, 45], [45, 45]],
  6: [[15, 15], [45, 15], [15, 30], [45, 30], [15, 45], [45, 45]]
};

const SingleDie = ({ value, isUsed, isRolling }) => {
  const dieStyle = {
    width: '60px',
    height: '60px',
    backgroundColor: isUsed ? '#9e9e9e' : '#ffffff',
    borderRadius: '10px',
    border: '2px solid #333',
    position: 'relative',
    boxShadow: isUsed 
      ? 'inset 0 2px 4px rgba(0,0,0,0.2)' 
      : '0 4px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)',
    transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
    animation: isRolling ? 'dieRoll 0.15s infinite linear' : 'none',
    opacity: isUsed ? 0.6 : 1
  };

  const pipStyle = (x, y) => ({
    position: 'absolute',
    width: '12px',
    height: '12px',
    backgroundColor: isUsed ? '#666' : '#1a1a1a',
    borderRadius: '50%',
    left: `${x - 6}px`,
    top: `${y - 6}px`,
    boxShadow: isUsed ? 'none' : 'inset 0 -2px 2px rgba(0,0,0,0.3)'
  });

  const displayValue = isRolling ? Math.ceil(Math.random() * 6) : value;
  const pips = pipPositions[displayValue] || [];

  return (
    <div style={dieStyle}>
      {pips.map((pos, i) => (
        <div key={i} style={pipStyle(pos[0], pos[1])} />
      ))}
    </div>
  );
};

const Dice = ({
  dice,
  diceUsed = [],
  isDoubles = false,
  isRolling = false,
  canRoll = false,
  onRoll
}) => {
  // Container for dice
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px'
  };

  // Dice grid style
  const diceGridStyle = {
    display: 'grid',
    gridTemplateColumns: isDoubles ? 'repeat(2, 60px)' : 'repeat(2, 60px)',
    gridTemplateRows: isDoubles ? 'repeat(2, 60px)' : '60px',
    gap: '10px',
    padding: '15px',
    backgroundColor: '#2d5016',
    borderRadius: '12px',
    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)'
  };

  // Roll button style
  const buttonStyle = {
    padding: '12px 32px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: canRoll ? '#1976D2' : '#666',
    border: 'none',
    borderRadius: '8px',
    cursor: canRoll ? 'pointer' : 'not-allowed',
    boxShadow: canRoll ? '0 4px 12px rgba(25, 118, 210, 0.4)' : 'none',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    opacity: canRoll ? 1 : 0.7
  };

  // Spinner for loading state
  const spinnerStyle = {
    width: '16px',
    height: '16px',
    border: '2px solid #fff',
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  };

  // Keyframes injection
  const keyframes = `
    @keyframes dieRoll {
      0% { transform: rotate(0deg) scale(1); }
      25% { transform: rotate(90deg) scale(1.05); }
      50% { transform: rotate(180deg) scale(1); }
      75% { transform: rotate(270deg) scale(1.05); }
      100% { transform: rotate(360deg) scale(1); }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;

  // Render dice based on state
  const renderDice = () => {
    if (!dice || dice.length === 0) {
      // Show placeholder dice
      return (
        <>
          <div style={{ ...placeholderDieStyle }} />
          <div style={{ ...placeholderDieStyle }} />
        </>
      );
    }

    return dice.map((value, index) => (
      <SingleDie
        key={index}
        value={value}
        isUsed={diceUsed[index] || false}
        isRolling={isRolling}
      />
    ));
  };

  const placeholderDieStyle = {
    width: '60px',
    height: '60px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: '10px',
    border: '2px dashed rgba(255,255,255,0.4)'
  };

  // Status text
  const getStatusText = () => {
    if (isRolling) return 'Rolling...';
    if (!dice) return 'Click to roll';
    
    const remaining = diceUsed.filter(u => !u).length;
    if (remaining === 0) return 'All dice used';
    return `${remaining} move${remaining > 1 ? 's' : ''} remaining`;
  };

  const statusStyle = {
    fontSize: '13px',
    color: '#ccc',
    marginTop: '5px',
    fontStyle: 'italic'
  };

  return (
    <div style={containerStyle}>
      <style>{keyframes}</style>
      
      {/* Dice display */}
      <div style={diceGridStyle}>
        {renderDice()}
      </div>

      {/* Status text */}
      <div style={statusStyle}>
        {getStatusText()}
      </div>

      {/* Roll button */}
      {canRoll && (
        <button
          style={buttonStyle}
          onClick={onRoll}
          disabled={!canRoll || isRolling}
          onMouseEnter={(e) => {
            if (canRoll) e.target.style.backgroundColor = '#1565C0';
          }}
          onMouseLeave={(e) => {
            if (canRoll) e.target.style.backgroundColor = '#1976D2';
          }}
        >
          {isRolling && <div style={spinnerStyle} />}
          {isRolling ? 'Fetching blockchain...' : '🎲 Roll Dice'}
        </button>
      )}
    </div>
  );
};

export default Dice;
