# Commit-Reveal System Testing Guide

## 🎯 Chunk 1 Complete: Backend Foundation

All backend infrastructure for the commit-reveal system is now in place.

### ✅ What Was Built

1. **Database Schema** (`supabase-migrations/001_game_sessions.sql`)
   - `game_sessions` table with RLS policies
   - Tracks server secrets + blockchain anchoring
   - Auto-expiration after 24 hours

2. **API Endpoints**
   - `POST /api/game/start` - Server commits secret
   - `POST /api/game/random` - Combines secret + blockchain
   - `POST /api/game/end` - Reveals secret for verification

3. **Client Library** (`src/blockchain/secureRng.js`)
   - `startSecureGame()` - Initialize session
   - `getSecureRandom()` - Get random values
   - `endSecureSession()` - End and verify
   - `verifyRandomValue()` - Replay verification

---

## 🚀 Setup Instructions

### Step 1: Create Database Table

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Open `supabase-migrations/001_game_sessions.sql`
5. Copy the entire contents
6. Paste into SQL Editor
7. Click **Run**

You should see: `Success. No rows returned`

### Step 2: Verify Environment Variables

Make sure these are set in your `.env` or Vercel dashboard:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Step 3: Deploy to Vercel (or test locally)

```bash
# If testing locally with Vercel dev:
npm install -g vercel
vercel dev

# Or deploy to Vercel:
git add .
git commit -m "Add commit-reveal backend infrastructure"
git push origin claude/commit-reveal-system-ZT6oE
vercel --prod
```

---

## 🧪 Testing the APIs

### Test 1: Start a Session

```bash
curl -X POST https://your-domain.vercel.app/api/game/start \
  -H "Content-Type: application/json" \
  -d '{"gameType": "backgammon"}'
```

**Expected Response:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "secretHash": "a3c5e8d9f2b4a7c1e9d8b7a6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6",
  "timestamp": "2026-01-26T15:30:00.000Z",
  "message": "Session created. Fetch blockchain data and begin game."
}
```

**What to check:**
- ✅ Returns `sessionId` (UUID format)
- ✅ Returns `secretHash` (64-char hex)
- ✅ Status code 200

**Save the sessionId for next tests!**

---

### Test 2: Get Random Value

First, you need blockchain data. You can get this from the Ergo API:

```bash
curl https://api.ergoplatform.com/api/v1/blocks?limit=1
```

Extract: `height`, `id` (block hash)

Then request random:

```bash
curl -X POST https://your-domain.vercel.app/api/game/random \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "blockData": {
      "blockHash": "actual-block-hash-from-ergo",
      "blockHeight": 123456
    },
    "purpose": "test-roll-1"
  }'
```

**Expected Response:**
```json
{
  "random": "e7d8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8",
  "purpose": "test-roll-1",
  "blockHash": "actual-block-hash-from-ergo",
  "blockHeight": 123456
}
```

**What to check:**
- ✅ Returns `random` (64-char hex)
- ✅ Status code 200
- ✅ Same inputs always give same output (deterministic)

**Try again with same inputs - should get identical random value!**

---

### Test 3: End Session and Verify

```bash
curl -X POST https://your-domain.vercel.app/api/game/end \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "gameData": {
      "score": 100,
      "testNote": "This is test data"
    }
  }'
```

**Expected Response:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "serverSecret": "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2",
  "secretHash": "a3c5e8d9f2b4a7c1e9d8b7a6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6",
  "blockHash": "...",
  "blockHeight": 123456,
  "gameType": "backgammon",
  "startedAt": "...",
  "endedAt": "...",
  "verification": {
    "message": "Verify: SHA256(serverSecret) === secretHash",
    "exploreBlock": "https://explorer.ergoplatform.com/en/blocks/...",
    "exploreTx": "..."
  }
}
```

**What to check:**
- ✅ Returns `serverSecret` (revealed!)
- ✅ Returns `secretHash` (same as from /start)
- ✅ Status code 200

---

### Test 4: Verify Commitment

Use any SHA256 tool to verify the commitment:

**Online:**
https://emn178.github.io/online-tools/sha256.html

**Command line:**
```bash
echo -n "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2" | shasum -a 256
```

**Should match `secretHash` from response!**

---

## 🔍 Verification Checklist

- [ ] Database table created successfully
- [ ] `/api/game/start` returns sessionId + secretHash
- [ ] `/api/game/random` returns deterministic random value
- [ ] `/api/game/random` verifies blockchain data exists
- [ ] `/api/game/end` reveals serverSecret
- [ ] SHA256(serverSecret) === secretHash ✓
- [ ] Same random inputs always produce same output
- [ ] Blockchain data is verified on Ergo API

---

## 🐛 Common Issues

### Error: "Missing required environment variables"

**Fix:** Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Error: "Session not found"

**Fix:** Check sessionId is valid UUID from `/start` response

### Error: "Invalid blockchain data"

**Fix:** Use real block hash from Ergo blockchain (not fake data)

```bash
# Get real blockchain data:
curl https://api.ergoplatform.com/api/v1/blocks?limit=1
```

### Error: "Failed to create game session" (Database)

**Fix:** Run the SQL migration in Supabase dashboard

---

## 📝 Example Node.js Test Script

```javascript
// test-commit-reveal.js
const crypto = require('crypto');

async function testCommitReveal() {
  const API_BASE = 'http://localhost:3000'; // or your Vercel URL

  console.log('1. Starting session...');
  const startRes = await fetch(`${API_BASE}/api/game/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameType: 'backgammon' })
  });
  const { sessionId, secretHash } = await startRes.json();
  console.log('✓ Session:', sessionId);
  console.log('✓ Hash:', secretHash);

  console.log('\n2. Getting blockchain data...');
  const blockRes = await fetch('https://api.ergoplatform.com/api/v1/blocks?limit=1');
  const blocks = await blockRes.json();
  const blockData = {
    blockHash: blocks.items[0].id,
    blockHeight: blocks.items[0].height
  };
  console.log('✓ Block:', blockData.blockHeight);

  console.log('\n3. Getting random value...');
  const randomRes = await fetch(`${API_BASE}/api/game/random`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, blockData, purpose: 'test-1' })
  });
  const { random } = await randomRes.json();
  console.log('✓ Random:', random);

  console.log('\n4. Ending session...');
  const endRes = await fetch(`${API_BASE}/api/game/end`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId })
  });
  const { serverSecret } = await endRes.json();
  console.log('✓ Secret revealed:', serverSecret);

  console.log('\n5. Verifying commitment...');
  const calculatedHash = crypto.createHash('sha256').update(serverSecret).digest('hex');
  const verified = calculatedHash === secretHash;
  console.log('✓ Verification:', verified ? 'PASSED ✓' : 'FAILED ✗');
  console.log('  Expected:', secretHash);
  console.log('  Calculated:', calculatedHash);
}

testCommitReveal().catch(console.error);
```

Run it:
```bash
node test-commit-reveal.js
```

---

## ✅ Chunk 1 Status: COMPLETE

**Next Steps:**
- Chunk 2: Integrate with one game (Backgammon or Blackjack)
- Update game to use `startSecureGame()`, `getSecureRandom()`, `endSecureSession()`
- Test full game flow with commit-reveal

**Ready to proceed?** Let me know when you've:
1. ✅ Created the database table
2. ✅ Tested the APIs (at least manually or with curl)
3. ✅ Verified commit-reveal works

Then we'll move to Chunk 2!
