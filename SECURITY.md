# Security Policy

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

**API Endpoints:** Public access allowed
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

**Why Public:**
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
1. **Admin Password Hardcoded**
   - Password is in source code, not environment variable
   - Rotating password requires code change and redeploy
   - Mitigation: Consider moving to environment variable

2. **No Password Hashing**
   - Admin password compared as plaintext
   - Not a major issue for single-admin system
   - Mitigation: Use strong unique password

3. **Session Storage Only**
   - Admin session clears on tab close
   - Can be annoying for long admin sessions
   - Mitigation: Consider localStorage with expiration

4. **In-Memory Rate Limiting**
   - Rate limits reset on server restart
   - Doesn't persist across multiple instances
   - Mitigation: Consider Redis for distributed rate limiting

5. **No Email Verification**
   - Player names not verified
   - Name collisions possible
   - Mitigation: Leaderboard shows all matching names

## Security Roadmap

**Future Enhancements (Priority Order):**

1. ✅ **Admin Authentication** (Completed)
2. ✅ **Security Headers** (Completed)
3. ✅ **Rate Limiting** (Completed)
4. ✅ **Comprehensive Validation** (Completed)
5. 🔄 **Admin Password in Environment Variable** (Recommended)
6. 🔄 **Persistent Rate Limiting** (Redis integration)
7. 🔄 **Audit Logging** (Track all admin actions)
8. 🔄 **Two-Factor Authentication** (For admin access)
9. 🔄 **IP-Based Rate Limiting** (More granular control)
10. 🔄 **Automated Security Scanning** (CI/CD integration)

## Contact

For security concerns or questions:
- GitHub Issues: https://github.com/cannonQ/provably-fair-games/issues (for non-sensitive questions)
- Private Reports: Use GitHub's private vulnerability reporting
- Email: Check repository owner's GitHub profile

---

Last Updated: 2026-01-18
