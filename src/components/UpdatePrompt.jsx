/**
 * UpdatePrompt Component
 *
 * Shows a banner when a new version of the app is available.
 * Triggered by the service worker detecting an update.
 */

import React, { useState, useEffect } from 'react';

export default function UpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    const handleUpdate = (event) => {
      setRegistration(event.detail);
      setShowPrompt(true);
    };

    window.addEventListener('swUpdate', handleUpdate);

    return () => {
      window.removeEventListener('swUpdate', handleUpdate);
    };
  }, []);

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      // Tell SW to skip waiting and activate new version
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });

      // Reload once the new SW takes control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div style={styles.banner}>
      <div style={styles.content}>
        <div style={styles.icon}>🆕</div>
        <div style={styles.text}>
          <strong style={styles.title}>Update Available</strong>
          <span style={styles.subtitle}>
            A new version is ready to install
          </span>
        </div>
      </div>
      <div style={styles.actions}>
        <button style={styles.updateBtn} onClick={handleUpdate}>
          Update Now
        </button>
        <button style={styles.laterBtn} onClick={handleDismiss}>
          Later
        </button>
      </div>
    </div>
  );
}

const styles = {
  banner: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1e293b',
    borderBottom: '1px solid #334155',
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 9999,
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: 12
  },
  icon: {
    fontSize: 24
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2
  },
  title: {
    color: '#f1f5f9',
    fontSize: 14
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 12
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  updateBtn: {
    backgroundColor: '#22c55e',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: '600',
    cursor: 'pointer'
  },
  laterBtn: {
    backgroundColor: 'transparent',
    color: '#94a3b8',
    border: '1px solid #334155',
    borderRadius: 6,
    padding: '7px 12px',
    fontSize: 13,
    cursor: 'pointer'
  }
};
