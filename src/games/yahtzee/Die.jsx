/**
 * Die Component for Yahtzee
 * Displays a single die with pip pattern and hold state
 */

import React from 'react';
import PropTypes from 'prop-types';

/**
 * Pip positions for each die value (1-6)
 * Grid positions: top-left, top-right, mid-left, center, mid-right, bot-left, bot-right
 */
const PIP_PATTERNS = {
  1: ['center'],
  2: ['topRight', 'botLeft'],
  3: ['topRight', 'center', 'botLeft'],
  4: ['topLeft', 'topRight', 'botLeft', 'botRight'],
  5: ['topLeft', 'topRight', 'center', 'botLeft', 'botRight'],
  6: ['topLeft', 'midLeft', 'botLeft', 'topRight', 'midRight', 'botRight']
};

/**
 * Pip position coordinates (percentage-based)
 */
const PIP_POSITIONS = {
  topLeft: { top: '18%', left: '18%' },
  topRight: { top: '18%', right: '18%' },
  midLeft: { top: '50%', left: '18%', transform: 'translateY(-50%)' },
  center: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
  midRight: { top: '50%', right: '18%', transform: 'translateY(-50%)' },
  botLeft: { bottom: '18%', left: '18%' },
  botRight: { bottom: '18%', right: '18%' }
};

function Die({ value, isHeld = false, onClick = null, disabled = false }) {
  const pips = PIP_PATTERNS[value] || [];

  const dieStyle = {
    width: '60px',
    height: '60px',
    backgroundColor: isHeld ? '#e3f2fd' : '#ffffff',
    border: isHeld ? '3px solid #1976d2' : '2px solid #333',
    borderRadius: '10px',
    position: 'relative',
    cursor: disabled ? 'default' : 'pointer',
    boxShadow: disabled 
      ? '1px 1px 2px rgba(0,0,0,0.1)' 
      : '2px 3px 6px rgba(0,0,0,0.2)',
    transition: 'all 0.15s ease-in-out',
    opacity: disabled ? 0.5 : 1,
    transform: 'scale(1)',
    userSelect: 'none'
  };

  const pipStyle = {
    width: '10px',
    height: '10px',
    backgroundColor: '#333',
    borderRadius: '50%',
    position: 'absolute'
  };

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const handleMouseEnter = (e) => {
    if (!disabled) {
      e.currentTarget.style.transform = 'scale(1.08)';
      e.currentTarget.style.boxShadow = '3px 4px 8px rgba(0,0,0,0.25)';
    }
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.boxShadow = disabled 
      ? '1px 1px 2px rgba(0,0,0,0.1)' 
      : '2px 3px 6px rgba(0,0,0,0.2)';
  };

  return (
    <div
      style={dieStyle}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      aria-label={`Die showing ${value}${isHeld ? ', held' : ''}`}
      aria-pressed={isHeld}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {pips.map((position, index) => (
        <div
          key={index}
          style={{
            ...pipStyle,
            ...PIP_POSITIONS[position]
          }}
        />
      ))}
      {isHeld && (
        <div
          style={{
            position: 'absolute',
            bottom: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '10px',
            fontWeight: 'bold',
            color: '#1976d2',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          HOLD
        </div>
      )}
    </div>
  );
}

Die.propTypes = {
  value: PropTypes.oneOf([1, 2, 3, 4, 5, 6]).isRequired,
  isHeld: PropTypes.bool,
  onClick: PropTypes.func,
  disabled: PropTypes.bool
};

export default Die;
