-- =============================================================================
-- Remove barcode validation constraint
-- Date: 2025-11-04
-- =============================================================================
-- This migration removes the CHECK constraint on the barcode column
-- to allow any barcode format to be used
-- =============================================================================

-- Drop the CHECK constraint on barcode
ALTER TABLE public.thesis_data 
DROP CONSTRAINT IF EXISTS valid_barcode;

-- Add a comment to document the change
COMMENT ON COLUMN public.thesis_data.barcode IS 
'Barcode field - accepts any format. Uniqueness is enforced at application level.';
