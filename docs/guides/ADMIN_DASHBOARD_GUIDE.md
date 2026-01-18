# Admin Dashboard Guide

## Overview

Now that you've added the Supabase validation columns, you have access to a complete admin dashboard for reviewing flagged submissions.

---

## What's Included

### 1. Consolidated Admin API Endpoint

**Note**: To avoid Vercel's 12 serverless function limit on the Hobby plan, all admin functionality is consolidated into a single endpoint with an `action` parameter.

#### GET `/api/admin?action=flagged-submissions`
- Retrieves submissions flagged for manual review
- Sorted by risk score (highest first)
- Supports filtering by game and minimum risk score

**Query Parameters**:
```
?action=flagged-submissions  # Required: action type
&limit=50                    # Results per page (default: 50)
&offset=0                    # Pagination offset (default: 0)
&game=yahtzee                # Filter by game (optional)
&minRisk=50                  # Minimum risk score (default: 50)
```

**Response**:
```json
{
  "success": true,
  "count": 5,
  "flagged": [
    {
      "id": 123,
      "game": "yahtzee",
      "game_id": "YAH-1234567-abc",
      "player_name": "Alice",
      "score": 375,
      "calculated_score": 248,
      "fraud_risk_score": 78,
      "risk_level": "HIGH_RISK",
      "validation_flags": [
        "Perfect score achieved in 45s",
        "Average 0.2s per move"
      ],
      "created_at": "2026-01-18T..."
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

#### POST `/api/admin?action=review-submission`
- Approve or reject a flagged submission
- Adds admin review metadata

**Request Body**:
```json
{
  "id": 123,
  "action": "approve",  // or "reject"
  "notes": "Legitimate gameplay verified"
}
```

**Response**:
```json
{
  "success": true,
  "action": "approved",
  "submission": { ... }
}
```

**What happens**:
- **Approve**: Clears `needs_review` flag, adds review timestamp/notes
- **Reject**: Deletes submission from leaderboard

#### GET `/api/admin?action=validation-stats`
- Get validation and fraud detection statistics

**Query Parameters**:
```
?action=validation-stats  # Required: action type
&days=7                   # Timeframe in days (default: 7)
&game=yahtzee             # Filter by game (optional)
```

**Response**:
```json
{
  "success": true,
  "stats": {
    "timeframe": { "days": 7, "from": "...", "to": "..." },
    "total": {
      "submissions": 150,
      "validated": 145,
      "rejected": 5
    },
    "fraud": {
      "flagged": 12,
      "averageRiskScore": 18,
      "riskDistribution": {
        "low": 120,
        "medium": 18,
        "high": 8,
        "critical": 4
      }
    },
    "byGame": {
      "yahtzee": { "total": 50, "flagged": 5, "averageScore": 198 }
    },
    "topFlags": [
      { "flag": "Average 0.2s per move", "count": 8 },
      { "flag": "Perfect score achieved in 45s", "count": 5 }
    ],
    "players": {
      "total": 85,
      "flagged": 7
    }
  }
}
```

---

### 2. Admin Dashboard Component

**Location**: `src/components/AdminDashboard.jsx`

**Features**:
- ✅ View flagged submissions in real-time
- ✅ Sort by risk score
- ✅ Filter by game and risk level
- ✅ See validation flags and details
- ✅ Approve or reject with one click
- ✅ Add notes about review decisions
- ✅ View statistics and risk distribution
- ✅ Top fraud flags analysis

**Screenshot (Conceptual)**:
```
┌─────────────────────────────────────────────────────────────┐
│ Admin Dashboard - Validation Review                         │
├─────────────────────────────────────────────────────────────┤
│ Statistics (Last 7 Days)                                    │
│ ┌────────────┬────────────┬────────────┬────────────┐       │
│ │  Total     │  Flagged   │  Avg Risk  │  Players   │       │
│ │   150      │     12     │     18     │     85     │       │
│ └────────────┴────────────┴────────────┴────────────┘       │
│                                                              │
│ Risk Distribution:                                           │
│ Low (0-25)      ████████████████████████ 120                │
│ Medium (25-50)  ████ 18                                      │
│ High (50-75)    ██ 8                                         │
│ Critical (75+)  █ 4                                          │
│                                                              │
│ Flagged Submissions                                          │
│ Game: [All ▼]  Min Risk: [50 ▼]                            │
│                                                              │
│ ┌──────┬──────────┬────────┬───────┬───────┬────────────┐  │
│ │ Risk │ Game     │ Player │ Score │ Flags │ Actions    │  │
│ ├──────┼──────────┼────────┼───────┼───────┼────────────┤  │
│ │  78  │ Yahtzee  │ Alice  │  375  │   2   │ ✓ Approve  │  │
│ │      │          │        │       │       │ ✗ Reject   │  │
│ ├──────┼──────────┼────────┼───────┼───────┼────────────┤  │
│ │  65  │ 2048     │ Bob    │ 50000 │   1   │ ✓ Approve  │  │
│ │      │          │        │       │       │ ✗ Reject   │  │
│ └──────┴──────────┴────────┴───────┴───────┴────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

### 3. Admin Page

**Location**: `src/pages/Admin.jsx`

**Access**: `/admin` route

Simply renders the AdminDashboard component.

---

## Setup Instructions

### 1. Supabase Schema (DONE ✅)

You've already added the columns:
- ✅ `validation_passed`
- ✅ `fraud_risk_score`
- ✅ `validation_flags`
- ✅ `needs_review`
- ✅ `calculated_score`

### 2. Add Optional Admin Review Columns

For full admin functionality, add these additional columns:

```sql
-- Add admin review tracking columns
ALTER TABLE "LeaderBoard"
ADD COLUMN IF NOT EXISTS admin_reviewed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS admin_action VARCHAR(20);

COMMENT ON COLUMN "LeaderBoard".admin_reviewed_at IS 'When admin reviewed this submission';
COMMENT ON COLUMN "LeaderBoard".admin_notes IS 'Admin notes about review decision';
COMMENT ON COLUMN "LeaderBoard".admin_action IS 'Admin action taken (approved/rejected)';
```

### 3. Add Admin Route

Update your React Router to include the admin page:

```jsx
// In your App.jsx or routing file
import AdminPage from './pages/Admin';

// Add to your routes
<Route path="/admin" element={<AdminPage />} />
```

### 4. Deploy API Endpoints

The API endpoints are already created in:
- `api/admin/flagged-submissions.js`
- `api/admin/review-submission.js`
- `api/admin/validation-stats.js`

They'll work automatically when you deploy (Vercel serverless functions).

---

## Usage Guide

### Viewing Flagged Submissions

1. Navigate to `/admin` in your browser
2. Dashboard loads with recent statistics
3. Flagged submissions are displayed in a table
4. Use filters to narrow down by game or risk level

### Reviewing a Submission

1. Click on a submission row to see full details
2. Details panel shows:
   - Basic info (game, player, score)
   - Validation flags and risk score
   - Blockchain verification data
   - Full game history (if available)

3. Decision options:
   - **Approve**: Clears review flag, keeps on leaderboard
   - **Reject**: Removes from leaderboard permanently

4. Optionally add notes explaining your decision

### Understanding Risk Levels

Risk scores are calculated based on multiple signals:

| Risk Score | Level | Meaning | Recommendation |
|------------|-------|---------|----------------|
| 0-25 | LOW_RISK | Normal gameplay | Auto-accept |
| 25-50 | MEDIUM_RISK | Slightly suspicious | Monitor |
| 50-75 | HIGH_RISK | Very suspicious | Review |
| 75-100 | CRITICAL | High confidence fraud | Reject |

### Common Validation Flags

**Time-based**:
- "Perfect score achieved in 45s" - Too fast
- "Average 0.2s per move" - Below human minimum
- "Completed 52 cards in 10s" - Impossible timing

**Pattern-based**:
- "10/12 games are perfect (83%)" - Too consistent
- "Scores are suspiciously consistent (std dev: 2.1)" - Bot behavior
- "Submissions averaged 15s apart" - Rapid submissions

**Game-specific**:
- "Score mismatch: claimed 300, calculated 248" - Manipulation detected
- "Highest tile 4096 unlikely with only 200 moves" - Impossible progression
- "Score 50 too low for 10 rounds" - Correlation issue

---

## API Authentication (Optional but Recommended)

Currently, the admin endpoints are **unprotected**. For production, you should add authentication:

### Option 1: Simple Password

```javascript
// api/admin/flagged-submissions.js
export default async function handler(req, res) {
  // Check admin password
  const adminPassword = req.headers['x-admin-password'];
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ... rest of code
}
```

Then set `ADMIN_PASSWORD` environment variable.

### Option 2: Supabase Auth

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key
);

export default async function handler(req, res) {
  // Verify user is admin
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user || user.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ... rest of code
}
```

### Option 3: IP Whitelist

```javascript
const ADMIN_IPS = ['192.168.1.100', '10.0.0.5'];

export default async function handler(req, res) {
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  if (!ADMIN_IPS.includes(clientIp)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // ... rest of code
}
```

**For now, you can protect the route client-side or rely on security through obscurity (don't share the `/admin` URL).**

---

## Workflow Examples

### Daily Review Routine

1. **Morning**: Check statistics
   - View 7-day summary
   - Note any spikes in flagged submissions
   - Check top fraud flags

2. **Review high-risk submissions**
   - Filter by risk score ≥75 (critical)
   - Review each submission
   - Reject obvious fraud, approve legitimate play

3. **Investigate patterns**
   - Check if same player has multiple flags
   - Look for coordinated cheating
   - Ban repeat offenders

4. **Weekly**: Analyze trends
   - Which games have most fraud?
   - Are new fraud patterns emerging?
   - Adjust detection thresholds if needed

### Handling False Positives

Sometimes legitimate players get flagged:

**Common False Positives**:
- Expert players with very fast completion times
- Lucky perfect scores
- Multiple submissions from same location (family/friends)

**How to Handle**:
1. Review game history in detail
2. Check if player has consistent skill level
3. Add notes explaining approval
4. Consider adjusting fraud detection thresholds

---

## Statistics Interpretation

### Healthy Metrics

Good signs:
- ✅ Flagged rate < 5% of total submissions
- ✅ Average risk score < 25
- ✅ Most submissions in "low risk" category
- ✅ Few repeat offenders

Warning signs:
- ⚠️ Flagged rate > 10%
- ⚠️ Average risk score > 35
- ⚠️ Increasing critical risk submissions
- ⚠️ Same flags appearing repeatedly

### Taking Action on Trends

If you see concerning patterns:

1. **Adjust validation thresholds**
   - Tighten time limits for specific games
   - Lower perfect score tolerance
   - Increase required move counts

2. **Add new validation rules**
   - Detect emerging fraud patterns
   - Add game-specific checks
   - Improve pattern recognition

3. **Ban persistent cheaters**
   - Track player_name across submissions
   - Create blocklist if needed
   - Add IP-based rate limiting

---

## Advanced Features (Future)

### Potential Enhancements

1. **Player Profiles**
   - View all submissions from a player
   - Track player statistics over time
   - Flag suspicious player accounts

2. **Automated Actions**
   - Auto-reject submissions with risk > 90
   - Auto-approve submissions with risk < 10
   - Email alerts for critical flags

3. **Appeal System**
   - Players can appeal rejections
   - Admins can re-review
   - Community voting on edge cases

4. **Machine Learning**
   - Train ML model on approved/rejected submissions
   - Improve fraud detection accuracy
   - Reduce false positives

5. **Audit Logs**
   - Track all admin actions
   - See who approved/rejected what
   - Export for compliance

---

## Troubleshooting

### "No flagged submissions found"

**Possible causes**:
- No submissions have been flagged yet (good!)
- Filters too restrictive (try lowering minRisk)
- Validation not running (check API logs)

**Solution**: Lower the minimum risk score filter to 0 to see all submissions.

### API endpoints returning 404

**Cause**: Vercel may not have deployed the new `/api/admin/` endpoints yet.

**Solution**:
1. Make sure files exist in `api/admin/` directory
2. Commit and push changes
3. Trigger Vercel redeploy
4. Check Vercel dashboard for build errors

### Statistics showing 0 for everything

**Cause**: No submissions in the timeframe, or database query issue.

**Solution**:
1. Check if you have any submissions in LeaderBoard table
2. Verify the columns exist (validation_passed, fraud_risk_score, etc.)
3. Check browser console for API errors

### Admin dashboard not loading

**Cause**: React component import issue or missing dependencies.

**Solution**:
1. Check browser console for errors
2. Verify AdminDashboard.jsx is in correct location
3. Make sure route is added to React Router

---

## Security Considerations

### ⚠️ Important

The admin dashboard has **significant power**:
- Can delete submissions
- Can see player data
- Can bypass validation

**Best Practices**:

1. **Add authentication** (see API Authentication section above)
2. **Use HTTPS** in production
3. **Limit access** to trusted admins only
4. **Audit admin actions** (log who approved/rejected what)
5. **Backup data** before bulk deletions
6. **Review carefully** before rejecting (can't undo deletion)

---

## Summary

You now have:
- ✅ 3 admin API endpoints
- ✅ Full-featured admin dashboard component
- ✅ Statistics and analytics
- ✅ Approve/reject workflow
- ✅ Validation flags display
- ✅ Risk score visualization

**Next steps**:
1. Add optional admin review columns to Supabase (see Setup step 2)
2. Add `/admin` route to your React Router
3. Optionally add authentication to admin endpoints
4. Start monitoring flagged submissions!

**Access your admin dashboard at**: `http://localhost:3000/admin` (or your production URL)

---

## Quick Reference

### API Endpoints
```
GET  /api/admin?action=flagged-submissions&game=yahtzee&minRisk=50
POST /api/admin?action=review-submission
GET  /api/admin?action=validation-stats&days=7
```

### Risk Levels
```
0-25:   LOW_RISK     (auto-accept)
25-50:  MEDIUM_RISK  (monitor)
50-75:  HIGH_RISK    (review required)
75-100: CRITICAL     (likely fraud)
```

### Common Actions
```
Review submission → Click row → See details
Approve → Click Approve button → Add notes (optional) → Confirm
Reject → Click Reject button → Add notes (optional) → Confirm
Filter → Select game/risk from dropdowns
Stats → View automatically at top of dashboard
```

---

**Happy reviewing!** 🛡️

Your admin dashboard is ready to use. All flagged submissions will appear automatically as they're submitted.
