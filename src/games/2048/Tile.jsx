/**
 * 2048 Tile Component - Single tile with colors and animations
 * @module Tile
 */

import React from 'react';

/**
 * Color scheme for tile values (background, text)
 */
const TILE_COLORS = {
  0: { bg: 'transparent', text: 'transparent' },
  2: { bg: '#eee4da', text: '#776e65' },
  4: { bg: '#ede0c8', text: '#776e65' },
  8: { bg: '#f2b179', text: '#f9f6f2' },
  16: { bg: '#f59563', text: '#f9f6f2' },
  32: { bg: '#f67c5f', text: '#f9f6f2' },
  64: { bg: '#f65e3b', text: '#f9f6f2' },
  128: { bg: '#edcf72', text: '#f9f6f2' },
  256: { bg: '#edcc61', text: '#f9f6f2' },
  512: { bg: '#edc850', text: '#f9f6f2' },
  1024: { bg: '#edc53f', text: '#f9f6f2' },
  2048: { bg: '#edc22e', text: '#f9f6f2' }
};

/**
 * Get colors for a tile value
 * @param {number} value - Tile value
 * @returns {{bg: string, text: string}} Color scheme
 */
const getColors = (value) => {
  if (TILE_COLORS[value]) return TILE_COLORS[value];
  if (value > 2048) return { bg: '#3c3a32', text: '#f9f6f2' };
  return TILE_COLORS[0];
};

/**
 * Get font size based on value length (responsive for mobile)
 * Uses clamp() to scale between min and max sizes based on viewport
 * @param {number} value - Tile value
 * @returns {string} Font size
 */
const getFontSize = (value) => {
  if (value === 0) return '0px';
  const digits = value.toString().length;

  // Use clamp() for responsive scaling: clamp(min, preferred, max)
  // Scales with viewport while maintaining readability
  if (digits <= 2) return 'clamp(1.5rem, 5vmin, 2rem)';
  if (digits === 3) return 'clamp(1.25rem, 4.5vmin, 1.75rem)';
  if (digits === 4) return 'clamp(1rem, 3.5vmin, 1.4rem)';
  return 'clamp(0.85rem, 3vmin, 1.1rem)';
};

/**
 * Format value for display
 * @param {number} value - Tile value
 * @returns {string} Formatted value
 */
const formatValue = (value) => {
  if (value === 0) return '';
  return value.toString();
};

/**
 * CSS keyframes injected once
 */
const injectKeyframes = (() => {
  let injected = false;
  return () => {
    if (injected || typeof document === 'undefined') return;
    const style = document.createElement('style');
    style.textContent = `
      @keyframes tile-pop {
        0% { transform: scale(0); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
      @keyframes tile-merge {
        0% { transform: scale(1); }
        50% { transform: scale(1.15); }
        100% { transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
    injected = true;
  };
})();

/**
 * Tile component for 2048 game
 * @param {Object} props - Component props
 * @param {number} props.value - Tile value (0 for empty)
 * @param {boolean} props.isNew - Just spawned (scale animation)
 * @param {boolean} props.isMerged - Just merged (pulse animation)
 * @param {number} props.row - Row position (0-3)
 * @param {number} props.col - Column position (0-3)
 */
const Tile = ({ value = 0, isNew = false, isMerged = false, row, col }) => {
  // Inject keyframes on first render
  React.useEffect(() => {
    injectKeyframes();
  }, []);

  if (value === 0) return null;

  const colors = getColors(value);
  
  const style = {
    position: 'absolute',
    width: 'calc(25% - 10px)',
    height: 'calc(25% - 10px)',
    left: `calc(${col * 25}% + 5px)`,
    top: `calc(${row * 25}% + 5px)`,
    backgroundColor: colors.bg,
    color: colors.text,
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: getFontSize(value),
    fontWeight: 'bold',
    fontFamily: 'Arial, sans-serif',
    transition: 'left 0.15s ease, top 0.15s ease',
    animation: isNew 
      ? 'tile-pop 0.2s ease-out' 
      : isMerged 
        ? 'tile-merge 0.2s ease-out' 
        : 'none',
    zIndex: isMerged ? 10 : 1,
    boxShadow: value >= 128 
      ? '0 0 30px 10px rgba(243, 215, 116, 0.3)' 
      : 'none'
  };

  return (
    <div style={style}>
      {formatValue(value)}
    </div>
  );
};

export default Tile;
