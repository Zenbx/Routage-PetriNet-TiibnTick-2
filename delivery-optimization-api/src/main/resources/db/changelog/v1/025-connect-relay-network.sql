-- Connexion du réseau de Points Relais pour permettre le calcul d'itinéraires (A*)
-- Ajoute des arcs entre les pôles majeurs (Yaoundé, Douala, Dschang)

-- Connexions Yaoundé
INSERT INTO arcs (origin_id, destination_id, distance, travel_time, penibility, weather_impact, fuel_cost) VALUES
('RELAY_YDE_MVAN', 'RELAY_YDE_CENTRE_VILLE', 5.5, 900, 0.2, 0.1, 0.6),
('RELAY_YDE_CENTRE_VILLE', 'RELAY_YDE_MVAN', 5.5, 900, 0.2, 0.1, 0.6),
('RELAY_YDE_CENTRE_VILLE', 'RELAY_YDE_BASTOS', 3.2, 500, 0.1, 0.0, 0.3),
('RELAY_YDE_BASTOS', 'RELAY_YDE_CENTRE_VILLE', 3.2, 500, 0.1, 0.0, 0.3),
('RELAY_YDE_BASTOS', 'RELAY_YDE_ETOUDI', 2.8, 450, 0.1, 0.0, 0.3),
('RELAY_YDE_ETOUDI', 'RELAY_YDE_BASTOS', 2.8, 450, 0.1, 0.0, 0.3),
('RELAY_YDE_ETOUDI', 'RELAY_YDE_MESSASSI', 4.5, 700, 0.2, 0.1, 0.4),
('RELAY_YDE_MESSASSI', 'RELAY_YDE_ETOUDI', 4.5, 700, 0.2, 0.1, 0.4),
('RELAY_YDE_CENTRE_VILLE', 'RELAY_YDE_NGOUSSO', 5.0, 800, 0.3, 0.1, 0.5),
('RELAY_YDE_NGOUSSO', 'RELAY_YDE_CENTRE_VILLE', 5.0, 800, 0.3, 0.1, 0.5);

-- Backbone Yaoundé <-> Douala
INSERT INTO arcs (origin_id, destination_id, distance, travel_time, penibility, weather_impact, fuel_cost) VALUES
('RELAY_YDE_MVAN', 'RELAY_DLA_AKWA', 245.0, 14400, 0.5, 0.2, 25.0),
('RELAY_DLA_AKWA', 'RELAY_YDE_MVAN', 245.0, 14400, 0.5, 0.2, 25.0);

-- Connexions Douala
INSERT INTO arcs (origin_id, destination_id, distance, travel_time, penibility, weather_impact, fuel_cost) VALUES
('RELAY_DLA_AKWA', 'RELAY_DLA_BONAPRISO', 3.5, 600, 0.2, 0.1, 0.4),
('RELAY_DLA_BONAPRISO', 'RELAY_DLA_AKWA', 3.5, 600, 0.2, 0.1, 0.4),
('RELAY_DLA_AKWA', 'RELAY_DLA_BONANJO', 2.5, 400, 0.1, 0.0, 0.3),
('RELAY_DLA_BONANJO', 'RELAY_DLA_AKWA', 2.5, 400, 0.1, 0.0, 0.3);

-- Connexion Dschang <-> Douala (via Littoral)
INSERT INTO arcs (origin_id, destination_id, distance, travel_time, penibility, weather_impact, fuel_cost) VALUES
('RELAY_DSCH_UNIV', 'RELAY_DLA_AKWA', 220.0, 15000, 0.6, 0.3, 22.0),
('RELAY_DLA_AKWA', 'RELAY_DSCH_UNIV', 220.0, 15000, 0.6, 0.3, 22.0);

-- Pont entre les anciens et nouveaux IDs pour la traversabilité
INSERT INTO arcs (origin_id, destination_id, distance, travel_time, penibility, weather_impact, fuel_cost) VALUES
('relay_1', 'RELAY_YDE_BASTOS', 0.5, 60, 0.0, 0.0, 0.1),
('RELAY_YDE_BASTOS', 'relay_1', 0.5, 60, 0.0, 0.0, 0.1);
