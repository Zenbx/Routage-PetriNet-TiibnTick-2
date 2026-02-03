-- Migration pour ajouter les champs géographiques manquants
-- Complète la migration 013 avec les informations de localisation

-- Informations géographiques expéditeur
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS sender_city VARCHAR(100);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS sender_region VARCHAR(100);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS sender_country VARCHAR(100);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS sender_landmark TEXT;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS sender_email VARCHAR(100);

-- Informations géographiques destinataire
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS recipient_city VARCHAR(100);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS recipient_region VARCHAR(100);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS recipient_country VARCHAR(100);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS recipient_landmark TEXT;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS recipient_email VARCHAR(100);

-- Commentaires pour documentation
COMMENT ON COLUMN deliveries.sender_city IS 'Ville de l''expéditeur';
COMMENT ON COLUMN deliveries.sender_region IS 'Région de l''expéditeur';
COMMENT ON COLUMN deliveries.sender_country IS 'Pays de l''expéditeur';
COMMENT ON COLUMN deliveries.sender_landmark IS 'Point de repère pour l''expéditeur';
COMMENT ON COLUMN deliveries.sender_email IS 'Email de l''expéditeur';

COMMENT ON COLUMN deliveries.recipient_city IS 'Ville du destinataire';
COMMENT ON COLUMN deliveries.recipient_region IS 'Région du destinataire';
COMMENT ON COLUMN deliveries.recipient_country IS 'Pays du destinataire';
COMMENT ON COLUMN deliveries.recipient_landmark IS 'Point de repère pour le destinataire';
COMMENT ON COLUMN deliveries.recipient_email IS 'Email du destinataire';
