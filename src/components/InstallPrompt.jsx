/**
 * InstallPrompt Component
 *
 * Shows a banner prompting users to install the PWA.
 * Handles both iOS (manual add to homescreen) and Android (automatic prompt).
 */

import React, { useState, useEffect } from 'react';

// Detect iOS
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

// Detect if running as standalone PWA
const isStandalone = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
};

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Don't show if already installed
    if (isStandalone()) {
      return;
    }

    // Check if dismissed recently (24 hours)
    const dismissedAt = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissedAt && Date.now() - parseInt(dismissedAt) < 24 * 60 * 60 * 1000) {
      return;
    }

    // For iOS, show after a delay
    if (isIOS()) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 30000); // 30 seconds
      return () => clearTimeout(timer);
    }

    // For Android/Desktop, capture the beforeinstallprompt event
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show after a delay
      setTimeout(() => setShowPrompt(true), 30000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS()) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for user response
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA installed');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    setShowPrompt(false);
    setShowIOSInstructions(false);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <>
      {/* Main Install Banner */}
      <div style={styles.banner}>
        <div style={styles.content}>
          <div style={styles.icon}>📲</div>
          <div style={styles.text}>
            <strong style={styles.title}>Install App</strong>
            <span style={styles.subtitle}>
              Add to your home screen for the best experience
            </span>
          </div>
        </div>
        <div style={styles.actions}>
          <button style={styles.installBtn} onClick={handleInstall}>
            Install
          </button>
          <button style={styles.dismissBtn} onClick={handleDismiss}>
            ×
          </button>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div style={styles.modalOverlay} onClick={handleDismiss}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Add to Home Screen</h3>

            <div style={styles.step}>
              <div style={styles.stepNumber}>1</div>
              <div style={styles.stepText}>
                Tap the <strong>Share</strong> button
                <span style={styles.shareIcon}>⎙</span>
                in Safari's toolbar
              </div>
            </div>

            <div style={styles.step}>
              <div style={styles.stepNumber}>2</div>
              <div style={styles.stepText}>
                Scroll down and tap <strong>"Add to Home Screen"</strong>
              </div>
            </div>

            <div style={styles.step}>
              <div style={styles.stepNumber}>3</div>
              <div style={styles.stepText}>
                Tap <strong>"Add"</strong> in the top right corner
              </div>
            </div>

            <button style={styles.gotItBtn} onClick={handleDismiss}>
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  banner: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1e293b',
    borderTop: '1px solid #334155',
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 9999,
    boxShadow: '0 -4px 12px rgba(0,0,0,0.3)'
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: 12
  },
  icon: {
    fontSize: 28
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
  installBtn: {
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: '600',
    cursor: 'pointer'
  },
  dismissBtn: {
    backgroundColor: 'transparent',
    color: '#64748b',
    border: 'none',
    fontSize: 24,
    cursor: 'pointer',
    padding: '0 8px',
    lineHeight: 1
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: 20
  },
  modal: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 24,
    maxWidth: 340,
    width: '100%'
  },
  modalTitle: {
    margin: '0 0 20px 0',
    color: '#f1f5f9',
    fontSize: 18,
    textAlign: 'center'
  },
  step: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: 14,
    flexShrink: 0
  },
  stepText: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 1.5
  },
  shareIcon: {
    display: 'inline-block',
    margin: '0 4px',
    padding: '2px 6px',
    backgroundColor: '#334155',
    borderRadius: 4,
    fontSize: 16
  },
  gotItBtn: {
    width: '100%',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '12px 20px',
    fontSize: 14,
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: 8
  }
};
