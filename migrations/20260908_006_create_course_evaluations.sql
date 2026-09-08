-- Phase 1: Post-course evaluation (one per enrollment)
CREATE TABLE IF NOT EXISTS course_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Learning & Practice Impact
  knowledge_before TEXT NOT NULL, -- 'none'|'novice'|'competent'|'proficient'
  knowledge_after TEXT NOT NULL,
  new_information BOOLEAN NOT NULL,
  overall_speaker_rating TEXT NOT NULL, -- 'poor'|'below_average'|'average'|'above_average'|'excellent'
  would_take_again BOOLEAN NOT NULL,
  would_recommend BOOLEAN NOT NULL,
  -- Free text fields
  most_valuable_concept TEXT,
  clinical_application TEXT,
  needs_more_detail TEXT,
  -- Commercial bias
  perceived_commercial_bias BOOLEAN NOT NULL DEFAULT false,
  commercial_bias_explanation TEXT,
  -- General
  enjoyed_most TEXT,
  additional_topics TEXT,
  additional_comments TEXT
);

CREATE INDEX IF NOT EXISTS idx_course_evaluations_enrollment_id ON course_evaluations(enrollment_id);
