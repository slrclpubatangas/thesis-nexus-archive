-- Fix student validation function and ensure it works correctly
-- Date: 2025-08-19

-- 1) Ensure the validate_lpu_student function exists and works
CREATE OR REPLACE FUNCTION public.validate_lpu_student(student_num TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  -- Log the input for debugging
  RAISE NOTICE 'Validating student number: %', student_num;
  
  -- Check if student exists
  RETURN EXISTS (
    SELECT 1 
    FROM public.students 
    WHERE student_no = student_num
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in validate_lpu_student: %', SQLERRM;
    RETURN false;
END;
$$;

-- 2) Grant proper permissions to all users (including anonymous)
REVOKE ALL ON FUNCTION public.validate_lpu_student(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_lpu_student(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_lpu_student(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_lpu_student(TEXT) TO service_role;

-- 3) Create a simple test function to verify the validation works
CREATE OR REPLACE FUNCTION public.test_student_validation()
RETURNS TABLE(
  student_count BIGINT,
  sample_student TEXT,
  validation_result BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  test_student_no TEXT;
BEGIN
  -- Get total student count
  SELECT COUNT(*) INTO student_count FROM public.students;
  
  -- Get first student number for testing
  SELECT student_no INTO test_student_no 
  FROM public.students 
  LIMIT 1;
  
  sample_student := test_student_no;
  
  -- Test validation
  IF test_student_no IS NOT NULL THEN
    SELECT public.validate_lpu_student(test_student_no) INTO validation_result;
  ELSE
    validation_result := FALSE;
  END IF;
  
  RETURN NEXT;
END;
$$;

-- 4) Grant permission to test function
GRANT EXECUTE ON FUNCTION public.test_student_validation() TO anon;
GRANT EXECUTE ON FUNCTION public.test_student_validation() TO authenticated;

-- 5) Run a quick test
DO $$
DECLARE
  test_result RECORD;
BEGIN
  SELECT * INTO test_result FROM public.test_student_validation();
  
  RAISE NOTICE '=== STUDENT VALIDATION TEST ===';
  RAISE NOTICE 'Total students in database: %', test_result.student_count;
  RAISE NOTICE 'Sample student number: %', test_result.sample_student;
  RAISE NOTICE 'Validation function result: %', test_result.validation_result;
  
  IF test_result.student_count > 0 AND test_result.validation_result = TRUE THEN
    RAISE NOTICE '✅ Student validation function is working correctly!';
  ELSE
    RAISE NOTICE '❌ Student validation function may have issues';
  END IF;
END;
$$;
