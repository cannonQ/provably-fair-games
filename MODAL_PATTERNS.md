# Modal Component Patterns

This document defines standard patterns for game modals to ensure consistency across all games.

## Verification Links in GameOver Modals

### ✅ Correct Pattern

Verification links should **always** open in a new tab to prevent navigation away from the modal:

```jsx
<a
  href={`/verify/[game]/${gameId}`}
  target="_blank"
  rel="noopener noreferrer"
  className="verify-link-btn"
>
  🔗 Verify this game on blockchain
</a>
```

### ❌ Incorrect Pattern

**NEVER** use react-router `<Link>` for verification links in modals:

```jsx
// DON'T DO THIS - navigates away, user loses modal state
<Link to={`/verify/[game]/${gameId}`}>
  Verify
</Link>
```

### Why This Matters

1. **User Experience**: User can submit score AND verify game without losing progress
2. **No 404 errors**: Verification page opens separately, modal stays visible
3. **Multi-tasking**: User can compare verification in one tab while reviewing stats in another

### Current Implementation Status

| Game       | Has Verification Link | Uses target="_blank" | Status |
|------------|----------------------|---------------------|--------|
| Chess      | ✅                    | ✅                   | ✅ Correct |
| Blackjack  | ✅                    | ✅                   | ✅ Correct |
| Solitaire  | ❌                    | N/A                 | ⚠️ No link |
| Yahtzee    | ❌                    | N/A                 | ⚠️ No link |
| Backgammon | ❌                    | N/A                 | ⚠️ No link |
| 2048       | ❌                    | N/A                 | ⚠️ No link |

## Other Modal Patterns

### Leaderboard Submission Form

Standard layout:
```jsx
{!submitted ? (
  <div className="leaderboard-submit">
    <h3>Submit to Leaderboard?</h3>
    <div className="submit-row">
      <input
        type="text"
        placeholder="Your name (optional)"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        maxLength={20}
      />
      <button onClick={handleSubmit} disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Score'}
      </button>
    </div>
    {submitError && <p className="submit-error">{submitError}</p>}
  </div>
) : (
  <div className="submit-success">
    ✓ Submitted! You ranked #{submitRank}
  </div>
)}
```

### Modal Actions

Standard two-button layout:
```jsx
<div className="modal-actions">
  <button className="action-btn primary" onClick={onNewGame}>
    New Game
  </button>
  <button className="action-btn secondary" onClick={onClose}>
    Review Game
  </button>
</div>
```

## CSS Classes

Standard modal classes that should be consistent:

- `.modal-overlay` - Full-screen backdrop
- `.game-over-modal` - Modal container
- `.result-header` - Top section with win/loss/draw
- `.game-stats` - Grid of game statistics
- `.leaderboard-submit` - Submission form container
- `.submit-row` - Input + button flex container
- `.verify-link` - Verification link container
- `.verify-link-btn` - Styled verification anchor
- `.modal-actions` - Bottom button row

## Responsive Design

### Mobile Breakpoints

```css
@media (max-width: 768px) {
  .game-stats {
    grid-template-columns: 1fr 1fr; /* 2 columns on tablets */
  }
  .submit-row {
    flex-direction: column; /* Stack input and button */
  }
}

@media (max-width: 480px) {
  .game-stats {
    grid-template-columns: 1fr; /* 1 column on phones */
  }
  .modal-actions {
    flex-direction: column; /* Stack buttons */
  }
}
```

## Implementation Checklist

When creating a new GameOver modal:

- [ ] Add verification link with `target="_blank"` and `rel="noopener noreferrer"`
- [ ] Include leaderboard submission form
- [ ] Use standard CSS class names
- [ ] Implement responsive design for mobile
- [ ] Add loading and error states for submission
- [ ] Display rank number after successful submission
- [ ] Test on mobile devices (390px, 360px widths)

## Future Improvements

Consider creating:
- `<VerificationLink gameId={id} game="chess" />` - Reusable component
- `<LeaderboardSubmitForm onSubmit={...} />` - Reusable component
- `<GameOverModal>` - Base component with common functionality
