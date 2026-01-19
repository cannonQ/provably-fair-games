# Backgammon Dice Reuse Bug - Comprehensive Audit Summary

**Audit Date**: 2026-01-18
**Auditor**: Claude Code AI Agent
**Severity**: CRITICAL
**Status**: CONFIRMED - Fix Required Immediately

---

## Executive Summary

A critical bug allows players to reuse dice after entering from the bar, enabling cheating and score manipulation. The bug exists in both frontend and backend validation, making it fully exploitable.

**Key Findings**:
- ✅ Bug confirmed and reproduced
- ✅ Root cause identified (incorrect formula in gameState.js line 295)
- ✅ Fix is simple (one line change)
- ✅ Backend validation insufficient (doesn't catch exploit)
- ✅ Test coverage inadequate (missing dice consumption tests)

---

## Bug Details

### What Happens
When a player enters a checker from the bar:
1. The checker successfully moves from bar to board
2. **The die is NOT marked as consumed**
3. Player can reuse that same die for another move
4. This effectively gives the player extra moves per turn

### User Report
> "When coming off the bar with a 1, you can reuse the 1 (but it's already been used to get off the bar)"

### Confirmed Test Result
```
Initial state:
- White has 1 checker on bar
- Dice rolled: [6, 1]
- Dice used: [false, false]

After bar entry with die 1:
- Bar: white = 0 ✓ (checker moved)
- Dice: [6, 1]
- Dice used: [false, false] ❌ SHOULD BE [false, true]
- Remaining dice: [6, 1] ❌ SHOULD BE [6]

CRITICAL BUG CONFIRMED: NO die was marked as used!
```

---

## Root Cause

### File: `src/games/backgammon/gameState.js`
### Line: 295
### Function: `MOVE_CHECKER` reducer

**Buggy Code**:
```javascript
if (from === 'bar') {
  dieValue = player === 'white' ? (25 - to) : to;  // ❌ WRONG FORMULA
}
```

**Why It's Wrong**:

**For White**:
- Correct entry point: `getBarEntryPoint(1, 'white')` = `24 - 1` = `23`
- Buggy reverse calc: `dieValue = 25 - 23 = 2` ❌ (looking for wrong die)
- Should be: `dieValue = 24 - 23 = 1` ✓

**For Black**:
- Correct entry point: `getBarEntryPoint(1, 'black')` = `1 - 1` = `0`
- Buggy reverse calc: `dieValue = 0` ❌ (looking for impossible die)
- Should be: `dieValue = 0 + 1 = 1` ✓

**Consequence**:
The code searches for a die with the wrong value, doesn't find it, and therefore doesn't mark any die as used.

---

## The Fix

### Required Change

**File**: `/home/user/provably-fair-games/src/games/backgammon/gameState.js`
**Line**: 295

**Change From**:
```javascript
dieValue = player === 'white' ? (25 - to) : to;
```

**Change To**:
```javascript
dieValue = player === 'white' ? (24 - to) : (to + 1);
```

**That's it!** One line change fixes the entire bug.

---

## Verification Matrix

| Player | Die | Entry Point | Old Formula | Old Result | New Formula | New Result | Status |
|--------|-----|-------------|-------------|------------|-------------|------------|--------|
| White  | 1   | 23 (pt 24)  | 25 - 23     | 2 ❌       | 24 - 23     | 1 ✓        | FIXED  |
| White  | 6   | 18 (pt 19)  | 25 - 18     | 7 ❌       | 24 - 18     | 6 ✓        | FIXED  |
| Black  | 1   | 0 (pt 1)    | 0           | 0 ❌       | 0 + 1       | 1 ✓        | FIXED  |
| Black  | 6   | 5 (pt 6)    | 5           | 5 ❌       | 5 + 1       | 6 ✓        | FIXED  |

---

## Impact Assessment

### 1. Cheating Potential: HIGH

**Can players exploit this?** YES
- Players can intentionally enter from bar to trigger bug
- Can make unlimited moves with reused dice
- Can win unwinnable games
- Can manipulate scores

**How easy to exploit?** TRIVIAL
- No technical knowledge required
- Happens naturally during normal gameplay
- Many players may have already discovered it

### 2. Frontend Vulnerability: CONFIRMED

**Affected File**: `src/games/backgammon/gameState.js`
**Used By**: React game UI components
**Impact**: Players can cheat in browser

### 3. Backend Validation: BYPASSED

**Affected File**: `lib/validation/games/backgammon/historyValidator.js`

**Current Backend Validation**:
```javascript
// Note: We cannot fully validate move legality without dice rolls,
// which would require the seed and move-by-move dice generation.
// For now, we validate that:
// 1. Moves are in valid format ✓
// 2. Game ends with white winning ✓
// 3. Win type matches final board state ✓
```

**What Backend DOESN'T Validate**:
- ❌ Whether dice were properly consumed
- ❌ Whether moves were legal given the dice
- ❌ Whether move sequences are valid

**Consequence**:
A player could submit a game with dice reuse and the backend would accept it, adding the fraudulent score to the leaderboard.

### 4. Test Coverage: INSUFFICIENT

**Existing Tests** (`src/games/backgammon/__tests__/barEntry.test.js`):
- ✓ Entry point calculation (getBarEntryPoint)
- ✓ Legal move generation
- ✓ Bar entry priority

**Missing Tests**:
- ❌ Dice consumption after bar entry
- ❌ Verification that dice cannot be reused
- ❌ Integration tests using gameReducer

**Why Tests Didn't Catch This**:
Tests use `applyMove()` from `moveValidation.js` (correct implementation) instead of `gameReducer()` from `gameState.js` (buggy implementation).

---

## Files Involved

### Buggy Files (Need Fix)
1. ✅ `/home/user/provably-fair-games/src/games/backgammon/gameState.js` - Line 295 (PRIMARY BUG)
2. ⚠️ `/home/user/provably-fair-games/lib/validation/games/backgammon/historyValidator.js` - Insufficient validation

### Correct Files (No Changes Needed)
1. ✓ `/home/user/provably-fair-games/src/games/backgammon/gameLogic.js` - getBarEntryPoint is correct
2. ✓ `/home/user/provably-fair-games/src/games/backgammon/moveValidation.js` - applyMove is correct

### Test Files (Need Enhancement)
1. ⚠️ `/home/user/provably-fair-games/src/games/backgammon/__tests__/barEntry.test.js` - Add dice consumption tests

---

## Exploitation Scenario

### How a Malicious Player Could Cheat

**Step 1: Play Game with Dice Reuse**
```
Turn 1:
- White on bar
- Roll [6, 1]
- Enter with die 1 to point 24
- BUG: Die 1 not consumed
- Reuse die 1 to move another checker
- Also use die 6 for third move
- Total: 3 moves instead of 2
```

**Step 2: Win Game Unfairly**
```
- Extra moves give massive advantage
- Win game that should have been lost
- Achieve high score
```

**Step 3: Submit to Backend**
```
- Send game history to server
- Backend validates:
  ✓ Move format (valid)
  ✓ Score calculation (valid)
  ✓ Move count (valid)
  ❌ Dice consumption (NOT CHECKED)
- Fraudulent score ACCEPTED
```

**Step 4: Leaderboard Manipulation**
```
- High score added to leaderboard
- Other players can't compete fairly
- Leaderboard integrity compromised
```

---

## Recommended Actions

### IMMEDIATE (Priority 1) - Do Now

1. **Apply the fix** to line 295 in gameState.js
   ```javascript
   dieValue = player === 'white' ? (24 - to) : (to + 1);
   ```

2. **Test the fix** manually:
   - Set up game with checker on bar
   - Roll dice with 1
   - Enter from bar
   - Verify die is marked as used
   - Verify die cannot be reused

3. **Run existing tests**:
   ```bash
   npm test src/games/backgammon/__tests__/
   ```

### SHORT-TERM (Priority 2) - Do This Week

4. **Add regression tests** (use proposed test file):
   - Copy `PROPOSED_TEST_diceConsumption.test.js` to test suite
   - Run new tests to verify fix
   - Add to CI/CD pipeline

5. **Review leaderboard data**:
   - Check for suspiciously high scores
   - Look for games with unusual move counts
   - Consider flagging or removing suspicious entries

6. **Monitor game logs**:
   - Look for evidence of exploitation
   - Track if bug was actively being used

### LONG-TERM (Priority 3) - Next Month

7. **Enhance backend validation**:
   - Implement full move replay with dice
   - Validate dice consumption server-side
   - Reject games with illegal move sequences

8. **Improve test coverage**:
   - Add dice consumption tests for all move types
   - Add integration tests using gameReducer
   - Test both white and black players

9. **Code audit**:
   - Review other die calculations (bearing off, regular moves)
   - Check for similar bugs in other game types
   - Implement consistent validation patterns

---

## Documentation Provided

This audit includes the following deliverables:

1. **DICE_REUSE_BUG_REPORT.md** - Comprehensive bug analysis
2. **DICE_REUSE_BUG_FIX.md** - Detailed fix documentation with verification
3. **PROPOSED_TEST_diceConsumption.test.js** - Complete test suite for regression prevention
4. **AUDIT_SUMMARY.md** - This executive summary

All files are in: `/home/user/provably-fair-games/`

---

## Conclusion

This is a **critical security vulnerability** that must be fixed immediately. The good news:
- ✅ Fix is simple (one line)
- ✅ Low risk of breaking other functionality
- ✅ Easy to test and verify
- ✅ Complete documentation provided

The bad news:
- ❌ Bug is easily exploitable
- ❌ Backend validation won't catch it
- ❌ May have been exploited already
- ❌ Affects game integrity and fairness

**Recommendation**: Deploy fix within 24 hours, then enhance backend validation and test coverage.

---

## Technical Details

### Dice Consumption Flow

**Correct Flow** (after fix):
```
1. Player makes move from bar
2. gameReducer calculates: dieValue = 24 - to (white) or to + 1 (black)
3. Code searches for die with matching value in dice array
4. Finds match at index i
5. Sets diceUsed[i] = true
6. Die is consumed, cannot be reused
```

**Buggy Flow** (before fix):
```
1. Player makes move from bar
2. gameReducer calculates: dieValue = 25 - to (white) or to (black)
3. Code searches for die with wrong value
4. No match found (dieIndex = -1)
5. diceUsed array NOT updated
6. Die remains available for reuse ❌
```

### Mathematical Proof

**getBarEntryPoint** (from gameLogic.js):
```javascript
// White: to = 24 - dieValue
// Black: to = dieValue - 1
```

**Inverse functions** (for gameState.js):
```javascript
// White: dieValue = 24 - to  ✓
// Black: dieValue = to + 1   ✓
```

**Verification**:
```
White: to = 24 - dieValue  →  dieValue = 24 - to ✓
Black: to = dieValue - 1   →  dieValue = to + 1  ✓
```

---

**End of Audit Report**

For questions or clarifications, refer to the detailed documentation files included with this audit.
