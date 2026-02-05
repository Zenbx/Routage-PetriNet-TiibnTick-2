-- Add landmark fields to deliveries table
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS sender_landmark VARCHAR(255);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS recipient_landmark VARCHAR(255);
