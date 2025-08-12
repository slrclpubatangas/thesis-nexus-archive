
-- Create the feedback table
CREATE TABLE public.feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comments text,
    submission_id uuid REFERENCES public.thesis_submissions(id) ON DELETE SET NULL,
    user_agent text,
    ip_address inet,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_feedback_rating ON public.feedback (rating);
CREATE INDEX idx_feedback_created_at ON public.feedback (created_at DESC);
CREATE INDEX idx_feedback_submission_id ON public.feedback (submission_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_feedback_updated_at_trigger
    BEFORE UPDATE ON public.feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_feedback_updated_at();

-- Enable Row Level Security
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow anyone to insert feedback (anonymous feedback allowed)
CREATE POLICY "Anyone can submit feedback" ON public.feedback
    FOR INSERT
    WITH CHECK (true);

-- Only authenticated users (admins) can view feedback
CREATE POLICY "Authenticated users can view feedback" ON public.feedback
    FOR SELECT
    TO authenticated
    USING (true);

-- Only authenticated users can update/delete feedback
CREATE POLICY "Authenticated users can modify feedback" ON public.feedback
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can delete feedback" ON public.feedback
    FOR DELETE
    TO authenticated
    USING (true);

-- Add comments for documentation
COMMENT ON TABLE public.feedback IS 'Stores user feedback and ratings from thesis submissions';
COMMENT ON COLUMN public.feedback.rating IS 'User rating from 1 to 5 stars';
COMMENT ON COLUMN public.feedback.comments IS 'Optional user comments';
COMMENT ON COLUMN public.feedback.submission_id IS 'Reference to the thesis submission (nullable)';
COMMENT ON COLUMN public.feedback.user_agent IS 'Browser user agent for analytics';
COMMENT ON COLUMN public.feedback.ip_address IS 'User IP address for analytics';
