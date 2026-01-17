/**
 * Backgammon Board Component
 * 
 * Complete board layout including:
 * - 24 points in two halves
 * - Center bar for hit checkers
 * - Bear-off trays on sides
 * - Wood texture background
 */

import React from 'react';
import Point from './Point';
import Checker from './Checker';

const BackgammonBoard = ({
  gameState,
  onPointClick,
  onCheckerClick,
  onBarClick,
  selectedPoint,
  validMoves = []
}) => {
  const { points, bar, bearOff, currentPlayer } = gameState;

  // Check if a point is a valid destination
  const isValidDestination = (pointIndex) => {
    return validMoves.some(move => move.to === pointIndex);
  };

  // Check if bar entry is valid
  const isBarEntryValid = (player) => {
    return validMoves.some(move => move.from === 'bar') && currentPlayer === player;
  };

  // Check if bearing off is valid
  const isBearOffValid = () => {
    return validMoves.some(move => move.to === 'bearOff');
  };

  // Board container style
  const boardContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px'
  };

  // Main board style with wood texture
  const boardStyle = {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#5D4037',
    backgroundImage: `
      linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px),
      linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
      linear-gradient(90deg, transparent 0%, rgba(139,90,43,0.3) 50%, transparent 100%)
    `,
    backgroundSize: '20px 20px, 20px 20px, 100% 100%',
    borderRadius: '12px',
    border: '8px solid #3E2723',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 2px 8px rgba(0,0,0,0.2)',
    padding: '10px',
    gap: '0'
  };

  // Playing area (left or right of bar)
  const playAreaStyle = {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#2d5016',
    borderRadius: '4px',
    padding: '8px 4px',
    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)'
  };

  // Row of points
  const pointRowStyle = {
    display: 'flex',
    flexDirection: 'row',
    height: '200px',
    justifyContent: 'center'
  };

  // Center bar style
  const barStyle = {
    width: '60px',
    backgroundColor: '#4E342E',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 5px',
    borderRadius: '4px',
    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)',
    margin: '0 5px'
  };

  // Bar section for each player's checkers
  const barSectionStyle = (player) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: player === 'black' ? 'flex-start' : 'flex-end',
    flex: 1,
    padding: '5px',
    cursor: bar[player] > 0 && currentPlayer === player ? 'pointer' : 'default',
    borderRadius: '4px',
    backgroundColor: selectedPoint === 'bar' && currentPlayer === player
      ? 'rgba(255, 193, 7, 0.3)'
      : isBarEntryValid(player)
        ? 'rgba(76, 175, 80, 0.2)'
        : 'transparent',
    transition: 'background-color 0.2s ease'
  });

  // Bear-off tray style
  const bearOffTrayStyle = (side) => ({
    width: '50px',
    backgroundColor: '#3E2723',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: side === 'top' ? 'flex-start' : 'flex-end',
    alignItems: 'center',
    padding: '10px 5px',
    borderRadius: '4px',
    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4)',
    gap: '2px'
  });

  // Bear-off valid indicator
  const bearOffIndicatorStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: isBearOffValid() ? 'rgba(76, 175, 80, 0.4)' : 'transparent',
    border: isBearOffValid() ? '2px solid #4CAF50' : '2px dashed rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: isBearOffValid() ? 'pointer' : 'default',
    transition: 'all 0.2s ease'
  };

  // Render borne off checkers
  const renderBearOff = (player) => {
    const count = bearOff[player];
    if (count === 0) return null;

    const maxShow = 5;
    const showCount = Math.min(count, maxShow);
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
        {Array.from({ length: showCount }).map((_, i) => (
          <div
            key={i}
            style={{
              width: '36px',
              height: '10px',
              backgroundColor: player === 'white' ? '#f0f0f0' : '#2a2a2a',
              borderRadius: '3px',
              border: `1px solid ${player === 'white' ? '#999' : '#000'}`,
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
            }}
          />
        ))}
        {count > maxShow && (
          <span style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
            +{count - maxShow}
          </span>
        )}
      </div>
    );
  };

  // Render bar checkers
  const renderBarCheckers = (player) => {
    const count = bar[player];
    if (count === 0) return null;

    const isSelected = selectedPoint === 'bar' && currentPlayer === player;
    const canSelect = currentPlayer === player && count > 0;

    return (
      <div
        onClick={() => canSelect && onBarClick && onBarClick(player)}
        style={{ cursor: canSelect ? 'pointer' : 'default' }}
      >
        <Checker
          color={player}
          count={count}
          isSelected={isSelected}
          canSelect={canSelect}
        />
      </div>
    );
  };

  // Point indices for each quadrant (visual order)
  // Top row: 13-18 (left), 19-24 (right) - triangles pointing down
  // Bottom row: 12-7 (left), 6-1 (right) - triangles pointing up
  
  // Top left quadrant (points 13-18, indices 12-17)
  const topLeftPoints = [12, 13, 14, 15, 16, 17];
  // Top right quadrant (points 19-24, indices 18-23)  
  const topRightPoints = [18, 19, 20, 21, 22, 23];
  // Bottom left quadrant (points 12-7, indices 11-6)
  const bottomLeftPoints = [11, 10, 9, 8, 7, 6];
  // Bottom right quadrant (points 6-1, indices 5-0)
  const bottomRightPoints = [5, 4, 3, 2, 1, 0];

  // Render a row of points
  const renderPointRow = (pointIndices, isTopHalf) => {
    return pointIndices.map(index => (
      <Point
        key={index}
        pointIndex={index}
        checkers={points[index]}
        isTopHalf={isTopHalf}
        isValidDestination={isValidDestination(index)}
        isSelected={selectedPoint === index}
        onPointClick={(idx) => onPointClick && onPointClick(idx)}
        onCheckerClick={(idx) => onCheckerClick && onCheckerClick(idx)}
      />
    ));
  };

  // Handle bear off click
  const handleBearOffClick = () => {
    if (isBearOffValid() && onPointClick) {
      onPointClick('bearOff');
    }
  };

  return (
    <div style={boardContainerStyle}>
      {/* White's bear-off tray (right side) */}
      <div style={bearOffTrayStyle('bottom')}>
        <div style={{ fontSize: '11px', color: '#999', marginBottom: '5px' }}>WHITE</div>
        {renderBearOff('white')}
        <div 
          style={bearOffIndicatorStyle}
          onClick={handleBearOffClick}
        >
          {isBearOffValid() && currentPlayer === 'white' && (
            <span style={{ fontSize: '10px', color: '#4CAF50' }}>OFF</span>
          )}
        </div>
      </div>

      {/* Main board */}
      <div style={boardStyle}>
        {/* Left playing area */}
        <div style={playAreaStyle}>
          {/* Top row (points 13-18) */}
          <div style={pointRowStyle}>
            {renderPointRow(topLeftPoints, true)}
          </div>
          
          {/* Spacer */}
          <div style={{ height: '20px' }} />
          
          {/* Bottom row (points 12-7) */}
          <div style={pointRowStyle}>
            {renderPointRow(bottomLeftPoints, false)}
          </div>
        </div>

        {/* Center bar */}
        <div style={barStyle}>
          {/* Black's bar area (top) */}
          <div 
            style={barSectionStyle('black')}
            onClick={() => bar.black > 0 && currentPlayer === 'black' && onBarClick && onBarClick('black')}
          >
            {renderBarCheckers('black')}
            {bar.black === 0 && (
              <div style={{ fontSize: '10px', color: '#666', textAlign: 'center' }}>BAR</div>
            )}
          </div>

          {/* Divider */}
          <div style={{
            width: '40px',
            height: '2px',
            backgroundColor: '#666',
            margin: '10px 0'
          }} />

          {/* White's bar area (bottom) */}
          <div 
            style={barSectionStyle('white')}
            onClick={() => bar.white > 0 && currentPlayer === 'white' && onBarClick && onBarClick('white')}
          >
            {renderBarCheckers('white')}
            {bar.white === 0 && (
              <div style={{ fontSize: '10px', color: '#666', textAlign: 'center' }}>BAR</div>
            )}
          </div>
        </div>

        {/* Right playing area */}
        <div style={playAreaStyle}>
          {/* Top row (points 19-24) */}
          <div style={pointRowStyle}>
            {renderPointRow(topRightPoints, true)}
          </div>
          
          {/* Spacer */}
          <div style={{ height: '20px' }} />
          
          {/* Bottom row (points 6-1) */}
          <div style={pointRowStyle}>
            {renderPointRow(bottomRightPoints, false)}
          </div>
        </div>
      </div>

      {/* Black's bear-off tray (left side) */}
      <div style={bearOffTrayStyle('top')}>
        <div 
          style={bearOffIndicatorStyle}
          onClick={handleBearOffClick}
        >
          {isBearOffValid() && currentPlayer === 'black' && (
            <span style={{ fontSize: '10px', color: '#4CAF50' }}>OFF</span>
          )}
        </div>
        {renderBearOff('black')}
        <div style={{ fontSize: '11px', color: '#999', marginTop: '5px' }}>BLACK</div>
      </div>
    </div>
  );
};

export default BackgammonBoard;
