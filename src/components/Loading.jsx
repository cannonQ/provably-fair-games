/**
 * Loading Component
 *
 * Displays a loading spinner while lazy-loaded components are being fetched
 *
 * Usage:
 * <Suspense fallback={<Loading />}>
 *   <LazyComponent />
 * </Suspense>
 */

import React from 'react';

const Loading = ({ message = 'Loading...' }) => {
  return (
    <div style={styles.container}>
      <div style={styles.spinner}></div>
      <p style={styles.message}>{message}</p>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '70vh',
    padding: '2rem'
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #2a3f5f',
    borderTop: '4px solid #4ade80',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem'
  },
  message: {
    color: '#aaa',
    fontSize: '1rem',
    margin: 0
  },
  // Add keyframe animation via style tag
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' }
  }
};

// Inject CSS animation
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  if (!document.querySelector('style[data-loading-animation]')) {
    styleSheet.setAttribute('data-loading-animation', 'true');
    document.head.appendChild(styleSheet);
  }
}

export default Loading;
