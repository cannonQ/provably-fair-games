import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

// Page imports
import Home from './pages/Home';
import HowItWorks from './pages/HowItWorks';
import LeaderboardPage from './pages/LeaderboardPage';
import GarbageGame from './games/garbage/GarbageGame';
import SolitaireGame from './games/solitaire/SolitaireGame';
import SolitaireVerification from './games/solitaire/VerificationPage';
import YahtzeeGame from './games/yahtzee/YahtzeeGame';
import YahtzeeVerification from './games/yahtzee/VerificationPage';

// Main App component with routing
function App() {
  return (
    <BrowserRouter>
      <div style={styles.app}>
        {/* Simple header navigation */}
        <header style={styles.header}>
          <Link to="/" style={styles.logo}>🃏 Provably Fair Games</Link>
          <nav style={styles.nav}>
            <Link to="/garbage" style={styles.link}>Garbage</Link>
            <Link to="/solitaire" style={styles.link}>Solitaire</Link>
            <Link to="/yahtzee" style={styles.link}>Yahtzee</Link>
            <Link to="/leaderboard" style={styles.link}>Leaderboard</Link>
            <Link to="/how-it-works" style={styles.link}>How It Works</Link>
          </nav>
        </header>

        {/* Route definitions */}
        <main style={styles.main}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/garbage" element={<GarbageGame />} />
            <Route path="/play" element={<GarbageGame />} />
            <Route path="/solitaire" element={<SolitaireGame />} />
            <Route path="/verify/solitaire/:gameId" element={<SolitaireVerification />} />
            <Route path="/yahtzee" element={<YahtzeeGame />} />
            <Route path="/yahtzee/verify" element={<YahtzeeVerification />} />
            <Route path="/verify/yahtzee/:gameId" element={<YahtzeeVerification />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
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

// Basic inline styles (keeps everything in one file)
const styles = {
  app: { minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif', backgroundColor: '#1a1a2e', color: '#eee' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', backgroundColor: '#16213e' },
  logo: { fontSize: '1.25rem', fontWeight: 'bold', color: '#fff', textDecoration: 'none' },
  nav: { display: 'flex', gap: '1.5rem' },
  link: { color: '#a0a0ff', textDecoration: 'none' },
  main: { flex: 1, padding: '2rem' },
  footer: { textAlign: 'center', padding: '1rem', color: '#666', fontSize: '0.875rem' }
};

export default App;
