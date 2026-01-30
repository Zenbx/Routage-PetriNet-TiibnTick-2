-- Add traffic_factor column to arcs table
ALTER TABLE arcs ADD COLUMN IF NOT EXISTS traffic_factor DOUBLE PRECISION DEFAULT 1.0;
UPDATE arcs SET traffic_factor = 1.0 WHERE traffic_factor IS NULL;

-- Add total_distance to kalman_states
ALTER TABLE kalman_states ADD COLUMN IF NOT EXISTS total_distance DOUBLE PRECISION DEFAULT 0.0;
