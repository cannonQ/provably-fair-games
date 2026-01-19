# Documentation Index

This directory contains all project documentation, organized by category.

## Quick Links

- **[Main README](../README.md)** - Project overview and setup
- **[Quickstart Guide](../QUICKSTART.md)** - Get started quickly
- **[Security Documentation](../SECURITY.md)** - Security policies and headers

## Documentation Structure

### `/guides/` - Implementation Guides
Current guides for working with the platform:
- `ADMIN_DASHBOARD_GUIDE.md` - Admin dashboard usage
- `API_INTEGRATION_GUIDE.md` - API integration documentation
- `GAME_INTEGRATION_GUIDE.md` - Adding new games
- `TESTING_GUIDE.md` - Testing strategies and best practices
- `SUPABASE_SCHEMA_UPDATES.md` - Database schema documentation

### `/audits/` - Security and Code Audits
Reports from security audits and bug investigations:
- `AUDIT_SUMMARY.md` - Backgammon dice reuse bug audit summary
- `DICE_REUSE_BUG_REPORT.md` - Detailed bug analysis
- `DICE_REUSE_BUG_FIX.md` - Fix implementation details
- `QUICK_FIX_GUIDE.md` - Quick reference for the fix
- `BACKGAMMON_AUDIT_REPORT.md` - Full backgammon audit
- `BACKGAMMON_FIXES_REQUIRED.md` - Required fixes checklist
- `PROPOSED_TEST_diceConsumption.test.js` - Proposed regression tests

### `/archive/` - Historical Documents
Archived planning documents and weekly summaries from the initial development:
- `LAUNCH_READY_IMPLEMENTATION_PLAN.md` - Original 8-week implementation plan
- `WEEK_2_REVIEW.md` through `WEEK_7_SUMMARY.md` - Weekly progress reports

**Note**: Items in archive are historical records. For current status, see the main README and recent commits.

## Contributing Documentation

When adding new documentation:
1. Place guides in `/guides/`
2. Place audit reports in `/audits/`
3. Archive completed plans in `/archive/`
4. Keep essential docs (README, SECURITY, QUICKSTART) in project root
5. Update this index when adding new documentation

## Documentation Standards

- Use Markdown format (`.md`)
- Include table of contents for docs >100 lines
- Date-stamp audit reports
- Link related documents
- Keep language clear and concise
