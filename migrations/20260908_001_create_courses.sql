-- Phase 1: CE course catalog
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'Global Flexinars Inc.',
  speaker TEXT NOT NULL,
  topic TEXT NOT NULL,
  video_url TEXT NOT NULL,
  video_platform TEXT NOT NULL DEFAULT 'synthesia', -- 'synthesia' | 'mux'
  ce_credits NUMERIC(4,1) NOT NULL DEFAULT 1.0,
  passing_score INTEGER NOT NULL DEFAULT 60,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_courses_tenant_id ON courses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_courses_is_active ON courses(is_active);
