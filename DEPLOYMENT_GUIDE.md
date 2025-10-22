# User Profile Feature Deployment Guide

## Quick Start

This guide provides step-by-step instructions for deploying the user profile transformation feature to staging and production environments.

---

## Pre-Deployment Checklist

### 1. Code Quality Verification
```bash
# Run linting
npm run lint

# Check TypeScript
npm run typecheck

# Run unit tests
npm test

# Run E2E tests
npm run test:e2e
```

**Expected Results:**
- ✅ No ESLint errors or warnings
- ✅ All TypeScript types resolve
- ✅ All unit tests pass
- ✅ All E2E tests pass

### 2. Database Schema Verification
```bash
# Check current Prisma schema
cat prisma/schema.prisma | grep -A 20 "model UserProfile"

# Verify UserProfile model exists with these fields:
# - id (CUID, primary key)
# - userId (unique foreign key to User)
# - organization (optional)
# - phoneNumber (optional)
# - twoFactorEnabled (boolean)
# - twoFactorSecret (optional)
# - and other fields as documented
```

### 3. Environment Variables Verification
```bash
# Verify required environment variables are set
echo "DATABASE_URL: ${DATABASE_URL:?DATABASE_URL not set}"
echo "NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:?NEXTAUTH_SECRET not set}"
echo "NEXTAUTH_URL: ${NEXTAUTH_URL:?NEXTAUTH_URL not set}"

# Optional but recommended
echo "SMTP_HOST: ${SMTP_HOST:-not configured}"
echo "SENTRY_DSN: ${SENTRY_DSN:-not configured}"
```

---

## Staging Deployment

### Step 1: Create Database Migration

```bash
# Generate migration for UserProfile model
prisma migrate dev --name add_user_profile

# This will:
# 1. Create migration files in prisma/migrations/
# 2. Apply migrations to staging database
# 3. Generate Prisma Client

# Verify migration status
prisma migrate status
```

### Step 2: Deploy to Staging

```bash
# Build for staging
npm run build

# If using Netlify
netlify deploy --prod --site YOUR_STAGING_SITE_ID

# If using Vercel
vercel deploy --prod --target staging
```

### Step 3: Staging Smoke Tests

```bash
# 1. Open admin dashboard
# Navigate to: https://staging.yourapp.com/admin

# 2. Locate user profile dropdown
# Click avatar/user menu button in top-right

# 3. Test dropdown functionality
# - Click "Manage Profile" button
# - Verify profile panel opens
# - Switch between "Profile" and "Sign in & Security" tabs

# 4. Test theme switcher
# - Click theme option (Dark, Light, System)
# - Verify theme changes immediately
# - Verify persistence on page reload

# 5. Test status selector
# - Change status to Away/Busy
# - Verify status dot color changes
# - Verify persistence on dropdown reopen

# 6. Test profile editing
# - Edit name field
# - Save changes
# - Verify changes persist

# 7. Test sign-out
# - Click "Sign out"
# - Confirm in dialog
# - Verify redirect to login page
```

### Step 4: Performance Audit

```bash
# Run Lighthouse audit
# In browser DevTools: Ctrl/Cmd + Shift + P
# Type: "Lighthouse: Generate report"

# Expected metrics:
# - Performance: > 80
# - Accessibility: > 95
# - Best Practices: > 90
# - SEO: > 90

# Check Core Web Vitals:
# - FCP (First Contentful Paint): < 1.5s
# - LCP (Largest Contentful Paint): < 2.5s
# - TTI (Time to Interactive): < 3s
# - CLS (Cumulative Layout Shift): < 0.1
```

### Step 5: Security Verification

```bash
# 1. Test CSRF protection
# - Open DevTools Network tab
# - Edit profile field and save
# - Verify request includes proper headers
# - Check for X-Requested-With or similar CSRF token

# 2. Test rate limiting
# - Make rapid profile update requests
# - After ~20 requests per minute, expect 429 response
# - Verify error message displayed to user

# 3. Test password validation
# - Try to change email without current password
# - Verify error: "Current password is required"
# - Try to change password with incorrect password
# - Verify error: "Incorrect current password"

# 4. Verify secure headers
# - Check Response Headers for security headers
# - Content-Security-Policy should be set
# - X-Frame-Options should prevent clickjacking
```

### Step 6: Accessibility Audit

```bash
# 1. Screen reader testing (NVDA, JAWS, VoiceOver)
# - Open dropdown and navigate with screen reader
# - Verify all menu items announced correctly
# - Verify role announcements (menuitem, button, etc.)

# 2. Keyboard navigation
# - Press Tab repeatedly through all interactive elements
# - Press Escape to close dropdown/panel
# - Verify focus management
# - Check focus visible indicator

# 3. WAVE browser extension
# - Install WAVE for Chrome/Firefox
# - Open profile page
# - Check for warnings/errors
# - Verify no contrast issues

# 4. Color contrast
# - Use WebAIM Contrast Checker
# - Test status dot colors against background
# - Verify WCAG AA compliance (4.5:1 for text)
```

### Step 7: Browser Compatibility Test

Test on staging across browsers:

```
Chrome (latest 2 versions)
Firefox (latest 2 versions)
Safari (latest 2 versions)
Edge (latest version)
Mobile Safari (iOS 15+)
Chrome Mobile (Android 8+)
```

Expected behavior:
- ✅ Dropdown opens and closes
- ✅ Theme switching works
- ✅ Status selector functional
- ✅ Profile panel editable
- ✅ No JavaScript errors in console

### Step 8: Load Testing (Optional)

```bash
# Using Apache Bench or similar
ab -n 1000 -c 10 https://staging.yourapp.com/admin

# Using k6 for complex scenarios
k6 run load-test.js

# Expected results:
# - Response time < 300ms (p99)
# - Error rate < 0.1%
# - Rate limiting triggers correctly
```

### Step 9: Rollback Preparation

```bash
# Tag the current staging state
git tag staging-release-v1.0.0

# Document rollback steps
git log --oneline -1  # Save this commit hash
# If issues arise, revert to this commit:
# git revert <commit-hash>
```

---

## Production Deployment

### Step 1: Final Code Review

```bash
# Review all changes
git log --oneline staging..main | head -20

# Verify no secrets in commits
git log -p | grep -i "password\|token\|secret" | head

# Run final quality checks
npm run lint && npm run typecheck && npm test
```

### Step 2: Production Database Migration

```bash
# **IMPORTANT: Backup database first!**
# Your backup script here

# Apply migration to production
prisma migrate deploy

# Verify migration success
prisma migrate status

# Check UserProfile table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'user_profiles';
```

### Step 3: Deploy to Production

```bash
# Using Netlify
netlify deploy --prod --site YOUR_PROD_SITE_ID

# Using Vercel
vercel deploy --prod

# Using custom CI/CD
git push origin main
# Webhook triggers deployment pipeline
```

### Step 4: Post-Deployment Verification (First Hour)

```bash
# 1. Check Sentry for errors
# - Navigate to Sentry dashboard
# - Filter for last hour
# - Expected: 0 critical errors

# 2. Monitor API response times
# - Check APM dashboard
# - /api/users/me should be < 200ms
# - Expected: < 300ms p99

# 3. Test critical user flows
# - Login as test user
# - Open profile dropdown
# - Change theme
# - Change status
# - Edit profile
# - Sign out
# - Expected: All operations successful

# 4. Monitor database performance
# - Check query logs
# - UserProfile queries should use indexes
# - Expected: < 10ms for profile queries

# 5. Verify logs
# - Check application logs for errors
# - Verify audit logs capture profile updates
# - Expected: Clean logs, no unexpected errors
```

### Step 5: Post-Deployment Verification (First 24 Hours)

```bash
# 1. Error monitoring
# - Monitor Sentry error rate
# - Expected: < 0.1% error rate
# - Alert if > 5% errors

# 2. Performance monitoring
# - Check Core Web Vitals
# - FCP: should be < 1.5s
# - LCP: should be < 2.5s
# - TTI: should be < 3s
# - CLS: should be < 0.1

# 3. User feedback
# - Check support tickets
# - Monitor for complaints
# - Expected: Positive or neutral feedback

# 4. Database health
# - Check disk space usage
# - Verify backup ran successfully
# - Monitor slow query log
# - Expected: Normal operation

# 5. Rate limiting verification
# - Monitor rate limit hits
# - Expected: < 1% of requests rate limited
# - Alert if > 5% are rate limited
```

### Step 6: Feature Rollout Strategy

**Option A: Gradual Rollout**
```bash
# Release to 10% of users first
FEATURE_FLAG_USER_PROFILE_V2=true npm run deploy:prod:canary

# Monitor for 24 hours
# If no issues, increase to 50%
FEATURE_FLAG_USER_PROFILE_V2=true npm run deploy:prod:50percent

# Finally, 100%
FEATURE_FLAG_USER_PROFILE_V2=true npm run deploy:prod
```

**Option B: Immediate Full Rollout**
```bash
# Deploy directly to all users
npm run deploy:prod

# Monitor closely for issues
# Be ready for quick rollback
```

---

## Rollback Procedure

If critical issues arise:

### Immediate Actions (First 15 Minutes)

```bash
# 1. Check error rate
curl https://api.sentry.io/api/0/projects/<org>/<project>/stats/
# If error rate > 5%, proceed with rollback

# 2. Stop deploy (if still in progress)
# In CI/CD dashboard, cancel ongoing deployment

# 3. Disable feature temporarily (if possible)
# Set feature flag to false
# Or comment out component import in AdminHeader.tsx
```

### Execute Rollback

```bash
# Identify rollback commit
git log --oneline | grep "user-profile"
# Find the last known-good commit hash

# Option 1: Revert via Git
git revert <commit-hash>
git push origin main
# Trigger redeploy via CI/CD

# Option 2: Revert database migration
prisma migrate resolve --rolled-back add_user_profile
prisma migrate status
# Re-deploy previous version

# Option 3: Restore from backup (if corrupted)
# Restore database from backup taken before deployment
# Re-deploy previous application version
```

### Post-Rollback

```bash
# 1. Verify rollback succeeded
curl https://yourapp.com/admin
# Verify old profile dropdown still works

# 2. Investigate root cause
git log -p <commit-hash> | head -100
# Review what changed

# 3. Open incident report
# Create issue with:
# - What broke
# - Error messages
# - Reproduction steps
# - Proposed fix

# 4. Fix and re-test
# Make code changes
# Run full test suite
# Re-deploy to staging first
# Then production with monitoring
```

---

## Monitoring & Alerting

### Key Metrics to Monitor

```
Application Metrics:
- Error rate (alert if > 5%)
- API response time (alert if > 500ms p99)
- Deployment success (must be 100%)
- Feature flag status

Database Metrics:
- Query time for /api/users/me (alert if > 200ms)
- Connection pool utilization (alert if > 80%)
- Disk usage (alert if > 90%)
- Backup success (must complete daily)

User Metrics:
- Feature adoption rate (track %)
- User satisfaction (track support tickets)
- Theme change adoption (track usage)
- Profile edits per day (track usage)

Infrastructure:
- CPU usage (alert if > 80%)
- Memory usage (alert if > 85%)
- Network latency (alert if > 100ms)
```

### Recommended Alert Thresholds

```yaml
# Sentry Alerts
- Error rate > 5%: Page PagerDuty (critical)
- Error rate > 1%: Alert Slack #alerts (warning)

# APM Alerts
- API latency p99 > 500ms: Page PagerDuty
- Database query > 200ms: Alert Slack
- Error budget exceeded: Page PagerDuty

# Infrastructure
- CPU > 80%: Alert Slack
- Disk > 90%: Page PagerDuty
- Memory > 85%: Alert Slack
```

---

## Success Criteria

### Launch Success = All of:

1. **Zero Critical Errors**
   - No unhandled exceptions in Sentry
   - No database constraint violations
   - No unhandled promise rejections

2. **Performance Targets Met**
   - FCP < 1.5s (p99)
   - LCP < 2.5s (p99)
   - TTI < 3s (p99)
   - CLS < 0.1
   - API response < 300ms (p99)

3. **Security Verified**
   - No security vulnerabilities found
   - Rate limiting working correctly
   - CSRF tokens validated
   - Passwords hashed and verified

4. **User Experience**
   - > 80% of users successfully open dropdown
   - > 50% of users edit profile within first week
   - > 90% of users change theme successfully
   - Zero XSS or injection issues reported

5. **Operational Health**
   - Database backups running successfully
   - Logs collected and searchable
   - Monitoring alerts firing correctly
   - On-call team responding to incidents

---

## Support & Troubleshooting

### Common Deployment Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Migration fails | Schema mismatch | Run `prisma db push` to sync |
| Dropdown doesn't appear | Component not imported | Check `AdminHeader.tsx` imports |
| Theme not persisting | next-themes config | Verify `ThemeProvider` wraps app |
| 2FA setup failing | MFA endpoint unavailable | Verify `/api/auth/mfa/enroll` exists |
| Rate limiting too strict | Threshold too low | Increase limits in `/api/users/me/route.ts` |
| Password verification fails | bcrypt issue | Ensure bcryptjs dependency installed |

### Emergency Contacts

- **On-Call Engineer:** [contact info]
- **Database Admin:** [contact info]
- **Security Team:** [contact info]
- **DevOps Team:** [contact info]

---

## Conclusion

Following these steps ensures safe, reliable deployment of the user profile feature to production. Monitor closely for the first 24 hours and escalate any issues to the on-call team immediately.

**Expected Timeline:**
- Staging: 1-2 hours
- Production: 30-45 minutes (deployment only)
- Full verification: 24 hours

**Good luck! 🚀**
