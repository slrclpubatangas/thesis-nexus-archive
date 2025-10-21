-- Add name validation to student verification
-- Date: 2025-08-19

-- 1) Create enhanced validation function that checks both student number and name
CREATE OR REPLACE FUNCTION public.validate_lpu_student_with_name(
  student_num TEXT,
  student_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  student_record RECORD;
  result JSONB;
BEGIN
  -- Log the input for debugging
  RAISE NOTICE 'Validating student number: % with name: %', student_num, student_name;
  
  -- Check if student exists and get their details
  SELECT student_no, full_name, course_section, email, school_year 
  INTO student_record
  FROM public.students 
  WHERE student_no = student_num;
  
  IF NOT FOUND THEN
    -- Student number doesn't exist
    result := jsonb_build_object(
      'valid', false,
      'error', 'student_not_found',
      'message', 'Student number not found in database'
    );
  ELSE
    -- Student exists, now check if name matches
    -- Use case-insensitive comparison and trim whitespace
    IF LOWER(TRIM(student_record.full_name)) = LOWER(TRIM(student_name)) THEN
      -- Perfect match
      result := jsonb_build_object(
        'valid', true,
        'student_details', jsonb_build_object(
          'student_no', student_record.student_no,
          'full_name', student_record.full_name,
          'course_section', student_record.course_section,
          'email', student_record.email,
          'school_year', student_record.school_year
        )
      );
    ELSE
      -- Name doesn't match
      result := jsonb_build_object(
        'valid', false,
        'error', 'name_mismatch',
        'message', 'Student name does not match the name on file',
        'expected_name', student_record.full_name
      );
    END IF;
  END IF;
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in validate_lpu_student_with_name: %', SQLERRM;
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'validation_error',
      'message', 'An error occurred during validation'
    );
END;
$$;

-- 2) Keep the old function for backward compatibility but enhance it
CREATE OR REPLACE FUNCTION public.validate_lpu_student(student_num TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  -- Log the input for debugging
  RAISE NOTICE 'Validating student number (basic): %', student_num;
  
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

-- 3) Grant proper permissions
REVOKE ALL ON FUNCTION public.validate_lpu_student_with_name(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_lpu_student_with_name(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_lpu_student_with_name(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_lpu_student_with_name(TEXT, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.validate_lpu_student(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_lpu_student(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_lpu_student(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_lpu_student(TEXT) TO service_role;

-- 4) Create test function
CREATE OR REPLACE FUNCTION public.test_name_validation()
RETURNS TABLE(
  student_count BIGINT,
  sample_student_no TEXT,
  sample_student_name TEXT,
  validation_result JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  test_student_record RECORD;
BEGIN
  -- Get total student count
  SELECT COUNT(*) INTO student_count FROM public.students;
  
  -- Get first student for testing
  SELECT student_no, full_name INTO test_student_record
  FROM public.students 
  LIMIT 1;
  
  sample_student_no := test_student_record.student_no;
  sample_student_name := test_student_record.full_name;
  
  -- Test validation
  IF test_student_record.student_no IS NOT NULL THEN
    SELECT public.validate_lpu_student_with_name(
      test_student_record.student_no, 
      test_student_record.full_name
    ) INTO validation_result;
  ELSE
    validation_result := jsonb_build_object('valid', false, 'error', 'no_students');
  END IF;
  
  RETURN NEXT;
END;
$$;

-- 5) Grant permission to test function
GRANT EXECUTE ON FUNCTION public.test_name_validation() TO anon;
GRANT EXECUTE ON FUNCTION public.test_name_validation() TO authenticated;

-- 6) Run test
DO $$
DECLARE
  test_result RECORD;
BEGIN
  SELECT * INTO test_result FROM public.test_name_validation();
  
  RAISE NOTICE '=== STUDENT NAME VALIDATION TEST ===';
  RAISE NOTICE 'Total students in database: %', test_result.student_count;
  RAISE NOTICE 'Sample student number: %', test_result.sample_student_no;
  RAISE NOTICE 'Sample student name: %', test_result.sample_student_name;
  RAISE NOTICE 'Validation result: %', test_result.validation_result;
  
  IF test_result.student_count > 0 AND (test_result.validation_result->>'valid')::boolean = TRUE THEN
    RAISE NOTICE '✅ Student name validation function is working correctly!';
  ELSE
    RAISE NOTICE '❌ Student name validation function may have issues';
  END IF;
END;
$$;
