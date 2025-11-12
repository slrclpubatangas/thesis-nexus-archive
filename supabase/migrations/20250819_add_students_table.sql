-- Migration: Add students table and RLS for admin-only access
-- Date: 2025-08-19

-- 1) Create students table
CREATE TABLE IF NOT EXISTS public.students (
  student_no TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  course_section TEXT NOT NULL,
  email TEXT NOT NULL,
  school_year TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Trigger to maintain updated_at
CREATE OR REPLACE FUNCTION public.students_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_students_set_updated_at ON public.students;
CREATE TRIGGER trg_students_set_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.students_set_updated_at();

-- 3) Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_students_course_section ON public.students(course_section);
CREATE INDEX IF NOT EXISTS idx_students_school_year ON public.students(school_year);
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(email);

-- 4) Enable RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- 5) RLS Policies: Admin-only access via existing is_admin_user()
-- Select
DROP POLICY IF EXISTS "Admins can select students" ON public.students;
CREATE POLICY "Admins can select students"
ON public.students
FOR SELECT
USING (is_admin_user());

-- Insert
DROP POLICY IF EXISTS "Admins can insert students" ON public.students;
CREATE POLICY "Admins can insert students"
ON public.students
FOR INSERT
WITH CHECK (is_admin_user());

-- Update
DROP POLICY IF EXISTS "Admins can update students" ON public.students;
CREATE POLICY "Admins can update students"
ON public.students
FOR UPDATE
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- Delete
DROP POLICY IF EXISTS "Admins can delete students" ON public.students;
CREATE POLICY "Admins can delete students"
ON public.students
FOR DELETE
USING (is_admin_user());

