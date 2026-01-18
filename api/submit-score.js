/**
 * POST /api/submit-score
 *
 * ENHANCED with comprehensive server-side validation
 *
 * Verification steps:
 * 1. Rate limiting check
 * 2. Game ID format validation
 * 3. Blockchain verification (optional but recommended)
 * 4. Game-specific history validation
 * 5. Fraud detection
 * 6. Save to database with validation metadata
 */

import { createClient } from '@supabase/supabase-js';
import { validateGameSubmission, ValidationLevel } from './validation/index.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Configuration
const VALIDATION_LEVEL = process.env.VALIDATION_LEVEL || ValidationLevel.FULL;
const ENABLE_RATE_LIMITING = process.env.ENABLE_RATE_LIMITING !== 'false';
const ENABLE_FRAUD_DETECTION = process.env.ENABLE_FRAUD_DETECTION !== 'false';

/**
 * Fetch recent games from player for fraud detection
 */
async function getPlayerHistory(playerName, limit = 10) {
  if (!playerName || playerName === 'Anonymous') {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('LeaderBoard')
      .select('*')
      .eq('player_name', playerName)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching player history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching player history:', error);
    return [];
  }
}

/**
 * Main handler
 */
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
      // Game-specific history fields
      rollHistory,      // Yahtzee
      scorecard,        // Yahtzee
      roundHistory,     // Blackjack
      moveHistory,      // 2048, Backgammon
      highestTile,      // 2048
      winType,          // Backgammon
      difficulty,       // Backgammon, Garbage
      cubeValue,        // Backgammon
      rounds            // Garbage
    } = req.body;

    // Validate required fields
    if (!game || !gameId || score === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['game', 'gameId', 'score']
      });
    }

    // Prepare submission object for validation
    const submission = {
      game,
      gameId,
      playerName: playerName || 'Anonymous',
      score,
      timeSeconds,
      moves,
      blockHeight,
      blockHash,
      txHash,
      blockTimestamp,
      txIndex,
      seed,
      // Game-specific fields
      rollHistory,
      scorecard,
      roundHistory,
      moveHistory,
      highestTile,
      winType,
      difficulty,
      cubeValue,
      rounds
    };

    // Fetch player history for fraud detection
    const playerHistory = ENABLE_FRAUD_DETECTION
      ? await getPlayerHistory(playerName)
      : [];

    // COMPREHENSIVE VALIDATION
    const validationOptions = {
      skipBlockchain: !blockHash || !blockHeight, // Skip if no blockchain data
      skipFraud: !ENABLE_FRAUD_DETECTION,
      playerHistory
    };

    const validation = await validateGameSubmission(submission, validationOptions);

    // Check validation result
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Validation failed',
        reason: validation.reason,
        validationResults: validation.validationResults,
        riskScore: validation.riskScore
      });
    }

    // Prepare database insert
    const insertData = {
      game,
      game_id: gameId,
      player_name: playerName || 'Anonymous',
      score,
      time_seconds: timeSeconds || 0,
      moves: moves || 0,
      block_height: blockHeight,
      block_hash: blockHash,
      tx_hash: txHash,
      block_timestamp: blockTimestamp,
      created_at: new Date().toISOString()
    };

    // Add validation metadata (optional - requires schema update)
    if (validation.validationResults) {
      insertData.validation_passed = true;

      // Add fraud risk score if available
      if (validation.validationResults.fraudDetection) {
        insertData.fraud_risk_score = validation.validationResults.fraudDetection.riskScore;
        insertData.needs_review = validation.validationResults.needsReview || false;

        // Store flags as JSON array
        if (validation.validationResults.fraudDetection.flags.length > 0) {
          insertData.validation_flags = validation.validationResults.fraudDetection.flags;
        }
      }

      // Add calculated score if different from claimed
      if (validation.calculatedScore !== undefined && validation.calculatedScore !== score) {
        insertData.calculated_score = validation.calculatedScore;
      }
    }

    // Add transaction index and seed if provided
    if (txIndex !== undefined) {
      insertData.tx_index = txIndex;
    }
    if (seed) {
      insertData.seed = seed;
    }

    // Add game-specific history fields
    if (game === 'yahtzee' && rollHistory && Array.isArray(rollHistory)) {
      insertData.roll_history = rollHistory;
    }

    if (game === 'blackjack' && roundHistory && Array.isArray(roundHistory)) {
      insertData.round_history = roundHistory;
    }

    if (game === '2048') {
      if (moveHistory) {
        insertData.move_history = moveHistory;
      }
      if (highestTile) {
        insertData.highest_tile = highestTile;
      }
    }

    if ((game === 'backgammon' || game === 'garbage') && difficulty) {
      insertData.difficulty = difficulty;
    }

    if (game === 'backgammon') {
      if (winType) {
        insertData.win_type = winType;
      }
      if (cubeValue) {
        insertData.cube_value = cubeValue;
      }
    }

    // Insert to database
    const { data, error } = await supabase
      .from('LeaderBoard')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          error: 'Score already submitted for this game',
          duplicate: true
        });
      }

      // Log the error but don't expose details to client
      console.error('Database insert error:', error);
      throw error;
    }

    // Calculate rank
    let rankQuery = supabase
      .from('LeaderBoard')
      .select('*', { count: 'exact', head: true })
      .eq('game', game);

    // Game-specific ranking logic
    if (['blackjack', 'yahtzee', '2048', 'backgammon', 'garbage'].includes(game)) {
      // Higher score = better rank
      rankQuery = rankQuery.gt('score', score);
    } else {
      // Solitaire: higher cards + lower time = better (simplified)
      rankQuery = rankQuery.gt('score', score);
    }

    const { count } = await rankQuery;
    const rank = (count || 0) + 1;

    // Success response
    return res.status(200).json({
      success: true,
      verified: true,
      validationLevel: VALIDATION_LEVEL,
      rank,
      entry: data,
      validation: {
        passed: true,
        riskScore: validation.riskScore || 0,
        needsReview: validation.validationResults?.needsReview || false,
        calculatedScore: validation.calculatedScore
      }
    });

  } catch (error) {
    console.error('Submit score error:', error);
    return res.status(500).json({
      error: 'Failed to submit score',
      message: error.message
    });
  }
}
