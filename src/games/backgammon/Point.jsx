/**
 * Point Component
 * 
 * Triangular point on the backgammon board.
 * Displays checkers stacked vertically with highlight states.
 */

import React from 'react';
import Checker from './Checker';

const Point = ({
  pointIndex,
  checkers = { checkers: 0, color: null },
  isTopHalf = false,
  isValidDestination = false,
  isSelected = false,
  onPointClick,
  onCheckerClick,
  onCheckerDoubleClick
}) => {
  // Alternating colors for points
  const isDark = pointIndex % 2 === 0;
  const baseColor = isDark ? '#8B4513' : '#D2B48C'; // Brown / Tan
  const highlightColor = '#4CAF50'; // Green for valid moves
  const selectedColor = '#FFC107'; // Amber for selected

  // Determine current triangle color
  let triangleColor = baseColor;
  if (isValidDestination) {
    triangleColor = highlightColor;
  } else if (isSelected) {
    triangleColor = selectedColor;
  }

  // Container style
  const containerStyle = {
    width: '60px',
    height: '200px',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: isTopHalf ? 'center' : 'center',
    justifyContent: isTopHalf ? 'flex-start' : 'flex-end',
    cursor: isValidDestination || checkers.checkers > 0 ? 'pointer' : 'default'
  };

  // Triangle SVG points
  // Top half: point faces down (wide at top, point at bottom)
  // Bottom half: point faces up (wide at bottom, point at top)
  const trianglePoints = isTopHalf
    ? '0,0 60,0 30,180' // Wide top, point bottom
    : '30,20 60,200 0,200'; // Point top, wide bottom

  // Calculate checker positions
  const renderCheckers = () => {
    if (checkers.checkers === 0 || !checkers.color) return null;

    const count = checkers.checkers;
    const maxVisible = 5;
    const visibleCount = Math.min(count, maxVisible);
    const showOverflow = count > maxVisible;

    const checkerElements = [];
    const spacing = 32; // Vertical spacing between checkers (reduced from 40)

    for (let i = 0; i < visibleCount; i++) {
      const isTopChecker = i === visibleCount - 1;
      
      // Position from edge of triangle
      const offset = isTopHalf
        ? 10 + (i * spacing)  // From top
        : 10 + (i * spacing); // From bottom (flex handles direction)

      const checkerContainerStyle = {
        position: 'absolute',
        [isTopHalf ? 'top' : 'bottom']: `${offset}px`,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: i + 1
      };

      checkerElements.push(
        <div key={i} style={checkerContainerStyle}>
          <Checker
            color={checkers.color}
            count={isTopChecker && showOverflow ? count : 1}
            isSelected={isSelected && isTopChecker}
            canSelect={isTopChecker && onCheckerClick !== undefined}
            onSelect={() => onCheckerClick && onCheckerClick(pointIndex)}
            onDoubleClick={() => onCheckerDoubleClick && onCheckerDoubleClick(pointIndex)}
          />
        </div>
      );
    }

    return checkerElements;
  };

  // Handle click on the point area
  const handlePointClick = (e) => {
    // Prevent triggering if clicking on a checker
    if (e.target.closest('[data-checker]')) return;
    
    if (isValidDestination && onPointClick) {
      onPointClick(pointIndex);
    } else if (checkers.checkers > 0 && onCheckerClick) {
      onCheckerClick(pointIndex);
    }
  };

  // Point number label
  const labelStyle = {
    position: 'absolute',
    [isTopHalf ? 'bottom' : 'top']: '-20px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '11px',
    color: '#666',
    fontWeight: '500',
    userSelect: 'none'
  };

  return (
    <div style={containerStyle} onClick={handlePointClick}>
      {/* Triangle SVG */}
      <svg
        width="60"
        height="200"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none'
        }}
      >
        <polygon
          points={trianglePoints}
          fill={triangleColor}
          stroke={isValidDestination ? '#2E7D32' : (isSelected ? '#FF8F00' : '#5D4037')}
          strokeWidth={isValidDestination || isSelected ? '3' : '1'}
          style={{
            transition: 'fill 0.2s ease, stroke 0.2s ease',
            filter: isValidDestination ? 'brightness(1.1)' : 'none'
          }}
        />
        
        {/* Highlight glow for valid destination */}
        {isValidDestination && (
          <polygon
            points={trianglePoints}
            fill="none"
            stroke={highlightColor}
            strokeWidth="2"
            style={{
              filter: 'blur(4px)',
              opacity: 0.6
            }}
          />
        )}
      </svg>

      {/* Checkers */}
      {renderCheckers()}

      {/* Point number label */}
      <span style={labelStyle}>
        {pointIndex + 1}
      </span>
    </div>
  );
};

export default Point;
