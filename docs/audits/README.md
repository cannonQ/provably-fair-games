# Security and Code Audits

This directory contains security audit reports, bug investigations, and code analysis documentation.

## Current Audits

### Backgammon Dice Reuse Bug (January 2026)

**Status**: ✅ FIXED (See commits a6a964f and 7043360)

A critical bug was discovered and fixed where dice could be reused after entering from the bar in Backgammon, allowing players to cheat on the leaderboard.

#### Related Documents
1. **AUDIT_SUMMARY.md** - Executive summary of the dice reuse bug
2. **DICE_REUSE_BUG_REPORT.md** - Detailed technical analysis
3. **DICE_REUSE_BUG_FIX.md** - Implementation details of the fix
4. **QUICK_FIX_GUIDE.md** - Quick reference guide (TL;DR)
5. **BACKGAMMON_AUDIT_REPORT.md** - Comprehensive backgammon code audit
6. **BACKGAMMON_FIXES_REQUIRED.md** - Checklist of required fixes
7. **PROPOSED_TEST_diceConsumption.test.js** - Regression test suite (now implemented)

#### What Was Fixed
- **File**: `src/games/backgammon/gameState.js:295`
- **Issue**: Incorrect die value calculation for bar entry moves
- **Fix**: Changed formula from `(25 - to)` to `(24 - to)` for white, `to` to `(to + 1)` for black
- **Tests**: Added 20 comprehensive regression tests in `src/games/backgammon/__tests__/diceConsumption.test.js`

#### Key Findings
- **Severity**: CRITICAL - Exploitable cheating bug
- **Impact**: Players could reuse dice, gaining unfair advantage
- **Backend**: Validation insufficient - didn't catch the exploit
- **Root Cause**: Off-by-one error in die value reverse calculation
- **Test Coverage**: Tests didn't use gameReducer (used correct moveValidation.js instead)

#### Verification
All 255 backgammon tests pass, including:
- 41 bar entry tests ✓
- 20 dice consumption regression tests ✓
- All other game logic tests ✓

## Audit Process

When conducting audits:
1. **Investigate** - Understand the bug/vulnerability
2. **Document** - Create detailed technical report
3. **Fix** - Implement the solution
4. **Test** - Add regression tests to prevent recurrence
5. **Archive** - Keep reports for future reference

## Reading These Documents

- Start with **AUDIT_SUMMARY.md** for overview
- Read **QUICK_FIX_GUIDE.md** for TL;DR
- See detailed reports for technical deep-dives
- Check commits for actual implementation

## Future Audits

When adding new audit reports:
1. Use descriptive filenames with dates
2. Include executive summary
3. Document root cause analysis
4. Provide fix verification
5. Update this README
6. Link to related commits/PRs
