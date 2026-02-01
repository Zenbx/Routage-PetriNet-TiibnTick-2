-- Add UNIQUE constraint to kalman_states for ON CONFLICT clause
ALTER TABLE kalman_states
ADD CONSTRAINT uk_kalman_delivery_timestamp UNIQUE (delivery_id, timestamp);
