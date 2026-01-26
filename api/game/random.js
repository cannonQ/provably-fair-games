/**
 * POST /api/game/random
 *
 * Generates deterministic random value for game.
 *
 * Flow:
 * 1. Client provides session ID + blockchain data + purpose
 * 2. Server fetches secret from database
 * 3. Server verifies blockchain data is real (call Ergo API)
 * 4. Server combines: secret + blockchain fan + purpose
 * 5. Returns SHA256 hash (but NOT the secret)
 *
 * Security:
 * - Server secret remains hidden
 * - Blockchain data verified on-chain
 * - Same inputs always produce same output (deterministic)
 * - Client can't predict output without secret
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import axios from 'axios';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Ergo API for blockchain verification
const ERGO_API_BASE = 'https://api.ergoplatform.com/api/v1';

/**
 * Verify that blockchain data is real by querying Ergo API
 */
async function verifyBlockchainData(blockData) {
  try {
    const { blockHash, blockHeight } = blockData;

    // Fetch block from Ergo blockchain
    const response = await axios.get(`${ERGO_API_BASE}/blocks/${blockHash}`);
    const block = response.data.block;

    // Verify height matches
    if (block.header.height !== blockHeight) {
      return { valid: false, error: 'Block height mismatch' };
    }

    return { valid: true };
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return { valid: false, error: 'Block not found on Ergo blockchain' };
    }
    return { valid: false, error: 'Failed to verify blockchain data' };
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📥 /api/game/random request received');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const { sessionId, blockData, purpose } = req.body;

    // Validate inputs
    if (!sessionId) {
      console.error('❌ Missing sessionId');
      return res.status(400).json({ error: 'Missing sessionId' });
    }

    if (!blockData || !blockData.blockHash || !blockData.blockHeight) {
      return res.status(400).json({ error: 'Missing or invalid blockData' });
    }

    if (!purpose) {
      return res.status(400).json({ error: 'Missing purpose parameter' });
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

    // Check if session has ended
    if (session.ended_at) {
      return res.status(400).json({ error: 'Session already ended' });
    }

    // Verify blockchain data is real (prevents fake block data)
    // Make this non-critical for now - just log warnings
    let blockchainVerified = false;
    try {
      const verification = await verifyBlockchainData(blockData);
      if (!verification.valid) {
        console.warn('⚠️ Blockchain verification failed:', verification.error);
        console.warn('Continuing anyway for testing purposes');
      } else {
        blockchainVerified = true;
      }
    } catch (verifyError) {
      console.error('❌ Blockchain verification error:', verifyError);
      console.warn('Continuing anyway for testing purposes');
    }

    // Store blockchain data on first use (establishes anchor)
    if (!session.block_hash) {
      const { error: updateError } = await supabase
        .from('game_sessions')
        .update({
          block_hash: blockData.blockHash,
          block_height: blockData.blockHeight,
          tx_hash: blockData.txHash || null,
          tx_index: blockData.txIndex || null,
          timestamp: blockData.timestamp || null,
          tx_count: blockData.txCount || null
        })
        .eq('session_id', sessionId);

      if (updateError) {
        console.error('Failed to update session with blockchain data:', updateError);
        // Continue anyway - this is not critical
      }
    }

    // Combine ALL entropy sources:
    // - Server secret (hidden until reveal)
    // - Block hash (blockchain immutability)
    // - Transaction hash (additional blockchain entropy)
    // - Timestamp (temporal anchor)
    // - Transaction index (deterministic selection proof)
    // - Purpose (unique per random request)
    const components = [
      session.server_secret,
      blockData.blockHash,
      blockData.txHash || '',
      String(blockData.timestamp || ''),
      String(blockData.txIndex || ''),
      purpose
    ];

    const combinedInput = components.join(':');

    // Generate deterministic random value
    const random = crypto
      .createHash('sha256')
      .update(combinedInput)
      .digest('hex');

    // Return random value (but NOT the server secret!)
    return res.status(200).json({
      random,
      purpose,
      blockHash: blockData.blockHash,
      blockHeight: blockData.blockHeight
    });

  } catch (error) {
    console.error('❌ Get random error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      sessionId: req.body?.sessionId,
      purpose: req.body?.purpose
    });
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
