# Security Policy

## 🚨 Critical Security Update (2026-01-18)

**IMMEDIATE ACTION REQUIRED** if deploying from this commit forward:

### What Changed
Fixed 4 critical security vulnerabilities discovered in comprehensive security audit:

1. **Exposed Supabase Credentials** (CRITICAL)
   - Previously hardcoded in `api/submit-score.js` and `api/leaderboard.js`
   - Now requires environment variables (fails fast if not set)
   - **ACTION**: Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel

2. **Hardcoded Admin Password** (CRITICAL)
   - Previously `'CQgames'` hardcoded in source code
   - Now requires `ADMIN_PASSWORD` environment variable
   - **ACTION**: Set strong random password in Vercel environment variables

3. **Wildcard CORS Configuration** (CRITICAL)
   - Changed from `Access-Control-Allow-Origin: *` to domain-specific
   - Now restricted to `https://provably-fair-games.vercel.app`
   - **ACTION**: Update `vercel.json` line 39 to match your production domain

4. **Unenforced Rate Limiting** (CRITICAL)
   - Rate limiting flag existed but was never checked
   - Now properly enforced (10 submissions per minute per player)
   - **ACTION**: None - automatically enabled when `ENABLE_RATE_LIMITING=true`

### Exposed Credentials (MUST ROTATE)

⚠️ **The following credentials were EXPOSED in git history and must be rotated:**

```
Supabase URL: https://rmutcncnppyzirywzozc.supabase.co
Supabase Anon Key: sb_publishable_K-KApBISA6IiiNE9CCnjNA_3qhuNg8k
Admin Password: CQgames
```

**Required Actions:**
1. ✅ Rotate Supabase keys in Supabase Dashboard > Project Settings > API
2. ✅ Set new `ADMIN_PASSWORD` in Vercel (never use "CQgames" again)
3. ✅ Update all environment variables in Vercel Dashboard
4. ✅ Redeploy after setting environment variables
5. ✅ See `.env.example` for complete environment variable documentation

### Environment Variables Setup

See `.env.example` file for complete documentation. Required variables:

```bash
# Database (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Admin Authentication (REQUIRED)
ADMIN_PASSWORD=your-strong-random-password

# Ergo Blockchain for Cron (REQUIRED)
ERGO_SERVER_MNEMONIC=your mnemonic
ERGO_SERVER_ADDRESS=your address
CRON_SECRET=your-secret

# Security Flags (OPTIONAL - defaults shown)
ENABLE_RATE_LIMITING=true
ENABLE_FRAUD_DETECTION=true
VALIDATION_LEVEL=full
```

**Setup Instructions:**
1. Copy `.env.example` to `.env.local` for local development
2. Set all variables in Vercel Dashboard > Settings > Environment Variables
3. Redeploy after adding variables

---

## Supported Security Features

### 🔐 Authentication & Authorization

**Admin Dashboard Protection:**
- Dual-layer authentication (frontend + backend)
- Password-based access control
- Session management with automatic expiration
- API key validation on all admin endpoints
- **No CAPTCHA** - Rate limiting prevents abuse without annoying users

**API Security:**
- Admin endpoints require `Authorization` header
- 401 Unauthorized response for invalid credentials
- No token in URL (security best practice)

### 🛡️ Security Headers

All pages include comprehensive security headers:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

**What These Protect Against:**
- **X-Content-Type-Options**: MIME sniffing attacks
- **X-Frame-Options**: Clickjacking attacks
- **X-XSS-Protection**: Cross-site scripting (XSS) attacks
- **Referrer-Policy**: Information leakage via referrer
- **Permissions-Policy**: Unauthorized access to device features

### 🚦 Rate Limiting

**Purpose:** Prevent spam and abuse without CAPTCHA

**Default Limits:**
- Score submissions: 10 per minute per player
- Configurable via `ENABLE_RATE_LIMITING` environment variable
- In-memory tracking (resets on server restart)

**Why No CAPTCHA:**
- Buggy with VPNs
- Poor user experience
- Can lose good game scores
- Rate limiting is sufficient for this use case

### 🔍 Input Validation

**Multi-Layer Validation:**

1. **Format Validation**
   - Game ID format (e.g., `YAH-1234567-abc123`)
   - Game type whitelist (only 6 valid games)
   - Score ranges per game
   - Data type validation

2. **Game Logic Validation**
   - Full move/roll/round replay
   - Score recalculation from history
   - Completion detection
   - Rule compliance checks

3. **Blockchain Verification**
   - Ergo block existence validation
   - Seed generation verification
   - Block height reasonableness checks
   - Transaction data validation

4. **Fraud Detection**
   - Statistical analysis (0-100 risk score)
   - Pattern detection (bot behavior)
   - Player history analysis
   - Time-based anomaly detection

**Protection Against:**
- ✅ Score manipulation
- ✅ SQL injection (Supabase parameterized queries)
- ✅ XSS (React auto-escaping)
- ✅ Invalid data submission
- ✅ Blockchain spoofing

### 🌐 CORS Policy

**API Endpoints:** Domain-restricted for security
```
Access-Control-Allow-Origin: https://provably-fair-games.vercel.app
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

**Security Notice:**
- Changed from wildcard (`*`) to specific domain for security
- Prevents CSRF attacks and unauthorized cross-origin requests
- Update `vercel.json` line 39 to match your production domain
- Leaderboard is read-only public data
- Score submission requires blockchain proof (not forgeable)
- Admin endpoints protected by authentication
- Rate limiting prevents abuse

### 💾 Data Security

**Database Access:**
- Supabase Row Level Security (RLS) enabled
- Public read access to leaderboard (transparency)
- Public insert access with server-side validation
- No direct database modification via client

**Sensitive Data:**
- No personally identifiable information (PII) collected
- Player names are optional (default: "Anonymous")
- No emails, passwords, or payment info
- All blockchain data is public by design

**Session Storage:**
- Admin credentials stored in `sessionStorage` (not `localStorage`)
- Automatically cleared when tab closes
- Not persisted across browser sessions
- Manual logout available

### 🔄 API Response Caching

**Cache Strategy:**

| Endpoint | Cache Duration | Reason |
|----------|---------------|---------|
| `/api/leaderboard` | 5 minutes | Frequently updated, but not real-time critical |
| `/api/game/:gameId` | 1 hour | Verification data never changes |
| `/api/submit-score` | No cache | Each submission is unique |
| `/api/admin` | No cache | Sensitive data, always fresh |

**Benefits:**
- Reduced server load
- Faster page loads
- Lower bandwidth costs
- Better user experience

## Vulnerability Management

### Supported Versions

| Version | Supported |
|---------|-----------|
| Latest (main branch) | ✅ |
| Previous releases | ❌ |

We only support the latest version. Please update to main branch for security fixes.

### Reporting a Vulnerability

**How to Report:**
1. **DO NOT** open a public GitHub issue for security vulnerabilities
2. Open a private vulnerability report on GitHub (if available)
3. Or email the repository owner directly (check GitHub profile)

**What to Include:**
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if known)
- Your contact information (for follow-up)

**Response Time:**
- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 1 week
- **Fix Timeline**: Depends on severity
  - Critical: 1-3 days
  - High: 1-2 weeks
  - Medium: 2-4 weeks
  - Low: Best effort

**Severity Classification:**

- **Critical**: Authentication bypass, database access, score manipulation at scale
- **High**: XSS, CSRF, admin bypass, rate limit bypass
- **Medium**: Information disclosure, denial of service
- **Low**: Non-sensitive information leakage, UI quirks

### Disclosure Policy

**Coordinated Disclosure:**
1. You report the vulnerability privately
2. We acknowledge and investigate
3. We develop and test a fix
4. We deploy the fix to production
5. We publicly disclose the issue and credit you (if desired)

**Public Disclosure Timeline:**
- After fix is deployed to production
- Typically 7-14 days after fix deployment
- Faster for critical issues affecting active users

## Security Best Practices

### For Users

**Safe Gaming:**
- Play without providing personal information
- Use anonymous player names if privacy-conscious
- Understand all game data is public on leaderboard
- Don't share admin password if you're an administrator

**Verification:**
- Always verify suspicious high scores using the verification feature
- Check blockchain proof before trusting scores
- Compare seed generation manually if suspicious

### For Administrators

**Admin Access:**
- Keep admin password secure and private
- Rotate password regularly (requires code change currently)
- Log out after admin sessions
- Don't access admin panel on shared computers
- Review flagged submissions promptly

**Monitoring:**
- Review validation statistics regularly
- Check fraud patterns by game
- Investigate consistent high-risk players
- Monitor rate limit violations

### For Developers

**Code Security:**
- Never commit secrets to git
- Use environment variables for configuration
- Keep dependencies updated
- Review code changes for security issues
- Test validation logic thoroughly

**Deployment:**
- Set environment variables in Vercel dashboard
- Enable HTTPS (automatic with Vercel)
- Review security headers after deployment
- Test admin authentication before going live

## Known Limitations

**Current Security Gaps:**
1. **No Password Hashing**
   - Admin password compared as plaintext (constant-time comparison recommended)
   - Not a major issue for single-admin system
   - Mitigation: Use strong unique password, bcrypt hashing recommended for future

2. **Session Storage Only**
   - Admin session clears on tab close
   - Can be annoying for long admin sessions
   - Mitigation: Consider localStorage with expiration

3. **In-Memory Rate Limiting**
   - Rate limits reset on server restart (~15 min on Vercel)
   - Doesn't persist across multiple instances
   - Mitigation: Consider Redis for distributed rate limiting in high-traffic scenarios

4. **No Email Verification**
   - Player names not verified
   - Name collisions possible
   - Mitigation: Leaderboard shows all matching names

**Recently Fixed (2026-01-18):**
- ✅ Admin password now in environment variable (not hardcoded)
- ✅ Supabase credentials no longer hardcoded (fail-fast validation)
- ✅ CORS changed from wildcard to domain-specific
- ✅ Rate limiting now actually enforced (was configured but not used)

## Security Roadmap

**Completed Enhancements:**

1. ✅ **Admin Authentication** (Completed - Week 7)
2. ✅ **Security Headers** (Completed - Week 7)
3. ✅ **Rate Limiting** (Completed - Week 7)
4. ✅ **Comprehensive Validation** (Completed - Week 6)
5. ✅ **Admin Password in Environment Variable** (Completed - 2026-01-18)
6. ✅ **Credential Security Hardening** (Completed - 2026-01-18)
7. ✅ **CORS Security Restriction** (Completed - 2026-01-18)
8. ✅ **Rate Limiting Enforcement** (Completed - 2026-01-18)

**Future Enhancements (Priority Order):**

1. 🔄 **Password Hashing with bcrypt** (High priority - prevents credential exposure)
2. 🔄 **Persistent Rate Limiting** (Redis integration for distributed systems)
3. 🔄 **Audit Logging** (Track all admin actions with timestamps)
4. 🔄 **Two-Factor Authentication** (For admin access)
5. 🔄 **IP-Based Rate Limiting** (More granular control)
6. 🔄 **Content Security Policy Header** (Additional XSS protection)
7. 🔄 **Automated Security Scanning** (CI/CD integration)
8. 🔄 **Automated Credential Rotation** (Periodic password rotation)

## Contact

For security concerns or questions:
- GitHub Issues: https://github.com/cannonQ/provably-fair-games/issues (for non-sensitive questions)
- Private Reports: Use GitHub's private vulnerability reporting
- Email: Check repository owner's GitHub profile

---

Last Updated: 2026-01-18
