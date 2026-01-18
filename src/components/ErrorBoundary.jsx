/**
 * Error Boundary Component
 *
 * Catches JavaScript errors in child components and displays a fallback UI
 * instead of crashing the entire app.
 *
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('Error caught by boundary:', error, errorInfo);

    // Update state with error details
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    // Reset error state and try again
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI when error occurs
      return (
        <div style={styles.container}>
          <div style={styles.errorBox}>
            <h1 style={styles.title}>⚠️ Something Went Wrong</h1>
            <p style={styles.message}>
              An unexpected error occurred. This has been logged for investigation.
            </p>

            <div style={styles.actions}>
              <button onClick={this.handleReset} style={styles.button}>
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{...styles.button, ...styles.buttonSecondary}}
              >
                Go Home
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={styles.details}>
                <summary style={styles.summary}>Error Details (Dev Only)</summary>
                <pre style={styles.errorDetails}>
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '70vh',
    padding: '2rem'
  },
  errorBox: {
    backgroundColor: '#16213e',
    padding: '3rem',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
    maxWidth: '600px',
    width: '100%',
    border: '2px solid #ef4444'
  },
  title: {
    fontSize: '2rem',
    marginBottom: '1rem',
    color: '#ef4444',
    textAlign: 'center'
  },
  message: {
    color: '#ddd',
    marginBottom: '2rem',
    textAlign: 'center',
    lineHeight: '1.6'
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    marginBottom: '2rem'
  },
  button: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: 'bold',
    backgroundColor: '#4ade80',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  buttonSecondary: {
    backgroundColor: '#3b82f6'
  },
  details: {
    marginTop: '2rem',
    padding: '1rem',
    backgroundColor: '#0f1419',
    borderRadius: '8px',
    border: '1px solid #2a3f5f'
  },
  summary: {
    cursor: 'pointer',
    color: '#4ade80',
    fontWeight: 'bold',
    marginBottom: '1rem'
  },
  errorDetails: {
    color: '#ef4444',
    fontSize: '0.875rem',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    maxHeight: '300px',
    overflow: 'auto'
  }
};

export default ErrorBoundary;
