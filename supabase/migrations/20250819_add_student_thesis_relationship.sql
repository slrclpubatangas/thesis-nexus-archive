-- Migration: Add foreign key relationship between students and thesis_submissions
-- Date: 2025-08-19

-- 1) Add foreign key constraint to thesis_submissions table
-- This creates a reference from thesis_submissions.student_number to students.student_no
ALTER TABLE public.thesis_submissions 
ADD CONSTRAINT fk_thesis_submissions_student_number 
FOREIGN KEY (student_number) 
REFERENCES public.students(student_no) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- 2) Create an index on student_number for better performance
CREATE INDEX IF NOT EXISTS idx_thesis_submissions_student_number 
ON public.thesis_submissions(student_number);

-- 3) Create a function to validate student existence for LPU students
CREATE OR REPLACE FUNCTION public.validate_lpu_student(student_num TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.students 
    WHERE student_no = student_num
  );
$$;

-- 4) Grant execute permission to anonymous users (for public form submission)
GRANT EXECUTE ON FUNCTION public.validate_lpu_student(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_lpu_student(TEXT) TO authenticated;

-- 5) Add a comment explaining the relationship
COMMENT ON CONSTRAINT fk_thesis_submissions_student_number ON public.thesis_submissions IS 
'Foreign key relationship to ensure student_number exists in students table for LPU students';

COMMENT ON FUNCTION public.validate_lpu_student IS 
'Function to validate if a student number exists in the students table. Used for form validation.';
