/**
 * GnubgLoadingModal - Loading UI for GNU Backgammon WASM
 *
 * Shows progress bar and status while loading ~15MB of WASM files.
 * Matches existing Backgammon styling with wood theme and responsive design.
 */

import React from 'react';

const GnubgLoadingModal = ({ progress, onCancel }) => {
  const { percentage = 0, filename = '', loaded = 0, total = 0 } = progress || {};

  // Format bytes to MB
  const formatMB = (bytes) => {
    return (bytes / (1024 * 1024)).toFixed(1);
  };

  // Responsive sizing
  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 900;

  // Styles matching Backgammon theme
  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  };

  const modalStyle = {
    backgroundColor: '#5D4037',
    backgroundImage: 'linear-gradient(135deg, #6D4C41 0%, #5D4037 50%, #4E342E 100%)',
    border: '8px solid #3E2723',
    borderRadius: isSmallScreen ? '12px' : '16px',
    boxShadow: '0 12px 48px rgba(0,0,0,0.6), inset 0 2px 8px rgba(255,255,255,0.1)',
    padding: isSmallScreen ? '30px' : '40px',
    width: isSmallScreen ? '90%' : '500px',
    maxWidth: '90vw',
    color: '#FFF',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  };

  const titleStyle = {
    fontSize: isSmallScreen ? '20px' : '24px',
    fontWeight: '600',
    marginBottom: '20px',
    textAlign: 'center',
    color: '#FFF',
    textShadow: '0 2px 4px rgba(0,0,0,0.4)',
  };

  const subtitleStyle = {
    fontSize: isSmallScreen ? '13px' : '14px',
    color: '#FFB74D',
    textAlign: 'center',
    marginBottom: '25px',
    lineHeight: '1.5',
  };

  const progressContainerStyle = {
    marginBottom: '20px',
  };

  const progressBarBackgroundStyle = {
    width: '100%',
    height: isSmallScreen ? '20px' : '24px',
    backgroundColor: '#3E2723',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '2px solid #2C1810',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
  };

  const progressBarFillStyle = {
    height: '100%',
    backgroundColor: '#4CAF50',
    backgroundImage: 'linear-gradient(90deg, #66BB6A 0%, #4CAF50 50%, #43A047 100%)',
    borderRadius: '10px',
    transition: 'width 0.3s ease-out',
    width: `${percentage}%`,
    boxShadow: '0 2px 4px rgba(76, 175, 80, 0.4)',
    position: 'relative',
    overflow: 'hidden',
  };

  // Animated shimmer effect
  const shimmerStyle = {
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
    animation: 'shimmer 2s infinite',
  };

  const progressTextStyle = {
    marginTop: '12px',
    fontSize: isSmallScreen ? '16px' : '18px',
    fontWeight: '600',
    textAlign: 'center',
    color: '#FFF',
  };

  const statusTextStyle = {
    marginTop: '8px',
    fontSize: isSmallScreen ? '12px' : '13px',
    textAlign: 'center',
    color: '#BCAAA4',
  };

  const detailsStyle = {
    marginTop: '8px',
    fontSize: isSmallScreen ? '11px' : '12px',
    textAlign: 'center',
    color: '#A1887F',
    fontFamily: 'monospace',
  };

  const buttonContainerStyle = {
    marginTop: '25px',
    display: 'flex',
    justifyContent: 'center',
  };

  const cancelButtonStyle = {
    padding: isSmallScreen ? '10px 24px' : '12px 30px',
    fontSize: isSmallScreen ? '14px' : '15px',
    fontWeight: '600',
    backgroundColor: '#D32F2F',
    color: '#FFF',
    border: '2px solid #B71C1C',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
  };

  const cancelButtonHoverStyle = {
    ...cancelButtonStyle,
    backgroundColor: '#E53935',
    transform: 'translateY(-1px)',
    boxShadow: '0 6px 12px rgba(0,0,0,0.4)',
  };

  // Spinner animation for waiting
  const spinnerStyle = {
    width: isSmallScreen ? '40px' : '50px',
    height: isSmallScreen ? '40px' : '50px',
    border: '4px solid #3E2723',
    borderTop: '4px solid #FFB74D',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px',
  };

  const keyframesStyle = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes shimmer {
      0% { left: -100%; }
      100% { left: 100%; }
    }
  `;

  const getStatusMessage = () => {
    if (percentage === 0) {
      return 'Initializing...';
    } else if (percentage < 100) {
      return `Loading ${filename || 'files'}...`;
    } else {
      return 'Initializing engine...';
    }
  };

  return (
    <>
      <style>{keyframesStyle}</style>
      <div style={overlayStyle}>
        <div style={modalStyle}>
          <div style={titleStyle}>Loading World-Class AI</div>

          <div style={subtitleStyle}>
            GNU Backgammon (~2000 FIBS rating)
            <br />
            This may take 5-10 seconds on first load
          </div>

          <div style={spinnerStyle} />

          <div style={progressContainerStyle}>
            <div style={progressBarBackgroundStyle}>
              <div style={progressBarFillStyle}>
                {percentage > 5 && <div style={shimmerStyle} />}
              </div>
            </div>

            <div style={progressTextStyle}>
              {Math.round(percentage)}%
            </div>

            <div style={statusTextStyle}>
              {getStatusMessage()}
            </div>

            {loaded > 0 && total > 0 && (
              <div style={detailsStyle}>
                {formatMB(loaded)} MB / {formatMB(total)} MB
              </div>
            )}
          </div>

          {onCancel && (
            <div style={buttonContainerStyle}>
              <button
                style={cancelButtonStyle}
                onMouseEnter={(e) => {
                  Object.assign(e.target.style, cancelButtonHoverStyle);
                }}
                onMouseLeave={(e) => {
                  Object.assign(e.target.style, cancelButtonStyle);
                }}
                onClick={onCancel}
              >
                Cancel & Use Hard Difficulty
              </button>
            </div>
          )}

          <div style={{
            marginTop: '20px',
            fontSize: isSmallScreen ? '11px' : '12px',
            textAlign: 'center',
            color: '#8D6E63',
            fontStyle: 'italic',
          }}>
            Tip: Files are cached after first load
          </div>
        </div>
      </div>
    </>
  );
};

export default GnubgLoadingModal;
