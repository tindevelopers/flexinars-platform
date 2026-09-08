-- Phase 1: Learner enrollments (one per clinician per course)
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  clinician_name TEXT NOT NULL,
  professional_title TEXT NOT NULL,
  email TEXT NOT NULL,
  location TEXT,
  invited_at TIMESTAMPTZ,
  invite_token UUID UNIQUE DEFAULT gen_random_uuid(),
  invite_expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'invited', -- 'invited' | 'in_progress' | 'passed' | 'failed'
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(course_id, email)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_tenant_id ON enrollments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_invite_token ON enrollments(invite_token);
