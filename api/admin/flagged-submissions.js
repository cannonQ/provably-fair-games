/**
 * GET /api/admin/flagged-submissions
 *
 * Retrieve submissions flagged for manual review
 *
 * Query parameters:
 * - limit: Number of results (default: 50)
 * - offset: Pagination offset (default: 0)
 * - game: Filter by game type (optional)
 * - minRisk: Minimum risk score (default: 50)
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
    const {
      limit = 50,
      offset = 0,
      game,
      minRisk = 50
    } = req.query;

    // Query the admin view we created
    let query = supabase
      .from('flagged_submissions')
      .select('*')
      .gte('fraud_risk_score', minRisk)
      .order('fraud_risk_score', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by game if specified
    if (game) {
      query = query.eq('game', game);
    }

    const { data, error, count } = await query;

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
