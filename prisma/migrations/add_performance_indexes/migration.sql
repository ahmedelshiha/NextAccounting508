-- Performance Indexes Migration
-- Purpose: Add database indexes for frequently queried fields to improve performance
-- Target fields: scheduledAt, status, serviceId, clientEmail, createdAt

-- ServiceRequest table indexes
CREATE INDEX IF NOT EXISTS "service_requests_service_id_idx" ON "service_requests" ("service_id");
CREATE INDEX IF NOT EXISTS "service_requests_client_email_idx" ON "service_requests" ("client_email");
CREATE INDEX IF NOT EXISTS "service_requests_status_idx" ON "service_requests" ("status");
CREATE INDEX IF NOT EXISTS "service_requests_scheduled_at_idx" ON "service_requests" ("scheduled_at");
CREATE INDEX IF NOT EXISTS "service_requests_created_at_idx" ON "service_requests" ("created_at");
CREATE INDEX IF NOT EXISTS "service_requests_client_id_idx" ON "service_requests" ("client_id");

-- User table indexes for frequently filtered fields
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" ("role");
CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users" ("created_at");

-- Booking table indexes (additional to existing ones)
CREATE INDEX IF NOT EXISTS "bookings_service_id_idx" ON "bookings" ("service_id");
CREATE INDEX IF NOT EXISTS "bookings_client_email_idx" ON "bookings" ("client_email");
CREATE INDEX IF NOT EXISTS "bookings_created_at_idx" ON "bookings" ("created_at");

-- Service table indexes
CREATE INDEX IF NOT EXISTS "services_status_idx" ON "services" ("status");
CREATE INDEX IF NOT EXISTS "services_created_at_idx" ON "services" ("created_at");
CREATE INDEX IF NOT EXISTS "services_updated_at_idx" ON "services" ("updated_at");

-- Task table indexes
CREATE INDEX IF NOT EXISTS "tasks_status_idx" ON "tasks" ("status");
CREATE INDEX IF NOT EXISTS "tasks_due_at_idx" ON "tasks" ("due_at");
CREATE INDEX IF NOT EXISTS "tasks_created_at_idx" ON "tasks" ("created_at");
CREATE INDEX IF NOT EXISTS "tasks_assignee_id_idx" ON "tasks" ("assignee_id");

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS "service_requests_status_created_at_idx" ON "service_requests" ("status", "created_at");
CREATE INDEX IF NOT EXISTS "bookings_status_scheduled_at_idx" ON "bookings" ("status", "scheduled_at");
CREATE INDEX IF NOT EXISTS "services_active_featured_idx" ON "services" ("active", "featured");
CREATE INDEX IF NOT EXISTS "tasks_status_due_at_idx" ON "tasks" ("status", "due_at");

-- Contact submissions index for admin review
CREATE INDEX IF NOT EXISTS "contact_submissions_responded_created_at_idx" ON "contact_submissions" ("responded", "created_at");

-- Audit/activity log indexes for performance monitoring
CREATE INDEX IF NOT EXISTS "health_logs_service_created_at_idx" ON "health_logs" ("service", "created_at");