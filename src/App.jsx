import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';

// Page imports
import Home from './pages/Home';
import HowItWorks from './pages/HowItWorks';
import LeaderboardPage from './pages/LeaderboardPage';
import GarbageGame from './games/garbage/GarbageGame';
import SolitaireGame from './games/solitaire/SolitaireGame';
import SolitaireVerification from './games/solitaire/VerificationPage';
import YahtzeeGame from './games/yahtzee/YahtzeeGame';
import YahtzeeVerification from './games/yahtzee/VerificationPage';
import YahtzeeRules from './games/yahtzee/RulesPage';
import BlackjackGame from './games/blackjack/BlackjackGame';
import BlackjackVerification from './games/blackjack/VerificationPage';

// 404 Not Found Component
function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <h1 style={{ fontSize: '4rem', margin: '0 0 1rem', color: '#f44336' }}>404</h1>
      <h2 style={{ margin: '0 0 1rem', color: '#fff' }}>Page Not Found</h2>
      <p style={{ color: '#aaa', marginBottom: '2rem' }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link 
        to="/" 
        style={{
          display: 'inline-block',
          padding: '0.75rem 1.5rem',
          backgroundColor: '#4ade80',
          color: '#000',
          textDecoration: 'none',
          borderRadius: '8px',
          fontWeight: 'bold'
        }}
      >
        Back to Home
      </Link>
    </div>
  );
}

// Header component with burger menu
function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const location = useLocation();

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  // Handle window resize
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close menu when route changes
  React.useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  return (
    <header style={styles.header}>
      <Link to="/" style={styles.logo}>🃏 Provably Fair Games</Link>

      {/* Burger button for mobile */}
      {isMobile && (
        <button
          style={styles.burgerButton}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <div style={styles.burgerLine}></div>
          <div style={styles.burgerLine}></div>
          <div style={styles.burgerLine}></div>
        </button>
      )}

      {/* Navigation */}
      <nav style={
        isMobile
          ? {
              ...styles.navMobile,
              ...(menuOpen ? styles.navMobileOpen : {})
            }
          : styles.nav
      }>
        <Link to="/garbage" style={isMobile ? styles.linkMobile : styles.link} onClick={closeMenu}>Garbage</Link>
        <Link to="/solitaire" style={isMobile ? styles.linkMobile : styles.link} onClick={closeMenu}>Solitaire</Link>
        <Link to="/blackjack" style={isMobile ? styles.linkMobile : styles.link} onClick={closeMenu}>Blackjack</Link>
        <Link to="/yahtzee" style={isMobile ? styles.linkMobile : styles.link} onClick={closeMenu}>Yahtzee</Link>
        <Link to="/leaderboard" style={isMobile ? styles.linkMobile : styles.link} onClick={closeMenu}>Leaderboard</Link>
        <Link to="/how-it-works" style={isMobile ? styles.linkMobile : styles.link} onClick={closeMenu}>How It Works</Link>
      </nav>

      {/* Overlay for mobile menu */}
      {isMobile && menuOpen && (
        <div
          style={styles.overlay}
          onClick={closeMenu}
        />
      )}
    </header>
  );
}

// Main App component with routing
function App() {
  return (
    <BrowserRouter>
      <div style={styles.app}>
        <Header />

        {/* Route definitions */}
        <main style={styles.main}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/garbage" element={<GarbageGame />} />
            <Route path="/play" element={<GarbageGame />} />
            <Route path="/solitaire" element={<SolitaireGame />} />
            <Route path="/verify/solitaire/:gameId" element={<SolitaireVerification />} />
            <Route path="/blackjack" element={<BlackjackGame />} />
            <Route path="/play/blackjack" element={<BlackjackGame />} />
            <Route path="/verify/blackjack/:gameId" element={<BlackjackVerification />} />
            <Route path="/yahtzee" element={<YahtzeeGame />} />
            <Route path="/yahtzee/rules" element={<YahtzeeRules />} />
            <Route path="/yahtzee/verify" element={<YahtzeeVerification />} />
            <Route path="/verify/yahtzee/:gameId" element={<YahtzeeVerification />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            {/* 404 catch-all route - must be last */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        {/* Simple footer */}
        <footer style={styles.footer}>
          Randomness powered by Ergo blockchain
        </footer>
      </div>
    </BrowserRouter>
  );
}

// Basic inline styles with mobile responsive behavior
const styles = {
  app: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'system-ui, sans-serif',
    backgroundColor: '#1a1a2e',
    color: '#eee'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: '#16213e',
    position: 'relative',
    zIndex: 100
  },
  logo: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#fff',
    textDecoration: 'none',
    zIndex: 101
  },
  burgerButton: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    width: '2rem',
    height: '2rem',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    zIndex: 101
  },
  burgerLine: {
    width: '2rem',
    height: '0.25rem',
    backgroundColor: '#fff',
    borderRadius: '10px',
    transition: 'all 0.3s linear'
  },
  nav: {
    display: 'flex',
    gap: '1.5rem'
  },
  navMobile: {
    display: 'flex',
    position: 'fixed',
    flexDirection: 'column',
    backgroundColor: '#16213e',
    top: 0,
    right: 0,
    height: '100vh',
    width: '250px',
    paddingTop: '5rem',
    paddingLeft: '2rem',
    transition: 'transform 0.3s ease-in-out',
    transform: 'translateX(100%)',
    zIndex: 100,
    gap: '1rem'
  },
  navMobileOpen: {
    transform: 'translateX(0)'
  },
  link: {
    color: '#a0a0ff',
    textDecoration: 'none',
    padding: '0.5rem 0'
  },
  linkMobile: {
    color: '#a0a0ff',
    textDecoration: 'none',
    padding: '0.75rem 0',
    fontSize: '1.1rem',
    display: 'block'
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 99
  },
  main: {
    flex: 1,
    padding: '2rem'
  },
  footer: {
    textAlign: 'center',
    padding: '1rem',
    color: '#666',
    fontSize: '0.875rem'
  }
};

export default App;
