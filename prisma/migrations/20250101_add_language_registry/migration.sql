-- Create Language registry table
CREATE TABLE "languages" (
  "code" VARCHAR(10) PRIMARY KEY,
  "name" VARCHAR(100) NOT NULL,
  "nativeName" VARCHAR(100) NOT NULL,
  "direction" VARCHAR(3) NOT NULL DEFAULT 'ltr',
  "flag" VARCHAR(5),
  "bcp47Locale" VARCHAR(10) NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL
);

-- Add index for enabled languages (for quick filtering)
CREATE INDEX "languages_enabled_idx" ON "languages"("enabled");

-- Insert default languages
INSERT INTO "languages" ("code", "name", "nativeName", "direction", "flag", "bcp47Locale", "enabled", "updatedAt")
VALUES
  ('en', 'English', 'English', 'ltr', '🇺🇸', 'en-US', true, CURRENT_TIMESTAMP),
  ('ar', 'Arabic', 'العربية', 'rtl', '🇸🇦', 'ar-SA', true, CURRENT_TIMESTAMP),
  ('hi', 'Hindi', 'हिन्दी', 'ltr', '🇮🇳', 'hi-IN', true, CURRENT_TIMESTAMP);
