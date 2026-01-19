# CRITICAL BUG REPORT: Dice Reuse After Bar Entry

## Executive Summary

**Severity**: CRITICAL
**Impact**: Players can cheat by reusing dice after entering from the bar
**Exploitable**: YES - Both frontend and backend
**Affects**: All backgammon games with bar entry moves
**Status**: CONFIRMED

---

## Bug Description

When a player enters a checker from the bar, the die used for entry is **NOT marked as consumed**. This allows the player to reuse that same die value for additional moves, effectively getting extra moves per turn.

**User Report**:
> "When coming off the bar with a 1, you can reuse the 1 (but it's already been used to get off the bar)"

---

## Root Cause Analysis

### Location: `/home/user/provably-fair-games/src/games/backgammon/gameState.js`

**Lines 294-295** (MOVE_CHECKER reducer):
```javascript
if (from === 'bar') {
  // Moving from bar
  dieValue = player === 'white' ? (25 - to) : to;  // ❌ WRONG FORMULA
}
```

### The Problem

The formula for calculating which die was used during bar entry is **incorrect**:

**For White Player**:
- Entry point calculation (gameLogic.js): `getBarEntryPoint(dieValue, 'white') = 24 - dieValue`
- Die 1 → index 23 (point 24)
- Die 6 → index 18 (point 19)

**Current (wrong) reverse calculation**:
```javascript
dieValue = 25 - to  // If to=23, dieValue=2 ❌ WRONG!
```

**Correct reverse calculation**:
```javascript
dieValue = 24 - to  // If to=23, dieValue=1 ✓ CORRECT
```

**For Black Player**:
- Entry point calculation (gameLogic.js): `getBarEntryPoint(dieValue, 'black') = dieValue - 1`
- Die 1 → index 0 (point 1)
- Die 6 → index 5 (point 6)

**Current (wrong) reverse calculation**:
```javascript
dieValue = to  // If to=0, dieValue=0 ❌ WRONG!
```

**Correct reverse calculation**:
```javascript
dieValue = to + 1  // If to=0, dieValue=1 ✓ CORRECT
```

### Why This Causes Dice Reuse

After calculating the wrong `dieValue`, the code tries to find a matching die in the available dice array (lines 310-315):

```javascript
// Find exact match first
for (let i = 0; i < newDice.length; i++) {
  if (!newDiceUsed[i] && newDice[i] === dieValue) {
    dieIndex = i;
    break;
  }
}
```

With the wrong `dieValue`, **no match is found**, so `dieIndex` remains `-1`.

Lines 327-329 only mark a die as used if `dieIndex !== -1`:
```javascript
if (dieIndex !== -1) {
  newDiceUsed[dieIndex] = true;  // This never executes!
}
```

**Result**: The checker moves from bar to board, but NO die is marked as used. The player can then reuse both dice.

---

## Step-by-Step Reproduction

### Test Case 1: White Player

1. Set up state:
   - White has 1 checker on bar
   - Roll dice: [6, 1]
   - diceUsed: [false, false]

2. Enter from bar with die 1 (to point 24, index 23)

3. Bug occurs:
   - Checker successfully enters at point 24
   - Bar count decreases: white = 0
   - **But diceUsed remains [false, false]** ❌
   - Player can now use die 1 again for another move

**Expected**: diceUsed = [false, true] (die 1 marked as used)
**Actual**: diceUsed = [false, false] (no die marked as used)

### Test Case 2: Black Player

1. Set up state:
   - Black has 1 checker on bar
   - Roll dice: [3, 2]
   - diceUsed: [false, false]

2. Enter from bar with die 2 (to point 2, index 1)

3. Bug occurs:
   - Checker successfully enters at point 2
   - Bar count decreases: black = 0
   - **But diceUsed remains [false, false]** ❌
   - Player can now use die 2 again for another move

**Expected**: diceUsed = [false, true] (die 2 marked as used)
**Actual**: diceUsed = [false, false] (no die marked as used)

---

## Impact Assessment

### 1. Cheating Potential: HIGH

Players can exploit this to:
- Make more moves per turn than allowed
- Win games they should lose
- Achieve artificially high scores
- Manipulate leaderboards

### 2. Frontend Vulnerability: CONFIRMED

The bug exists in `gameState.js` which is used by the frontend game UI. Players can:
- Use browser to make multiple moves with the same die
- Complete turns with invalid move sequences
- Win games unfairly

### 3. Backend Validation: BYPASSED

**File**: `/home/user/provably-fair-games/lib/validation/games/backgammon/historyValidator.js`

Lines 75-86:
```javascript
// Note: We cannot fully validate move legality without dice rolls,
// which would require the seed and move-by-move dice generation.
// For now, we validate that:
// 1. Moves are in valid format
// 2. Game ends with white winning
// 3. Win type matches final board state

// Skip full replay for now (would need dice simulation)
// Instead, validate end state and score calculation
```

**The backend does NOT validate**:
- Whether dice were properly consumed
- Whether moves were legal given the dice rolled
- Whether the move sequence is valid

**Conclusion**: A malicious player could:
1. Play a game with dice reuse bug
2. Submit the fraudulent move history
3. Backend accepts it (only validates format and score calculation)
4. Fraudulent score gets added to leaderboard

### 4. Test Coverage: INSUFFICIENT

**File**: `/home/user/provably-fair-games/src/games/backgammon/__tests__/barEntry.test.js`

The bar entry tests validate:
- Entry point calculation (getBarEntryPoint) ✓
- Legal move generation ✓
- Bar entry priority ✓

**Missing test**:
- ❌ Dice consumption verification after bar entry
- ❌ Test that die cannot be reused after bar entry
- ❌ Integration test using gameReducer (tests use applyMove instead)

The tests don't catch this bug because they use `applyMove()` from `moveValidation.js`, which receives the die value from the move object (correct implementation). They don't test the `gameReducer` in `gameState.js` which calculates the die value (buggy implementation).

---

## The Fix

### Location: `/home/user/provably-fair-games/src/games/backgammon/gameState.js`

**Lines 294-295** - Replace:
```javascript
if (from === 'bar') {
  // Moving from bar
  dieValue = player === 'white' ? (25 - to) : to;
}
```

**With**:
```javascript
if (from === 'bar') {
  // Moving from bar
  // White: reverse of getBarEntryPoint = 24 - dieValue
  // Black: reverse of getBarEntryPoint = dieValue - 1
  dieValue = player === 'white' ? (24 - to) : (to + 1);
}
```

### Why This Works

**For White**:
- Entry with die 1 → to = getBarEntryPoint(1, 'white') = 24 - 1 = 23
- Reverse: dieValue = 24 - to = 24 - 23 = 1 ✓

**For Black**:
- Entry with die 1 → to = getBarEntryPoint(1, 'black') = 1 - 1 = 0
- Reverse: dieValue = to + 1 = 0 + 1 = 1 ✓

Now the correct die value is calculated, so the matching die is found and marked as used.

---

## Proposed Test Case

Add to `/home/user/provably-fair-games/src/games/backgammon/__tests__/barEntry.test.js`:

```javascript
describe('Dice Consumption After Bar Entry', () => {
  test('white: die is marked as used after bar entry', () => {
    const state = createEmptyState();
    placeOnBar(state, 'white', 1);
    setDice(state, [6, 1]);

    // Enter from bar with die 1 (to point 24, index 23)
    const stateAfter = gameReducer(state, {
      type: ActionTypes.MOVE_CHECKER,
      payload: { from: 'bar', to: 23 }
    });

    // Die 1 should be marked as used
    expect(stateAfter.diceUsed[1]).toBe(true);

    // Only die 6 should remain
    const remaining = stateAfter.dice.filter((d, i) => !stateAfter.diceUsed[i]);
    expect(remaining).toEqual([6]);
  });

  test('black: die is marked as used after bar entry', () => {
    const state = createEmptyState();
    state.currentPlayer = 'black';
    placeOnBar(state, 'black', 1);
    setDice(state, [3, 2]);

    // Enter from bar with die 2 (to point 2, index 1)
    const stateAfter = gameReducer(state, {
      type: ActionTypes.MOVE_CHECKER,
      payload: { from: 'bar', to: 1 }
    });

    // Die 2 should be marked as used
    expect(stateAfter.diceUsed[1]).toBe(true);

    // Only die 3 should remain
    const remaining = stateAfter.dice.filter((d, i) => !stateAfter.diceUsed[i]);
    expect(remaining).toEqual([3]);
  });

  test('cannot reuse die after bar entry', () => {
    const state = createEmptyState();
    placeOnBar(state, 'white', 1);
    placeChecker(state, 10, 'white', 2); // Checker at point 11
    setDice(state, [1, 1, 1, 1]); // Doubles

    // Enter from bar with die 1
    const state2 = gameReducer(state, {
      type: ActionTypes.MOVE_CHECKER,
      payload: { from: 'bar', to: 23 }
    });

    // Now should have 3 dice left, not 4
    const remaining = state2.dice.filter((d, i) => !state2.diceUsed[i]);
    expect(remaining).toHaveLength(3);
    expect(state2.diceUsed.filter(used => used)).toHaveLength(1);
  });
});
```

---

## Additional Checks Needed

### 1. Check Other Die Calculation Locations

The bug affects bar entry. We should verify similar calculations for:
- ✓ **Bearing off** (lines 296-298): Uses correct formula
- ✓ **Regular moves** (lines 300-301): Uses correct formula

### 2. Verify moveValidation.js

**File**: `/home/user/provably-fair-games/src/games/backgammon/moveValidation.js`

The `applyMove()` function (lines 621-689) does NOT have this bug because it receives `dieValue` from the move object (line 622), rather than calculating it. The move object comes from `getLegalBarEntries()` which uses the correct `getBarEntryPoint()` function.

**Conclusion**: `moveValidation.js` is correct. Only `gameState.js` is buggy.

---

## Severity Justification

**CRITICAL** because:

1. ✅ **Exploitable**: Players can intentionally trigger this bug
2. ✅ **Cheating**: Allows winning games unfairly
3. ✅ **Score manipulation**: Affects leaderboards
4. ✅ **Backend bypass**: Server validation doesn't catch it
5. ✅ **Common occurrence**: Bar entry happens in most games
6. ✅ **Easy to exploit**: No technical skill required

---

## Recommended Actions

### Immediate (Priority 1)
1. ✅ **Apply the fix** to line 295 in gameState.js
2. ✅ **Add test cases** to prevent regression
3. ✅ **Test the fix** with manual testing

### Short-term (Priority 2)
4. **Review leaderboard** for suspicious scores
5. **Check game logs** for evidence of exploitation
6. **Consider resetting** affected leaderboard entries

### Long-term (Priority 3)
7. **Improve backend validation** to replay moves with dice
8. **Add dice consumption tests** for all move types
9. **Add integration tests** using gameReducer (not just applyMove)

---

## Files Affected

1. `/home/user/provably-fair-games/src/games/backgammon/gameState.js` - **BUG** (line 295)
2. `/home/user/provably-fair-games/src/games/backgammon/moveValidation.js` - Correct
3. `/home/user/provably-fair-games/lib/validation/games/backgammon/historyValidator.js` - Insufficient validation
4. `/home/user/provably-fair-games/src/games/backgammon/__tests__/barEntry.test.js` - Missing test coverage

---

## Conclusion

This is a **critical security vulnerability** that allows players to cheat by reusing dice after bar entry. The fix is simple (one line), but the impact is severe. The bug should be patched immediately, and the backend validation should be enhanced to prevent similar exploits in the future.

**Estimated time to fix**: 15 minutes
**Estimated time to test**: 30 minutes
**Estimated risk if not fixed**: HIGH - Active exploitation possible
