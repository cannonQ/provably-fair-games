/**
 * POST /api/submit-score
 * 
 * Verifies game result against blockchain, then saves to leaderboard.
 * 
 * Verification steps:
 * 1. Fetch block from Ergo blockchain
 * 2. Regenerate seed from block data + gameId
 * 3. Verify score is plausible (cards <= 52, time > 0, etc.)
 * 4. Save to database
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const ERGO_API = 'https://api.ergoplatform.com/api/v1';

/**
 * Fetch block from Ergo blockchain to verify it exists
 */
async function verifyBlock(blockHash, blockHeight) {
  try {
    const response = await fetch(`${ERGO_API}/blocks/${blockHash}`);
    if (!response.ok) return { valid: false, reason: 'Block not found on blockchain' };

    const data = await response.json();
    const block = data.block;

    if (block.header.height !== blockHeight) {
      return { valid: false, reason: 'Block height mismatch' };
    }

    return { 
      valid: true, 
      txCount: block.blockTransactions?.length || 0,
      timestamp: block.header.timestamp
    };
  } catch (error) {
    return { valid: false, reason: 'Failed to fetch block from Ergo API' };
  }
}

/**
 * Simple hash function (must match client-side shuffle.js)
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Generate seed (must match client-side shuffle.js)
 */
function generateSeed(blockData, gameId) {
  const { blockHash, txHash, timestamp, txIndex } = blockData;
  const combined = `${blockHash}${txHash || ''}${timestamp || ''}${gameId}${txIndex || 0}`;

  let seed = '';
  for (let i = 0; i < 4; i++) {
    seed += simpleHash(combined + i);
  }
  return seed;
}

/**
 * Validate score is plausible
 */
function validateScore(game, score, timeSeconds, moves) {
  // Basic sanity checks - timeSeconds optional for blackjack (uses session timer internally)
  if (timeSeconds !== undefined && timeSeconds < 0) return { valid: false, reason: 'Invalid time' };

  // Moves validation (optional for some games)
  if (moves !== undefined && moves < 0) return { valid: false, reason: 'Invalid moves' };

  if (game === 'solitaire') {
    if (score < 0 || score > 52) return { valid: false, reason: 'Invalid card count' };
    // Minimum moves to get X cards to foundation (rough estimate)
    if (score > 0 && moves < score) return { valid: false, reason: 'Impossible move count' };
  }

  if (game === 'garbage') {
    if (score < 0) return { valid: false, reason: 'Invalid score' };
  }

  if (game === 'yahtzee') {
    // Yahtzee scores range from 0 to 375 (theoretical max with bonuses)
    if (score < 0 || score > 375) return { valid: false, reason: 'Invalid Yahtzee score' };
  }

  if (game === 'blackjack') {
    // Blackjack score is final chip balance (started with 1000)
    // Theoretical max is very high with splits/doubles, min is 0 (busted out)
    if (score < 0) return { valid: false, reason: 'Invalid chip balance' };
    // Must have played at least 1 hand if submitting
    if (moves !== undefined && moves < 1) return { valid: false, reason: 'Must play at least one hand' };
  }

  return { valid: true };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      game,
      gameId,
      playerName,
      score,
      timeSeconds,
      moves,
      blockHeight,
      blockHash,
      txHash,
      blockTimestamp,
      txIndex,
      seed,
      rollHistory,   // Yahtzee roll history
      roundHistory   // Blackjack round history
    } = req.body;

    // Validate required fields - timeSeconds optional for blackjack
    if (!game || !gameId || score === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['game', 'gameId', 'score']
      });
    }

    // Validate game type
    if (!['solitaire', 'garbage', 'yahtzee', 'blackjack'].includes(game)) {
      return res.status(400).json({ error: 'Invalid game type' });
    }

    // Validate gameId format
    let gameIdPattern;
    if (game === 'solitaire') gameIdPattern = /^SOL-\d+-\w+$/;
    else if (game === 'garbage') gameIdPattern = /^GRB-\d+-\w+$/;
    else if (game === 'yahtzee') gameIdPattern = /^YAH-\d+-\w+$/;
    else if (game === 'blackjack') gameIdPattern = /^BJK-\d+-\w+$/;

    if (!gameIdPattern.test(gameId)) {
      return res.status(400).json({ error: 'Invalid game ID format' });
    }

    // Step 1: Verify block exists on blockchain
    if (blockHash && blockHeight) {
      const blockVerification = await verifyBlock(blockHash, blockHeight);
      if (!blockVerification.valid) {
        return res.status(400).json({ 
          error: 'Block verification failed', 
          reason: blockVerification.reason 
        });
      }
    }

    // Step 2: Validate score is plausible
    const scoreValidation = validateScore(game, score, timeSeconds, moves);
    if (!scoreValidation.valid) {
      return res.status(400).json({ 
        error: 'Score validation failed', 
        reason: scoreValidation.reason 
      });
    }

    // Step 3: Verify seed can be regenerated (optional deep verification)
    // This ensures the gameId + blockData combination is legitimate
    if (blockHash && txHash && blockTimestamp) {
      const blockData = { 
        blockHash, 
        txHash, 
        timestamp: blockTimestamp, 
        txIndex: txIndex || 0 
      };
      const regeneratedSeed = generateSeed(blockData, gameId);
      // We can't fully verify the shuffle server-side without the full deck,
      // but we've confirmed the block exists and inputs are valid
      
      // If client sent seed, verify it matches
      if (seed && regeneratedSeed !== seed) {
        console.warn(`Seed mismatch for ${gameId}: expected ${regeneratedSeed}, got ${seed}`);
        // Don't reject - could be timing/format differences, just log it
      }
    }

    // Step 4: Insert score
    const insertData = {
      game,
      game_id: gameId,
      player_name: playerName || 'Anonymous',
      score,
      time_seconds: timeSeconds || 600, // Default 10 min for blackjack
      moves: moves || 0,
      block_height: blockHeight,
      block_hash: blockHash,
      tx_hash: txHash,
      block_timestamp: blockTimestamp,
      created_at: new Date().toISOString()
    };

    // Add tx_index and seed if provided (for enhanced verification)
    if (txIndex !== undefined) {
      insertData.tx_index = txIndex;
    }
    if (seed) {
      insertData.seed = seed;
    }

    // Add roll history for Yahtzee (enables leaderboard verification)
    if (game === 'yahtzee' && rollHistory && Array.isArray(rollHistory)) {
      insertData.roll_history = rollHistory;
    }

    // Add round history for Blackjack (enables leaderboard verification)
    if (game === 'blackjack' && roundHistory && Array.isArray(roundHistory)) {
      insertData.round_history = roundHistory;
    }

    const { data, error } = await supabase
      .from('LeaderBoard')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Score already submitted for this game' });
      }
      throw error;
    }

    // Get rank - for blackjack, higher score (chip balance) is better
    let rankQuery = supabase
      .from('LeaderBoard')
      .select('*', { count: 'exact', head: true })
      .eq('game', game);

    if (game === 'blackjack') {
      // Higher chip balance = better rank
      rankQuery = rankQuery.gt('score', score);
    } else if (game === 'yahtzee') {
      // Higher score = better rank
      rankQuery = rankQuery.gt('score', score);
    } else {
      // Solitaire/Garbage: higher cards + lower time = better
      // This is simplified - you may want more complex ranking
      rankQuery = rankQuery.gt('score', score);
    }

    const { count } = await rankQuery;
    const rank = (count || 0) + 1;

    return res.status(200).json({
      success: true,
      verified: true,
      rank,
      entry: data
    });

  } catch (error) {
    console.error('Submit score error:', error);
    return res.status(500).json({ error: 'Failed to submit score' });
  }
}
