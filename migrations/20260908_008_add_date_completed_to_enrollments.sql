-- Phase 3: clinician-entered "Date Completed" captured on the course landing page.
-- Distinct from completed_at (set automatically when the quiz is passed).
ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS date_completed DATE;
