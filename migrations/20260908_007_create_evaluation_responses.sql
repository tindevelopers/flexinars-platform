-- Phase 1: Individual Likert responses within an evaluation
CREATE TABLE IF NOT EXISTS evaluation_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES course_evaluations(id) ON DELETE CASCADE,
  section TEXT NOT NULL, -- 'learning_objective' | 'content_speaker'
  item_key TEXT NOT NULL, -- e.g. 'lo_1', 'cs_1' etc
  item_text TEXT NOT NULL,
  response INTEGER NOT NULL CHECK (response BETWEEN 1 AND 5), -- 1=strongly disagree, 5=strongly agree
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evaluation_responses_evaluation_id ON evaluation_responses(evaluation_id);
