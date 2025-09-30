-- Seed default security settings (global + sample tenant)

DO $$
BEGIN
  -- Global defaults (tenantId null)
  IF NOT EXISTS (SELECT 1 FROM public.security_settings WHERE "tenantId" IS NULL) THEN
    INSERT INTO public.security_settings (id, "tenantId", "passwordPolicy", "sessionSecurity", "twoFactor", "network", "dataProtection", "compliance", "createdAt", "updatedAt")
    VALUES (
      'sec_default',
      NULL,
      ('{"minLength":12,"requireUppercase":true,"requireLowercase":true,"requireNumber":true,"requireSymbol":false,"rotationDays":0}'::jsonb),
      ('{"sessionTimeoutMinutes":60,"idleTimeoutMinutes":30,"maxConcurrentSessions":5,"enforceSingleSession":false,"refreshTokenRotation":true}'::jsonb),
      ('{"requiredForAdmins":true,"allowedMethods":["totp","email"],"backupCodes":5}'::jsonb),
      ('{"ipAllowlist":[],"ipBlocklist":[],"blockTorExitNodes":false,"geoRestrictions":[]}'::jsonb),
      ('{"auditLogRetentionDays":365,"piiRedactionEnabled":true,"exportRequestsEnabled":true,"legalHoldEnabled":false,"documentRetentionDays":730}'::jsonb),
      ('{"gdprEnabled":true,"hipaaEnabled":false,"soc2Enabled":false,"requireDpa":false}'::jsonb),
      now(), now()
    );
  END IF;

  -- Example tenant defaults (tenant 't1')
  IF NOT EXISTS (SELECT 1 FROM public.security_settings WHERE "tenantId" = 't1') THEN
    INSERT INTO public.security_settings (id, "tenantId", "passwordPolicy", "sessionSecurity", "twoFactor", "network", "dataProtection", "compliance", "createdAt", "updatedAt")
    VALUES (
      'sec_t1_default',
      't1',
      ('{"minLength":12,"requireUppercase":true,"requireLowercase":true,"requireNumber":true,"requireSymbol":false,"rotationDays":0}'::jsonb),
      ('{"sessionTimeoutMinutes":60,"idleTimeoutMinutes":30,"maxConcurrentSessions":5,"enforceSingleSession":false,"refreshTokenRotation":true}'::jsonb),
      ('{"requiredForAdmins":true,"allowedMethods":["totp","email"],"backupCodes":5}'::jsonb),
      ('{"ipAllowlist":[],"ipBlocklist":[],"blockTorExitNodes":false,"geoRestrictions":[]}'::jsonb),
      ('{"auditLogRetentionDays":365,"piiRedactionEnabled":true,"exportRequestsEnabled":true,"legalHoldEnabled":false,"documentRetentionDays":730}'::jsonb),
      ('{"gdprEnabled":true,"hipaaEnabled":false,"soc2Enabled":false,"requireDpa":false}'::jsonb),
      now(), now()
    );
  END IF;
END$$;
