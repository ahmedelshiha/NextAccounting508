CREATE TABLE IF NOT EXISTS "ServiceRequest" (
  id TEXT PRIMARY KEY,
  clientId TEXT,
  serviceId TEXT,
  title TEXT,
  description TEXT,
  priority TEXT,
  status TEXT,
  requirements JSONB,
  attachments JSONB,
  assignedTeamMemberId TEXT,
  assignedAt TIMESTAMPTZ,
  assignedBy TEXT,
  completedAt TIMESTAMPTZ,
  clientApprovalAt TIMESTAMPTZ,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_request_clientid ON "ServiceRequest" (clientId);
CREATE INDEX IF NOT EXISTS idx_service_request_status ON "ServiceRequest" (status);
CREATE INDEX IF NOT EXISTS idx_service_request_priority ON "ServiceRequest" (priority);
CREATE INDEX IF NOT EXISTS idx_service_request_assigned ON "ServiceRequest" (assignedTeamMemberId);
