/**
 * Admin Dashboard for Reviewing Flagged Submissions
 *
 * Features:
 * - View flagged submissions sorted by risk score
 * - See validation flags and details
 * - Approve or reject submissions
 * - View validation statistics
 *
 * Usage:
 * <AdminDashboard />
 */

import React, { useState, useEffect } from 'react';

const AdminDashboard = () => {
  const [flaggedSubmissions, setFlaggedSubmissions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ game: 'all', minRisk: 50 });
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Fetch flagged submissions
  const fetchFlaggedSubmissions = async () => {
    try {
      const params = new URLSearchParams({
        limit: 50,
        minRisk: filter.minRisk
      });

      if (filter.game !== 'all') {
        params.append('game', filter.game);
      }

      const response = await fetch(`/api/admin/flagged-submissions?${params}`);
      const data = await response.json();

      if (data.success) {
        setFlaggedSubmissions(data.flagged);
      }
    } catch (error) {
      console.error('Error fetching flagged submissions:', error);
    }
  };

  // Fetch validation stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/validation-stats?days=7');
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Load data on mount and when filters change
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchFlaggedSubmissions(), fetchStats()]);
      setLoading(false);
    };

    loadData();
  }, [filter]);

  // Review submission (approve or reject)
  const reviewSubmission = async (id, action, notes = '') => {
    try {
      const response = await fetch('/api/admin/review-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, notes })
      });

      const data = await response.json();

      if (data.success) {
        // Remove from list
        setFlaggedSubmissions(prev => prev.filter(s => s.id !== id));
        setSelectedSubmission(null);
        alert(`Submission ${action}ed successfully`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error reviewing submission:', error);
      alert('Failed to review submission');
    }
  };

  if (loading) {
    return <div className="admin-dashboard loading">Loading admin dashboard...</div>;
  }

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard - Validation Review</h1>

      {/* Statistics Summary */}
      {stats && (
        <div className="stats-summary">
          <h2>Statistics (Last 7 Days)</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Submissions</h3>
              <p className="stat-value">{stats.total.submissions}</p>
            </div>
            <div className="stat-card">
              <h3>Flagged for Review</h3>
              <p className="stat-value warning">{stats.fraud.flagged}</p>
            </div>
            <div className="stat-card">
              <h3>Avg Risk Score</h3>
              <p className="stat-value">{stats.fraud.averageRiskScore}</p>
            </div>
            <div className="stat-card">
              <h3>Unique Players</h3>
              <p className="stat-value">{stats.players.total}</p>
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="risk-distribution">
            <h3>Risk Distribution</h3>
            <div className="distribution-bars">
              <div className="bar">
                <span className="label">Low (0-25)</span>
                <div className="bar-fill low" style={{ width: `${(stats.fraud.riskDistribution.low / stats.total.submissions) * 100}%` }}>
                  {stats.fraud.riskDistribution.low}
                </div>
              </div>
              <div className="bar">
                <span className="label">Medium (25-50)</span>
                <div className="bar-fill medium" style={{ width: `${(stats.fraud.riskDistribution.medium / stats.total.submissions) * 100}%` }}>
                  {stats.fraud.riskDistribution.medium}
                </div>
              </div>
              <div className="bar">
                <span className="label">High (50-75)</span>
                <div className="bar-fill high" style={{ width: `${(stats.fraud.riskDistribution.high / stats.total.submissions) * 100}%` }}>
                  {stats.fraud.riskDistribution.high}
                </div>
              </div>
              <div className="bar">
                <span className="label">Critical (75-100)</span>
                <div className="bar-fill critical" style={{ width: `${(stats.fraud.riskDistribution.critical / stats.total.submissions) * 100}%` }}>
                  {stats.fraud.riskDistribution.critical}
                </div>
              </div>
            </div>
          </div>

          {/* Top Flags */}
          {stats.topFlags && stats.topFlags.length > 0 && (
            <div className="top-flags">
              <h3>Most Common Flags</h3>
              <ul>
                {stats.topFlags.map(({ flag, count }, idx) => (
                  <li key={idx}>
                    <span className="flag-text">{flag}</span>
                    <span className="flag-count">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="filters">
        <h2>Flagged Submissions</h2>
        <div className="filter-controls">
          <label>
            Game:
            <select value={filter.game} onChange={(e) => setFilter({ ...filter, game: e.target.value })}>
              <option value="all">All Games</option>
              <option value="yahtzee">Yahtzee</option>
              <option value="backgammon">Backgammon</option>
              <option value="blackjack">Blackjack</option>
              <option value="2048">2048</option>
              <option value="solitaire">Solitaire</option>
              <option value="garbage">Garbage</option>
            </select>
          </label>

          <label>
            Min Risk Score:
            <select value={filter.minRisk} onChange={(e) => setFilter({ ...filter, minRisk: parseInt(e.target.value) })}>
              <option value="0">0 (All)</option>
              <option value="25">25 (Low+)</option>
              <option value="50">50 (Medium+)</option>
              <option value="75">75 (Critical)</option>
            </select>
          </label>
        </div>
      </div>

      {/* Flagged Submissions List */}
      <div className="submissions-list">
        {flaggedSubmissions.length === 0 ? (
          <p className="no-results">No flagged submissions found</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Risk</th>
                <th>Game</th>
                <th>Player</th>
                <th>Score</th>
                <th>Calculated</th>
                <th>Flags</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {flaggedSubmissions.map((submission) => (
                <tr
                  key={submission.id}
                  className={selectedSubmission?.id === submission.id ? 'selected' : ''}
                  onClick={() => setSelectedSubmission(submission)}
                >
                  <td>
                    <span className={`risk-badge risk-${submission.risk_level.toLowerCase()}`}>
                      {submission.fraud_risk_score}
                    </span>
                  </td>
                  <td>{submission.game}</td>
                  <td>{submission.player_name}</td>
                  <td>{submission.score}</td>
                  <td>{submission.calculated_score || '-'}</td>
                  <td className="flags-cell">
                    {submission.validation_flags && submission.validation_flags.length > 0 ? (
                      <span className="flag-count-badge">{submission.validation_flags.length}</span>
                    ) : '-'}
                  </td>
                  <td>{new Date(submission.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn-approve"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Approve this submission?')) {
                          reviewSubmission(submission.id, 'approve');
                        }
                      }}
                    >
                      Approve
                    </button>
                    <button
                      className="btn-reject"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Reject and delete this submission?')) {
                          reviewSubmission(submission.id, 'reject');
                        }
                      }}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Selected Submission Details */}
      {selectedSubmission && (
        <div className="submission-details">
          <h3>Submission Details</h3>
          <button className="close-btn" onClick={() => setSelectedSubmission(null)}>×</button>

          <div className="details-grid">
            <div className="detail-section">
              <h4>Basic Info</h4>
              <p><strong>ID:</strong> {selectedSubmission.id}</p>
              <p><strong>Game ID:</strong> {selectedSubmission.game_id}</p>
              <p><strong>Player:</strong> {selectedSubmission.player_name}</p>
              <p><strong>Score:</strong> {selectedSubmission.score}</p>
              <p><strong>Calculated Score:</strong> {selectedSubmission.calculated_score || 'N/A'}</p>
              <p><strong>Time:</strong> {selectedSubmission.time_seconds}s</p>
              <p><strong>Moves:</strong> {selectedSubmission.moves || 'N/A'}</p>
            </div>

            <div className="detail-section">
              <h4>Validation</h4>
              <p><strong>Risk Score:</strong> {selectedSubmission.fraud_risk_score}</p>
              <p><strong>Risk Level:</strong> {selectedSubmission.risk_level}</p>
              <p><strong>Validation Passed:</strong> {selectedSubmission.validation_passed ? 'Yes' : 'No'}</p>

              {selectedSubmission.validation_flags && selectedSubmission.validation_flags.length > 0 && (
                <div className="flags-list">
                  <strong>Flags:</strong>
                  <ul>
                    {selectedSubmission.validation_flags.map((flag, idx) => (
                      <li key={idx}>{flag}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="detail-section">
              <h4>Blockchain</h4>
              <p><strong>Block Hash:</strong> <code>{selectedSubmission.block_hash?.substring(0, 16)}...</code></p>
              <p><strong>Block Height:</strong> {selectedSubmission.block_height}</p>
              <p><strong>Seed:</strong> <code>{selectedSubmission.seed?.substring(0, 16)}...</code></p>
            </div>
          </div>

          <div className="review-actions">
            <h4>Review Actions</h4>
            <textarea
              placeholder="Add notes about this review (optional)"
              rows="3"
              id={`notes-${selectedSubmission.id}`}
            />
            <div className="action-buttons">
              <button
                className="btn-approve-large"
                onClick={() => {
                  const notes = document.getElementById(`notes-${selectedSubmission.id}`).value;
                  if (confirm('Approve this submission?')) {
                    reviewSubmission(selectedSubmission.id, 'approve', notes);
                  }
                }}
              >
                ✓ Approve Submission
              </button>
              <button
                className="btn-reject-large"
                onClick={() => {
                  const notes = document.getElementById(`notes-${selectedSubmission.id}`).value;
                  if (confirm('Reject and delete this submission?')) {
                    reviewSubmission(selectedSubmission.id, 'reject', notes);
                  }
                }}
              >
                ✗ Reject & Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-dashboard {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .loading {
          text-align: center;
          padding: 40px;
          font-size: 18px;
        }

        h1 {
          margin-bottom: 30px;
          color: #333;
        }

        h2 {
          margin: 30px 0 15px 0;
          color: #555;
        }

        .stats-summary {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .stat-card h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #666;
          text-transform: uppercase;
        }

        .stat-value {
          margin: 0;
          font-size: 32px;
          font-weight: bold;
          color: #333;
        }

        .stat-value.warning {
          color: #e74c3c;
        }

        .risk-distribution {
          margin: 20px 0;
        }

        .distribution-bars {
          margin-top: 10px;
        }

        .bar {
          margin: 10px 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .bar .label {
          min-width: 120px;
          font-size: 14px;
        }

        .bar-fill {
          background: #3498db;
          color: white;
          padding: 8px 12px;
          border-radius: 4px;
          font-weight: bold;
          min-width: 40px;
          text-align: center;
        }

        .bar-fill.low { background: #2ecc71; }
        .bar-fill.medium { background: #f39c12; }
        .bar-fill.high { background: #e67e22; }
        .bar-fill.critical { background: #e74c3c; }

        .top-flags ul {
          list-style: none;
          padding: 0;
        }

        .top-flags li {
          display: flex;
          justify-content: space-between;
          padding: 8px;
          background: white;
          margin: 5px 0;
          border-radius: 4px;
        }

        .flag-count {
          font-weight: bold;
          color: #e74c3c;
        }

        .filters {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .filter-controls {
          display: flex;
          gap: 20px;
          margin-top: 10px;
        }

        .filter-controls label {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .filter-controls select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .submissions-list {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .no-results {
          text-align: center;
          padding: 40px;
          color: #999;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          background: #f8f9fa;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #555;
          border-bottom: 2px solid #dee2e6;
        }

        td {
          padding: 12px;
          border-bottom: 1px solid #e9ecef;
        }

        tr:hover {
          background: #f8f9fa;
          cursor: pointer;
        }

        tr.selected {
          background: #e3f2fd;
        }

        .risk-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: bold;
          font-size: 12px;
          color: white;
        }

        .risk-badge.risk-low_risk { background: #2ecc71; }
        .risk-badge.risk-medium_risk { background: #f39c12; }
        .risk-badge.risk-high_risk { background: #e67e22; }
        .risk-badge.risk-critical { background: #e74c3c; }

        .flag-count-badge {
          background: #e74c3c;
          color: white;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: bold;
        }

        button {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          margin: 0 4px;
        }

        .btn-approve {
          background: #2ecc71;
          color: white;
        }

        .btn-approve:hover {
          background: #27ae60;
        }

        .btn-reject {
          background: #e74c3c;
          color: white;
        }

        .btn-reject:hover {
          background: #c0392b;
        }

        .submission-details {
          position: fixed;
          right: 20px;
          top: 20px;
          width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
          padding: 20px;
          z-index: 1000;
        }

        .close-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          background: #e74c3c;
          color: white;
          border: none;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          font-size: 20px;
          cursor: pointer;
          line-height: 1;
        }

        .details-grid {
          margin: 20px 0;
        }

        .detail-section {
          margin: 15px 0;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .detail-section h4 {
          margin: 0 0 10px 0;
          color: #555;
        }

        .detail-section p {
          margin: 8px 0;
          font-size: 14px;
        }

        .detail-section code {
          background: #e9ecef;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 12px;
        }

        .flags-list ul {
          margin: 8px 0;
          padding-left: 20px;
        }

        .flags-list li {
          margin: 4px 0;
          color: #e74c3c;
        }

        .review-actions {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 2px solid #e9ecef;
        }

        .review-actions textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: inherit;
          margin: 10px 0;
        }

        .action-buttons {
          display: flex;
          gap: 10px;
        }

        .btn-approve-large,
        .btn-reject-large {
          flex: 1;
          padding: 12px 20px;
          font-size: 16px;
          font-weight: bold;
        }

        .btn-approve-large {
          background: #2ecc71;
          color: white;
        }

        .btn-approve-large:hover {
          background: #27ae60;
        }

        .btn-reject-large {
          background: #e74c3c;
          color: white;
        }

        .btn-reject-large:hover {
          background: #c0392b;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
