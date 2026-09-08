-- Phase 1: True/False quiz questions per course
CREATE TABLE IF NOT EXISTS course_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  correct_answer BOOLEAN NOT NULL, -- true = True, false = False (T/F format)
  rationale TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_questions_course_id ON course_questions(course_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_course_questions_course_position ON course_questions(course_id, position);
