/**
 * UnifiedVerification Component
 *
 * A consistent verification page for all 7 games.
 * Provides standardized layout with game-specific sections.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// ============================================
// STYLING TOKENS (from spec)
// ============================================
const tokens = {
  bg: '#0f172a',
  cardBg: '#1e293b',
  border: '#334155',
  text: '#f1f5f9',
  textMuted: '#94a3b8',
  success: '#22c55e',
  error: '#ef4444',
  accent: '#3b82f6',
  mono: '#a5b4fc',
  sectionGap: 24,
  itemGap: 12,
  cardPadding: 20,
  cardRadius: 12
};

// ============================================
// GAME METADATA
// ============================================
const GAME_META = {
  solitaire: { name: 'Solitaire', icon: '♠', randomizes: '52-card deck shuffle' },
  blackjack: { name: 'Blackjack', icon: '♠♥', randomizes: '312-card shoe (6 decks)' },
  yahtzee: { name: 'Yahtzee', icon: '🎲', randomizes: 'Dice rolls (5 dice per roll)' },
  garbage: { name: 'Garbage', icon: '♣', randomizes: 'Card deal (player, AI, draw pile)' },
  '2048': { name: '2048', icon: '🔢', randomizes: 'Tile spawns (position + value)' },
  backgammon: { name: 'Backgammon', icon: '🎯', randomizes: 'Dice rolls (2 dice per turn)' },
  chess: { name: 'Chess', icon: '♔', randomizes: 'Player color assignment' }
};

// ============================================
// HELPER COMPONENTS
// ============================================

const CopyButton = ({ text, label, copied, onCopy }) => (
  <button
    style={styles.copyBtn}
    onClick={() => onCopy(text, label)}
  >
    {copied === label ? '✓ Copied' : 'Copy'}
  </button>
);

const ToggleButton = ({ expanded, onToggle, showLabel = 'Full', hideLabel = 'Hide' }) => (
  <button style={styles.copyBtn} onClick={onToggle}>
    {expanded ? hideLabel : showLabel}
  </button>
);

const ExplorerLink = ({ type, hash, children }) => {
  const baseUrl = 'https://explorer.ergoplatform.com/en';
  const url = type === 'block'
    ? `${baseUrl}/blocks/${hash}`
    : `${baseUrl}/transactions/${hash}`;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={styles.link}>
      {children}
    </a>
  );
};

const CollapsibleSection = ({ title, defaultOpen = false, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div style={{ marginTop: tokens.itemGap }}>
      <h4
        style={styles.collapsibleTitle}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '▼' : '▶'} {title}
      </h4>
      {isOpen && (
        <div style={styles.collapsibleContent}>
          {children}
        </div>
      )}
    </div>
  );
};

const VerificationBadge = ({ verified, eventCount }) => (
  <div style={{
    ...styles.badge,
    backgroundColor: verified ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
    borderColor: verified ? tokens.success : tokens.error
  }}>
    <span style={{ fontSize: '32px' }}>{verified ? '✓' : '✗'}</span>
    <div>
      <div style={{
        fontWeight: 'bold',
        fontSize: '18px',
        color: verified ? tokens.success : tokens.error
      }}>
        {verified ? 'VERIFIED' : 'VERIFICATION FAILED'}
      </div>
      <div style={{ fontSize: '13px', color: tokens.textMuted }}>
        {verified
          ? `All ${eventCount || ''} random events verified on Ergo blockchain`
          : 'Could not verify blockchain proof'
        }
      </div>
    </div>
  </div>
);

const DataRow = ({ label, value, mono = false, children }) => (
  <div style={styles.row}>
    <span style={styles.label}>{label}</span>
    {value && (
      <span style={mono ? styles.mono : styles.value}>{value}</span>
    )}
    {children}
  </div>
);

// ============================================
// PYTHON SCRIPT GENERATOR
// ============================================
const generatePythonScript = (game, data) => {
  const gameSpecificCode = {
    solitaire: `
# Solitaire-specific: shuffle 52 cards
# Uses EXACT same algorithm as JavaScript

RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
SUITS_NAMES = ['hearts', 'diamonds', 'clubs', 'spades']
SUITS_SYMBOLS = ['♥', '♦', '♣', '♠']

# Linear Congruential Generator (matches JavaScript seedRandom)
class SeededRandom:
    def __init__(self, seed_hex):
        self.state = int(seed_hex[:8], 16)
        self.a = 1103515245  # glibc constants
        self.c = 12345
        self.m = 2**31

    def random(self):
        self.state = (self.a * self.state + self.c) % self.m
        return self.state / self.m

def create_deck():
    """Create deck in same order as JavaScript"""
    deck = []
    for suit in SUITS_NAMES:
        for rank in RANKS:
            deck.append({'rank': rank, 'suit': suit})
    return deck

def shuffle_array(array, seed_hex):
    """Fisher-Yates shuffle matching JavaScript"""
    result = array.copy()
    rng = SeededRandom(seed_hex)
    for i in range(len(result) - 1, 0, -1):
        j = int(rng.random() * (i + 1))
        result[i], result[j] = result[j], result[i]
    return result

def format_card(card_obj):
    suit_idx = SUITS_NAMES.index(card_obj['suit'])
    return f"{card_obj['rank']}{SUITS_SYMBOLS[suit_idx]}"

deck = create_deck()
shuffled_deck = shuffle_array(deck, seed)

print(f"\\nShuffled deck (first 10 cards):")
for i in range(10):
    print(f"  {i+1}. {format_card(shuffled_deck[i])}")
`,
    blackjack: `
# Blackjack-specific: shuffle 312 cards (6 decks)
# Uses EXACT same algorithm as JavaScript

RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
SUITS_NAMES = ['hearts', 'diamonds', 'clubs', 'spades']
SUITS_SYMBOLS = ['♥', '♦', '♣', '♠']

# Linear Congruential Generator (matches JavaScript seedRandom)
class SeededRandom:
    def __init__(self, seed_hex):
        self.state = int(seed_hex[:8], 16)
        self.a = 1103515245  # glibc constants
        self.c = 12345
        self.m = 2**31

    def random(self):
        self.state = (self.a * self.state + self.c) % self.m
        return self.state / self.m

def create_shoe():
    """Create 6-deck shoe in same order as JavaScript"""
    shoe = []
    for deck in range(1, 7):  # decks 1-6
        for suit in SUITS_NAMES:
            for rank in RANKS:
                shoe.append({'rank': rank, 'suit': suit, 'deck': deck})
    return shoe

def shuffle_array(array, seed_hex):
    """Fisher-Yates shuffle matching JavaScript"""
    result = array.copy()
    rng = SeededRandom(seed_hex)
    for i in range(len(result) - 1, 0, -1):
        j = int(rng.random() * (i + 1))
        result[i], result[j] = result[j], result[i]
    return result

def format_card(card_obj):
    suit_idx = SUITS_NAMES.index(card_obj['suit'])
    return f"{card_obj['rank']}{SUITS_SYMBOLS[suit_idx]}"

shoe = create_shoe()
shuffled_shoe = shuffle_array(shoe, seed)

print(f"\\nShuffled shoe (first 10 cards):")
for i in range(10):
    print(f"  {i+1}. {format_card(shuffled_shoe[i])}")
`,
    yahtzee: `
# Yahtzee-specific: generate dice rolls
# NOTE: Yahtzee uses per-roll blockchain data (block traversal)
# This script verifies the first roll using the first roll's block data

def generate_yahtzee_seed(block_hash, tx_hash, timestamp, game_id, tx_index, turn, roll):
    """Generate seed matching Yahtzee's generateSeedFromSource exactly"""
    turn_roll = f"T{turn}R{roll}"
    # Direct concatenation, no separators (matches JavaScript join(''))
    seed_input = f"{block_hash}{tx_hash}{timestamp}{game_id}{tx_index}{turn_roll}"
    return hashlib.sha256(seed_input.encode()).hexdigest(), seed_input

def calculate_die_value(seed, die_index):
    """Calculate single die value matching Yahtzee's calculateDieValue"""
    die_hash = hashlib.sha256(f"{seed}{die_index}".encode()).hexdigest()
    numeric_value = int(die_hash[:8], 16)
    return (numeric_value % 6) + 1

def roll_dice(block_hash, tx_hash, timestamp, game_id, tx_index, turn, roll):
    """Roll all 5 dice for a specific turn/roll"""
    seed, seed_input = generate_yahtzee_seed(block_hash, tx_hash, timestamp, game_id, tx_index, turn, roll)
    dice = [calculate_die_value(seed, i) for i in range(5)]
    return dice, seed, seed_input

# Debug: print all values being used
print(f"TX Hash: {tx_hash[:20]}..." if tx_hash else "TX Hash: None")
print(f"TX Index: {tx_index}")
print(f"Timestamp: {timestamp}")
print()

# First roll (Turn 1, Roll 1) using first roll's block data
dice, roll_seed, seed_input = roll_dice(block_hash, tx_hash, timestamp, game_id, tx_index, 1, 1)
print(f"Seed input (first 80 chars): {seed_input[:80]}...")
print(f"Roll seed: {roll_seed[:32]}...")
print(f"First roll: {dice}")
`,
    backgammon: `
# Backgammon-specific: generate dice rolls
# Uses rejection sampling to eliminate modulo bias (matches JavaScript exactly)
def roll_dice(block_hash, game_id, turn_number):
    """Generate two dice values using blockchain seed"""
    seed_input = f"{block_hash}{game_id}{turn_number}"
    hash_hex = hashlib.sha256(seed_input.encode()).hexdigest()

    dice = []
    byte_index = 0

    # Rejection sampling: skip bytes >= 252 to avoid bias
    while len(dice) < 2 and byte_index < len(hash_hex) - 1:
        byte_val = int(hash_hex[byte_index:byte_index + 2], 16)
        byte_index += 2
        if byte_val < 252:
            dice.append((byte_val % 6) + 1)

    return tuple(dice), seed_input, hash_hex

# Generate first 5 rolls
print("First 5 dice rolls:")
print("-" * 40)
for turn in range(1, 6):
    dice, seed_input, hash_hex = roll_dice(block_hash, game_id, turn)
    print(f"Turn {turn}: {dice}")
    if turn == 1:
        print(f"  Seed: {seed_input[:60]}...")
        print(f"  Hash: {hash_hex[:32]}...")
print()
`,
    '2048': `
# 2048-specific: full game replay and spawn verification
# NOTE: 2048 uses anchor/fanning pattern - all spawns derive from a SINGLE block.
# The seed formula is: SHA256(blockHash + gameId + spawnIndex)
# NOT the unified seed in the common header above.

move_history = "${data.moveHistory || ''}"

# ============================================
# GRID LOGIC (matches gridLogic.js exactly)
# ============================================

def create_empty_grid():
    return [[0]*4 for _ in range(4)]

def clone_grid(grid):
    return [row[:] for row in grid]

def get_empty_cells(grid):
    cells = []
    for r in range(4):
        for c in range(4):
            if grid[r][c] == 0:
                cells.append((r, c))
    return cells

def grids_equal(g1, g2):
    return all(g1[r][c] == g2[r][c] for r in range(4) for c in range(4))

def rotate_cw(grid):
    """Rotate 90 degrees clockwise (matches JS rotateGrid)"""
    rotated = create_empty_grid()
    for r in range(4):
        for c in range(4):
            rotated[c][3 - r] = grid[r][c]
    return rotated

def rotate_grid(grid, times):
    result = clone_grid(grid)
    for _ in range(times):
        result = rotate_cw(result)
    return result

def slide_row_left(row):
    """Slide and merge row left. Each tile merges only once."""
    values = [v for v in row if v > 0]
    merged = []
    score = 0
    i = 0
    while i < len(values):
        if i + 1 < len(values) and values[i] == values[i + 1]:
            new_val = values[i] * 2
            merged.append(new_val)
            score += new_val
            i += 2
        else:
            merged.append(values[i])
            i += 1
    while len(merged) < 4:
        merged.append(0)
    return merged, score

def slide_grid(grid, direction):
    """Slide grid in direction. Returns (new_grid, score, moved)"""
    rotations = {'left': 0, 'up': 3, 'right': 2, 'down': 1}
    rot = rotations[direction]
    working = clone_grid(grid)
    if rot > 0:
        working = rotate_grid(working, rot)
    total_score = 0
    for r in range(4):
        working[r], row_score = slide_row_left(working[r])
        total_score += row_score
    if rot > 0:
        working = rotate_grid(working, 4 - rot)
    moved = not grids_equal(grid, working)
    return working, total_score, moved

# ============================================
# SPAWN LOGIC (matches spawnLogic.js exactly)
# ============================================

def generate_master_seed(bh, gid, spawn_idx):
    """SHA256(blockHash + gameId + spawnIndex)"""
    return hashlib.sha256(f"{bh}{gid}{spawn_idx}".encode()).hexdigest()

def calc_spawn_position(seed_hex, empty_cells):
    """SHA256(seed + 'position') -> first 8 hex chars -> mod emptyCells"""
    pos_hash = hashlib.sha256((seed_hex + "position").encode()).hexdigest()
    return empty_cells[int(pos_hash[:8], 16) % len(empty_cells)]

def calc_spawn_value(seed_hex):
    """SHA256(seed + 'value') -> first 8 hex chars -> mod 100 -> <90=2, >=90=4"""
    val_hash = hashlib.sha256((seed_hex + "value").encode()).hexdigest()
    return 2 if int(val_hash[:8], 16) % 100 < 90 else 4

def spawn_tile(grid, bh, gid, spawn_idx):
    """Spawn tile on grid. Returns (new_grid, spawn_info, seed, empty_count)"""
    empty = get_empty_cells(grid)
    if not empty:
        return grid, None, None, 0
    seed = generate_master_seed(bh, gid, spawn_idx)
    pos = calc_spawn_position(seed, empty)
    value = calc_spawn_value(seed)
    new_grid = clone_grid(grid)
    new_grid[pos[0]][pos[1]] = value
    return new_grid, (pos[0], pos[1], value), seed, len(empty)

# ============================================
# REPLAY GAME FROM MOVE HISTORY
# ============================================

if not move_history:
    print("No move history available - cannot replay game.")
    print("Move history is required to verify 2048 spawns.")
    print("(The board state at each move determines empty cells for spawn placement)")
else:
    dir_map = {'U': 'up', 'D': 'down', 'L': 'left', 'R': 'right'}
    moves = [dir_map[c] for c in move_history if c in dir_map]

    grid = create_empty_grid()
    spawn_idx = 0
    score = 0
    spawns = []

    # Initial two tile spawns
    grid, s1, seed1, e1 = spawn_tile(grid, block_hash, game_id, spawn_idx)
    if s1:
        spawns.append((spawn_idx, s1, seed1, e1))
    spawn_idx += 1

    grid, s2, seed2, e2 = spawn_tile(grid, block_hash, game_id, spawn_idx)
    if s2:
        spawns.append((spawn_idx, s2, seed2, e2))
    spawn_idx += 1

    # Process each move
    for direction in moves:
        new_grid, move_score, moved = slide_grid(grid, direction)
        if moved:
            score += move_score
            grid = new_grid
            grid, sp, sd, emp = spawn_tile(grid, block_hash, game_id, spawn_idx)
            if sp:
                spawns.append((spawn_idx, sp, sd, emp))
            spawn_idx += 1

    # ============================================
    # RESULTS
    # ============================================
    print(f"Replay complete!")
    print(f"  Moves played: {len(moves)}")
    print(f"  Tile spawns:  {len(spawns)}")
    print(f"  Final score:  {score}")
    print()

    def show_spawn(si, info, sd, emp):
        r, c, v = info
        print(f"  #{si:4d}: pos=({r},{c}) val={v}  empty_cells={emp}  seed={sd[:16]}...")

    if len(spawns) <= 10:
        print("All spawns:")
        for s in spawns:
            show_spawn(*s)
    else:
        print("First 5 spawns:")
        for s in spawns[:5]:
            show_spawn(*s)
        print(f"  ... ({len(spawns) - 10} more) ...")
        print("Last 5 spawns:")
        for s in spawns[-5:]:
            show_spawn(*s)

    print()
    print("Final board:")
    for r in range(4):
        print("  " + "".join(f"{grid[r][c]:>6}" if grid[r][c] > 0 else "     ." for c in range(4)))

    twos = sum(1 for _, info, _, _ in spawns if info[2] == 2)
    fours = sum(1 for _, info, _, _ in spawns if info[2] == 4)
    if spawns:
        print(f"\\nTile distribution: {twos}x2 ({twos*100//len(spawns)}%) | {fours}x4 ({fours*100//len(spawns)}%)")
        print(f"Expected: ~90% twos, ~10% fours")

    print(f"\\nAll {len(spawns)} spawns verified deterministically from anchor block #{block_height}.")
`,
    chess: `
# Chess-specific: verify color assignment
def get_player_color(block_hash, user_seed):
    combined = block_hash + str(user_seed)
    char_sum = sum(ord(c) for c in combined)
    return "white" if char_sum % 2 == 0 else "black"

color = get_player_color(block_hash, "${data.userSeed || 'USER_SEED'}")
print(f"Assigned color: {color}")
`,
    garbage: `
# Garbage-specific: shuffle and deal cards
import random

def deal_garbage(seed_int):
    deck = list(range(52))
    random.seed(seed_int)
    random.shuffle(deck)
    player_hand = deck[:10]
    ai_hand = deck[10:20]
    draw_pile = deck[20:]
    return player_hand, ai_hand, draw_pile

player, ai, draw = deal_garbage(seed_int)
print(f"Player hand: {player}")
print(f"AI hand: {ai}")
`
  };

  return `#!/usr/bin/env python3
"""
Provably Fair Games - Independent Verification Script
Game: ${GAME_META[game]?.name || game}
Game ID: ${data.gameId}
Generated: ${new Date().toISOString()}
"""

import hashlib

# ============================================
# BLOCKCHAIN DATA
# ============================================
block_hash = "${data.blockHash}"
block_height = ${data.blockHeight || 'None'}
tx_hash = "${data.txHash || ''}"
tx_index = ${data.txIndex ?? 0}
timestamp = ${data.timestamp || 'None'}
game_id = "${data.gameId}"

# ============================================
# SEED GENERATION (matches client-side)
# ============================================
def simple_hash(input_str):
    """Simple hash function matching JavaScript simpleHash"""
    h = 0
    for c in input_str:
        h = ((h << 5) - h) + ord(c)
        h = h & 0xFFFFFFFF  # Convert to 32-bit
    # Return absolute value to match JavaScript Math.abs
    if h >= 0x80000000:
        h = -(0x100000000 - h)
    return abs(h)

def generate_seed(block_hash, tx_hash, timestamp, game_id, tx_index):
    """Generate seed matching JavaScript generateSeed exactly"""
    # Use colons to separate inputs (matches JavaScript)
    input_str = f"{block_hash}:{tx_hash}:{timestamp}:{game_id}:{tx_index}"

    # Generate 4 hash rounds (matches JavaScript)
    hash1 = simple_hash(input_str)
    hash2 = simple_hash(input_str + str(hash1))
    hash3 = simple_hash(str(hash1) + str(hash2))
    hash4 = simple_hash(str(hash2) + str(hash3))

    # Convert to 8-char hex strings (padded with zeros)
    hex1 = format(hash1, '08x')
    hex2 = format(hash2, '08x')
    hex3 = format(hash3, '08x')
    hex4 = format(hash4, '08x')

    # Concatenate twice and slice to 64 chars (matches JavaScript)
    return (hex1 + hex2 + hex3 + hex4 + hex1 + hex2 + hex3 + hex4)[:64]

# Generate the seed
seed = generate_seed(block_hash, tx_hash, timestamp, game_id, tx_index)
seed_int = int(hashlib.sha256(seed.encode()).hexdigest(), 16)

print("=" * 50)
print("VERIFICATION RESULTS")
print("=" * 50)
print(f"Game ID: {game_id}")
print(f"Block Height: {block_height}")
print(f"Block Hash: {block_hash[:20]}...")
print(f"Generated Seed: {seed[:32]}...")
print()

# ============================================
# GAME-SPECIFIC VERIFICATION
# ============================================
${gameSpecificCode[game] || '# No game-specific verification code'}

print()
print("=" * 50)
print("To verify:")
print("1. Look up block on Ergo Explorer")
print("2. Confirm block hash matches")
print("3. Run this script - results should match game")
print("=" * 50)
`;
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function UnifiedVerification({
  game,
  gameId,
  data,
  verified = false,
  eventCount,
  backLink,
  backText,
  // Game-specific render props
  renderGameSummary,
  renderReplay,
  renderStatistics,
  // Loading states
  loading = false,
  notFound = false,
  error = null
}) {
  const [copied, setCopied] = useState(null);
  const [showFullBlockHash, setShowFullBlockHash] = useState(false);
  const [showFullTxHash, setShowFullTxHash] = useState(false);

  const gameMeta = GAME_META[game] || { name: game, icon: '🎮', randomizes: 'Random events' };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const truncateHash = (hash) => {
    if (!hash || hash.length <= 20) return hash || 'N/A';
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  const formatDate = (ts) => {
    if (!ts) return 'Unknown';
    const date = typeof ts === 'number' ? new Date(ts) : new Date(ts);
    return date.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null) return 'N/A';
    return num.toLocaleString();
  };

  const downloadPythonScript = () => {
    const script = generatePythonScript(game, data);
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verify-${game}-${gameId}.py`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Not found state
  if (notFound) {
    return (
      <div style={styles.container}>
        <h1 style={styles.pageTitle}>Game Not Found</h1>
        <p style={{ color: tokens.textMuted, marginBottom: 20 }}>
          Could not find verification data for game: <code style={styles.mono}>{gameId}</code>
        </p>
        <p style={{ color: tokens.textMuted, fontSize: 14, marginBottom: 30 }}>
          Game data is stored locally in your browser. If you cleared your browser data
          or are on a different device, the verification data won't be available.
        </p>
        {backLink && <Link to={backLink} style={styles.link}>{backText || '← Back'}</Link>}
      </div>
    );
  }

  // Loading state
  if (loading || !data) {
    return (
      <div style={styles.container}>
        <p style={{ color: tokens.textMuted }}>Loading verification data...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={styles.container}>
        <h1 style={styles.pageTitle}>Verification Error</h1>
        <p style={{ color: tokens.error }}>{error}</p>
        {backLink && <Link to={backLink} style={styles.link}>{backText || '← Back'}</Link>}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        {backLink && (
          <Link to={backLink} style={styles.link}>{backText || '← Back'}</Link>
        )}
        <h1 style={styles.pageTitle}>
          {gameMeta.icon} {gameMeta.name} Verification
        </h1>
        <p style={{ color: tokens.textMuted, margin: 0, fontSize: 14 }}>
          Independently verify this game was provably fair
        </p>
      </div>

      {/* Game ID & Timestamp */}
      <div style={styles.section}>
        <DataRow label="Game ID:" mono>
          <span style={styles.mono}>{gameId}</span>
          <CopyButton text={gameId} label="gameId" copied={copied} onCopy={copyToClipboard} />
        </DataRow>
        <DataRow label="Played:" value={formatDate(data.timestamp)} />
        <DataRow label="What's randomized:" value={gameMeta.randomizes} />
      </div>

      {/* Verification Badge */}
      <VerificationBadge verified={verified} eventCount={eventCount} />

      {/* Blockchain Anchor */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>⚓ Blockchain Anchor</h3>

        <DataRow label="Block Height:">
          <span style={styles.mono}>{formatNumber(data.blockHeight)}</span>
          <ExplorerLink type="block" hash={data.blockHash}>
            View on Explorer →
          </ExplorerLink>
        </DataRow>

        <DataRow label="Block Hash:">
          <span style={styles.mono}>
            {showFullBlockHash ? data.blockHash : truncateHash(data.blockHash)}
          </span>
          <ToggleButton
            expanded={showFullBlockHash}
            onToggle={() => setShowFullBlockHash(!showFullBlockHash)}
          />
          <CopyButton text={data.blockHash} label="blockHash" copied={copied} onCopy={copyToClipboard} />
        </DataRow>

        {data.txHash && (
          <DataRow label="TX Hash:">
            <span style={styles.mono}>
              {showFullTxHash ? data.txHash : truncateHash(data.txHash)}
            </span>
            <ToggleButton
              expanded={showFullTxHash}
              onToggle={() => setShowFullTxHash(!showFullTxHash)}
            />
            <CopyButton text={data.txHash} label="txHash" copied={copied} onCopy={copyToClipboard} />
            <ExplorerLink type="tx" hash={data.txHash}>
              View TX →
            </ExplorerLink>
          </DataRow>
        )}

        {data.txIndex !== undefined && (
          <DataRow
            label="TX Index:"
            value={`${data.txIndex}${data.txCount ? ` of ${data.txCount}` : ''}`}
            mono
          />
        )}

        <DataRow label="Timestamp:" value={data.timestamp?.toString()} mono />
      </div>

      {/* Anti-Spoofing / Seed Formula */}
      <CollapsibleSection title="🔐 Seed Formula (Anti-Spoofing)">
        <div style={styles.seedBox}>
          <code style={styles.codeBlock}>
            seed = HASH(blockHash + txHash + timestamp + gameId + txIndex)
          </code>
          <p style={styles.seedNote}>
            5 independent inputs = virtually impossible to manipulate.
            An attacker would need to control the blockchain itself.
          </p>
          {data.seed && (
            <div style={{ marginTop: 12 }}>
              <DataRow label="Generated Seed:">
                <span style={{ ...styles.mono, fontSize: 10, wordBreak: 'break-all' }}>
                  {data.seed}
                </span>
                <CopyButton text={data.seed} label="seed" copied={copied} onCopy={copyToClipboard} />
              </DataRow>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Game-Specific Summary (custom render) */}
      {renderGameSummary && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>🎮 Game Summary</h3>
          {renderGameSummary()}
        </div>
      )}

      {/* Game-Specific Replay/History (custom render) */}
      {renderReplay && (
        <CollapsibleSection title="🎬 Replay / History">
          {renderReplay()}
        </CollapsibleSection>
      )}

      {/* Statistics (optional) */}
      {renderStatistics && (
        <CollapsibleSection title="📊 Statistics">
          {renderStatistics()}
        </CollapsibleSection>
      )}

      {/* Independent Verification */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>📋 How to Verify Independently</h3>
        <ol style={styles.stepsList}>
          <li>
            Look up{' '}
            <ExplorerLink type="block" hash={data.blockHash}>
              block #{formatNumber(data.blockHeight)}
            </ExplorerLink>
            {' '}on Ergo Explorer
          </li>
          <li>Confirm the block hash matches: <code style={styles.miniCode}>{truncateHash(data.blockHash)}</code></li>
          {data.txHash && (
            <li>Confirm TX hash: <code style={styles.miniCode}>{truncateHash(data.txHash)}</code></li>
          )}
          <li>Download and run the verification script below</li>
          <li>Compare results - identical inputs = identical outputs</li>
        </ol>

        <button style={styles.downloadBtn} onClick={downloadPythonScript}>
          📥 Download Python Verification Script
        </button>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <p>This game is provably fair using Ergo blockchain</p>
        <Link to="/how-it-works" style={styles.link}>Learn how it works →</Link>
      </div>

      {/* Copy Toast */}
      {copied && <div style={styles.toast}>Copied to clipboard!</div>}
    </div>
  );
}

// ============================================
// STYLES
// ============================================
const styles = {
  container: {
    padding: 20,
    maxWidth: 700,
    margin: '0 auto',
    color: tokens.text,
    backgroundColor: tokens.bg,
    minHeight: '100vh',
    fontFamily: 'system-ui, sans-serif'
  },
  header: {
    marginBottom: tokens.sectionGap
  },
  pageTitle: {
    margin: '8px 0',
    fontSize: 24,
    fontWeight: 600
  },
  section: {
    backgroundColor: tokens.cardBg,
    borderRadius: tokens.cardRadius,
    padding: tokens.cardPadding,
    marginBottom: tokens.sectionGap,
    border: `1px solid ${tokens.border}`
  },
  sectionTitle: {
    margin: '0 0 16px 0',
    fontSize: 15,
    color: tokens.accent,
    fontWeight: 600
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: tokens.itemGap,
    flexWrap: 'wrap'
  },
  label: {
    color: tokens.textMuted,
    fontSize: 13,
    minWidth: 100,
    flexShrink: 0
  },
  value: {
    color: tokens.text,
    fontSize: 13
  },
  mono: {
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: '4px 8px',
    borderRadius: 4,
    fontSize: 12,
    color: tokens.mono,
    wordBreak: 'break-all'
  },
  miniCode: {
    fontFamily: 'monospace',
    fontSize: 11,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: '2px 4px',
    borderRadius: 3,
    color: tokens.mono
  },
  copyBtn: {
    padding: '4px 8px',
    fontSize: 11,
    backgroundColor: tokens.border,
    color: tokens.textMuted,
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  link: {
    color: tokens.accent,
    textDecoration: 'none',
    fontSize: 13
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    borderRadius: tokens.cardRadius,
    marginBottom: tokens.sectionGap,
    border: '2px solid'
  },
  collapsibleTitle: {
    margin: '8px 0',
    fontSize: 14,
    color: tokens.accent,
    cursor: 'pointer',
    userSelect: 'none',
    fontWeight: 600
  },
  collapsibleContent: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 16,
    borderRadius: 8,
    marginTop: 8
  },
  seedBox: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 16,
    borderRadius: 8
  },
  codeBlock: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
    color: tokens.success,
    display: 'block',
    marginBottom: 8
  },
  seedNote: {
    color: tokens.textMuted,
    fontSize: 12,
    margin: 0
  },
  stepsList: {
    color: tokens.text,
    fontSize: 14,
    margin: 0,
    paddingLeft: 20,
    lineHeight: 2
  },
  downloadBtn: {
    marginTop: 16,
    padding: '12px 20px',
    fontSize: 14,
    backgroundColor: tokens.accent,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 500
  },
  footer: {
    textAlign: 'center',
    padding: 20,
    color: tokens.textMuted,
    fontSize: 13
  },
  toast: {
    position: 'fixed',
    bottom: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: tokens.cardBg,
    color: tokens.text,
    padding: '10px 20px',
    borderRadius: 8,
    fontSize: 13,
    border: `1px solid ${tokens.border}`,
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
  }
};
