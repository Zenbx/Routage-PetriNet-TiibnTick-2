-- Seed de données de test pour les livraisons logistiques
-- Génère des livraisons réalistes avec tracking codes, expéditeurs, destinataires

-- Livraison 1: PENDING (disponible pour les livreurs)
INSERT INTO deliveries (
    id, tracking_code, status,
    pickup_node_id, dropoff_node_id, weight,
    sender_name, sender_phone, sender_address, pickup_type, pickup_location_id,
    recipient_name, recipient_phone, recipient_address, delivery_type, delivery_location_id,
    package_description, package_length, package_width, package_height,
    price, deadline, created_at
) VALUES (
    'del_logistics_001',
    'TRK-ABCD123XY',
    'PENDING',
    'node_1', 'node_5', 2.5,
    'Marie Dubois', '+33612345678', '15 Rue de la Paix, Paris 75001', 'RELAY_POINT', 'node_1',
    'Jean Martin', '+33623456789', '42 Avenue des Champs, Lyon 69001', 'HOME', 'node_5',
    'Colis fragile - Électronique', 30.0, 20.0, 15.0,
    12.50, CURRENT_TIMESTAMP + INTERVAL '2 days', CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- Livraison 2: PENDING (poids lourd)
INSERT INTO deliveries (
    id, tracking_code, status,
    pickup_node_id, dropoff_node_id, weight,
    sender_name, sender_phone, sender_address, pickup_type, pickup_location_id,
    recipient_name, recipient_phone, recipient_address, delivery_type, delivery_location_id,
    package_description, package_length, package_width, package_height,
    price, deadline, created_at
) VALUES (
    'del_logistics_002',
    'TRK-EFGH456ZA',
    'PENDING',
    'node_2', 'node_8', 8.0,
    'Sophie Laurent', '+33634567890', '23 Boulevard Victor Hugo, Marseille', 'HOME', 'node_2',
    'Pierre Durand', '+33645678901', '67 Rue du Commerce, Toulouse', 'RELAY_POINT', 'node_8',
    'Livres et documents', 45.0, 35.0, 25.0,
    18.00, CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '2 hours'
) ON CONFLICT (id) DO NOTHING;

-- Livraison 3: ACCEPTED (assignée à driver_1)
INSERT INTO deliveries (
    id, tracking_code, status, driver_id,
    pickup_node_id, dropoff_node_id, weight,
    sender_name, sender_phone, sender_address, pickup_type, pickup_location_id,
    recipient_name, recipient_phone, recipient_address, delivery_type, delivery_location_id,
    package_description, package_length, package_width, package_height,
    price, deadline, created_at, accepted_at
) VALUES (
    'del_logistics_003',
    'TRK-IJKL789BC',
    'ACCEPTED',
    'driver_1',
    'node_3', 'node_7', 1.2,
    'Lucas Bernard', '+33656789012', '89 Place de la Bastille, Paris', 'RELAY_POINT', 'node_3',
    'Emma Petit', '+33667890123', '12 Rue Nationale, Lille', 'HOME', 'node_7',
    'Vêtements', 25.0, 20.0, 10.0,
    9.50, CURRENT_TIMESTAMP + INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP - INTERVAL '30 minutes'
) ON CONFLICT (id) DO NOTHING;

-- Livraison 4: PICKED_UP (en cours de récupération)
INSERT INTO deliveries (
    id, tracking_code, status, driver_id,
    pickup_node_id, dropoff_node_id, weight,
    sender_name, sender_phone, sender_address, pickup_type, pickup_location_id,
    recipient_name, recipient_phone, recipient_address, delivery_type, delivery_location_id,
    package_description, package_length, package_width, package_height,
    price, deadline, created_at, accepted_at, picked_up_at
) VALUES (
    'del_logistics_004',
    'TRK-MNOP012DE',
    'PICKED_UP',
    'driver_2',
    'node_4', 'node_6', 3.5,
    'Camille Rousseau', '+33678901234', '34 Avenue Foch, Nice', 'HOME', 'node_4',
    'Thomas Leroy', '+33689012345', '78 Rue Gambetta, Bordeaux', 'RELAY_POINT', 'node_6',
    'Équipement sportif', 50.0, 40.0, 30.0,
    15.00, CURRENT_TIMESTAMP + INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '3 hours', CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '1 hour'
) ON CONFLICT (id) DO NOTHING;

-- Livraison 5: IN_TRANSIT (en cours de livraison)
INSERT INTO deliveries (
    id, tracking_code, status, driver_id,
    pickup_node_id, dropoff_node_id, weight,
    sender_name, sender_phone, sender_address, pickup_type, pickup_location_id,
    recipient_name, recipient_phone, recipient_address, delivery_type, delivery_location_id,
    package_description, package_length, package_width, package_height,
    price, deadline, created_at, accepted_at, picked_up_at
) VALUES (
    'del_logistics_005',
    'TRK-QRST345FG',
    'IN_TRANSIT',
    'driver_1',
    'node_1', 'node_9', 5.0,
    'Chloé Moreau', '+33690123456', '56 Cours Lafayette, Lyon', 'RELAY_POINT', 'node_1',
    'Hugo Simon', '+33601234567', '91 Rue de Rivoli, Paris', 'HOME', 'node_9',
    'Matériel informatique', 35.0, 30.0, 20.0,
    14.50, CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '5 hours', CURRENT_TIMESTAMP - INTERVAL '4 hours', CURRENT_TIMESTAMP - INTERVAL '3 hours'
) ON CONFLICT (id) DO NOTHING;

-- Livraison 6: DELIVERED (terminée)
INSERT INTO deliveries (
    id, tracking_code, status, driver_id,
    pickup_node_id, dropoff_node_id, weight,
    sender_name, sender_phone, sender_address, pickup_type, pickup_location_id,
    recipient_name, recipient_phone, recipient_address, delivery_type, delivery_location_id,
    package_description, package_length, package_width, package_height,
    price, deadline, created_at, accepted_at, picked_up_at, delivered_at
) VALUES (
    'del_logistics_006',
    'TRK-UVWX678HI',
    'DELIVERED',
    'driver_3',
    'node_2', 'node_4', 1.8,
    'Léa Fournier', '+33612345678', '23 Boulevard Haussmann, Paris', 'HOME', 'node_2',
    'Noah Girard', '+33623456789', '45 Avenue Jean Jaurès, Nantes', 'RELAY_POINT', 'node_4',
    'Cosmétiques', 20.0, 15.0, 10.0,
    10.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '23 hours', CURRENT_TIMESTAMP - INTERVAL '22 hours', CURRENT_TIMESTAMP - INTERVAL '20 hours'
) ON CONFLICT (id) DO NOTHING;

-- Livraison 7: PENDING (urgente)
INSERT INTO deliveries (
    id, tracking_code, status,
    pickup_node_id, dropoff_node_id, weight,
    sender_name, sender_phone, sender_address, pickup_type, pickup_location_id,
    recipient_name, recipient_phone, recipient_address, delivery_type, delivery_location_id,
    package_description, package_length, package_width, package_height,
    price, deadline, created_at
) VALUES (
    'del_logistics_007',
    'TRK-YZAB901JK',
    'PENDING',
    'node_5', 'node_3', 0.5,
    'Inès Garnier', '+33634567890', '12 Rue Montmartre, Paris', 'RELAY_POINT', 'node_5',
    'Louis Faure', '+33645678901', '89 Place Bellecour, Lyon', 'HOME', 'node_3',
    'Documents urgents', 10.0, 10.0, 5.0,
    8.00, CURRENT_TIMESTAMP + INTERVAL '6 hours', CURRENT_TIMESTAMP - INTERVAL '10 minutes'
) ON CONFLICT (id) DO NOTHING;

-- Livraison 8: PENDING (gros colis)
INSERT INTO deliveries (
    id, tracking_code, status,
    pickup_node_id, dropoff_node_id, weight,
    sender_name, sender_phone, sender_address, pickup_type, pickup_location_id,
    recipient_name, recipient_phone, recipient_address, delivery_type, delivery_location_id,
    package_description, package_length, package_width, package_height,
    price, deadline, created_at
) VALUES (
    'del_logistics_008',
    'TRK-CDEF234LM',
    'PENDING',
    'node_6', 'node_2', 12.0,
    'Manon Blanc', '+33656789012', '67 Avenue Montaigne, Paris', 'HOME', 'node_6',
    'Gabriel Chevalier', '+33667890123', '34 Cours Mirabeau, Marseille', 'RELAY_POINT', 'node_2',
    'Meubles démontés', 80.0, 60.0, 40.0,
    25.00, CURRENT_TIMESTAMP + INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '30 minutes'
) ON CONFLICT (id) DO NOTHING;

-- Commenter les statistiques
SELECT
    status,
    COUNT(*) as count
FROM deliveries
WHERE id LIKE 'del_logistics_%'
GROUP BY status
ORDER BY status;
