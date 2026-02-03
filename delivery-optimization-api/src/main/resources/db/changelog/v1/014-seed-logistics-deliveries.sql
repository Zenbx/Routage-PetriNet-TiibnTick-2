-- Seed de données de test pour les livraisons logistiques
-- Génère des livraisons réalistes avec tracking codes, expéditeurs, destinataires
-- Note: pickup_node_id et dropoff_node_id sont NULL (les nodes seront créés plus tard)

-- Livraison 1: PENDING
INSERT INTO deliveries (
    id, tracking_code, status,
    pickup_node_id, dropoff_node_id, weight,
    sender_name, sender_phone, sender_address, sender_city, sender_region, sender_country,
    recipient_name, recipient_phone, recipient_address, recipient_city, recipient_region, recipient_country,
    package_description, package_length, package_width, package_height,
    price, deadline, created_at
) VALUES (
    'del_001', 'TRK-ABC123', 'PENDING',
    NULL, NULL, 2.5,
    'Marie Kamga', '+237699123456', 'Quartier Bastos', 'Yaoundé', 'Centre', 'Cameroun',
    'Paul Njiki', '+237677987654', 'Akwa Nord', 'Douala', 'Littoral', 'Cameroun',
    'Documents', 30.0, 20.0, 15.0,
    5000, CURRENT_TIMESTAMP + INTERVAL '2 days', CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- Livraison 2: ACCEPTED
INSERT INTO deliveries (
    id, tracking_code, status, driver_id,
    pickup_node_id, dropoff_node_id, weight,
    sender_name, sender_phone, sender_address, sender_city, sender_region, sender_country,
    recipient_name, recipient_phone, recipient_address, recipient_city, recipient_region, recipient_country,
    package_description, package_length, package_width, package_height,
    price, deadline, created_at, accepted_at
) VALUES (
    'del_002', 'TRK-DEF456', 'ACCEPTED', 'driver_1',
    NULL, NULL, 5.0,
    'Jean Mballa', '+237655112233', 'Melen', 'Yaoundé', 'Centre', 'Cameroun',
    'Alice Nkomo', '+237688445566', 'Bonanjo', 'Douala', 'Littoral', 'Cameroun',
    'Vêtements', 40.0, 30.0, 20.0,
    8000, CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP - INTERVAL '30 minutes'
) ON CONFLICT (id) DO NOTHING;

-- Livraison 3: IN_TRANSIT
INSERT INTO deliveries (
    id, tracking_code, status, driver_id,
    pickup_node_id, dropoff_node_id, weight,
    sender_name, sender_phone, sender_address, sender_city, sender_region, sender_country,
    recipient_name, recipient_phone, recipient_address, recipient_city, recipient_region, recipient_country,
    package_description, package_length, package_width, package_height,
    price, deadline, created_at, accepted_at, picked_up_at
) VALUES (
    'del_003', 'TRK-GHI789', 'IN_TRANSIT', 'driver_2',
    NULL, NULL, 3.0,
    'Sophie Ndam', '+237699778899', 'Dschang', 'Dschang', 'Ouest', 'Cameroun',
    'Thomas Biya', '+237677554433', 'Carrefour Nlongkak', 'Yaoundé', 'Centre', 'Cameroun',
    'Électronique', 25.0, 25.0, 10.0,
    12000, CURRENT_TIMESTAMP + INTERVAL '6 hours', CURRENT_TIMESTAMP - INTERVAL '3 hours', CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '1 hour'
) ON CONFLICT (id) DO NOTHING;

-- Livraison 4: DELIVERED
INSERT INTO deliveries (
    id, tracking_code, status, driver_id,
    pickup_node_id, dropoff_node_id, weight,
    sender_name, sender_phone, sender_address, sender_city, sender_region, sender_country,
    recipient_name, recipient_phone, recipient_address, recipient_city, recipient_region, recipient_country,
    package_description, package_length, package_width, package_height,
    price, deadline, created_at, accepted_at, picked_up_at, delivered_at
) VALUES (
    'del_004', 'TRK-JKL012', 'DELIVERED', 'driver_3',
    NULL, NULL, 1.5,
    'Emma Foe', '+237688990011', 'Bertoua Centre', 'Bertoua', 'Est', 'Cameroun',
    'David Kana', '+237655223344', 'Essos', 'Yaoundé', 'Centre', 'Cameroun',
    'Livres', 20.0, 15.0, 10.0,
    6500, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '23 hours', CURRENT_TIMESTAMP - INTERVAL '22 hours', CURRENT_TIMESTAMP - INTERVAL '20 hours'
) ON CONFLICT (id) DO NOTHING;
