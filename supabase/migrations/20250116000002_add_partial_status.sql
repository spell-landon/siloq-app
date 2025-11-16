-- Add 'partial' to the allowed invoice status values

-- First, drop the existing check constraint
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;

-- Add new check constraint that includes 'partial'
ALTER TABLE invoices ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'partial'));

-- Update any invoices that have payments but aren't fully paid to 'partial' status
UPDATE invoices
SET status = 'partial'
WHERE balance_due > 0
  AND balance_due < total
  AND status NOT IN ('paid', 'partial')
  AND id IN (
    SELECT DISTINCT invoice_id
    FROM payments
    WHERE invoice_id IS NOT NULL
  );
