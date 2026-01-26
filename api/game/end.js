/**
 * POST /api/game/end
 *
 * Ends game session and reveals server secret for verification.
 *
 * Flow:
 * 1. Client sends session ID + final game data
 * 2. Server marks session as ended
 * 3. Server reveals the server secret (first time client sees it!)
 * 4. Client verifies: SHA256(secret) === commitment hash
 *
 * Security:
 * - Secret only revealed AFTER game ends
 * - Client can verify server didn't change the secret
 * - Anyone can replay game with revealed secret
 * - Blockchain data provides additional verification
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, gameData } = req.body;

    // Validate session ID
    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }

    // Fetch session from database
    const { data: session, error: fetchError } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (fetchError || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if already ended
    if (session.ended_at) {
      // Already ended - just return the reveal data
      return res.status(200).json({
        sessionId: session.session_id,
        serverSecret: session.server_secret,
        secretHash: session.secret_hash,
        blockHash: session.block_hash,
        blockHeight: session.block_height,
        txHash: session.tx_hash,
        txIndex: session.tx_index,
        timestamp: session.timestamp,
        txCount: session.tx_count,
        endedAt: session.ended_at,
        alreadyEnded: true
      });
    }

    // Mark session as ended and store game data
    const { data: updatedSession, error: updateError } = await supabase
      .from('game_sessions')
      .update({
        ended_at: new Date().toISOString(),
        game_data: gameData || null
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to end session:', updateError);
      return res.status(500).json({ error: 'Failed to end session' });
    }

    // NOW reveal everything for verification
    return res.status(200).json({
      sessionId: updatedSession.session_id,

      // Server secret (REVEALED!)
      serverSecret: updatedSession.server_secret,
      secretHash: updatedSession.secret_hash,

      // Blockchain anchoring data
      blockHash: updatedSession.block_hash,
      blockHeight: updatedSession.block_height,
      txHash: updatedSession.tx_hash,
      txIndex: updatedSession.tx_index,
      timestamp: updatedSession.timestamp,
      txCount: updatedSession.tx_count,

      // Metadata
      gameType: updatedSession.game_type,
      startedAt: updatedSession.created_at,
      endedAt: updatedSession.ended_at,

      // Verification instructions
      verification: {
        message: 'Verify: SHA256(serverSecret) === secretHash',
        exploreBlock: updatedSession.block_hash
          ? `https://explorer.ergoplatform.com/en/blocks/${updatedSession.block_hash}`
          : null,
        exploreTx: updatedSession.tx_hash
          ? `https://explorer.ergoplatform.com/en/transactions/${updatedSession.tx_hash}`
          : null
      }
    });

  } catch (error) {
    console.error('End game error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
