-- Ajout d'alias pour les points relais par ville pour correspondre aux IDs générés par le frontend
-- Ces points sont connectés aux points spécifiques par des arcs de distance 0

-- YAOUNDE
INSERT INTO nodes (id, type, name, latitude, longitude, capacity, current_occupancy)
VALUES ('RELAY_Yaoundé', 'RELAY', 'Point Relais Central (Yaoundé)', 3.8667, 11.5167, 500, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO arcs (origin_id, destination_id, distance, travel_time, penibility, weather_impact, fuel_cost) VALUES
('RELAY_Yaoundé', 'RELAY_YDE_CENTRE_VILLE', 0.0, 0, 0.0, 0.0, 0.0),
('RELAY_YDE_CENTRE_VILLE', 'RELAY_Yaoundé', 0.0, 0, 0.0, 0.0, 0.0);

-- DOUALA
INSERT INTO nodes (id, type, name, latitude, longitude, capacity, current_occupancy)
VALUES ('RELAY_Douala', 'RELAY', 'Point Relais Central (Douala)', 4.0533, 9.7133, 500, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO arcs (origin_id, destination_id, distance, travel_time, penibility, weather_impact, fuel_cost) VALUES
('RELAY_Douala', 'RELAY_DLA_AKWA', 0.0, 0, 0.0, 0.0, 0.0),
('RELAY_DLA_AKWA', 'RELAY_Douala', 0.0, 0, 0.0, 0.0, 0.0);

-- BAFOUSSAM
INSERT INTO nodes (id, type, name, latitude, longitude, capacity, current_occupancy)
VALUES ('RELAY_Bafoussam', 'RELAY', 'Point Relais Central (Bafoussam)', 5.4833, 10.4167, 200, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO arcs (origin_id, destination_id, distance, travel_time, penibility, weather_impact, fuel_cost) VALUES
('RELAY_Bafoussam', 'RELAY_BAF_CENTRE', 0.0, 0, 0.0, 0.0, 0.0),
('RELAY_BAF_CENTRE', 'RELAY_Bafoussam', 0.0, 0, 0.0, 0.0, 0.0);

-- DSCHANG
INSERT INTO nodes (id, type, name, latitude, longitude, capacity, current_occupancy)
VALUES ('RELAY_Dschang', 'RELAY', 'Point Relais Central (Dschang)', 5.4500, 10.0667, 100, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO arcs (origin_id, destination_id, distance, travel_time, penibility, weather_impact, fuel_cost) VALUES
('RELAY_Dschang', 'RELAY_DSCH_UNIV', 0.0, 0, 0.0, 0.0, 0.0),
('RELAY_DSCH_UNIV', 'RELAY_Dschang', 0.0, 0, 0.0, 0.0, 0.0);

-- KRIBI
INSERT INTO nodes (id, type, name, latitude, longitude, capacity, current_occupancy)
VALUES ('RELAY_Kribi', 'RELAY', 'Point Relais Central (Kribi)', 2.9333, 9.9167, 100, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO arcs (origin_id, destination_id, distance, travel_time, penibility, weather_impact, fuel_cost) VALUES
('RELAY_Kribi', 'RELAY_KRI_COTIERE', 0.0, 0, 0.0, 0.0, 0.0),
('RELAY_KRI_COTIERE', 'RELAY_Kribi', 0.0, 0, 0.0, 0.0, 0.0);

-- GAROUA
INSERT INTO nodes (id, type, name, latitude, longitude, capacity, current_occupancy)
VALUES ('RELAY_Garoua', 'RELAY', 'Point Relais Central (Garoua)', 9.3000, 13.4000, 100, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO arcs (origin_id, destination_id, distance, travel_time, penibility, weather_impact, fuel_cost) VALUES
('RELAY_Garoua', 'RELAY_GAR_CENTRE', 0.0, 0, 0.0, 0.0, 0.0),
('RELAY_GAR_CENTRE', 'RELAY_Garoua', 0.0, 0, 0.0, 0.0, 0.0);

-- BAMENDA
INSERT INTO nodes (id, type, name, latitude, longitude, capacity, current_occupancy)
VALUES ('RELAY_Bamenda', 'RELAY', 'Point Relais Central (Bamenda)', 5.9667, 10.1500, 100, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO arcs (origin_id, destination_id, distance, travel_time, penibility, weather_impact, fuel_cost) VALUES
('RELAY_Bamenda', 'RELAY_BAM_CENTRE', 0.0, 0, 0.0, 0.0, 0.0),
('RELAY_BAM_CENTRE', 'RELAY_Bamenda', 0.0, 0, 0.0, 0.0, 0.0);

-- BUEA
INSERT INTO nodes (id, type, name, latitude, longitude, capacity, current_occupancy)
VALUES ('RELAY_Buea', 'RELAY', 'Point Relais Central (Buea)', 4.1500, 9.2333, 100, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO arcs (origin_id, destination_id, distance, travel_time, penibility, weather_impact, fuel_cost) VALUES
('RELAY_Buea', 'RELAY_BUEA_MOUNTAIN', 0.0, 0, 0.0, 0.0, 0.0),
('RELAY_BUEA_MOUNTAIN', 'RELAY_Buea', 0.0, 0, 0.0, 0.0, 0.0);
