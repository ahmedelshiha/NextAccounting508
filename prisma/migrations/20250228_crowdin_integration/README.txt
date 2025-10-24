Migration: Add Crowdin Integration Table
Date: 2025-02-28
Status: Enables Translation Platform Integration

OVERVIEW:
---------
This migration creates the crowdin_integrations table for storing encrypted Crowdin API credentials
and integration settings per tenant.

CHANGES:
--------
1. Created "crowdin_integrations" table:
   - id (TEXT, PRIMARY KEY)
   - tenantId (UUID, UNIQUE, FOREIGN KEY to Tenant) - Ensures one integration per tenant
   - projectId (VARCHAR(100)) - Crowdin project ID
   - apiTokenMasked (VARCHAR(20)) - Last 20 chars of token for UI display
   - apiTokenEncrypted (TEXT) - Full encrypted token for API calls
   - autoSyncDaily (BOOLEAN, default: true) - Enable daily auto-sync
   - syncOnDeploy (BOOLEAN, default: false) - Sync when code is deployed
   - createPrs (BOOLEAN, default: true) - Create pull requests for translations
   - lastSyncAt (TIMESTAMP) - Timestamp of last successful sync
   - lastSyncStatus (VARCHAR(50)) - Status: success | failed | pending
   - testConnectionOk (BOOLEAN, default: false) - Last connection test result
   - createdAt (TIMESTAMP) - Record creation timestamp
   - updatedAt (TIMESTAMP) - Last update timestamp
   
   Indexes:
   - UNIQUE on tenantId (one integration per tenant)
   - INDEX on tenantId (for lookups)

SECURITY:
---------
- API tokens are encrypted using AES-256-CBC with ENCRYPTION_KEY from environment
- Only masked tokens (last 20 chars) are stored unencrypted for display
- Full tokens must be decrypted before use in API calls
- No tokens logged to Sentry (only masked versions)
- Environment variable ENCRYPTION_KEY must be set in production

RATIONALE:
----------
This table enables:
- Secure storage of Crowdin API credentials per tenant
- Tracking of sync status and history
- Configurable sync behavior (daily, on deploy, PR creation)
- Multi-tenant isolation (each tenant has own integration)
- Connection testing before saving credentials
- Audit trail via timestamps

BACKWARD COMPATIBILITY:
-----------------------
- No existing tables modified
- No data loss or migration required
- Integration is optional (nullable in most code paths)
- Safe for existing tenants (integration not required)

DATABASE SETUP:
---------------
1. Run migration: npm run db:migrate
2. Verify table created: psql -c "\dt crowdin_integrations"
3. Set ENCRYPTION_KEY environment variable

API INTEGRATION:
----------------
New API endpoints for Crowdin management:
- GET /api/admin/crowdin-integration (read settings)
- POST /api/admin/crowdin-integration (create/update)
- DELETE /api/admin/crowdin-integration (remove)
- PUT /api/admin/crowdin-integration/test (test connection)

TESTING:
--------
1. Verify table exists in database
2. Test creating integration via API
3. Verify encryption/decryption of tokens
4. Test connection with valid credentials
5. Verify unique constraint (only one per tenant)
6. Verify cascading delete when tenant is deleted
7. Test token masking for UI display

ROLLBACK:
---------
If needed: npm run db:migrate:resolve
This will mark migration as failed and create rollback.

For manual rollback:
  DROP TABLE IF EXISTS "crowdin_integrations";

NOTES:
------
- Token encryption uses AES-256-CBC with IV
- IV is stored as hex prefix of encrypted token (hex:encrypted)
- Masked token format: asterisks + last 20 characters
- lastSyncStatus values: 'success' | 'failed' | 'pending'
- Connection test verifies API access before saving
- Future: implement actual sync job to Crowdin

DEPENDENCIES:
--------------
- Requires Node.js crypto module
- Requires ENCRYPTION_KEY environment variable
- Completes integration infrastructure for translation workflows
