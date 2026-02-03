-- Migration pour ajouter les champs logistiques à la table deliveries
-- Transforme le système en plateforme de livraison complète

-- Champs principaux
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS tracking_code VARCHAR(20) UNIQUE;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS driver_id VARCHAR(50);

-- Informations expéditeur
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS sender_name VARCHAR(100);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS sender_phone VARCHAR(20);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS sender_address TEXT;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS pickup_type VARCHAR(20); -- RELAY_POINT, HOME
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS pickup_location_id VARCHAR(50);

-- Informations destinataire
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(100);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS recipient_phone VARCHAR(20);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS recipient_address TEXT;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS delivery_type VARCHAR(20); -- RELAY_POINT, HOME
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS delivery_location_id VARCHAR(50);

-- Informations colis
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS package_description TEXT;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS package_length DOUBLE PRECISION; -- cm
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS package_width DOUBLE PRECISION;  -- cm
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS package_height DOUBLE PRECISION; -- cm

-- Timestamps du workflow
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;

-- Pricing
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS price DOUBLE PRECISION;

-- Ajouter des index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_deliveries_tracking_code ON deliveries(tracking_code);
CREATE INDEX IF NOT EXISTS idx_deliveries_driver_id ON deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_created_at ON deliveries(created_at DESC);

-- Commentaires pour documentation
COMMENT ON COLUMN deliveries.tracking_code IS 'Code de tracking unique (ex: TRK-ABCD123XY)';
COMMENT ON COLUMN deliveries.driver_id IS 'ID du livreur assigné';
COMMENT ON COLUMN deliveries.pickup_type IS 'Type de récupération: RELAY_POINT ou HOME';
COMMENT ON COLUMN deliveries.delivery_type IS 'Type de livraison: RELAY_POINT ou HOME';
COMMENT ON COLUMN deliveries.package_description IS 'Description du colis';
COMMENT ON COLUMN deliveries.price IS 'Prix de la livraison en euros';
