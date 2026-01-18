/**
 * Doubling Cube Component
 * 
 * 3D cube showing stake multiplier with owner indication
 * and interactive double/accept/decline functionality.
 */

import React from 'react';

const DoublingCube = ({
  value = 1,
  owner = null,
  canDouble = false,
  isOffered = false,
  currentPlayer = 'white',
  onOfferDouble,
  onAcceptDouble,
  onDeclineDouble
}) => {
  // Owner colors
  const ownerColors = {
    white: '#f0f0f0',
    black: '#2a2a2a',
    null: '#ffd700' // Gold when centered (either can double)
  };

  const borderColor = ownerColors[owner] || ownerColors[null];
  const isPlayerOwner = owner === null || owner === currentPlayer;

  // Cube container style
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px'
  };

  // 3D Cube style
  const cubeStyle = {
    width: '64px',
    height: '64px',
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
    border: `4px solid ${borderColor}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `
      0 6px 12px rgba(0,0,0,0.4),
      inset 0 2px 4px rgba(255,255,255,0.1),
      inset 0 -2px 4px rgba(0,0,0,0.3)
    `,
    transform: 'perspective(200px) rotateX(5deg)',
    cursor: canDouble && !isOffered ? 'pointer' : 'default',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    position: 'relative'
  };

  // Cube hover effect
  const handleMouseEnter = (e) => {
    if (canDouble && !isOffered) {
      e.currentTarget.style.transform = 'perspective(200px) rotateX(5deg) scale(1.05)';
      e.currentTarget.style.boxShadow = `
        0 8px 16px rgba(0,0,0,0.5),
        inset 0 2px 4px rgba(255,255,255,0.1),
        inset 0 -2px 4px rgba(0,0,0,0.3),
        0 0 12px ${borderColor}
      `;
    }
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.transform = 'perspective(200px) rotateX(5deg)';
    e.currentTarget.style.boxShadow = `
      0 6px 12px rgba(0,0,0,0.4),
      inset 0 2px 4px rgba(255,255,255,0.1),
      inset 0 -2px 4px rgba(0,0,0,0.3)
    `;
  };

  // Value text style
  const valueStyle = {
    fontSize: value >= 32 ? '22px' : '28px',
    fontWeight: 'bold',
    color: '#ffd700',
    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
    fontFamily: 'Georgia, serif'
  };

  // Label style
  const labelStyle = {
    fontSize: '12px',
    color: '#999',
    textAlign: 'center'
  };

  // Button styles
  const buttonBaseStyle = {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  const acceptButtonStyle = {
    ...buttonBaseStyle,
    backgroundColor: '#4CAF50',
    color: '#fff',
    boxShadow: '0 2px 8px rgba(76, 175, 80, 0.4)'
  };

  const declineButtonStyle = {
    ...buttonBaseStyle,
    backgroundColor: '#f44336',
    color: '#fff',
    boxShadow: '0 2px 8px rgba(244, 67, 54, 0.4)'
  };

  const doubleButtonStyle = {
    ...buttonBaseStyle,
    backgroundColor: '#FF9800',
    color: '#fff',
    boxShadow: '0 2px 8px rgba(255, 152, 0, 0.4)'
  };

  // Get status text
  const getStatusText = () => {
    if (isOffered) return 'Double offered!';
    if (value >= 64) return 'Max stakes';
    if (owner === null) return 'Cube centered';
    return `${owner === 'white' ? 'White' : 'Black'} owns cube`;
  };

  return (
    <div style={containerStyle}>
      {/* Cube */}
      <div
        style={cubeStyle}
        onClick={canDouble && !isOffered ? onOfferDouble : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        title={canDouble ? 'Click to double' : ''}
      >
        <span style={valueStyle}>{value}</span>
      </div>

      {/* Status label */}
      <div style={labelStyle}>
        {getStatusText()}
      </div>

      {/* Double offer buttons (when offered to player) */}
      {isOffered && (
        <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
          <button
            style={acceptButtonStyle}
            onClick={onAcceptDouble}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#43A047'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#4CAF50'}
          >
            Accept
          </button>
          <button
            style={declineButtonStyle}
            onClick={onDeclineDouble}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#E53935'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#f44336'}
          >
            Decline
          </button>
        </div>
      )}

      {/* Offer double button (when player can double) */}
      {canDouble && !isOffered && isPlayerOwner && (
        <button
          style={doubleButtonStyle}
          onClick={onOfferDouble}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#FB8C00'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#FF9800'}
        >
          Double to {Math.min(value * 2, 64)}
        </button>
      )}
    </div>
  );
};

export default DoublingCube;
