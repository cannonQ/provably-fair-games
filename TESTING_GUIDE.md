# Testing Guide for Provably Fair Games

**Purpose**: Learn how to write automated tests for game logic
**For**: Non-developers using Claude Code
**Last Updated**: Week 1, Thursday

---

## What Are Tests? (Simple Explanation)

**Without tests**:
```
You: *Makes code change*
You: *Opens game in browser*
You: *Clicks through 20 different scenarios manually*
You: "I think it works... maybe?"
```

**With tests**:
```
You: *Makes code change*
You: "Run tests"
Tests: ✅ Checked 250 scenarios in 3 seconds - all pass!
You: "Definitely works!"
```

**Think of tests as**: A robot that plays your game thousands of times per second, checking every rule is correct.

---

## How Tests Work

### Anatomy of a Test

```javascript
test('white player moves from 24 to 1', () => {
  // ARRANGE: Set up the situation
  const player = 'white';

  // ACT: Do the thing we're testing
  const direction = getDirection(player);

  // ASSERT: Check the result is correct
  expect(direction).toBe(-1);
});
```

**What this does**:
1. **Arrange**: Create the test data (player = 'white')
2. **Act**: Call the function we're testing (getDirection)
3. **Assert**: Check the answer is what we expect (-1 for white)

If the function returns -1 → ✅ Test passes
If the function returns anything else → ❌ Test fails

---

## Test File Structure

### Directory Organization

```
src/games/backgammon/
  ├── gameLogic.js              ← Code we're testing
  ├── moveValidation.js         ← More code
  ├── ai.js                     ← Even more code
  └── __tests__/                ← Special folder for tests
      ├── gameLogic.test.js     ← Tests for gameLogic.js
      ├── moveValidation.test.js
      └── ai.test.js
```

**Rule**: Test files go in `__tests__/` folder and end with `.test.js`

### File Template

```javascript
/**
 * [Name] Tests
 *
 * What this file tests:
 * - Feature 1
 * - Feature 2
 * - Feature 3
 */

import { functionToTest } from '../fileToTest';

describe('Category Name', () => {
  test('specific thing it should do', () => {
    // Test code here
  });

  test('another specific thing', () => {
    // More test code
  });
});
```

**Explanation**:
- `describe()`: Groups related tests (like a folder)
- `test()`: One specific check
- `import`: Brings in the code we want to test

---

## Common Test Patterns

### Pattern 1: Testing Simple Functions

**Example**: Testing if a function returns the right value

```javascript
import { getDirection } from '../gameLogic';

describe('Movement Direction', () => {
  test('white moves in decreasing direction', () => {
    const result = getDirection('white');
    expect(result).toBe(-1);
  });

  test('black moves in increasing direction', () => {
    const result = getDirection('black');
    expect(result).toBe(1);
  });
});
```

**When to use**: Function takes input → returns output

---

### Pattern 2: Testing True/False Checks

**Example**: Testing if something is detected correctly

```javascript
import { isDoubles } from '../gameLogic';

describe('Doubles Detection', () => {
  test('detects doubles when both dice same', () => {
    expect(isDoubles([3, 3])).toBe(true);
    expect(isDoubles([6, 6])).toBe(true);
  });

  test('returns false when dice different', () => {
    expect(isDoubles([3, 5])).toBe(false);
    expect(isDoubles([1, 6])).toBe(false);
  });
});
```

**When to use**: Function returns true or false

---

### Pattern 3: Testing Arrays/Objects

**Example**: Testing if a function returns the right list

```javascript
import { getAvailableDice } from '../gameLogic';

describe('Available Dice', () => {
  test('returns all dice when none used', () => {
    const dice = [3, 5];
    const diceUsed = [false, false];

    const result = getAvailableDice(dice, diceUsed);

    expect(result).toEqual([3, 5]);
  });

  test('returns only unused dice', () => {
    const dice = [3, 5];
    const diceUsed = [true, false];  // First die used

    const result = getAvailableDice(dice, diceUsed);

    expect(result).toEqual([5]);  // Only second die
  });
});
```

**When to use**: Function returns array or object
**Note**: Use `.toEqual()` for arrays/objects, not `.toBe()`

---

### Pattern 4: Testing Error Handling

**Example**: Making sure functions handle bad input

```javascript
import { isDoubles } from '../gameLogic';

describe('Doubles Detection - Error Cases', () => {
  test('handles null input', () => {
    expect(isDoubles(null)).toBe(false);
  });

  test('handles undefined input', () => {
    expect(isDoubles(undefined)).toBe(false);
  });

  test('handles empty array', () => {
    expect(isDoubles([])).toBe(false);
  });

  test('handles single die', () => {
    expect(isDoubles([3])).toBe(false);
  });
});
```

**When to use**: Always! Check what happens with bad input

---

### Pattern 5: Testing Game State Changes

**Example**: Testing if moves update state correctly

```javascript
import { applyMove } from '../moveValidation';

describe('Move Application', () => {
  test('moving checker updates board correctly', () => {
    // ARRANGE: Create test state
    const state = {
      points: [
        { color: 'white', checkers: 2 },  // Point 0
        { color: null, checkers: 0 },      // Point 1
        // ... more points
      ],
      currentPlayer: 'white'
    };

    // ACT: Apply a move
    const newState = applyMove(state, { from: 0, to: 1 });

    // ASSERT: Check state changed correctly
    expect(newState.points[0].checkers).toBe(1);  // Source has 1 less
    expect(newState.points[1].checkers).toBe(1);  // Dest has 1 more
    expect(newState.points[1].color).toBe('white');
  });
});
```

**When to use**: Testing reducers, state updates, move application

---

## Jest Matchers (expect functions)

### Equality

```javascript
expect(value).toBe(5);              // Exact match (numbers, strings, booleans)
expect(array).toEqual([1, 2, 3]);   // Deep equality (arrays, objects)
expect(obj).not.toBe(null);         // Opposite check
```

### Truthiness

```javascript
expect(value).toBeTruthy();         // Is truthy (true, 1, "hello", etc.)
expect(value).toBeFalsy();          // Is falsy (false, 0, "", null, undefined)
expect(value).toBeNull();           // Is exactly null
expect(value).toBeUndefined();      // Is exactly undefined
expect(value).toBeDefined();        // Is not undefined
```

### Numbers

```javascript
expect(count).toBeGreaterThan(5);
expect(count).toBeGreaterThanOrEqual(5);
expect(count).toBeLessThan(10);
expect(count).toBeLessThanOrEqual(10);
expect(0.1 + 0.2).toBeCloseTo(0.3); // For floating point
```

### Arrays/Objects

```javascript
expect(array).toContain(item);         // Array contains item
expect(array).toHaveLength(5);         // Array has length 5
expect(obj).toHaveProperty('name');    // Object has property
expect(obj).toMatchObject({ a: 1 });   // Partial match
```

### Strings

```javascript
expect(str).toMatch(/pattern/);        // Matches regex
expect(str).toContain('substring');    // Contains substring
```

---

## Running Tests

### Run All Tests

```bash
npm test
```

Then press `a` to run all tests.

### Run Specific Test File

```bash
npm test -- --testPathPattern=gameLogic.test.js
```

### Run Tests Once (No Watch Mode)

```bash
npm test -- --watchAll=false --ci
```

---

## Reading Test Output

### When Tests Pass ✅

```
PASS src/games/backgammon/__tests__/gameLogic.test.js
  Movement Direction
    ✓ white player moves in decreasing direction (2 ms)
    ✓ black player moves in increasing direction (1 ms)
  Doubles Detection
    ✓ detects doubles when both dice same
    ✓ returns false when dice different

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Time:        3.2 s
```

**What this means**: All checks passed! Your code works correctly.

### When Tests Fail ❌

```
FAIL src/games/backgammon/__tests__/gameLogic.test.js
  Movement Direction
    ✓ white player moves in decreasing direction
    ✕ black player moves in increasing direction (5 ms)

  ● Movement Direction › black player moves in increasing direction

    expect(received).toBe(expected)

    Expected: 1
    Received: -1

      23 |   test('black player moves in increasing direction', () => {
      24 |     const direction = getDirection('black');
    > 25 |     expect(direction).toBe(1);
         |                       ^
      26 |   });
```

**What this means**:
- The test expected `1` but got `-1`
- The problem is in `getDirection('black')`
- Line 25 is where the test failed
- **Action**: Fix the `getDirection` function

---

## Test-Driven Development (TDD)

### The Process

**Step 1**: Write test FIRST (before code)
```javascript
test('bearing off requires all checkers in home', () => {
  const state = { /* state with checker outside home */ };
  expect(canBearOff(state, 'white')).toBe(false);
});
```

**Step 2**: Run test → see it FAIL ❌
```
✕ bearing off requires all checkers in home
  Expected: false
  Received: undefined (function doesn't exist yet)
```

**Step 3**: Write JUST enough code to pass
```javascript
function canBearOff(state, player) {
  // Check if all checkers in home...
  return allCheckersInHome(state, player);
}
```

**Step 4**: Run test → see it PASS ✅
```
✓ bearing off requires all checkers in home
```

**Step 5**: Repeat for next feature

### Why TDD?

- ✅ Prevents bugs before they happen
- ✅ Clear goal: make the test pass
- ✅ Confidence: if test passes, feature works
- ✅ No wasted code: write only what's needed

---

## How to Write Tests for New Features

### Example: Adding a New Rule

**Scenario**: You want to add "no moving backwards" rule

**Step 1**: Write the test
```javascript
describe('Backward Movement Prevention', () => {
  test('white cannot move from low to high numbers', () => {
    const state = {
      points: [{ color: 'white', checkers: 1 }],
      currentPlayer: 'white'
    };

    const isLegal = isMoveLegal(state, { from: 0, to: 5 });

    expect(isLegal).toBe(false); // Going backwards!
  });

  test('black cannot move from high to low numbers', () => {
    const state = {
      points: Array(24).fill({ color: null, checkers: 0 }),
      currentPlayer: 'black'
    };
    state.points[23] = { color: 'black', checkers: 1 };

    const isLegal = isMoveLegal(state, { from: 23, to: 18 });

    expect(isLegal).toBe(false); // Going backwards!
  });
});
```

**Step 2**: Run tests → they FAIL (rule doesn't exist yet)

**Step 3**: Tell Claude Code:
```
"Implement the backward movement prevention rule to make these tests pass"
```

**Step 4**: Claude writes the code

**Step 5**: Run tests → they PASS ✅

**Step 6**: Feature complete!

---

## Reusing Test Patterns

### Create Test Helpers

When you have repeated setup code:

```javascript
// test-helpers.js
export function createTestState() {
  return {
    points: Array(24).fill(null).map(() => ({
      color: null,
      checkers: 0
    })),
    bar: { white: 0, black: 0 },
    bearOff: { white: 0, black: 0 },
    currentPlayer: 'white',
    phase: 'moving'
  };
}

export function placeChecker(state, pointIndex, player, count = 1) {
  state.points[pointIndex] = {
    color: player,
    checkers: count
  };
  return state;
}
```

**Use in tests**:
```javascript
import { createTestState, placeChecker } from './test-helpers';

test('hitting a blot sends it to bar', () => {
  let state = createTestState();
  state = placeChecker(state, 5, 'black', 1);  // Black blot on point 5

  // Test hitting logic...
});
```

---

## Testing Checklist

### Before Writing Tests

- [ ] Understand what the function should do
- [ ] Know what inputs it takes
- [ ] Know what output it should return
- [ ] Think about edge cases (null, empty, invalid)

### Writing Tests

- [ ] Test the happy path (normal usage)
- [ ] Test edge cases (empty, null, undefined)
- [ ] Test boundaries (min, max values)
- [ ] Test error conditions
- [ ] Use descriptive test names

### After Writing Tests

- [ ] Run tests and verify they pass
- [ ] Check test coverage (are all cases covered?)
- [ ] Review test names (are they clear?)
- [ ] Commit tests with code changes

---

## Common Mistakes to Avoid

### ❌ Don't: Test implementation details
```javascript
// BAD - testing HOW it works
test('uses for loop to check dice', () => {
  expect(codeContainsForLoop()).toBe(true);
});
```

### ✅ Do: Test behavior
```javascript
// GOOD - testing WHAT it does
test('detects doubles correctly', () => {
  expect(isDoubles([3, 3])).toBe(true);
});
```

---

### ❌ Don't: Write tests that depend on each other
```javascript
// BAD - second test depends on first
test('save game', () => {
  saveGame(game);  // Sets global state
});

test('load game', () => {
  const loaded = loadGame();  // Depends on previous test
  expect(loaded).toBeDefined();
});
```

### ✅ Do: Make each test independent
```javascript
// GOOD - each test stands alone
test('save game', () => {
  saveGame(game);
  const saved = localStorage.getItem('game');
  expect(saved).toBeDefined();
});

test('load game', () => {
  saveGame(game);  // Set up what THIS test needs
  const loaded = loadGame();
  expect(loaded).toBeDefined();
});
```

---

### ❌ Don't: Use vague test names
```javascript
test('it works', () => { ... });
test('test 1', () => { ... });
test('check function', () => { ... });
```

### ✅ Do: Use descriptive names
```javascript
test('white player moves from 24 to 1', () => { ... });
test('doubles give 4 moves instead of 2', () => { ... });
test('bearing off requires all checkers in home board', () => { ... });
```

---

## How to Tell Claude Code to Write Tests

### Good Prompts

```
"Write tests for the forced die rule in moveValidation.js"

"Create comprehensive tests for the bearing off logic"

"Add tests for the AI move selection, ensuring it never picks illegal moves"

"Write error handling tests for the dice roll function"
```

### What Claude Will Do

1. Read the code to understand what it does
2. Write test cases covering:
   - Normal usage
   - Edge cases
   - Error conditions
3. Run the tests
4. Show you the results
5. Fix any failing tests

---

## Next Steps

Now that you understand testing:

1. **Week 2**: We'll write comprehensive tests for ALL Backgammon rules
2. **Week 3**: Use those tests to fix bugs confidently
3. **Week 4**: Test the AI thoroughly
4. **Week 5**: Apply this pattern to all other games

**Remember**: Tests = confidence. The more tests, the more confident you can be that your game works correctly!

---

## Quick Reference

### Test File Template
```javascript
import { functionToTest } from '../module';

describe('Feature Name', () => {
  test('specific behavior', () => {
    const result = functionToTest(input);
    expect(result).toBe(expected);
  });
});
```

### Running Tests
```bash
npm test                                    # Run all tests
npm test -- --testPathPattern=filename      # Run specific file
npm test -- --watchAll=false --ci           # Run once, no watch
```

### Common Matchers
```javascript
expect(x).toBe(y)           // Exact match
expect(x).toEqual(y)        // Deep equality
expect(x).toBeTruthy()      // Is truthy
expect(x).toBeNull()        // Is null
expect(arr).toContain(item) // Array contains
expect(arr).toHaveLength(n) // Array length
```

---

**Questions?** Tell Claude Code: "I don't understand [concept from this guide]" and it will explain in simpler terms!
