/**
 * DiceArea Component for Yahtzee
 * Displays 5 dice with roll button and hold controls
 */

import React from 'react';
import PropTypes from 'prop-types';
import Die from './Die';

function DiceArea({ dice, rollsRemaining, onRoll, onToggleHold, disabled = false, isLoading = false }) {
  const canRoll = rollsRemaining > 0 && !disabled && !isLoading;
  const hasRolled = rollsRemaining < 3;

  const getButtonText = () => {
    if (isLoading) return 'Rolling...';
    if (rollsRemaining === 3) return 'Roll Dice';
    if (rollsRemaining > 0) return 'Roll Again';
    return 'Select a Category';
  };

  const getButtonStyle = () => {
    const base = {
      padding: '14px 32px',
      fontSize: '18px',
      fontWeight: 'bold',
      border: 'none',
      borderRadius: '8px',
      cursor: canRoll ? 'pointer' : 'default',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      minWidth: '180px'
    };

    if (isLoading) {
      return { ...base, backgroundColor: '#78909c', color: '#fff' };
    }
    if (rollsRemaining === 3) {
      return { ...base, backgroundColor: '#4caf50', color: '#fff' };
    }
    if (rollsRemaining > 0) {
      return { ...base, backgroundColor: '#1976d2', color: '#fff' };
    }
    return { ...base, backgroundColor: '#bdbdbd', color: '#666' };
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    padding: '20px',
    backgroundColor: '#f5f5f5',
    borderRadius: '12px',
    border: '2px solid #ddd'
  };

  const diceRowStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '16px',
    padding: '10px 0 25px 0'
  };

  const rollInfoStyle = {
    fontSize: '16px',
    color: rollsRemaining > 0 ? '#333' : '#999',
    fontWeight: '500'
  };

  const instructionStyle = {
    fontSize: '14px',
    color: '#666',
    fontStyle: 'italic',
    marginTop: '-10px'
  };

  const spinnerStyle = {
    width: '18px',
    height: '18px',
    border: '3px solid rgba(255,255,255,0.3)',
    borderTop: '3px solid #fff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  };

  return (
    <div style={containerStyle}>
      {/* Spinner keyframes injected via style tag */}
      <style>
        {`@keyframes spin { to { transform: rotate(360deg); } }`}
      </style>

      {/* Dice row */}
      <div style={diceRowStyle}>
        {dice.map((die, index) => (
          <Die
            key={die.id}
            value={die.value}
            isHeld={die.isHeld}
            onClick={() => onToggleHold(index)}
            disabled={disabled || !hasRolled || isLoading}
          />
        ))}
      </div>

      {/* Instructions */}
      {hasRolled && rollsRemaining > 0 && !disabled && (
        <div style={instructionStyle}>
          Click dice to hold them between rolls
        </div>
      )}

      {/* Roll button */}
      <button
        style={getButtonStyle()}
        onClick={onRoll}
        disabled={!canRoll}
        aria-label={getButtonText()}
      >
        {isLoading && <div style={spinnerStyle} />}
        {getButtonText()}
      </button>

      {/* Rolls remaining */}
      <div style={rollInfoStyle}>
        {rollsRemaining > 0 ? (
          <>
            Rolls Remaining: <strong>{rollsRemaining}</strong>
          </>
        ) : (
          'No rolls remaining — choose a category'
        )}
      </div>
    </div>
  );
}

DiceArea.propTypes = {
  dice: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      value: PropTypes.number.isRequired,
      isHeld: PropTypes.bool.isRequired
    })
  ).isRequired,
  rollsRemaining: PropTypes.number.isRequired,
  onRoll: PropTypes.func.isRequired,
  onToggleHold: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  isLoading: PropTypes.bool
};

export default DiceArea;
