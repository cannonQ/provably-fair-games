/**
 * Admin Page with Password Protection
 *
 * Access at: /admin
 * Password: Set via ADMIN_PASSWORD environment variable
 *
 * Shows admin dashboard for reviewing flagged submissions
 */

import React, { useState, useEffect } from 'react';
import AdminDashboard from '../components/AdminDashboard';

// SECURITY: Password validation now happens on backend via API
// Frontend stores only a session token after successful authentication
const SESSION_KEY = 'admin_authenticated';
const SESSION_TOKEN_KEY = 'admin_token';

const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Check if already authenticated from sessionStorage
  useEffect(() => {
    const isAuth = sessionStorage.getItem(SESSION_KEY) === 'true';
    const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
    if (isAuth && token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Validate password via backend API call
      const response = await fetch('/api/admin?action=validation-stats&days=1', {
        headers: {
          'Authorization': `Bearer ${password}`
        }
      });

      if (response.ok) {
        // Password is valid - store session
        sessionStorage.setItem(SESSION_KEY, 'true');
        sessionStorage.setItem(SESSION_TOKEN_KEY, password);
        setIsAuthenticated(true);
        setPassword('');
      } else {
        setError('Incorrect password');
        setPassword('');
      }
    } catch (error) {
      setError('Authentication failed. Please try again.');
      setPassword('');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    setIsAuthenticated(false);
    setPassword('');
  };

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div style={styles.container}>
        <div style={styles.loginBox}>
          <h1 style={styles.title}>🔒 Admin Access</h1>
          <p style={styles.subtitle}>Enter password to continue</p>

          <form onSubmit={handleLogin} style={styles.form}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              style={styles.input}
              autoFocus
            />

            {error && (
              <div style={styles.error}>{error}</div>
            )}

            <button type="submit" style={styles.button}>
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Show admin dashboard if authenticated
  // Get stored token for API calls
  const adminToken = sessionStorage.getItem(SESSION_TOKEN_KEY);

  return (
    <div className="admin-page">
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Admin Dashboard</h1>
        <button onClick={handleLogout} style={styles.logoutButton}>
          Logout
        </button>
      </div>
      <AdminDashboard adminPassword={adminToken} />
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '70vh',
    padding: '2rem'
  },
  loginBox: {
    backgroundColor: '#16213e',
    padding: '3rem',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
    maxWidth: '400px',
    width: '100%'
  },
  title: {
    fontSize: '2rem',
    marginBottom: '0.5rem',
    color: '#fff',
    textAlign: 'center'
  },
  subtitle: {
    color: '#aaa',
    marginBottom: '2rem',
    textAlign: 'center'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  input: {
    padding: '0.75rem',
    fontSize: '1rem',
    borderRadius: '8px',
    border: '2px solid #2a3f5f',
    backgroundColor: '#0f1419',
    color: '#fff',
    outline: 'none'
  },
  button: {
    padding: '0.75rem',
    fontSize: '1rem',
    fontWeight: 'bold',
    backgroundColor: '#4ade80',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  error: {
    color: '#f87171',
    padding: '0.5rem',
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderRadius: '6px',
    textAlign: 'center',
    fontSize: '0.9rem'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    padding: '1rem',
    backgroundColor: '#16213e',
    borderRadius: '8px'
  },
  headerTitle: {
    margin: 0,
    color: '#fff'
  },
  logoutButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold'
  }
};

export default AdminPage;
