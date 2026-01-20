# Provably Fair Games - Launch Plan v2

**Created:** January 20, 2026
**Status:** Planning Complete - Ready for Execution

---

## Executive Summary

This document outlines the complete launch plan for the Provably Fair Games platform. The plan is organized into 7 phases, prioritizing security first, then building toward a polished user experience.

**Key Decisions Locked:**
- All 7 games launch-critical (go big or go home)
- Dark theme maintained throughout
- Landing page: Card table with fanned poker hand (desktop) / horizontal carousel (mobile)
- Card design: Playing card style with suits indicating game type
- Verification UX: Full consistency across all 7 games
- PWA: Yes, implement before mobile fixes
- CI/CD: Stay with Vercel (working fine)
- Backgammon mobile: Fix it, but last priority

---

## Phase 1: Security & Validation

**Priority:** CRITICAL
**Must complete first**

| Item | Status | Effort | Notes |
|------|--------|--------|-------|
| Chess server-side validator | TODO | Medium | No `/lib/validation/games/chess/` exists |
| Validate all 6 other validators working | Done | - | All have validators |
| Backgammon dice bug fix | Done | - | Verified in code (line 306) |

### Chess Validator Requirements
- Follow existing validator pattern from other games
- Validate color assignment was blockchain-derived
- Validate AI commitment hash matches settings
- Validate move legality (use chess.js or similar)
- Return detailed validation result

---

## Phase 2: Content Preparation

**Priority:** HIGH
**Can run in parallel with Phase 1**

### Landing Page Content

| Item | Status | Notes |
|------|--------|-------|
| Hero tagline | TODO | "Pick your game. Verify your luck." or similar |
| Footer copy | TODO | "House edge: 0%" |

### Game Card Content (7 cards)

| Game | Suit | Tagline | Expanded Description | Status |
|------|------|---------|---------------------|--------|
| Solitaire | Hearts | TODO | TODO | TODO |
| Blackjack | Hearts | TODO | TODO | TODO |
| Garbage | Hearts | TODO | TODO | TODO |
| Yahtzee | Diamonds | TODO | TODO | TODO |
| 2048 | Clubs | TODO | TODO | TODO |
| Backgammon | Spades | TODO | TODO | TODO |
| Chess | Spades | TODO | TODO | TODO |

**Suit Legend:**
- Hearts = Card games (Solitaire, Blackjack, Garbage)
- Diamonds = Dice/Luck games (Yahtzee)
- Clubs = Puzzle games (2048)
- Spades = Strategy games (Chess, Backgammon)

### How It Works Page Content

| Section | Status | Notes |
|---------|--------|-------|
| The Problem | TODO | Why traditional online games can't be trusted |
| The Solution: Blockchain RNG | TODO | Ergo blockchain explanation (simple) |
| Per-Game Details (x7) | TODO | Dropdown/slider - what's randomized, how to verify |
| Why This is Trustless | TODO | Can't predict, can't modify, independent verification |
| Leaderboards | TODO | How scoring works, anti-cheat measures |
| FAQ | TODO | Common questions |

---

## Phase 3: Verification UX Consistency

**Priority:** HIGH
**User trust depends on this**

### Current State Analysis

| Game | Page Type | Game ID | Block Hash | TX Hash | Explorer Links | Python Script |
|------|-----------|---------|------------|---------|----------------|---------------|
| Solitaire | Full page | Yes | Yes | Yes | Yes | No |
| Blackjack | Full page | Yes | Yes | Yes | Yes | No |
| Yahtzee | Full page | Yes | Yes | Yes | Yes | Yes |
| Backgammon | Full page | Yes | Per-roll | No | Per-roll | Yes |
| 2048 | Full page | Yes | Yes | No | Yes | Yes |
| Chess | **Panel only** | **No** | Truncated | **No** | **No** | **No** |
| Garbage | Shared component | Yes | Yes | Yes | Yes | No |

**Key Issues:**
- Chess is drastically different (panel vs full page, missing most fields)
- Data shown varies wildly across games
- Python scripts only on 3 of 7 games
- Inconsistent styling patterns

### Migration Tasks

| Item | Status | Notes |
|------|--------|-------|
| Create unified VerificationPage component | TODO | Based on spec below |
| Migrate Solitaire to unified | TODO | Closest to spec already |
| Migrate Blackjack to unified | TODO | |
| Migrate Yahtzee to unified | TODO | |
| Migrate Backgammon to unified | TODO | |
| Migrate 2048 to unified | TODO | |
| Migrate Chess to unified | TODO | Most work needed |
| Migrate Garbage to unified | TODO | |
| Add Python script download to all 7 | TODO | Currently only 3 have it |
| Consistent Explorer links for all 7 | TODO | |
| QA pass - verify all 7 work | TODO | |

### Unified Verification Component Spec

#### Design Principles

1. **Full page for all games** - No more inline panels
2. **Same data structure** - All games show same core fields
3. **Game-specific sections** - Consistent placement, game-unique content
4. **Consistent styling** - Dark theme, same component patterns
5. **Progressive disclosure** - Core info visible, details collapsible

#### Component Structure

```
VerificationPage (unified)
├── Header
│   ├── Game Icon + Name
│   ├── Game ID (with copy button)
│   ├── Timestamp
│   └── Back to Game button
│
├── VerificationBadge
│   ├── Large status: VERIFIED / FAILED / VERIFYING
│   └── Subtitle: "All [N] random events verified on Ergo blockchain"
│
├── BlockchainAnchor (common to all)
│   ├── Block Height + Explorer link
│   ├── Block Hash (truncated + full toggle + copy)
│   ├── TX Hash (truncated + full toggle + copy)
│   ├── TX Index
│   └── Timestamp
│
├── AntiSpoofingExplainer (collapsible)
│   ├── "Why 5 inputs?" explanation
│   └── Visual showing: Block Hash + TX Hash + TX Index + Parent TX + Timestamp
│
├── SeedFormula (collapsible)
│   ├── Formula display with actual values
│   └── Final seed value
│
├── GameSpecificVerification (varies by game)
│   └── [See per-game specs below]
│
├── Replay/History (collapsible)
│   ├── Game-specific replay component
│   └── Event-by-event breakdown
│
├── Statistics (optional, collapsible)
│   └── Game-specific stats
│
├── IndependentVerification
│   ├── Download Python Script button
│   ├── "How to Verify" steps (collapsible)
│   └── Ergo Explorer links
│
└── Footer
    ├── "This game is provably fair using Ergo blockchain"
    └── Link to How It Works page
```

#### Common Data Fields (All 7 Games)

| Field | Type | Display | Actions |
|-------|------|---------|---------|
| `gameId` | string | Truncated UUID | Copy |
| `gameName` | string | Icon + Title | - |
| `timestamp` | ISO date | Formatted date/time | - |
| `blockHeight` | number | With comma formatting | Explorer link |
| `blockHash` | string | Truncated (16 chars) | Full toggle, Copy, Explorer |
| `txHash` | string | Truncated (16 chars) | Full toggle, Copy, Explorer |
| `txIndex` | number | "X of Y" format | - |
| `parentTxHash` | string | Truncated | Full toggle, Copy |
| `verificationStatus` | enum | Badge (VERIFIED/FAILED) | - |
| `randomEventsCount` | number | "N random events" | - |

#### Game-Specific Sections

**Solitaire**
- What was randomized: "52-card deck shuffle"
- Shuffle seed display
- Deal Replay: Shows initial tableau layout

**Blackjack**
- What was randomized: "312-card shoe (6 decks)"
- Final Balance display
- Shoe Order: Collapsible list of all 312 cards
- Round-by-round breakdown with replay
- Statistics: Wins/Losses/Pushes/Blackjacks

**Yahtzee**
- What was randomized: "Dice rolls (5 dice per roll)"
- Final Score display
- Turn-by-turn breakdown with per-roll verification
- Each roll has individual "Verify" button

**Backgammon**
- What was randomized: "Dice rolls (2 dice per turn)"
- Winner + Win Type (normal/gammon/backgammon)
- Final Score + Doubling cube value
- Turn-by-turn breakdown with per-roll verification
- Full Game Replay component (visual board)
- Statistics: Dice distribution, Chi-squared test, Doubles %

**2048**
- What was randomized: "Tile spawns (position + value)"
- Final Score
- Spawn verification table (position, value, seed, status)
- Statistics: Total moves, Highest tile, Spawn distribution

**Chess**
- What was randomized: "Player color assignment"
- AI Settings Commitment (locked before game)
- Commitment Hash verification
- Move-by-move notation (PGN format)
- Result + Reason

**Garbage**
- What was randomized: "Card deal (player, AI, draw pile)"
- Winner
- Initial deal display (both hands + draw pile)
- Round-by-round progression
- Statistics: Wild cards count

#### Styling Tokens

```css
/* Color tokens - dark theme */
--verify-bg: #0f172a;           /* Page background */
--verify-card-bg: #1e293b;      /* Card/section background */
--verify-border: #334155;       /* Borders */
--verify-text: #f1f5f9;         /* Primary text */
--verify-text-muted: #94a3b8;   /* Secondary text */
--verify-success: #22c55e;      /* Verified badge */
--verify-error: #ef4444;        /* Failed badge */
--verify-accent: #3b82f6;       /* Links, buttons */
--verify-mono: #a5b4fc;         /* Monospace values (hashes) */

/* Typography */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
--font-body: system-ui, sans-serif;

/* Spacing */
--section-gap: 24px;
--item-gap: 12px;
--card-padding: 20px;
--card-radius: 12px;
```

#### Component Behaviors

| Component | Behavior |
|-----------|----------|
| Copy buttons | Click → "Copied!" toast, 2s timeout |
| Full hash toggle | Inline expand/collapse |
| Explorer links | Open in new tab |
| Collapsible sections | Smooth accordion animation |
| Verify buttons | Loading state → Success/Fail badge |
| Download script | Generates Python file with game data embedded |

---

## Phase 4: PWA Implementation

**Priority:** MEDIUM-HIGH
**Do before mobile fixes - may help mobile experience**

| Item | Status | Notes |
|------|--------|-------|
| Create manifest.json | TODO | App name, icons, theme colors |
| Create service worker | TODO | Offline support, asset caching |
| Add PWA icons (multiple sizes) | TODO | 192x192, 512x512, maskable |
| Configure Vercel for PWA | TODO | Headers, caching strategies |
| Add "Install App" prompt | TODO | iOS + Android detection |
| Test on iOS Safari | TODO | Add to homescreen flow |
| Test on Android Chrome | TODO | Install prompt flow |
| Splash screen configuration | TODO | Loading experience |

### PWA Manifest Template

```json
{
  "name": "Provably Fair Games",
  "short_name": "Fair Games",
  "description": "Blockchain-verified fair gaming",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#0f172a",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

---

## Phase 5: Mobile UX Fixes

**Priority:** HIGH
**Core experience - do after PWA to leverage fullscreen**

| Game | Issue | Status | Effort |
|------|-------|--------|--------|
| 2048 | Viewport swipe issues, page slides | TODO | Medium |
| Solitaire | Landscape broken, portrait unplayable | TODO | Medium |
| Blackjack | Can't see all in one view | TODO | Low-Medium |
| Chess | Unknown - needs testing | TODO | TBD |
| Yahtzee | Unknown - needs testing | TODO | TBD |
| Garbage | Unknown - needs testing | TODO | TBD |
| Backgammon | Board doesn't fit | TODO | High (LAST) |

### 2048 Mobile Fix Requirements
- Add `touch-action: none` to prevent browser swipe interference
- Use `100dvh` for full dynamic viewport height
- Capture touch events at game level
- Consider cream/warm tile colors (like 2048.co) within dark shell
- Larger touch targets for tiles

### Solitaire Mobile Fix Requirements
- Lock to landscape orientation OR
- Responsive redesign for portrait
- Prevent accidental browser gestures
- Card size scaling for screen width

### Blackjack Mobile Fix Requirements
- Tighter layout, reduce padding
- Smaller card sizes
- All elements visible without scroll
- Chip selector optimization

### Backgammon Mobile Fix (LAST PRIORITY)
- Complex board layout
- May need separate mobile view
- Consider "Best on desktop" message as fallback
- If fixing: simplified touch controls, zoom/pan?

---

## Phase 6: Landing Page Redesign

**Priority:** HIGH
**First impression - requires Phase 2 content complete**

### Design Decisions (Locked)

| Decision | Choice |
|----------|--------|
| Visual concept | Card table with green felt background |
| Desktop layout | Fanned poker hand (7 cards) |
| Mobile layout | Horizontal scroll carousel |
| Card style | Playing card style with suits |
| Interaction | Hover lifts card, click expands to details + Play |
| Theme | Dark with green felt accents |

### Theme System

| Element | Treatment |
|---------|-----------|
| Background | Green felt texture |
| Nav bar | Subtle chip/felt texture |
| How It Works | Cards being dealt animation |
| Leaderboard | Casino scoreboard display |
| Footer | "House edge: 0%" tagline |

### Implementation Tasks

| Item | Tool | Status |
|------|------|--------|
| Design card table landing (desktop) | Bolt/Lovable | TODO |
| Design horizontal carousel (mobile) | Bolt/Lovable | TODO |
| Design nav bar (chip/felt texture) | Bolt/Lovable | TODO |
| Design How It Works page | Bolt/Lovable | TODO |
| Design Leaderboard (casino scoreboard) | Bolt/Lovable | TODO |
| Design footer | Bolt/Lovable | TODO |
| Export and integrate into React app | Claude Code | TODO |
| Connect game cards to existing games | Claude Code | TODO |
| Wire up navigation | Claude Code | TODO |
| QA all pages | Manual | TODO |

### Landing Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│  [Nav: Logo | Games | How It Works | Leaderboard]           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│              Provably Fair Games                            │
│         Pick your game. Verify your luck.                   │
│                                                             │
│         ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐         │
│         │ ♥ │ │ ♥ │ │ ♥ │ │ ♦ │ │ ♣ │ │ ♠ │ │ ♠ │         │
│         │Sol│ │B21│ │Gar│ │Yah│ │204│ │Bkg│ │Chs│         │
│         └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘         │
│              (Fanned hand - hover to lift)                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Why Blockchain RNG?                                        │
│  • Can't predict future blocks                              │
│  • Can't modify past results                                │
│  • Anyone can verify independently                          │
├─────────────────────────────────────────────────────────────┤
│  [Live Leaderboard Ticker]                                  │
├─────────────────────────────────────────────────────────────┤
│  Footer: House edge: 0% | GitHub | How It Works             │
└─────────────────────────────────────────────────────────────┘
```

### Expanded Card State

When a card is clicked:

```
┌─────────────────────────────┐
│  ♠ CHESS ♠                  │
│  ─────────────              │
│  [Game Preview Image]       │
│                             │
│  Challenge Stockfish with   │
│  provably fair color        │
│  assignment. Every game     │
│  verified on blockchain.    │
│                             │
│  Best: 2,450 pts            │
│  24 players today           │
│                             │
│  [ PLAY NOW ]  [ Learn ]    │
└─────────────────────────────┘
```

---

## Phase 7: Polish & Launch Prep

**Priority:** MEDIUM
**Final touches before launch**

| Item | Status | Notes |
|------|--------|-------|
| Backgammon mobile fix | TODO | Last priority, most complex |
| Card flip animations | TODO | Landing page interaction |
| Page transitions | TODO | Smooth navigation |
| Loading states | TODO | Consistent spinners/skeletons |
| Error boundaries | TODO | Graceful error handling |
| Cross-browser testing | TODO | Safari, Firefox, Chrome, Edge |
| Mobile browser testing | TODO | iOS Safari, Android Chrome |
| Performance audit (Lighthouse) | TODO | Target 90+ scores |
| Accessibility pass | TODO | ARIA labels, keyboard nav |
| Final security review | TODO | One more pass |
| Soft launch / beta testers | TODO | Limited release first |

---

## Execution Timeline

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: Security           ░░░░░░░░  Chess validator      │
│  PHASE 2: Content            ░░░░░░░░  All copy/text        │
│  PHASE 3: Verification UX    ░░░░░░░░  7 game migrations    │
│  PHASE 4: PWA                ░░░░░░░░  Manifest + SW        │
│  PHASE 5: Mobile UX          ░░░░░░░░  6 games + Backgammon │
│  PHASE 6: Landing Redesign   ░░░░░░░░  Bolt/Lovable + integrate │
│  PHASE 7: Polish             ░░░░░░░░  Final touches        │
└─────────────────────────────────────────────────────────────┘

Parallelization Opportunities:
├── Phase 1 + 2: Can run in parallel (different workstreams)
├── Phase 3 + 4: Can partially overlap
├── Phase 5: Sequential (depends on PWA insights)
├── Phase 6: Requires Phase 2 complete (needs content)
└── Phase 7: Sequential (depends on everything else)
```

---

## Tools Assignment

| Work | Tool |
|------|------|
| Chess validator | Claude Code |
| Content drafting (all copy) | Claude Code |
| Unified verification component | Claude Code |
| PWA setup | Claude Code |
| Mobile game fixes | Claude Code |
| Landing page design | Bolt / Lovable |
| How It Works design | Bolt / Lovable |
| Integration of Bolt output | Claude Code |

---

## Success Criteria

Before launch, all of the following must be true:

- [ ] All 7 games playable and scores submitting
- [ ] Chess server-side validator implemented and working
- [ ] All 7 verification pages consistent and functional
- [ ] PWA installable on iOS and Android
- [ ] No critical mobile UX issues on any game
- [ ] Landing page polished with card table theme
- [ ] How It Works page complete with all content
- [ ] Lighthouse performance score 90+
- [ ] Cross-browser testing passed
- [ ] Security review completed

---

## Appendix: File Locations

### Key Files to Modify

```
Phase 1 (Chess Validator):
└── lib/validation/games/chess/     (CREATE)
    ├── index.js
    ├── moveValidator.js
    └── commitmentValidator.js

Phase 3 (Verification UX):
├── src/components/UnifiedVerification.jsx  (CREATE)
├── src/games/solitaire/VerificationPage.jsx
├── src/games/blackjack/VerificationPage.jsx
├── src/games/yahtzee/VerificationPage.jsx
├── src/games/backgammon/VerificationPage.jsx
├── src/games/2048/VerificationPage.jsx
├── src/games/chess/components/VerificationPanel.jsx
└── src/components/Verification.jsx (Garbage)

Phase 4 (PWA):
├── public/manifest.json            (CREATE)
├── public/sw.js                    (CREATE)
├── public/icons/                   (CREATE)
└── vercel.json                     (MODIFY)

Phase 5 (Mobile UX):
├── src/games/2048/Game2048.jsx
├── src/games/solitaire/SolitaireGame.jsx
├── src/games/blackjack/BlackjackGame.jsx
├── src/games/chess/ChessGame.jsx
├── src/games/yahtzee/YahtzeeGame.jsx
├── src/games/garbage/GarbageGame.jsx
└── src/games/backgammon/BackgammonGame.jsx

Phase 6 (Landing):
├── src/pages/Home.jsx
├── src/pages/HowItWorks.jsx
├── src/components/Navigation.jsx
├── src/components/Footer.jsx
└── src/components/GameCard.jsx     (CREATE)
```

---

*Document Version: 2.0*
*Last Updated: January 20, 2026*
