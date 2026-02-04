-- Ajout des champs d'authentification à la table drivers
ALTER TABLE drivers
ADD COLUMN email VARCHAR(255) UNIQUE,
ADD COLUMN password VARCHAR(255),
ADD COLUMN phone VARCHAR(20),
ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN vehicle_type VARCHAR(50),
ADD COLUMN license_plate VARCHAR(20);

-- Index pour améliorer les performances de recherche par email
CREATE INDEX idx_drivers_email ON drivers(email);

-- Commentaires pour documenter les colonnes
COMMENT ON COLUMN drivers.email IS 'Email unique du livreur pour connexion';
COMMENT ON COLUMN drivers.password IS 'Mot de passe hashé (BCrypt)';
COMMENT ON COLUMN drivers.phone IS 'Numéro de téléphone du livreur';
COMMENT ON COLUMN drivers.vehicle_type IS 'Type de véhicule (MOTO, VOITURE, VELO)';
COMMENT ON COLUMN drivers.license_plate IS 'Plaque d''immatriculation du véhicule';
