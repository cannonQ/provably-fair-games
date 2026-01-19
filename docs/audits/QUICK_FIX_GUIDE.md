# Quick Fix Guide - Dice Reuse Bug

## TL;DR

**Bug**: Dice can be reused after bar entry
**Severity**: CRITICAL (players can cheat)
**Fix**: Change 1 line in gameState.js
**Time**: 5 minutes to fix, 10 minutes to test

---

## The One-Line Fix

### File: `src/games/backgammon/gameState.js`
### Line: 295

**Change this**:
```javascript
dieValue = player === 'white' ? (25 - to) : to;
```

**To this**:
```javascript
dieValue = player === 'white' ? (24 - to) : (to + 1);
```

**Done!** That's the entire fix.

---

## Why This Works

**White players**: Entry point is `24 - dieValue`, so reverse is `dieValue = 24 - to`
**Black players**: Entry point is `dieValue - 1`, so reverse is `dieValue = to + 1`

---

## Quick Test

### Manual Test (30 seconds)

1. Start a game
2. Get a checker on the bar (let opponent hit you)
3. Roll the dice
4. Enter from bar
5. **Check**: Try to use the same die again
6. **Expected**: Should NOT be able to (die already used)

### Automated Test (2 minutes)

```bash
npm test src/games/backgammon/__tests__/barEntry.test.js
```

All tests should pass.

---

## Verification Checklist

- [ ] Line 295 in gameState.js updated
- [ ] Code saved
- [ ] Manual test: cannot reuse die after bar entry
- [ ] Automated tests pass
- [ ] Git commit with message: "Fix dice reuse bug after bar entry"

---

## Before/After Comparison

### Before (Buggy)
```
Player enters from bar with die 1
→ Checker moves ✓
→ Die 1 NOT marked as used ❌
→ Player can use die 1 again ❌
```

### After (Fixed)
```
Player enters from bar with die 1
→ Checker moves ✓
→ Die 1 marked as used ✓
→ Player CANNOT use die 1 again ✓
```

---

## Files to Review

**Must change**:
- `src/games/backgammon/gameState.js` (line 295)

**No changes needed** (already correct):
- `src/games/backgammon/gameLogic.js`
- `src/games/backgammon/moveValidation.js`

---

## If You Have 15 Minutes

After applying the fix, add this test to prevent regression:

**File**: `src/games/backgammon/__tests__/barEntry.test.js`

```javascript
test('die is marked as used after bar entry (regression test)', () => {
  const state = createEmptyState();
  placeOnBar(state, 'white', 1);
  setDice(state, [6, 1]);

  // Enter from bar with die 1
  const stateAfter = gameReducer(state, {
    type: ActionTypes.MOVE_CHECKER,
    payload: { from: 'bar', to: 23 }
  });

  // Die 1 should be marked as used
  expect(stateAfter.diceUsed[1]).toBe(true);

  // Die 1 should NOT be available
  const remaining = stateAfter.dice.filter((d, i) => !stateAfter.diceUsed[i]);
  expect(remaining).toEqual([6]);
});
```

---

## Common Mistakes

**❌ Don't do this**:
```javascript
dieValue = player === 'white' ? (25 - to) : to;  // OLD (WRONG)
```

**✓ Do this**:
```javascript
dieValue = player === 'white' ? (24 - to) : (to + 1);  // NEW (CORRECT)
```

**❌ Don't forget the parentheses**:
```javascript
dieValue = player === 'white' ? 24 - to : to + 1;  // WRONG (operator precedence)
```

**✓ Use parentheses**:
```javascript
dieValue = player === 'white' ? (24 - to) : (to + 1);  // CORRECT
```

---

## Questions?

See full documentation:
- `DICE_REUSE_BUG_REPORT.md` - Complete bug analysis
- `DICE_REUSE_BUG_FIX.md` - Detailed fix explanation
- `AUDIT_SUMMARY.md` - Executive summary

---

**Last Updated**: 2026-01-18
**Status**: Ready to deploy
