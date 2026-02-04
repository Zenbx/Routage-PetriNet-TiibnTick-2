-- Migration pour créer la table notifications
-- Changelog: 018-create-notifications-table.sql

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(255) PRIMARY KEY,
    delivery_id VARCHAR(255) NOT NULL,
    tracking_code VARCHAR(50) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    
    metadata TEXT,
    
    CONSTRAINT fk_notification_delivery FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE CASCADE
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_notifications_delivery ON notifications(delivery_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tracking ON notifications(tracking_code);
CREATE INDEX IF NOT EXISTS idx_notifications_phone ON notifications(recipient_phone);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Index composite pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_notifications_phone_status ON notifications(recipient_phone, status);
