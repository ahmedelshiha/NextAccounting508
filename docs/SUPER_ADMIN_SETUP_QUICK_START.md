# SUPER_ADMIN User Setup - Quick Start

**TL;DR:** Run the seed and SUPER_ADMIN user is automatically created with all other demo accounts.

---

## Quick Setup (30 seconds)

### Option 1: Auto-Generated Passwords
```bash
npm run db:seed
```
✅ Creates SUPER_ADMIN account  
✅ Displays credentials in console  
✅ Ready to login immediately

### Option 2: Custom Passwords
```bash
SEED_SUPERADMIN_PASSWORD="YourSecurePassword123!" npm run db:seed
```

### Option 3: Via .env File
```env
# Add to .env
SEED_SUPERADMIN_PASSWORD=YourPassword123!
SEED_ADMIN_PASSWORD=AdminPassword123!
```
Then: `npm run db:seed`

---

## Login Credentials

After seeding, check console output for:

```
📋 Test Accounts:
SUPER_ADMIN: superadmin@accountingfirm.com / <password>
Admin: admin@accountingfirm.com / <password>
Staff: staff@accountingfirm.com / <password>
Client 1: client1@example.com / <password>
Client 2: client2@example.com / <password>
Lead: lead@accountingfirm.com / <password>
```

### Login Flow
1. Navigate to `/login`
2. Enter: `superadmin@accountingfirm.com`
3. Enter: Password (from console output or .env)
4. Click "Sign In"
5. Access full admin dashboard

---

## Admin Account Details

### SUPER_ADMIN Account
- **Email:** superadmin@accountingfirm.com
- **Role:** SUPER_ADMIN (system-wide access)
- **Status:** Email verified (can login immediately)
- **Tenant:** Primary Accounting Tenant

### ADMIN Account (Standard)
- **Email:** admin@accountingfirm.com
- **Role:** ADMIN (tenant-level access)
- **Status:** Email verified
- **Tenant:** Primary Accounting Tenant

---

## What Gets Created

When you run `npm run db:seed`:

| Account | Email | Role | Use Case |
|---------|-------|------|----------|
| Super Admin | superadmin@accountingfirm.com | SUPER_ADMIN | System administration |
| Admin | admin@accountingfirm.com | ADMIN | Dashboard management |
| Staff | staff@accountingfirm.com | TEAM_MEMBER | Day-to-day operations |
| Lead | lead@accountingfirm.com | TEAM_LEAD | Team oversight |
| Client 1 | client1@example.com | CLIENT | Client portal |
| Client 2 | client2@example.com | CLIENT | Client portal |

**Plus:** Services, tasks, bookings, blog posts, and more demo data

---

## Post-Seed Checklist

- [ ] Seed completed successfully
- [ ] No database errors
- [ ] Credentials displayed in console
- [ ] Navigate to `/login`
- [ ] Login with SUPER_ADMIN email
- [ ] Verify dashboard loads
- [ ] Check admin functions accessible
- [ ] Test other roles (optional)

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "Cannot find module .prisma/client" | Run `npm run db:generate` first |
| "DATABASE_URL not set" | Set env var: `export DATABASE_URL="..."`  |
| "UNIQUE constraint violation" | Normal - seed is idempotent (updates existing users) |
| "No users created" | Check console for error messages |

---

## Password Reset (If Needed)

```bash
# Reset SUPER_ADMIN password
tsx scripts/admin-setup/reset-password.ts

# Then follow prompts to set new password
```

---

## Security Notes

✅ Passwords are hashed (bcryptjs, 12 rounds)  
✅ Email verification pre-filled (no email confirmation needed)  
✅ Users tenant-scoped (isolated to Primary Tenant)  
✅ RBAC roles assigned automatically  

⚠️ Change default passwords in production  
⚠️ Don't commit .env files with passwords  
⚠️ Enable MFA for admin accounts  

---

## Next: Configure & Deploy

After confirming accounts work:

1. **Customize:** Update user names, emails, passwords
2. **Production:** Set secure passwords in environment
3. **MFA:** Enable 2FA for admin accounts
4. **Audit:** Review admin access logs

---

**For detailed documentation, see:** `docs/admin-user-creation-guide.md`

**Status:** ✅ Ready to use  
**Created:** 2025-10-21  
**Last Updated:** 2025-10-21
