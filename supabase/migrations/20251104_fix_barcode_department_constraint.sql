-- =============================================================================
-- Fix barcode constraint to allow same barcode with different departments
-- Date: 2025-11-04
-- =============================================================================
-- This migration removes the unique constraint on barcode alone and
-- creates a composite unique constraint on (barcode, department)
-- =============================================================================

-- Drop the existing unique constraint on barcode if it exists
ALTER TABLE public.thesis_data 
DROP CONSTRAINT IF EXISTS thesis_data_barcode_key;

-- Create a composite unique constraint on barcode + department
-- This allows the same barcode to exist as long as the department is different
ALTER TABLE public.thesis_data
ADD CONSTRAINT thesis_data_barcode_department_key 
UNIQUE (barcode, department);

-- Add a comment to document the change
COMMENT ON CONSTRAINT thesis_data_barcode_department_key ON public.thesis_data IS 
'Composite unique constraint: same barcode can exist across different departments, but not within the same department';
