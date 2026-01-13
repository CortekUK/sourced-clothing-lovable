-- Add status fields to sales table for void/edit functionality
-- Status: 'completed' (default) or 'voided'

-- Add status column
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'completed';

-- Add void tracking columns
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS voided_at timestamptz,
  ADD COLUMN IF NOT EXISTS voided_by uuid,
  ADD COLUMN IF NOT EXISTS void_reason text;

-- Add constraint for valid statuses (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_status_check'
  ) THEN
    ALTER TABLE public.sales
      ADD CONSTRAINT sales_status_check
      CHECK (status IN ('completed', 'voided'));
  END IF;
END $$;

-- Create index for filtering by status
CREATE INDEX IF NOT EXISTS idx_sales_status ON public.sales(status);

-- Update v_stock_on_hand view to exclude voided sales
-- Note: The stock_movements already have related_sale_id, so we need to
-- exclude movements from voided sales OR handle via return_in movements
-- For simplicity, we'll use return_in movements to reverse stock on void
