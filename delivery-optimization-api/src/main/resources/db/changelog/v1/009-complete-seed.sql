-- Comprehensive Seed Data for Delivery Optimization System

-- 1. Ensure Drivers
INSERT INTO drivers (id, name, current_latitude, current_longitude, status) VALUES
('driver_1', 'Jean Express', 3.8277, 11.5173, 'AVAILABLE'),
('driver_2', 'Paul Livraison', 3.8277, 11.5173, 'BUSY'),
('driver_3', 'Marc Rapide', 3.8967, 11.5119, 'AVAILABLE'),
('driver_4', 'Sophie Vitesse', 3.8650, 11.5050, 'AVAILABLE')
ON CONFLICT (id) DO NOTHING;

-- 2. Deliveries (Pending and Active)
INSERT INTO deliveries (id, pickup_node_id, dropoff_node_id, weight, status) VALUES
('del_10', 'client_1', 'client_2', 12.0, 'PENDING'),
('del_11', 'client_3', 'client_4', 5.5, 'PENDING'),
('del_12', 'client_5', 'client_6', 8.0, 'IN_TRANSIT'),
('del_13', 'client_7', 'client_8', 2.0, 'ASSIGNED'),
('del_14', 'client_9', 'client_10', 15.0, 'DELIVERED'),
('del_15', 'client_11', 'client_12', 3.5, 'PENDING'),
('del_16', 'client_13', 'client_14', 6.0, 'PENDING'),
('del_17', 'client_15', 'client_16', 9.0, 'IN_TRANSIT'),
('del_18', 'client_17', 'client_18', 4.5, 'ASSIGNED'),
('del_19', 'client_19', 'client_20', 11.0, 'PENDING')
ON CONFLICT (id) DO NOTHING;

-- 3. Tours (Active and Planned)
INSERT INTO tours (id, driver_id, status, total_cost, total_distance, estimated_duration) VALUES
('tour_1', 'driver_2', 'ACTIVE', 125.0, 45.5, 3600),
('tour_2', 'driver_3', 'PLANNED', 80.0, 25.0, 1800)
ON CONFLICT (id) DO NOTHING;

-- 4. Tour Stops
INSERT INTO tour_stops (tour_id, node_id, stop_order, stop_type) VALUES
('tour_1', 'depot_1', 1, 'PICKUP'),
('tour_1', 'client_5', 2, 'PICKUP'),
('tour_1', 'client_6', 3, 'DROPOFF'),
('tour_1', 'depot_1', 4, 'DROPOFF'),
('tour_2', 'depot_1', 1, 'PICKUP'),
('tour_2', 'client_7', 2, 'PICKUP'),
('tour_2', 'client_8', 3, 'DROPOFF')
ON CONFLICT (tour_id, stop_order) DO NOTHING;

-- 5. Kalman States (for Analytics)
INSERT INTO kalman_states (delivery_id, distance_covered, estimated_speed, traffic_bias, variance) VALUES
('del_12', 5.0, 45.0, 1.1, 0.5),
('del_17', 2.5, 30.0, 1.2, 0.8)
ON CONFLICT (delivery_id, timestamp) DO NOTHING;
