# Week 2 Review: Backgammon Rule Testing

**Goal**: Write comprehensive tests for all Backgammon rules to expose bugs before fixing them.

**Strategy**: Test-Driven Development (TDD) - Write tests first, expose bugs, fix in Week 3.

---

## 📊 Overall Stats

- **Total Tests**: 190
- **Passing**: 187 (98.4%)
- **Failing**: 3 (1.6%)
- **Test Suites**: 7 files
- **Lines of Test Code**: ~1,500+

---

## 📁 Test Files Created

### Monday: Movement Rules
**File**: `movement.test.js`
- **Tests**: 34
- **Status**: ✅ All passing
- **Coverage**:
  - Movement direction (white 24→1, black 1→24)
  - Point blocking (2+ opponent checkers)
  - Hitting blots (single opponent checker)
  - Edge cases (board boundaries, empty points)

### Tuesday: Bar Entry Rules
**File**: `barEntry.test.js`
- **Tests**: 41
- **Status**: ✅ All passing
- **Coverage**:
  - Bar entry point calculation (white vs black)
  - Must enter before other moves (priority)
  - Blocked entry points (2+ opponent checkers)
  - Multiple checkers on bar
  - Hitting during bar entry

### Wednesday: Bearing Off Rules
**File**: `bearingOff.test.js`
- **Tests**: 41
- **Status**: ✅ All passing
- **Coverage**:
  - All checkers must be in home board
  - Exact die bears off
  - Higher die bears off furthest checker
  - Cannot bear off with checkers outside home
  - Edge cases (point 6 empty, mixed scenarios)

### Thursday: Forced Die Rule (CRITICAL)
**File**: `forcedDieRule.test.js`
- **Tests**: 17
- **Status**: ⚠️ 16 passing, 1 failing
- **Coverage**:
  - Must use both dice when possible
  - Must use larger die when only one usable
  - Doubles must use all 4 when possible
  - Complex scenarios (bar entry, bearing off)
  - Edge cases

**Bug Exposed**:
```
Test: "use as many as possible when cannot use all 4"
Scenario: White checker at point 3, black blocks point 1, dice [2,2,2,2]
Expected: Can move 3→1 (use at least 1 die)
Actual: No moves returned (forced die rule too strict)
```

### Friday: Doubles Testing
**File**: `doubles.test.js`
- **Tests**: 39
- **Status**: ⚠️ 37 passing, 2 failing
- **Coverage**:
  - Doubles detection and expansion (2 dice → 4 dice)
  - Basic doubles movement
  - Dice usage tracking (all 4 dice)
  - Doubles in bar entry
  - Doubles in bearing off
  - Edge cases (partial blocking, forced die)

**Bugs Exposed**:
```
Test 1: "doubles allow bearing off multiple exact matches"
Scenario: 4 checkers at point 5, dice [5,5,5,5]
Expected: Can bear off all 4 checkers
Actual: No bearing off moves returned

Test 2: "doubles with higher die bears off furthest"
Scenario: Checkers at points 3 and 1, dice [6,6,6,6]
Expected: Die 6 bears off from point 3 (furthest)
Actual: Move not found
```

### Week 1 Files (Still Included)
**Files**: `gameLogic.test.js`, `storage.test.js`
- **Tests**: 18
- **Status**: ✅ All passing
- **Coverage**: Basic game logic, localStorage persistence

### Helper File
**File**: `test-helpers.js`
- **Not a test file** (Jest warning expected)
- **Purpose**: Reusable utilities for creating game states
- **Functions**: `createEmptyState`, `placeChecker`, `placeOnBar`, `setDice`, `createBearingOffState`

---

## 🐛 Bugs Identified for Week 3

### 1. Forced Die Rule - Doubles Partial Usage (PRIORITY)
**Location**: `moveValidation.js` (forced die rule logic)
**Issue**: When all 4 doubles cannot be used, no moves are returned
**Test**: `forcedDieRule.test.js` - "use as many as possible when cannot use all 4"
**Fix**: Should allow using as many dice as possible (1, 2, or 3 if 4 blocked)

### 2. Bearing Off - Doubles with Exact Match (MEDIUM)
**Location**: `moveValidation.js` or bearing off logic
**Issue**: Cannot bear off multiple checkers with doubles when exact die matches
**Test**: `doubles.test.js` - "doubles allow bearing off multiple exact matches"
**Fix**: Should allow bearing off all checkers at point matching die value

### 3. Bearing Off - Doubles with Higher Die (MEDIUM)
**Location**: `moveValidation.js` or bearing off logic
**Issue**: Higher die not bearing off furthest checker with doubles
**Test**: `doubles.test.js` - "doubles with higher die bears off furthest"
**Fix**: Should use higher die to bear off from furthest point when exact empty

---

## ✅ What's Working Well

### Core Rules Implementation (187 passing tests!)
- ✅ Movement direction (white vs black)
- ✅ Blocking (2+ checkers prevent landing)
- ✅ Hitting (landing on opponent blot)
- ✅ Bar entry priority (must enter before other moves)
- ✅ Bar entry point calculation (white/black opposite boards)
- ✅ Bearing off basic rules (exact die, higher die)
- ✅ Home board requirement for bearing off
- ✅ Forced die rule (use larger when only one usable)
- ✅ Doubles detection and expansion (2 → 4 dice)
- ✅ Doubles movement (basic scenarios)
- ✅ Doubles bar entry
- ✅ Dice usage tracking

### Test Infrastructure
- ✅ Jest configured and running
- ✅ Reusable test helpers created
- ✅ Comprehensive test coverage (190 tests)
- ✅ Clear test organization (by rule category)
- ✅ Edge case coverage
- ✅ ELI5 comments in test files

---

## 📈 Progress Metrics

### Week 1 Recap
- Installed Jest testing framework
- Created first 18 tests (basic logic)
- Added localStorage persistence
- Created TESTING_GUIDE.md

### Week 2 Achievements
- Created 172 new tests (10x increase!)
- Tested all major Backgammon rules
- Exposed 3 specific bugs (vs vague "something's wrong")
- Built reusable test helpers
- 98.4% test pass rate

### Total Tests by Category
- Movement: 34 tests ✅
- Bar Entry: 41 tests ✅
- Bearing Off: 41 tests ✅
- Forced Die Rule: 17 tests (16 ✅, 1 ⚠️)
- Doubles: 39 tests (37 ✅, 2 ⚠️)
- Basic Logic: 12 tests ✅
- Storage: 6 tests ✅

---

## 🎯 Week 3 Preview

**Goal**: Fix all identified bugs using the tests as verification.

**Bugs to Fix** (in priority order):
1. Forced die rule - doubles partial usage (1 failing test)
2. Bearing off - doubles exact match (1 failing test)
3. Bearing off - doubles higher die (1 failing test)

**Success Criteria**:
- All 190 tests passing ✅
- No new bugs introduced
- Code changes documented
- Commit after each fix

**Estimated Time**: 3 days (1 bug per day + review)

---

## 💡 Key Learnings

### Test-Driven Development Works!
- Writing tests first exposed bugs immediately
- Clear scenarios make bugs obvious
- 187 passing tests = confidence in 98%+ of rules
- Only 3 failing tests = specific, fixable issues

### Edge Cases Matter
- Doubles with bearing off = most complex scenario
- Forced die rule needs careful implementation
- Multiple rules interacting = hardest to get right

### Good Test Helpers Save Time
- `createEmptyState()` used 100+ times
- `placeChecker()` makes tests readable
- Reusable helpers = faster test writing

---

## 🚀 Ready for Week 3!

**What We Have**:
- 190 comprehensive tests documenting every rule
- 3 specific bugs identified with clear scenarios
- Test helpers for rapid debugging
- 98.4% of rules working correctly

**What We'll Do**:
- Fix forced die rule bug (1 test)
- Fix bearing off bugs (2 tests)
- Verify all 190 tests pass
- Commit and push to branch

**Confidence Level**: HIGH 🎯
- We know exactly what's broken
- We have tests that will verify the fixes
- The majority of the implementation is solid

---

**Week 2 Status: COMPLETE ✅**

Created by Claude Code on 2026-01-18
Test suite: `npm test -- --watchAll=false --ci`
