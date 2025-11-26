-- Migration: Add score table
-- Date: 2025-10-10

-- 1) Create table if not exists
CREATE TABLE IF NOT EXISTS public.score (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  submission_id uuid REFERENCES public.thesis_submissions(id) ON DELETE SET NULL,
  value integer NOT NULL CHECK (value >= 0),
  category text,
  comments text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_score_user_id ON public.score(user_id);
CREATE INDEX IF NOT EXISTS idx_score_submission_id ON public.score(submission_id);
CREATE INDEX IF NOT EXISTS idx_score_category ON public.score(category);

-- 3) Trigger function to maintain updated_at
CREATE OR REPLACE FUNCTION public.score_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_score_set_updated_at ON public.score;
CREATE TRIGGER trg_score_set_updated_at
BEFORE UPDATE ON public.score
FOR EACH ROW EXECUTE FUNCTION public.score_set_updated_at();

-- 4) Enable Row Level Security
ALTER TABLE public.score ENABLE ROW LEVEL SECURITY;

-- 5) RLS Policies
-- Following a permissive model similar to feedback: allow public insert, public select, and authenticated update/delete
DROP POLICY IF EXISTS "Anyone can submit score" ON public.score;
CREATE POLICY "Anyone can submit score"
ON public.score
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view scores" ON public.score;
CREATE POLICY "Anyone can view scores"
ON public.score
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated users can modify scores" ON public.score;
CREATE POLICY "Authenticated users can modify scores"
ON public.score
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete scores" ON public.score;
CREATE POLICY "Authenticated users can delete scores"
ON public.score
FOR DELETE
TO authenticated
USING (true);


