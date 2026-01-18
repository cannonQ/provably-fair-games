/**
 * GET /api/admin/validation-stats
 *
 * Get validation and fraud detection statistics
 *
 * Query parameters:
 * - game: Filter by game type (optional)
 * - days: Number of days to analyze (default: 7)
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { game, days = 7 } = req.query;

    // Calculate date threshold
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));
    const dateThreshold = daysAgo.toISOString();

    // Build base query
    let query = supabase
      .from('LeaderBoard')
      .select('*')
      .gte('created_at', dateThreshold);

    if (game) {
      query = query.eq('game', game);
    }

    const { data: submissions, error } = await query;

    if (error) {
      throw error;
    }

    // Calculate statistics
    const stats = {
      timeframe: {
        days: parseInt(days),
        from: dateThreshold,
        to: new Date().toISOString()
      },
      total: {
        submissions: submissions.length,
        validated: submissions.filter(s => s.validation_passed !== false).length,
        rejected: submissions.filter(s => s.validation_passed === false).length
      },
      fraud: {
        flagged: submissions.filter(s => s.needs_review === true).length,
        averageRiskScore: 0,
        riskDistribution: {
          low: 0,      // 0-25
          medium: 0,   // 25-50
          high: 0,     // 50-75
          critical: 0  // 75-100
        }
      },
      byGame: {},
      topFlags: {},
      players: {
        total: new Set(submissions.map(s => s.player_name)).size,
        flagged: new Set(
          submissions
            .filter(s => s.needs_review === true)
            .map(s => s.player_name)
        ).size
      }
    };

    // Calculate risk distribution and average
    let totalRisk = 0;
    submissions.forEach(s => {
      const risk = s.fraud_risk_score || 0;
      totalRisk += risk;

      if (risk < 25) stats.fraud.riskDistribution.low++;
      else if (risk < 50) stats.fraud.riskDistribution.medium++;
      else if (risk < 75) stats.fraud.riskDistribution.high++;
      else stats.fraud.riskDistribution.critical++;
    });

    stats.fraud.averageRiskScore = submissions.length > 0
      ? Math.round(totalRisk / submissions.length)
      : 0;

    // Statistics by game
    submissions.forEach(s => {
      if (!stats.byGame[s.game]) {
        stats.byGame[s.game] = {
          total: 0,
          flagged: 0,
          averageScore: 0,
          totalScore: 0
        };
      }

      stats.byGame[s.game].total++;
      if (s.needs_review) stats.byGame[s.game].flagged++;
      stats.byGame[s.game].totalScore += s.score || 0;
    });

    // Calculate average scores
    Object.keys(stats.byGame).forEach(game => {
      const gameStats = stats.byGame[game];
      gameStats.averageScore = gameStats.total > 0
        ? Math.round(gameStats.totalScore / gameStats.total)
        : 0;
      delete gameStats.totalScore; // Remove intermediate calculation
    });

    // Top validation flags
    submissions.forEach(s => {
      if (s.validation_flags && Array.isArray(s.validation_flags)) {
        s.validation_flags.forEach(flag => {
          stats.topFlags[flag] = (stats.topFlags[flag] || 0) + 1;
        });
      }
    });

    // Sort top flags by count
    const sortedFlags = Object.entries(stats.topFlags)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([flag, count]) => ({ flag, count }));

    stats.topFlags = sortedFlags;

    return res.status(200).json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error fetching validation stats:', error);
    return res.status(500).json({
      error: 'Failed to fetch validation stats',
      message: error.message
    });
  }
}
