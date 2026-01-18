/**
 * Consolidated Admin API Endpoint
 *
 * Handles all admin functionality in a single serverless function
 * to avoid Vercel Hobby plan's 12 function limit
 *
 * Routes:
 * - GET  /api/admin?action=flagged-submissions
 * - POST /api/admin?action=review-submission
 * - GET  /api/admin?action=validation-stats
 */

import { createClient } from '@supabase/supabase-js';

// SECURITY: Credentials must be set in environment variables
// Never use fallback values for credentials - fail fast if not configured
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Get flagged submissions
 */
async function getFlaggedSubmissions(req, res) {
  try {
    const {
      limit = 50,
      offset = 0,
      game,
      minRisk = 50
    } = req.query;

    let query = supabase
      .from('flagged_submissions')
      .select('*')
      .gte('fraud_risk_score', minRisk)
      .order('fraud_risk_score', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (game) {
      query = query.eq('game', game);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      count: data.length,
      flagged: data,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: data.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching flagged submissions:', error);
    return res.status(500).json({
      error: 'Failed to fetch flagged submissions',
      message: error.message
    });
  }
}

/**
 * Review submission (approve or reject)
 */
async function reviewSubmission(req, res) {
  try {
    const { id, action, notes } = req.body;

    if (!id || !action) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['id', 'action']
      });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        error: 'Invalid action',
        valid: ['approve', 'reject']
      });
    }

    // Get the submission first
    const { data: submission, error: fetchError } = await supabase
      .from('LeaderBoard')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !submission) {
      return res.status(404).json({
        error: 'Submission not found',
        id
      });
    }

    if (action === 'approve') {
      const { data, error } = await supabase
        .from('LeaderBoard')
        .update({
          needs_review: false,
          admin_reviewed_at: new Date().toISOString(),
          admin_notes: notes || null,
          admin_action: 'approved'
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res.status(200).json({
        success: true,
        action: 'approved',
        submission: data
      });

    } else if (action === 'reject') {
      const { error } = await supabase
        .from('LeaderBoard')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return res.status(200).json({
        success: true,
        action: 'rejected',
        deleted: true,
        id
      });
    }

  } catch (error) {
    console.error('Error reviewing submission:', error);
    return res.status(500).json({
      error: 'Failed to review submission',
      message: error.message
    });
  }
}

/**
 * Get validation statistics
 */
async function getValidationStats(req, res) {
  try {
    const { game, days = 7 } = req.query;

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));
    const dateThreshold = daysAgo.toISOString();

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
          low: 0,
          medium: 0,
          high: 0,
          critical: 0
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

    // Calculate risk distribution
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
      delete gameStats.totalScore;
    });

    // Top validation flags
    submissions.forEach(s => {
      if (s.validation_flags && Array.isArray(s.validation_flags)) {
        s.validation_flags.forEach(flag => {
          stats.topFlags[flag] = (stats.topFlags[flag] || 0) + 1;
        });
      }
    });

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

/**
 * Authenticate admin request
 */
function authenticateAdmin(req) {
  const authHeader = req.headers.authorization;

  // SECURITY: Admin password must be set in environment variable
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedPassword) {
    console.error('CRITICAL: ADMIN_PASSWORD environment variable not set');
    return { authenticated: false, error: 'Server configuration error' };
  }

  // Check for Authorization header
  if (!authHeader) {
    return { authenticated: false, error: 'Missing Authorization header' };
  }

  // Extract token from "Bearer <token>" format
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : authHeader;

  // Validate password (constant-time comparison would be better)
  if (token !== expectedPassword) {
    return { authenticated: false, error: 'Invalid credentials' };
  }

  return { authenticated: true };
}

/**
 * Main handler - routes to appropriate function
 */
export default async function handler(req, res) {
  // Never cache admin data
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  // Authenticate all admin requests
  const auth = authenticateAdmin(req);
  if (!auth.authenticated) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: auth.error
    });
  }

  const { action } = req.query;

  // Route based on action parameter
  switch (action) {
    case 'flagged-submissions':
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      return getFlaggedSubmissions(req, res);

    case 'review-submission':
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      return reviewSubmission(req, res);

    case 'validation-stats':
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      return getValidationStats(req, res);

    default:
      return res.status(400).json({
        error: 'Invalid action',
        valid: ['flagged-submissions', 'review-submission', 'validation-stats']
      });
  }
}
