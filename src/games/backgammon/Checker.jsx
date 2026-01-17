/**
 * Checker Component
 * 
 * Circular checker piece with 3D gradient effect.
 * Supports stacking display and selection highlighting.
 */

import React from 'react';

const Checker = ({ 
  color, 
  count = 1, 
  isSelected = false, 
  canSelect = false, 
  onSelect,
  style = {}
}) => {
  // Color definitions
  const colors = {
    white: {
      main: '#f0f0f0',
      light: '#ffffff',
      dark: '#c0c0c0',
      border: '#a0a0a0'
    },
    black: {
      main: '#2a2a2a',
      light: '#4a4a4a',
      dark: '#1a1a1a',
      border: '#000000'
    }
  };

  const c = colors[color] || colors.white;

  // Base checker style with 3D gradient
  const checkerStyle = {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: `radial-gradient(circle at 30% 30%, ${c.light}, ${c.main} 50%, ${c.dark} 100%)`,
    border: `2px solid ${c.border}`,
    boxShadow: isSelected 
      ? `0 0 12px 4px #ffd700, 0 4px 8px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.3)`
      : `0 4px 8px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,${color === 'white' ? '0.5' : '0.2'})`,
    cursor: canSelect ? 'pointer' : 'default',
    transition: 'box-shadow 0.2s ease, transform 0.1s ease',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
    ...style
  };

  // Hover effect for selectable checkers
  const handleMouseEnter = (e) => {
    if (canSelect) {
      e.currentTarget.style.transform = 'scale(1.05)';
    }
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.transform = 'scale(1)';
  };

  // Count badge for stacks > 5
  const countBadgeStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '16px',
    fontWeight: 'bold',
    color: color === 'white' ? '#333' : '#fff',
    textShadow: color === 'white' 
      ? '0 1px 2px rgba(0,0,0,0.3)' 
      : '0 1px 2px rgba(0,0,0,0.5)',
    pointerEvents: 'none'
  };

  // For stacks, render multiple overlapping checkers
  if (count > 1 && count <= 5) {
    const stackStyle = {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      ...style
    };

    return (
      <div style={stackStyle}>
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            onClick={index === count - 1 && canSelect ? onSelect : undefined}
            onMouseEnter={index === count - 1 ? handleMouseEnter : undefined}
            onMouseLeave={index === count - 1 ? handleMouseLeave : undefined}
            style={{
              ...checkerStyle,
              position: index === 0 ? 'relative' : 'absolute',
              top: index === 0 ? 0 : `${index * -8}px`,
              zIndex: index,
              boxShadow: index === count - 1 && isSelected
                ? `0 0 12px 4px #ffd700, 0 4px 8px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.3)`
                : `0 ${2 + index}px ${4 + index * 2}px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,${color === 'white' ? '0.5' : '0.2'})`,
              cursor: index === count - 1 && canSelect ? 'pointer' : 'default'
            }}
          />
        ))}
      </div>
    );
  }

  // Single checker or stack > 5 (show count)
  return (
    <div
      onClick={canSelect ? onSelect : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={checkerStyle}
    >
      {count > 5 && (
        <span style={countBadgeStyle}>{count}</span>
      )}
    </div>
  );
};

export default Checker;
