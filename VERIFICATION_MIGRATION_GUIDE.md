# Commit-Reveal Verification Migration Guide

## Summary

All 5 games have been migrated to use the commit-reveal RNG system. This document provides the changes needed to complete the verification page updates.

## Completed:
- ✅ Yahtzee game updated to save server secret
- ✅ Yahtzee verification page updated to use commit-reveal formula

## Remaining Work:

### 1. Update Games to Save Server Secret

For each game (Backgammon, Solitaire, Blackjack, Garbage), make these changes:

#### Add State Variable (after other useState declarations):
```javascript
// Store revealed secret for verification
const [revealedSecret, setRevealedSecret] = useState(null);
```

#### Update endSecureSession useEffect:
```javascript
endSecureSession(sessionId, gameData).then(revealData => {
  console.log('✅ Game session ended and verified:', revealData);
  if (revealData.verified) {
    console.log('🔐 Server secret revealed and verified!');
  }
  // ADD THIS LINE:
  setRevealedSecret(revealData.serverSecret);
}).catch(error => {
  console.error('❌ Failed to end secure session:', error);
});
```

#### Update Verification Data Export:

**Backgammon** (`src/games/backgammon/BackgammonGame.jsx` - in `handleOpenVerification` function):
```javascript
const verificationData = {
  // ... existing fields ...
  serverSecret: revealedSecret,
  secretHash: secretHash,
  sessionId: sessionId
};
localStorage.setItem(`backgammon_${state.gameId}`, JSON.stringify(verificationData));
```

**Solitaire** (`src/games/solitaire/SolitaireGame.jsx` - when saving to localStorage):
```javascript
const verificationData = {
  // ... existing fields ...
  serverSecret: revealedSecret,
  secretHash: secretHash,
  sessionId: sessionId
};
localStorage.setItem(`solitaire_${state.blockchainData.gameId}`, JSON.stringify(verificationData));
```

**Blackjack** (`src/games/blackjack/BlackjackGame.jsx` - in sessionOver useEffect):
```javascript
const verificationData = {
  // ... existing fields ...
  serverSecret: revealedSecret,
  secretHash: secretHash,
  sessionId: sessionId
};
localStorage.setItem(`blackjack_${state.gameId}`, JSON.stringify(verificationData));
```

**Garbage** (`src/games/garbage/GarbageGame.jsx` - when saving to localStorage):
```javascript
// Add to blockData when starting game:
const blockDataWithSession = {
  ...block,
  sessionId,
  secretHash,
  gameId: newGameId,
  serverSecret: null // Will be filled when game ends
};

// In endSecureSession callback, update the stored data:
endSecureSession(sessionId, gameData).then(revealData => {
  // ... existing code ...
  setRevealedSecret(revealData.serverSecret);

  // Update stored blockData with revealed secret
  setBlockData(prev => ({ ...prev, serverSecret: revealData.serverSecret }));
}).catch(error => {
  console.error('❌ Failed to end secure session:', error);
});
```

### 2. Verification Formula

The new commit-reveal formula is:

```javascript
/**
 * Generate seed using commit-reveal formula
 * Formula: SHA256(serverSecret + blockHash + timestamp + purpose)
 */
function generateCommitRevealSeed(serverSecret, blockHash, timestamp, purpose) {
  const input = serverSecret + blockHash + timestamp.toString() + purpose;
  return CryptoJS.SHA256(input).toString();
}

/**
 * Verify that the server secret matches the commitment hash
 */
function verifySecretCommitment(serverSecret, secretHash) {
  const calculatedHash = CryptoJS.SHA256(serverSecret).toString();
  return calculatedHash === secretHash;
}
```

### 3. Verification Page Structure

Each verification page should:

1. **Load verification data** including `serverSecret`, `secretHash`, and `sessionId`
2. **Verify the commitment** by checking `SHA256(serverSecret) === secretHash`
3. **Show commitment verification banner** (green if verified, red if failed)
4. **Recalculate random values** using the commit-reveal formula
5. **Compare** with actual game history

See `/home/user/provably-fair-games/src/games/yahtzee/VerificationPage.jsx` as the reference implementation.

### 4. Per-Game Verification Pages

#### Backgammon
- Purpose format: `roll-${moveIndex}` or `move-${moveIndex}-dice-${dieNumber}`
- Verify dice rolls match game history

#### Solitaire
- Purpose: `'deck-shuffle'` (single shuffle)
- Verify deck order matches

#### Blackjack
- Initial shuffle: `'shoe-shuffle'`
- Reshuffles: `reshuffle-${timestamp}`
- Verify card order matches

#### Garbage
- Purpose: `'deck-shuffle'` (single shuffle)
- Verify deck order matches

### 5. Testing Verification

1. Play a complete game
2. Game should end and reveal server secret (check console for ✅)
3. Open verification page
4. Should show green "✓ Server Commitment Verified" banner
5. Click "Recalculate & Verify" on any event
6. Should show "✓ Verified" with matching values

## Old vs New Formula

### Old (Block Traversal):
```javascript
seed = SHA256(blockHash + txHash + timestamp + gameId + txIndex + metadata)
```

### New (Commit-Reveal):
```javascript
seed = SHA256(serverSecret + blockHash + timestamp + purpose)
```

**Key Difference:** Server commits `SHA256(serverSecret)` BEFORE blockchain data is fetched, preventing manipulation.

## Files Modified

### Games Updated:
1. `/home/user/provably-fair-games/src/games/yahtzee/YahtzeeGame.jsx` ✅
2. `/home/user/provably-fair-games/src/games/backgammon/BackgammonGame.jsx` (needs update)
3. `/home/user/provably-fair-games/src/games/solitaire/SolitaireGame.jsx` (needs update)
4. `/home/user/provably-fair-games/src/games/blackjack/BlackjackGame.jsx` (needs update)
5. `/home/user/provably-fair-games/src/games/garbage/GarbageGame.jsx` (needs update)

### Verification Pages Updated:
1. `/home/user/provably-fair-games/src/games/yahtzee/VerificationPage.jsx` ✅
2. `/home/user/provably-fair-games/src/games/backgammon/VerificationPage.jsx` (needs update)
3. `/home/user/provably-fair-games/src/games/solitaire/VerificationPage.jsx` (needs update)
4. `/home/user/provably-fair-games/src/games/blackjack/VerificationPage.jsx` (needs update)
5. `/home/user/provably-fair-games/src/games/garbage/VerificationPage.jsx` (needs update)

## Priority

**Critical:** Update all 4 remaining games and verification pages before merging to main.

The verification system is currently **broken** for all commit-reveal games except Yahtzee.
