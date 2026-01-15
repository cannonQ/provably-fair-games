/**
 * Leaderboard Component
 * 
 * Displays scores ranked by: cards to foundation > time > moves
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

const getRankDisplay = (rank) => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
};

export default function Leaderboard({ game, currentGameId = null }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [game]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/leaderboard?game=${game}&limit=20`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch');
      }

      setEntries(data.entries || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading leaderboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          Failed to load leaderboard
          <button onClick={fetchLeaderboard} style={styles.retryBtn}>Retry</button>
        </div>
      </div>
    );
  }

  const isSolitaire = game === 'solitaire';

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>
          🏆 {game.charAt(0).toUpperCase() + game.slice(1)} Leaderboard
        </h2>
        <button onClick={fetchLeaderboard} style={styles.refreshBtn}>↻ Refresh</button>
      </div>

      {isSolitaire && (
        <p style={styles.subtitle}>
          Ranked by: Cards → Time → Moves
        </p>
      )}

      {entries.length === 0 ? (
        <div style={styles.empty}>No scores yet. Be the first!</div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Rank</th>
                <th style={styles.th}>Player</th>
                <th style={styles.th}>{isSolitaire ? 'Cards' : 'Score'}</th>
                <th style={styles.th}>Time</th>
                <th style={styles.th}>Moves</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Proof</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const isCurrentGame = entry.game_id === currentGameId;
                const isWin = isSolitaire && entry.score === 52;
                
                return (
                  <tr 
                    key={entry.id} 
                    style={{
                      ...styles.tr,
                      backgroundColor: isCurrentGame ? 'rgba(76, 175, 80, 0.2)' : 'transparent'
                    }}
                  >
                    <td style={styles.td}>
                      <span style={styles.rank}>{getRankDisplay(entry.rank)}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.playerName}>
                        {entry.player_name}
                        {isCurrentGame && <span style={styles.youBadge}> ← You</span>}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.score,
                        color: isWin ? '#4caf50' : (isSolitaire ? '#64b5f6' : '#4ade80')
                      }}>
                        {isSolitaire ? `${entry.score}/52` : entry.score.toLocaleString()}
                        {isWin && ' ✓'}
                      </span>
                    </td>
                    <td style={styles.td}>{formatTime(entry.time_seconds)}</td>
                    <td style={styles.td}>{entry.moves}</td>
                    <td style={styles.td}>{formatDate(entry.created_at)}</td>
                    <td style={styles.td}>
                      <Link 
                        to={`/verify/${game}/${entry.game_id}`}
                        style={styles.proofLink}
                      >
                        ✓ Verify
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: '12px',
    padding: '20px',
    maxWidth: '800px',
    margin: '20px auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  title: {
    margin: 0,
    fontSize: '20px',
    color: '#fff'
  },
  subtitle: {
    margin: '0 0 15px 0',
    fontSize: '12px',
    color: '#888'
  },
  refreshBtn: {
    padding: '6px 12px',
    backgroundColor: '#2a3a5e',
    color: '#aaa',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  loading: {
    textAlign: 'center',
    color: '#888',
    padding: '40px'
  },
  error: {
    textAlign: 'center',
    color: '#f87171',
    padding: '40px'
  },
  retryBtn: {
    marginLeft: '10px',
    padding: '6px 12px',
    backgroundColor: '#2196f3',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    padding: '40px',
    fontSize: '16px'
  },
  tableWrapper: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  },
  th: {
    textAlign: 'left',
    padding: '12px 8px',
    borderBottom: '2px solid #2a3a5e',
    color: '#888',
    fontWeight: 'normal',
    fontSize: '11px',
    textTransform: 'uppercase'
  },
  tr: {
    borderBottom: '1px solid #2a3a5e'
  },
  td: {
    padding: '12px 8px',
    color: '#ddd'
  },
  rank: {
    fontSize: '14px'
  },
  playerName: {
    fontWeight: 'bold',
    color: '#fff'
  },
  youBadge: {
    color: '#4caf50',
    fontWeight: 'normal',
    fontSize: '12px'
  },
  score: {
    fontWeight: 'bold'
  },
  proofLink: {
    color: '#64b5f6',
    textDecoration: 'none',
    fontSize: '12px'
  }
};
