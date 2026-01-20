# GNU Backgammon WASM Integration

This directory contains the integration layer for GNU Backgammon (gnubg) WASM module, providing world-class AI for the "Hardest" difficulty setting.

## Overview

GNU Backgammon is the strongest open-source backgammon engine, with world-class play at ~2000 FIBS rating. This integration uses the WASM-compiled version for browser-based play.

## Architecture

```
gnubg/
├── gnubg-loader.js       # Lazy WASM loader with progress tracking
├── gnubg-interface.js    # UCI-style command interface to gnubg
├── position-converter.js # Board state ↔ Position ID converter
└── README.md            # This file
```

## File Descriptions

### gnubg-loader.js
- Handles lazy loading of ~15MB WASM files
- Shows progress bar during load
- Implements 60s timeout with fallback
- Singleton pattern for caching loaded module
- Files loaded from `/assets/gnubg/`

### gnubg-interface.js
- Provides clean API to gnubg engine
- Executes commands and parses responses
- Configures world-class settings (2-ply evaluation, no noise)
- Methods: `getBestMove()`, `shouldDouble()`, `evaluatePosition()`

### position-converter.js
- Converts between our board representation and gnubg Position IDs
- Position IDs are base64-encoded combinatorial representations
- Parses gnubg move notation (e.g., "13/7 8/7")
- Handles dice formatting for gnubg commands

## Required WASM Files

Place these files in `/public/assets/gnubg/`:

```
assets/gnubg/
├── gnubg.js        (~2MB)  - Emscripten glue code
├── gnubg.wasm      (~3MB)  - Core engine WASM
├── gnubg.wd        (~5MB)  - One-sided bearoff database
└── gnubg_os0.bd    (~5MB)  - Opening book database
```

**Total size:** ~15MB

## Building WASM Files

### Option 1: Pre-built Binaries

Download from gnubg-web releases:
```bash
git clone https://github.com/hwatheod/gnubg-web
cd gnubg-web/dist
cp gnubg.* ../path/to/public/assets/gnubg/
```

### Option 2: Build from Source

Requirements:
- Emscripten SDK
- GNU Backgammon source
- Build tools (make, autoconf, etc.)

```bash
# Install Emscripten
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh

# Build gnubg
git clone https://github.com/hwatheod/gnubg-web
cd gnubg-web
./build.sh

# Copy output files
cp dist/gnubg.* /path/to/public/assets/gnubg/
```

### Database Files

- `gnubg.wd` - One-sided bearoff database (required)
- `gnubg_os0.bd` - Opening book (required)
- `gnubg_ts0.bd` - Two-sided bearoff (optional, very large, minimal benefit)

We skip `gnubg_ts0.bd` to reduce download size with minimal impact on playing strength.

## Usage

### Loading gnubg

```javascript
import { loadGnubg, isGnubgLoaded } from './gnubg/gnubg-loader.js';

// Load with progress callback
const gnubg = await loadGnubg((progress) => {
  console.log(`Loading: ${progress.percentage}%`);
  console.log(`File: ${progress.filename}`);
});
```

### Getting Best Move

```javascript
import { getGnubgInterface } from './gnubg/gnubg-interface.js';

const gnubg = getGnubgInterface();
const moves = await gnubg.getBestMove(state, dice, 'white');

// moves = [{from: 13, to: 7}, {from: 8, to: 7}]
```

### Checking Double Decision

```javascript
const shouldDouble = await gnubg.shouldDouble(state, 'white');
```

### Cleanup

```javascript
import { unloadGnubg } from './gnubg/gnubg-loader.js';

// Free memory when done
unloadGnubg();
```

## Configuration

World-class settings are applied automatically:

```javascript
set player 0 chequer evaluation plies 2  // 2-ply lookahead
set player 0 cube evaluation plies 2      // 2-ply cube decisions
set player 0 chequer evaluation noise 0.0 // No noise = full strength
```

This provides ~2000 FIBS rating play, equivalent to top human players.

## Performance

- **Load time:** 5-10 seconds on typical broadband
- **Move calculation:** 100-500ms per move (2-ply)
- **Memory usage:** ~50MB when loaded
- **Timeout:** 60 seconds with automatic fallback to "Hard" difficulty

## Integration Points

### BackgammonGame.jsx
- Adds "Hardest" difficulty option
- Shows loading modal during WASM load
- Falls back to "Hard" on timeout or error

### ai.js
- Checks if gnubg is loaded
- Routes to gnubg for "hardest" difficulty
- Falls back to existing AI if unavailable

## Error Handling

1. **Load timeout (60s):** Falls back to Hard difficulty with toast notification
2. **Missing files:** Shows error message with setup instructions
3. **Parse errors:** Logs warning and returns empty move array
4. **Command failures:** Catches and logs, continues with fallback

## Position ID Format

gnubg uses Position IDs to represent board states:

- **Format:** Base64-encoded 10-byte array
- **Encoding:** Combinatorial number system (Lehmer code)
- **Positions:** 26 per player (24 points + bar + off)
- **Reference:** [gnubg Position ID spec](https://www.gnu.org/software/gnubg/manual/html_node/A-technical-description-of-the-Position-ID.html)

Example: `4HPwATDgc/ABMA`

## Move Notation

gnubg outputs moves in standard notation:

- `13/7 8/7` - Move from point 13 to 7, then 8 to 7
- `bar/23` - Enter from bar to point 23
- `6/off` - Bear off from point 6
- Numbers are 1-24 (we convert to 0-23 internally)

## Testing

Test the integration:

```javascript
// 1. Check loading
import { loadGnubg, isGnubgLoaded } from './gnubg/gnubg-loader.js';
const gnubg = await loadGnubg();
console.log('Loaded:', isGnubgLoaded());

// 2. Test move generation
const testState = { /* game state */ };
const moves = await gnubg.getBestMove(testState, [3, 1], 'white');
console.log('Best move:', moves);

// 3. Test position evaluation
const equity = await gnubg.evaluatePosition(testState, 'white');
console.log('Equity:', equity);
```

## Provably Fair Dice

Note: gnubg is ONLY used for move selection, not dice rolling. Dice are still generated using blockchain-based provably fair system via `getLatestBlock()`.

## Troubleshooting

**Problem:** Files not loading (404 errors)
- **Solution:** Ensure files are in `/public/assets/gnubg/`
- Check file names match exactly (case-sensitive)

**Problem:** Slow loading
- **Solution:** Enable gzip compression on server
- Consider CDN for assets
- Files should compress ~60% with gzip

**Problem:** Out of memory
- **Solution:** Unload gnubg when switching games
- Call `unloadGnubg()` in cleanup hooks

**Problem:** Incorrect moves
- **Solution:** Verify Position ID conversion
- Check board state matches gnubg's expected format
- Ensure dice are set correctly before hint command

## References

- [GNU Backgammon Manual](https://www.gnu.org/software/gnubg/manual/)
- [gnubg-web GitHub](https://github.com/hwatheod/gnubg-web)
- [Position ID Technical Spec](https://www.gnu.org/software/gnubg/manual/html_node/A-technical-description-of-the-Position-ID.html)
- [Emscripten Documentation](https://emscripten.org/docs/)

## License

GNU Backgammon is licensed under GPL v3. This integration code is part of the larger project's license.
