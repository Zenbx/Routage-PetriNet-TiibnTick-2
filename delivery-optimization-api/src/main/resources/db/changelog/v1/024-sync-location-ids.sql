-- Synchronisation des colonnes de localisation pour les livraisons de test
-- Assure la compatibilité entre les anciens et nouveaux champs
-- Nécessaire pour l'affichage de la carte sur la page de tracking client

UPDATE deliveries 
SET pickup_location_id = pickup_node_id,
    delivery_location_id = dropoff_node_id
WHERE (pickup_location_id IS NULL AND pickup_node_id IS NOT NULL)
   OR (delivery_location_id IS NULL AND dropoff_node_id IS NOT NULL);
