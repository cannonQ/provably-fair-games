# Supabase Schema Updates (Optional)

These schema updates are **optional** but recommended for storing validation metadata and fraud detection results.

## Current Status

The enhanced API endpoint works with your **existing schema**. It will simply skip storing validation metadata if these columns don't exist.

## Recommended Schema Updates

### 1. Add Validation Metadata Columns

Run this SQL in your Supabase SQL Editor:

```sql
-- Add validation metadata columns to LeaderBoard table
ALTER TABLE "LeaderBoard"
ADD COLUMN IF NOT EXISTS validation_passed BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS fraud_risk_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS validation_flags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS needs_review BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS calculated_score INTEGER;

-- Add indexes for querying flagged submissions
CREATE INDEX IF NOT EXISTS idx_leaderboard_needs_review
ON "LeaderBoard" (needs_review)
WHERE needs_review = true;

CREATE INDEX IF NOT EXISTS idx_leaderboard_fraud_risk
ON "LeaderBoard" (fraud_risk_score)
WHERE fraud_risk_score > 50;

-- Add comments
COMMENT ON COLUMN "LeaderBoard".validation_passed IS 'Did submission pass validation';
COMMENT ON COLUMN "LeaderBoard".fraud_risk_score IS 'Fraud detection risk score (0-100)';
COMMENT ON COLUMN "LeaderBoard".validation_flags IS 'Array of validation warning flags';
COMMENT ON COLUMN "LeaderBoard".needs_review IS 'Flagged for manual review';
COMMENT ON COLUMN "LeaderBoard".calculated_score IS 'Server-calculated score (if different from claimed)';
```

### 2. Create Admin View for Flagged Submissions (Optional)

```sql
-- Create view for admin review dashboard
CREATE OR REPLACE VIEW flagged_submissions AS
SELECT
  id,
  game,
  game_id,
  player_name,
  score,
  calculated_score,
  fraud_risk_score,
  validation_flags,
  created_at,
  CASE
    WHEN fraud_risk_score >= 75 THEN 'HIGH_RISK'
    WHEN fraud_risk_score >= 50 THEN 'MEDIUM_RISK'
    WHEN fraud_risk_score >= 25 THEN 'LOW_RISK'
    ELSE 'NORMAL'
  END as risk_level
FROM "LeaderBoard"
WHERE needs_review = true
ORDER BY fraud_risk_score DESC, created_at DESC;
```

## What These Columns Do

### `validation_passed` (BOOLEAN)
- Indicates if the submission passed validation
- Default: `true` (for backwards compatibility)
- **Use**: Filter out invalid submissions

### `fraud_risk_score` (INTEGER, 0-100)
- Risk score from fraud detection system
- 0-25: Normal
- 25-50: Low risk (monitored)
- 50-75: Medium risk (flagged)
- 75-100: High risk (rejected or needs review)
- **Use**: Sort by risk, flag suspicious players

### `validation_flags` (JSONB ARRAY)
- Array of warning flags from validation
- Examples: `["Perfect score achieved in 45s", "Average 0.2s per move"]`
- **Use**: Display reasons why submission was flagged

### `needs_review` (BOOLEAN)
- Whether submission needs manual admin review
- Set automatically based on risk score (≥50)
- **Use**: Admin dashboard to review suspicious submissions

### `calculated_score` (INTEGER)
- Score calculated by server from game history
- Only set if different from claimed score
- **Use**: Detect score manipulation attempts

## Do You Need These Columns?

### ✅ YES, if you want:
- Admin review dashboard
- Fraud detection analytics
- Manual approval workflow
- Audit trail for compliance

### ❌ NO, if you're okay with:
- Automatic rejection of suspicious scores
- No admin dashboard (validation happens automatically)
- No historical fraud data

## Summary

**You do NOT need to make any Supabase changes right now.**

The enhanced API will work with your existing schema. If you want to store validation metadata later, just run the SQL above.

**Recommendation**: Start without schema changes, add columns later if needed.
