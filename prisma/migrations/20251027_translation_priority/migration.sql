-- Migration: Add TranslationPriority table

CREATE TABLE IF NOT EXISTS translation_priorities (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  key TEXT NOT NULL,
  language_code TEXT,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  due_date TIMESTAMPTZ,
  assigned_to_user_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_translation_priorities_tenant ON translation_priorities(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_translation_priorities_tenant_key_language ON translation_priorities(tenant_id, key, language_code);
