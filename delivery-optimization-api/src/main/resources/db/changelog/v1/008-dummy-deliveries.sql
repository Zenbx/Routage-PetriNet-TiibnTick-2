-- Dummy Data for Deliveries
INSERT INTO deliveries (id, pickup_node_id, dropoff_node_id, weight, status) VALUES
('del_1', 'client_1', 'client_2', 10.5, 'IN_TRANSIT'),
('del_2', 'client_3', 'client_4', 5.0, 'ASSIGNED'),
('del_3', 'client_5', 'client_6', 15.0, 'DELIVERED'),
('del_4', 'client_7', 'client_8', 2.0, 'PENDING'),
('del_5', 'client_9', 'client_10', 8.5, 'IN_TRANSIT'),
('del_6', 'client_11', 'client_12', 12.0, 'IN_TRANSIT'),
('del_7', 'client_13', 'client_14', 3.0, 'DELIVERED'),
('del_8', 'client_15', 'client_16', 7.5, 'ASSIGNED')
ON CONFLICT (id) DO NOTHING;
