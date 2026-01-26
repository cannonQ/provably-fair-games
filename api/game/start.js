/**
 * POST /api/game/start
 *
 * Initiates a new game session with commit-reveal security.
 *
 * Flow:
 * 1. Server generates random secret (client never sees this)
 * 2. Server computes hash commitment
 * 3. Stores secret in database
 * 4. Returns only the hash to client (commitment)
 *
 * Security:
 * - Secret is hidden until game ends
 * - Hash commitment prevents server from changing secret later
 * - Client fetches blockchain data AFTER receiving commitment
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Valid game types
const VALID_GAME_TYPES = ['backgammon', 'blackjack', 'solitaire', 'yahtzee', 'garbage', '2048'];

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
    const { gameType } = req.body;

    // Validate game type
    if (!gameType) {
      return res.status(400).json({ error: 'Missing gameType parameter' });
    }

    if (!VALID_GAME_TYPES.includes(gameType)) {
      return res.status(400).json({
        error: 'Invalid game type',
        validTypes: VALID_GAME_TYPES
      });
    }

    // Generate server secret (32 bytes = 64 hex characters)
    // This is the ONLY time the secret exists in plaintext outside the database
    const serverSecret = crypto.randomBytes(32).toString('hex');

    // Compute commitment hash (this is what client sees)
    const secretHash = crypto
      .createHash('sha256')
      .update(serverSecret)
      .digest('hex');

    // Store in database
    const { data, error } = await supabase
      .from('game_sessions')
      .insert({
        game_type: gameType,
        server_secret: serverSecret,
        secret_hash: secretHash
      })
      .select('session_id, secret_hash, created_at')
      .single();

    if (error) {
      console.error('Database error creating session:', error);
      return res.status(500).json({ error: 'Failed to create game session' });
    }

    // Return commitment (NOT the secret!)
    return res.status(200).json({
      sessionId: data.session_id,
      secretHash: data.secret_hash,
      timestamp: data.created_at,
      message: 'Session created. Fetch blockchain data and begin game.'
    });

  } catch (error) {
    console.error('Start game error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
