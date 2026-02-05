-- Correction des livraisons de test pour qu'elles aient des IDs de nœuds valides
-- Cela permet l'affichage de la carte et du tracé d'itinéraire

-- del_001 (Marie Kamga, Bastos -> Paul Njiki, Akwa)
UPDATE deliveries 
SET pickup_node_id = 'RELAY_YDE_BASTOS', 
    dropoff_node_id = 'RELAY_DLA_AKWA' 
WHERE id = 'del_001';

-- del_002 (Jean Mballa, Melen -> Alice Nkomo, Bonanjo)
UPDATE deliveries 
SET pickup_node_id = 'RELAY_YDE_CENTRE_VILLE', 
    dropoff_node_id = 'RELAY_DLA_BONAPRISO' 
WHERE id = 'del_002';

-- del_003 (Sophie Ndam, Dschang -> Thomas Biya, Nlongkak)
UPDATE deliveries 
SET pickup_node_id = 'RELAY_DSCH_UNIV', 
    dropoff_node_id = 'RELAY_YDE_MESSASSI' 
WHERE id = 'del_003';
