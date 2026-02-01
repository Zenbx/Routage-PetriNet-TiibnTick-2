-- Add total_distance column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='kalman_states' AND column_name='total_distance') THEN
        ALTER TABLE kalman_states ADD COLUMN total_distance DOUBLE PRECISION;
    END IF;
END $$;
