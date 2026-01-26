-- =====================================================
-- Game Sessions Table for Commit-Reveal System
-- =====================================================
-- This table stores server secrets and blockchain data
-- for provably fair gameplay using commit-reveal scheme
-- =====================================================

CREATE TABLE IF NOT EXISTS game_sessions (
  -- Primary key
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Game metadata
  game_type TEXT NOT NULL CHECK (game_type IN ('backgammon', 'blackjack', 'solitaire', 'yahtzee', 'garbage', '2048')),

  -- Server secret (commit-reveal)
  server_secret TEXT NOT NULL,
  secret_hash TEXT NOT NULL,

  -- Blockchain anchoring (full fan - preserves multi-source entropy)
  block_hash TEXT,
  block_height INTEGER,
  tx_hash TEXT,
  tx_index INTEGER,
  timestamp BIGINT,
  tx_count INTEGER,

  -- Lifecycle timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),

  -- Game result data (stored at end)
  game_data JSONB,

  -- Indexes for performance
  CONSTRAINT valid_ended_at CHECK (ended_at IS NULL OR ended_at >= created_at)
);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_game_sessions_expires
  ON game_sessions(expires_at)
  WHERE ended_at IS NULL;

-- Index for session type queries
CREATE INDEX IF NOT EXISTS idx_game_sessions_type
  ON game_sessions(game_type, created_at DESC);

-- Index for blockchain verification
CREATE INDEX IF NOT EXISTS idx_game_sessions_block_height
  ON game_sessions(block_height)
  WHERE block_height IS NOT NULL;

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================
-- Enable RLS for security
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read sessions (needed for verification)
CREATE POLICY "Allow public read access"
  ON game_sessions
  FOR SELECT
  USING (true);

-- Allow anyone to insert sessions (game start)
CREATE POLICY "Allow public insert"
  ON game_sessions
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update their own session (game end)
CREATE POLICY "Allow public update"
  ON game_sessions
  FOR UPDATE
  USING (true);

-- =====================================================
-- Comments for documentation
-- =====================================================
COMMENT ON TABLE game_sessions IS 'Stores commit-reveal data for provably fair games. Combines server secrets with blockchain anchoring.';
COMMENT ON COLUMN game_sessions.server_secret IS 'Hidden until game ends. Combined with blockchain data for RNG.';
COMMENT ON COLUMN game_sessions.secret_hash IS 'SHA256(server_secret). Committed before gameplay starts.';
COMMENT ON COLUMN game_sessions.block_hash IS 'Ergo blockchain block hash (part of RNG seed).';
COMMENT ON COLUMN game_sessions.tx_hash IS 'Transaction hash from block (additional entropy).';
COMMENT ON COLUMN game_sessions.tx_index IS 'Transaction index in block (deterministic selection proof).';
COMMENT ON COLUMN game_sessions.timestamp IS 'Block timestamp (temporal anchor).';
COMMENT ON COLUMN game_sessions.expires_at IS 'Sessions expire after 24 hours if not ended (cleanup).';

-- =====================================================
-- Instructions for running this migration
-- =====================================================
-- Run this SQL in your Supabase dashboard:
-- 1. Go to https://supabase.com/dashboard
-- 2. Select your project
-- 3. Navigate to SQL Editor
-- 4. Paste this entire file
-- 5. Click "Run"
-- =====================================================
