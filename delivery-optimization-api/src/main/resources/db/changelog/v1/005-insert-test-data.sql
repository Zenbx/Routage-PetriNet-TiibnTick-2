-- Nodes (Yaoundé Centers)
INSERT INTO nodes (id, type, name, latitude, longitude, capacity) VALUES
('depot_1', 'DEPOT', 'Dépôt Central - Mvan', 3.8277, 11.5173, 0),
('relay_1', 'RELAY', 'Relais Bastos', 3.8967, 11.5119, 20),
('relay_2', 'RELAY', 'Relais Mendong', 3.8346, 11.4746, 15),
('client_1', 'CLIENT', 'Client Biyem Assi', 3.8398, 11.4880, 0),
('client_2', 'CLIENT', 'Client Ngousso', 3.9054, 11.5434, 0),
('client_3', 'CLIENT', 'Client Essos', 3.8675, 11.5350, 0),
('client_4', 'CLIENT', 'Client Odza', 3.7950, 11.5300, 0);

-- Drivers
INSERT INTO drivers (id, name, current_latitude, current_longitude, status) VALUES
('driver_1', 'Jean Express', 3.8277, 11.5173, 'AVAILABLE'),
('driver_2', 'Paul Livraison', 3.8277, 11.5173, 'AVAILABLE');

-- Arcs (Approximate distances in km and times in seconds)
INSERT INTO arcs (origin_id, destination_id, distance, travel_time, penibility, weather_impact, fuel_cost) VALUES
('depot_1', 'client_1', 4.5, 900, 0.2, 0.1, 0.5),
('client_1', 'relay_2', 1.8, 300, 0.1, 0.0, 0.2),
('relay_2', 'depot_1', 5.2, 1000, 0.3, 0.1, 0.6),
('depot_1', 'relay_1', 7.8, 1500, 0.1, 0.0, 0.9),
('relay_1', 'client_2', 4.2, 800, 0.1, 0.0, 0.4),
('client_2', 'client_3', 3.5, 700, 0.4, 0.2, 0.4),
('client_3', 'depot_1', 5.5, 1100, 0.2, 0.1, 0.6);
