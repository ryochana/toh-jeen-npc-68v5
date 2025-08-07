-- Add payment_date column to table_bookings table
ALTER TABLE table_bookings 
ADD COLUMN payment_date timestamp with time zone DEFAULT NULL;

-- Update existing paid bookings to have payment_date same as created_at
UPDATE table_bookings 
SET payment_date = created_at 
WHERE payment_status = 'paid' AND payment_date IS NULL;

-- Comment for documentation
COMMENT ON COLUMN table_bookings.payment_date IS 'Timestamp when payment was made (NULL if not paid yet)';
