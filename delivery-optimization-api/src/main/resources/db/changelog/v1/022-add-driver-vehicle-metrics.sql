-- Migration pour ajouter les paramètres de performance du véhicule du livreur
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS average_speed DOUBLE PRECISION DEFAULT 40.0; -- km/h par défaut
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS fuel_consumption DOUBLE PRECISION DEFAULT 8.0; -- L/100km par défaut

-- Commentaires pour documentation
COMMENT ON COLUMN drivers.average_speed IS 'Vitesse moyenne habituelle du livreur en km/h';
COMMENT ON COLUMN drivers.fuel_consumption IS 'Consommation moyenne de carburant en L/100km';
