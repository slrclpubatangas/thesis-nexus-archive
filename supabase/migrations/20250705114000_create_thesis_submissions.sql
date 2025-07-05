-- Create the thesis_submissions table
CREATE TABLE public.thesis_submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name text NOT NULL,
    user_type text NOT NULL,
    student_number text,
    school text,
    campus text NOT NULL,
    program text,
    thesis_title text NOT NULL,
    submission_date timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_thesis_submissions_created_at ON public.thesis_submissions (created_at DESC);
CREATE INDEX idx_thesis_submissions_campus ON public.thesis_submissions (campus);
CREATE INDEX idx_thesis_submissions_user_type ON public.thesis_submissions (user_type);

-- Enable Row Level Security
ALTER TABLE public.thesis_submissions ENABLE ROW LEVEL SECURITY;

-- POLICIES --
-- 1. Allow anyone to insert a submission (for the public form)
CREATE POLICY "Anyone can submit a thesis record"
ON public.thesis_submissions
FOR INSERT
WITH CHECK (true);

-- 2. Allow authenticated users (admins) to view all submissions
CREATE POLICY "Authenticated users can view submissions"
ON public.thesis_submissions
FOR SELECT
TO authenticated
USING (true);

-- 3. Allow authenticated users (admins) to update submissions
CREATE POLICY "Authenticated users can update submissions"
ON public.thesis_submissions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Allow authenticated users (admins) to delete submissions
CREATE POLICY "Authenticated users can delete submissions"
ON public.thesis_submissions
FOR DELETE
TO authenticated
USING (true);

-- Add comments for documentation
COMMENT ON TABLE public.thesis_submissions IS 'Stores daily user records from the undergraduate research collection form.';
COMMENT ON COLUMN public.thesis_submissions.full_name IS 'Full name of the user submitting the record.';
COMMENT ON COLUMN public.thesis_submissions.user_type IS 'Type of user, e.g., LPU Student or Non-LPU Student.';
