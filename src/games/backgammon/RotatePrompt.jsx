/**
 * RotatePrompt Component
 * 
 * Displays a prompt suggesting landscape orientation for better gameplay.
 * Offers fullscreen + landscape lock option on supported devices.
 */

import React, { useState, useEffect } from 'react';

const RotatePrompt = ({ gameName = 'Backgammon', onDismiss }) => {
  const [visible, setVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [lockSupported, setLockSupported] = useState(false);

  const STORAGE_KEY = `${gameName.toLowerCase()}-rotate-dismissed`;

  useEffect(() => {
    // Check if user previously dismissed
    const dismissed = localStorage.getItem(STORAGE_KEY) === 'true';
    if (dismissed) {
      setVisible(false);
      return;
    }

    // Check if orientation lock is supported
    const hasOrientationLock = screen.orientation && 
                               typeof screen.orientation.lock === 'function';
    setLockSupported(hasOrientationLock);

    // Check orientation
    const checkOrientation = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      const isMobile = window.innerWidth < 1024;
      setVisible(isPortrait && isMobile);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, [STORAGE_KEY]);

  // Handle dismiss
  const handleDismiss = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    setVisible(false);
    if (onDismiss) onDismiss();
  };

  // Try to lock to landscape with fullscreen
  const handleLockLandscape = async () => {
    try {
      // Request fullscreen first (required for orientation lock)
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }

      // Now try to lock orientation
      if (screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock('landscape');
      }
    } catch (error) {
      console.log('Could not lock orientation:', error.message);
      // Still dismiss - user tried
    }

    setVisible(false);
    if (onDismiss) onDismiss();
  };

  if (!visible) return null;

  // Styles
  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px'
  };

  const modalStyle = {
    backgroundColor: '#2a2a4a',
    borderRadius: '16px',
    padding: '30px',
    maxWidth: '350px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
  };

  const iconStyle = {
    fontSize: '64px',
    marginBottom: '20px',
    animation: 'rotatePhone 2s ease-in-out infinite'
  };

  const titleStyle = {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '15px'
  };

  const textStyle = {
    color: '#aaa',
    fontSize: '15px',
    lineHeight: '1.5',
    marginBottom: '25px'
  };

  const buttonStyle = {
    width: '100%',
    padding: '14px 20px',
    fontSize: '16px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '10px',
    transition: 'opacity 0.2s'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#4CAF50',
    color: '#fff'
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: 'transparent',
    color: '#888',
    border: '1px solid #444'
  };

  const checkboxContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '15px'
  };

  const checkboxStyle = {
    width: '18px',
    height: '18px',
    cursor: 'pointer'
  };

  const checkboxLabelStyle = {
    color: '#666',
    fontSize: '13px',
    cursor: 'pointer'
  };

  // Keyframes for animation
  const keyframes = `
    @keyframes rotatePhone {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-15deg); }
      75% { transform: rotate(90deg); }
    }
  `;

  return (
    <div style={overlayStyle}>
      <style>{keyframes}</style>
      <div style={modalStyle}>
        {/* Rotating phone icon */}
        <div style={iconStyle}>📱</div>

        <h2 style={titleStyle}>Rotate for Best Experience</h2>

        <p style={textStyle}>
          {gameName} plays best in landscape mode. 
          Please rotate your device or tap below to switch.
        </p>

        {/* Fullscreen + Lock button (if supported) */}
        {lockSupported && (
          <button
            style={primaryButtonStyle}
            onClick={handleLockLandscape}
            onMouseEnter={(e) => e.target.style.opacity = '0.9'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            🔄 Go Fullscreen Landscape
          </button>
        )}

        {/* Manual rotate hint if lock not supported */}
        {!lockSupported && (
          <div style={{ 
            backgroundColor: '#1a1a2e', 
            padding: '15px', 
            borderRadius: '8px',
            marginBottom: '15px'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>
              📱 → 📱
            </div>
            <div style={{ color: '#888', fontSize: '13px' }}>
              Rotate your device to landscape
            </div>
          </div>
        )}

        {/* Continue anyway */}
        <button
          style={secondaryButtonStyle}
          onClick={handleDismiss}
          onMouseEnter={(e) => e.target.style.borderColor = '#666'}
          onMouseLeave={(e) => e.target.style.borderColor = '#444'}
        >
          Continue in Portrait
        </button>

        {/* Don't show again checkbox */}
        <div style={checkboxContainerStyle}>
          <input
            type="checkbox"
            id="dontShowAgain"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            style={checkboxStyle}
          />
          <label htmlFor="dontShowAgain" style={checkboxLabelStyle}>
            Don't show this again
          </label>
        </div>
      </div>
    </div>
  );
};

export default RotatePrompt;
