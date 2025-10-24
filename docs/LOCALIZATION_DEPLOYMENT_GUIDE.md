# Localization Admin Settings - Deployment Guide

**Version:** 1.0  
**Last Updated:** 2025-10-23  
**Environment:** Production

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Strategy](#deployment-strategy)
3. [Feature Flags](#feature-flags)
4. [Monitoring & Alerts](#monitoring--alerts)
5. [Rollback Plan](#rollback-plan)
6. [Post-Deployment Validation](#post-deployment-validation)
7. [Runbook for Operations](#runbook-for-operations)

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All unit tests passing (`npm test`)
- [ ] All E2E tests passing (`npm run test:e2e`)
- [ ] No TypeScript compilation errors (`npm run build`)
- [ ] Code review approved by 2+ engineers
- [ ] Security scan completed (Semgrep, etc.)
- [ ] Dependencies audited (`npm audit`)

### Database
- [ ] Migration scripts tested in staging
- [ ] Rollback migrations verified
- [ ] Database backups created
- [ ] Backup retention policy: 30 days minimum

### Performance
- [ ] Page load time: < 2 seconds (Lighthouse score > 80)
- [ ] API response time: < 500ms (p95)
- [ ] Bundle size analyzed and acceptable
- [ ] No memory leaks detected
- [ ] Database query performance reviewed

### Documentation
- [ ] Admin runbooks updated
- [ ] API documentation current
- [ ] Troubleshooting guide complete
- [ ] Release notes prepared
- [ ] Training materials ready (if needed)

### Infrastructure
- [ ] Staging environment mirrors production
- [ ] SSL certificates valid
- [ ] Database credentials secured (not in repo)
- [ ] Environment variables configured
- [ ] Monitoring agents installed
- [ ] Log aggregation configured

### User Communication
- [ ] Maintenance window announced (if needed)
- [ ] Stakeholders notified
- [ ] Support team briefed
- [ ] Rollback communication plan ready

---

## Deployment Strategy

### Phased Rollout (Recommended)

#### Phase 1: Canary (1% of users, 2 hours)
1. Deploy to 1% of production servers
2. Monitor error rates, performance metrics
3. Success criteria:
   - Error rate < 0.1%
   - Response time within baseline
   - No critical errors
4. If successful, proceed to Phase 2
5. If issues, rollback immediately

#### Phase 2: Early Adopters (10% of users, 4 hours)
1. Deploy to 10% of servers
2. Monitor metrics for extended period
3. Gather feedback from power users
4. Success criteria: Same as Phase 1
5. If successful, proceed to Phase 3
6. If issues, rollback to Phase 1

#### Phase 3: Full Release (100% of users)
1. Deploy to all production servers
2. Monitor heavily for 24 hours
3. Be ready for quick rollback

### Blue-Green Deployment Alternative

If using blue-green:

1. **Blue Environment:** Current production
2. **Green Environment:** New version
3. **Test Green:** Run full test suite
4. **Switch:** Route traffic to green
5. **Monitor:** Watch metrics for 2 hours
6. **Decommission:** Keep blue for rollback

---

## Feature Flags

### New Features Behind Flags

All new features should be behind feature flags for safe rollout:

```typescript
// Example: Enable new analytics dashboard
const FEATURE_FLAGS = {
  LOCALIZATION_ANALYTICS_V2: process.env.FF_ANALYTICS_V2 === 'true',
  CROWDIN_WEBHOOKS: process.env.FF_CROWDIN_WEBHOOKS === 'true',
  KEY_DISCOVERY_AUTO_AUDIT: process.env.FF_AUTO_AUDIT === 'true',
}

export function useFeatureFlag(flag: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[flag] ?? false
}
```

### Feature Flag Configuration

Environment variables for feature flags:

```bash
# .env.production
FF_ANALYTICS_V2=false          # Start with disabled
FF_CROWDIN_WEBHOOKS=false      # Disabled for safety
FF_AUTO_AUDIT=false            # Disabled initially

# Enable gradually after validation
FF_ANALYTICS_V2=true           # After 24h monitoring
FF_CROWDIN_WEBHOOKS=true       # After week of testing
FF_AUTO_AUDIT=true             # After full validation
```

### Gradual Rollout per User

For user-level feature flags:

```typescript
// Toggle feature for specific users
const enabledUsers = ['user1@company.com', 'user2@company.com']
const isFeatureEnabled = enabledUsers.includes(currentUser.email)
```

---

## Monitoring & Alerts

### Key Metrics to Monitor

#### Application Metrics
- **Page Load Time:** Target < 2s
- **API Response Time:** p95 < 500ms
- **Error Rate:** < 0.1%
- **User Sessions:** Baseline should be stable
- **Language Selection Success:** > 99.5%

#### Business Metrics
- **Language Distribution:** Consistent with baseline
- **Crowdin Sync Success Rate:** > 99%
- **Translation Coverage:** Should not decrease
- **User Retention per Language:** Should improve

#### Infrastructure Metrics
- **CPU Usage:** < 70%
- **Memory Usage:** < 75%
- **Database Connections:** < 90% of max
- **Disk Space:** > 10% free
- **Network Latency:** Within baseline

### Monitoring Setup

#### Sentry Configuration

```javascript
// Already configured in sentry.server.config.ts
// Monitor:
// - API errors
// - Client-side crashes
// - Performance degradation
// - Security issues

Sentry.captureException(error, {
  tags: {
    component: 'localization',
    feature: 'language-import',
  },
  level: 'error',
})
```

#### Custom Dashboards (Vercel/Production)

Create dashboard for:
1. **Localization API Endpoints**
   - Request count by endpoint
   - Error rate by endpoint
   - Response time percentiles
   - Success/failure ratio

2. **User Language Analytics**
   - Active users per language
   - Language switches per hour
   - New users by language

3. **Crowdin Integration**
   - Sync success/failure
   - Keys added/updated
   - Sync duration

4. **Performance**
   - Page load time
   - Time to interactive
   - Cumulative layout shift

#### Alert Configuration

Set up alerts in Sentry/Vercel:

```
Alert: Localization API Error Rate > 1%
  Condition: error_rate > 0.01
  Action: Page on-call engineer
  Threshold: Triggered after 5 minutes

Alert: Language Import Failed
  Condition: endpoint=languages/import AND status=error
  Action: Notify support team
  Threshold: Any occurrence

Alert: Crowdin Sync Failed
  Condition: crowdin_sync_status=failed
  Action: Page DevOps team
  Threshold: Any occurrence
```

### Log Aggregation

Logs should capture:
- **Success events:** Language created, imported, deleted
- **Error events:** API failures, validation errors
- **Performance events:** Slow queries, timeouts
- **Security events:** Permission denials, auth failures

Example log structure:
```json
{
  "timestamp": "2025-10-23T10:30:00Z",
  "level": "INFO",
  "component": "localization",
  "action": "language_import",
  "status": "success",
  "imported_count": 5,
  "duration_ms": 234,
  "user_id": "admin-123",
  "tenant_id": "tenant-456"
}
```

---

## Rollback Plan

### When to Rollback

Rollback immediately if:
- Error rate exceeds 1%
- Page load time exceeds 5 seconds
- Any critical security issue
- Data corruption detected
- Database connection pool exhausted
- Crowdin integration broken
- More than 100 user complaints in 30 minutes

### Rollback Procedure

#### Automated Rollback (Recommended)

```bash
# Command to rollback to previous version
npm run deploy:rollback --version=previous

# Verifies:
# 1. Previous version is healthy
# 2. Database schema compatible
# 3. Restores from backup if needed
# 4. Verifies API health
# 5. Notifies team
```

#### Manual Rollback

If automated fails:

1. **Stop new version deployment**
   ```bash
   # Kill current deployment
   kubectl delete deployment localization-admin
   ```

2. **Restore previous version**
   ```bash
   # Deploy previous image tag
   kubectl set image deployment=localization \
     app=localization-admin:v1.2.3
   ```

3. **Verify health**
   ```bash
   # Check endpoint health
   curl https://api.company.com/admin/settings/localization
   
   # Check error rate
   # Check database connectivity
   # Check API response times
   ```

4. **If database schema changed:**
   ```bash
   # Rollback database migrations
   npm run db:migrate:rollback --target=previous
   ```

5. **Notify stakeholders**
   - Send Slack notification
   - Update status page
   - Notify support team
   - Document incident

### Data Rollback

If data corruption occurs:

1. **Stop writes immediately**
   - Set feature flag: `FF_MAINTENANCE_MODE=true`

2. **Restore from backup**
   ```bash
   # Find latest clean backup
   aws s3 ls s3://backups/database/

   # Restore to specific point in time
   aws rds restore-db-instance-from-db-snapshot \
     --db-instance-identifier localization-restore-prod \
     --db-snapshot-identifier localization-prod-2025-10-23-10-00
   ```

3. **Verify data integrity**
   - Check language count matches expected
   - Verify no orphaned translations
   - Check consistency across tables

4. **Resume operations**
   - Remove maintenance flag
   - Monitor for 24 hours

---

## Post-Deployment Validation

### Immediate Validation (0-5 minutes)

Run automated health checks:

```bash
# Check API endpoints
curl -H "Authorization: Bearer $TOKEN" \
  https://api.company.com/api/admin/languages

# Expected response: 200 with language list

# Check database connectivity
curl https://api.company.com/api/db-check

# Expected response: 200 { "status": "connected" }
```

### Short-term Validation (5 minutes - 1 hour)

1. **Monitor error rates**
   ```
   Should remain < 0.1%
   ```

2. **Check API response times**
   ```
   p95 should be < 500ms
   ```

3. **Verify new features work**
   - Test language import
   - Test Crowdin sync (if updated)
   - Test analytics display

4. **Spot check with users**
   - Ask power users if system feels responsive
   - Request feedback from each language team

### Medium-term Validation (1 hour - 24 hours)

1. **Monitor adoption metrics**
   - Language distribution stable?
   - No degradation in language switches?
   - Translation coverage unchanged?

2. **Review analytics**
   - Page load times consistent?
   - No spike in errors?
   - Database queries performant?

3. **Run end-to-end tests**
   ```bash
   npm run test:e2e:production
   ```

### Long-term Validation (24 hours - 1 week)

1. **Weekly review meeting**
   - Discuss any issues
   - Review metrics
   - Plan optimizations

2. **User feedback collection**
   - Send survey
   - Review support tickets
   - Check Slack threads

3. **Performance baseline comparison**
   - Compare against pre-deployment metrics
   - Identify any regressions
   - Plan fixes if needed

---

## Runbook for Operations

### Deployment Day

#### Morning (Before deployment)
- [ ] Read latest release notes
- [ ] Verify all checklists completed
- [ ] Have runbooks open
- [ ] Notify support team
- [ ] Set up monitoring dashboards

#### Deployment (Execute deployment)
```
14:00 - Start canary deployment (1%)
14:10 - Monitor canary metrics for 5 minutes
14:15 - If good, proceed to early adopters
14:15 - Deploy to 10% of traffic
14:25 - Monitor for 10 minutes
14:35 - If good, proceed to full release
14:35 - Deploy to 100%
14:45 - Monitor heavily
15:00 - First validation checkpoint
15:30 - Second validation checkpoint
16:00 - End of intensive monitoring
```

#### Post-deployment
- [ ] Send success message to team
- [ ] Update status page
- [ ] Trigger automated tests
- [ ] Archive rollback plan (not needed)
- [ ] Schedule post-mortem if any issues

### If Issues Occur

#### Issue Detection
- Error rate monitor triggers alert
- Sentry shows spike in errors
- Support team reports problems
- User complaints in Slack

#### Immediate Actions
1. **Alert on-call engineer** (< 2 minutes)
2. **Establish war room** (Zoom/Slack thread)
3. **Check monitoring dashboards** (What's failing?)
4. **Check recent logs** (What changed?)
5. **Decide: Fix or Rollback?**

#### Decision Tree

```
Is error rate > 1%?
├─ YES
│  └─ Can fix in < 5 minutes?
│     ├─ YES: Start fix, monitor closely
│     └─ NO: ROLLBACK immediately
└─ NO
   └─ Is there data corruption?
      ├─ YES: ROLLBACK and restore from backup
      └─ NO: Investigate, don't rollback yet
```

#### Rollback Execution
1. Execute rollback command
2. Verify previous version healthy
3. Confirm with team lead
4. Send notification
5. Start incident post-mortem

### Incident Post-Mortem

Template:

```
Incident: [Description]
Severity: P1/P2/P3
Duration: [Start time] - [End time]
Impact: [Number of users affected]

Timeline:
- 14:35: Deployment started
- 14:45: Error rate spike detected
- 14:47: Rolled back to v1.2.3
- 14:52: System recovered

Root Cause:
[What went wrong]

Prevention:
[What we'll do to prevent this]

Action Items:
- [ ] Add test case for X
- [ ] Improve monitoring for Y
- [ ] Add feature flag for Z
```

---

## Success Metrics

### 1 Week Post-Deployment

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Error Rate | < 0.1% | | |
| Page Load Time (p95) | < 2s | | |
| API Response Time (p95) | < 500ms | | |
| Uptime | > 99.9% | | |
| User Satisfaction (NPS) | Baseline + | | |

### 1 Month Post-Deployment

- [ ] No rollbacks required
- [ ] Zero critical incidents
- [ ] Positive user feedback
- [ ] Performance meets targets
- [ ] Documentation accurate and helpful

---

## Maintenance & Updates

### Regular Maintenance Schedule

- **Weekly:** Review error logs, monitor usage
- **Monthly:** Performance analysis, dependency updates
- **Quarterly:** Security audit, feature planning
- **Annually:** Major version upgrades

### Backup & Recovery

- **Backup Frequency:** Every 6 hours
- **Retention:** 30 days minimum
- **Recovery RTO:** < 1 hour
- **Recovery RPO:** < 30 minutes
- **Test:** Monthly recovery drill

### Security Updates

- **Critical:** Apply within 24 hours
- **High:** Apply within 1 week
- **Medium:** Apply within 30 days
- **Low:** Apply during next release

---

## Communication Templates

### Deployment Start

```
🚀 Deploying Localization Admin Settings v1.3.0

Timeline:
- 14:00 UTC: Canary deployment (1% of users)
- 14:30 UTC: Early adopter phase (10% of users)
- 15:00 UTC: Full deployment (100% of users)

What's new:
- Performance improvements (lazy-loaded tabs)
- New analytics dashboard
- Enhanced Crowdin integration

Monitoring: https://monitoring.company.com/localization
Support: #localization-support

Any issues? React with 🆘
```

### Deployment Success

```
✅ Localization Admin Settings v1.3.0 deployed successfully!

All systems nominal:
- Error rate: 0.05% (target: < 0.1%) ✓
- Page load: 1.8s (target: < 2s) ✓
- API response: 350ms (target: < 500ms) ✓

New features available now. Check docs: [link]

Thanks for your patience! 🎉
```

### Deployment Rollback

```
⚠️ Rolling back Localization Admin Settings to v1.2.3

We detected a performance issue and are reverting to the previous stable version.

Impact: Minimal - some new features unavailable
Duration: 5-10 minutes for full recovery
Status: https://monitoring.company.com

We apologize for the inconvenience. Full post-mortem coming soon.

Questions? Reply in thread 👇
```

---

## Related Documentation

- [Localization Admin Runbooks](./LOCALIZATION_ADMIN_RUNBOOKS.md)
- [API Reference](./LOCALIZATION_API_REFERENCE.md)
- [Accessibility Audit](./LOCALIZATION_ACCESSIBILITY_AUDIT.md)
- [Main Summary](./LOCALIZATION_ADMIN_SETTINGS_SUMMARY.md)

---

## Contact & Escalation

- **On-Call DevOps:** Check PagerDuty schedule
- **Engineering Lead:** Localization team lead
- **Architecture Review:** Architecture review board
- **Post-Incident:** Schedule with incident commander

---

**Last Review:** 2025-10-23  
**Next Review:** 2025-11-23  
**Owner:** Platform Team
