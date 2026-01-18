/**
 * POST /api/admin/review-submission
 *
 * Approve or reject a flagged submission
 *
 * Body:
 * {
 *   "id": 123,                    // LeaderBoard entry ID
 *   "action": "approve|reject",   // Review decision
 *   "notes": "string"             // Optional admin notes
 * }
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, action, notes } = req.body;

    // Validate required fields
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
      // Approve: Clear needs_review flag
      const { data, error } = await supabase
        .from('LeaderBoard')
        .update({
          needs_review: false,
          // Optionally add admin_reviewed timestamp and notes
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
      // Reject: Delete the submission or mark as invalid
      // Option 1: Delete completely
      const { error } = await supabase
        .from('LeaderBoard')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Option 2: Mark as invalid (requires additional column)
      // const { data, error } = await supabase
      //   .from('LeaderBoard')
      //   .update({
      //     validation_passed: false,
      //     needs_review: false,
      //     admin_reviewed_at: new Date().toISOString(),
      //     admin_notes: notes || null,
      //     admin_action: 'rejected'
      //   })
      //   .eq('id', id);

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
