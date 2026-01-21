# GNU Backgammon WASM Files

## Current Status: STUB FILES ONLY

The files currently in this directory are **stubs/placeholders**. They allow the UI to load and show the loading modal, but the actual AI will not work.

## How to Get Real Files

To enable the world-class GNU Backgammon AI, you need to replace these stub files with the real WASM binaries.

### Option 1: Download Pre-built Files

1. Visit: https://github.com/hwatheod/gnubg-web
2. Look for releases or pre-built files in the `dist/` folder
3. Download these files:
   - `gnubg.js` (~2MB)
   - `gnubg.wasm` (~3MB)
   - `gnubg.wd` (~5MB)
   - `gnubg_os0.bd` (~5MB)
4. Replace the stub files in this directory with the real ones

### Option 2: Build from Source

If pre-built files aren't available, you'll need to build them:

#### Requirements:
- Emscripten SDK
- Git
- Make and build tools

#### Steps:

```bash
# 1. Install Emscripten SDK
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh

# 2. Clone gnubg-web
cd ..
git clone https://github.com/hwatheod/gnubg-web
cd gnubg-web

# 3. Follow the build instructions in their README
# Usually something like:
./build.sh

# 4. Copy the output files
cp dist/gnubg.js /path/to/provably-fair-games/public/assets/gnubg/
cp dist/gnubg.wasm /path/to/provably-fair-games/public/assets/gnubg/
cp dist/gnubg.wd /path/to/provably-fair-games/public/assets/gnubg/
cp dist/gnubg_os0.bd /path/to/provably-fair-games/public/assets/gnubg/
```

## File Descriptions

- **gnubg.js** - Emscripten glue code (JavaScript wrapper)
- **gnubg.wasm** - Main GNU Backgammon engine compiled to WebAssembly
- **gnubg.wd** - One-sided bearoff database (required)
- **gnubg_os0.bd** - Opening book database (required)
- **gnubg_ts0.bd** - Two-sided bearoff database (optional, very large, minimal benefit - not included)

## Testing

Once you have the real files installed:

1. Restart your dev server: `npm start`
2. Navigate to Backgammon
3. Select "Hardest 🏆" difficulty
4. Click "Start Game"
5. You should see a progress bar loading the files
6. After ~5-10 seconds, the game will start with world-class AI

## Troubleshooting

**Problem:** "Failed to load World-Class AI"
- **Solution:** Check that all 4 files are present and are the real WASM files (not stubs)
- **Check:** Open browser DevTools → Network tab → Look for 404 errors on gnubg files

**Problem:** Files are loading but AI still fails
- **Solution:** Check the console for JavaScript errors
- **Verify:** Make sure gnubg.js is the real Emscripten output, not the stub

**Problem:** Very slow loading
- **Solution:** Enable gzip compression on your web server for .wasm and .bd files
- **Note:** Files are ~15MB total, should take 5-10 seconds on typical broadband

## Current Stub Behavior

With stub files (current state):
- Loading modal will appear ✓
- Progress bar will show briefly ✓
- After ~2 seconds, will fail with "Failed to load World-Class AI" ✓
- Game will automatically fall back to "Hard" difficulty ✓

This allows testing the UI without needing the large WASM files.

## License

GNU Backgammon is licensed under GPL v3. Make sure to comply with the license terms when using these files.

## More Information

- GNU Backgammon: https://www.gnu.org/software/gnubg/
- gnubg-web (WASM port): https://github.com/hwatheod/gnubg-web
- Integration docs: See `/src/games/backgammon/gnubg/README.md`
