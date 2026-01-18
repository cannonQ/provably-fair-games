# Backgammon Implementation - Quick Decision Matrix

**Purpose**: Quick reference for key architectural and implementation decisions.
**Full details**: See BACKGAMMON_PRE_IMPLEMENTATION_GUIDE.md

---

## Architecture Decision

| Option | Approach | Security | Cost | Effort | Recommendation |
|--------|----------|----------|------|--------|----------------|
| **A** | Enhanced Client-Side | ⭐⭐⭐ Good | $ Low | 🟢 1-2 weeks | ✅ **RECOMMENDED** |
| **B** | Hybrid (Server Validates) | ⭐⭐⭐⭐ Better | $$ Medium | 🟡 2-3 weeks | Consider if competitive |
| **C** | Full Server-Side | ⭐⭐⭐⭐⭐ Best | $$$ High | 🔴 4-6 weeks | Only if real money |

### Why Option A?
- ✅ Matches existing game architecture (consistency)
- ✅ Fast user experience (no latency)
- ✅ Minimal infrastructure changes
- ✅ Suitable for casual/AI gameplay
- ✅ Can upgrade to B/C later if needed

**Trade-off**: Verification over prevention (acceptable for casual leaderboards)

---

## Critical Issues Priority

| Issue | Severity | Fix Complexity | Deploy Week |
|-------|----------|----------------|-------------|
| Forced die rule bug | 🔴 Critical | Medium | Week 1 |
| No move validation in reducer | 🟡 High | Low | Week 1 |
| No server-side validation | 🔴 Critical* | Medium | Week 2 |
| Dice roll modulo bias | 🟡 High | Low | Week 2 |
| Insecure game ID | 🟡 High | Low | Week 2 |
| Hard AI insufficient depth | 🟢 Medium | Medium | Week 3 |
| Verification incomplete | 🟢 Low | Low | Week 3 |

*Addressed via enhanced client validation for Option A

---

## Testing Strategy

### Must Have (Before ANY fixes)
- [ ] Jest installed and configured
- [ ] moveValidation.test.js created
- [ ] Forced die rule tests written
- [ ] Bar entry tests
- [ ] Bearing off tests

### Nice to Have
- [ ] AI move legality tests
- [ ] Integration tests
- [ ] Performance tests

**Minimum coverage**: 80% on gameLogic.js and moveValidation.js

---

## Database Schema

### Changes Needed: ❌ NONE

Existing LeaderBoard table supports backgammon:

```javascript
{
  game: 'backgammon',
  game_id: 'BGM-{timestamp}-{random}',
  score: 1-192,  // Win points × cube value
  time_seconds: 180,
  moves: 45,

  // Store in existing round_history column
  round_history: {
    dice_rolls: [...],
    moves: [...],
    ai_difficulty: 'hard',
    win_type: 'gammon',
    doubling_cube_value: 2
  }
}
```

### Actions:
1. ✅ Update `api/submit-score.js` validation
2. ✅ Add 'backgammon' to VALID_GAMES arrays
3. ✅ Define game_id pattern: `/^BGM-\d+-[a-z0-9]{9}$/`

---

## Implementation Phases

### Phase 0: Preparation (2-3 days)
**Goal**: Set up infrastructure
- [ ] Install Jest
- [ ] Create test files
- [ ] Add localStorage persistence
- [ ] Tag rollback point: `git tag backgammon-pre-fixes`

### Phase 1: Critical Fixes (Week 1)
**Goal**: Fix game-breaking bugs
- [ ] Write forced die rule tests
- [ ] Implement forced die fix
- [ ] Add reducer validation
- [ ] Deploy to preview, test extensively

### Phase 2: Security (Week 2)
**Goal**: Harden security
- [ ] Fix dice bias
- [ ] Secure game ID generation
- [ ] Enhanced submit-score validation
- [ ] Rate limiting
- [ ] Deploy to preview, security test

### Phase 3: Quality (Week 3)
**Goal**: Improve AI and UX
- [ ] Improve Hard AI depth
- [ ] Complete verification system
- [ ] Error handling
- [ ] Code cleanup

### Phase 4: Deploy (Week 4)
**Goal**: Production release
- [ ] Comprehensive testing (50+ games)
- [ ] Documentation
- [ ] Merge to main
- [ ] Monitor for 24-48 hours

---

## Risk Mitigation

| Risk | Mitigation | Owner |
|------|------------|-------|
| Breaking in-progress games | localStorage persistence | Dev |
| New bugs introduced | Automated tests + incremental deploy | Dev + QA |
| Security vulnerabilities | Code review + rate limiting | Security |
| Performance issues | Client-side approach (no latency) | Dev |
| Leaderboard cheating | Enhanced validation + verification | Backend |
| Cost overruns | Stick to Option A (minimal infra) | Product |

---

## Cost Estimate

### Option A (Recommended)
- **Server costs**: +$0-1/month (negligible)
- **Development**: 4 weeks @ hourly rate
- **Testing**: Included in dev time
- **Security audit**: $0 (internal review OK for casual)

**Total infra cost increase**: < $1/month

### If choosing Option B or C
- **Option B**: +$5-20/month
- **Option C**: +$50-200/month
- **Both**: Recommend professional security audit ($500-2000)

---

## Quick Decision Checklist

**Before coding, confirm:**

- [ ] **Architecture**: Option A (Enhanced Client-Side)
- [ ] **Timeline**: 4 weeks acceptable
- [ ] **Testing**: Jest setup mandatory
- [ ] **Deployment**: Incremental (4 phases)
- [ ] **Rollback**: Git tag created
- [ ] **Schema**: No changes needed (confirmed)
- [ ] **Security**: Enhanced validation + rate limiting
- [ ] **Budget**: ~$1/month infra increase acceptable

**All checked? → Proceed to Phase 0**

---

## Files to Update

### Game Files (fix bugs)
- `src/games/backgammon/moveValidation.js` - Fix forced die rule
- `src/games/backgammon/gameState.js` - Add move validation
- `src/games/backgammon/gameLogic.js` - Fix dice bias, secure IDs
- `src/games/backgammon/ai.js` - Improve Hard AI depth

### API Files (add validation)
- `api/submit-score.js` - Add backgammon validation
- `api/leaderboard.js` - Add to valid games
- `api/cron/daily-leaderboard.js` - Add to GAMES array

### Test Files (create new)
- `src/games/backgammon/__tests__/moveValidation.test.js`
- `src/games/backgammon/__tests__/gameLogic.test.js`
- `src/games/backgammon/__tests__/ai.test.js`

### Integration Files (if not exists)
- `src/App.jsx` - Add routes (may already exist)
- `src/pages/Home.jsx` - Add game card (may already exist)
- `README.md` - Document backgammon

---

## Success Metrics

### Week 1 (Critical Fixes)
- [ ] All forced die rule tests passing
- [ ] 0 illegal moves allowed by reducer
- [ ] Manual testing: 20+ games, no rule violations

### Week 2 (Security)
- [ ] Dice distribution: chi-square test p-value > 0.05
- [ ] Game IDs use blockchain data (100% of new games)
- [ ] Rate limiting: max 1 submit per 5 sec per IP
- [ ] 0 invalid scores accepted by server

### Week 3 (Quality)
- [ ] Hard AI: noticeably stronger (user feedback)
- [ ] Verification page: 10+ games verified successfully
- [ ] Error handling: 0 crashes on network failures

### Week 4 (Deploy)
- [ ] Test suite: > 80% coverage
- [ ] Production: 48 hours with 0 critical bugs
- [ ] Leaderboard: Valid scores only, proper ranking
- [ ] User feedback: Positive on gameplay improvements

---

## Contact Points

**Questions about:**
- Architecture choice → Review BACKGAMMON_PRE_IMPLEMENTATION_GUIDE.md Section 1
- Database schema → Section 2
- Testing → Section 3
- Security → Section 6
- Implementation plan → Section 8

**Still unsure?**
- Review full audit: BACKGAMMON_AUDIT_REPORT.md
- Review fixes: BACKGAMMON_FIXES_REQUIRED.md
- Review this guide: BACKGAMMON_PRE_IMPLEMENTATION_GUIDE.md

---

## TL;DR

**Recommended approach:**
1. **Architecture**: Option A (Enhanced Client-Side)
2. **Timeline**: 4 weeks, incremental deployment
3. **First action**: Set up Jest testing
4. **Critical fix**: Forced die rule (Week 1)
5. **Deploy strategy**: Phase by phase with testing
6. **Budget**: ~$1/month infrastructure increase

**Start today:**
```bash
npm install --save-dev jest @testing-library/react
git tag backgammon-pre-fixes
git checkout -b backgammon-audit-fixes
```

**Don't start coding until:**
- Tests are set up
- Rollback plan ready
- Team agrees on architecture choice

---

Last updated: 2026-01-18
