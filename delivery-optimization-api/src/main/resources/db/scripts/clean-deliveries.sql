-- Script pour vider toutes les livraisons et données associées
-- ⚠️ ATTENTION: Cette opération est IRRÉVERSIBLE !

-- 1. Supprimer tous les dépôts de hub (à cause de la FK vers deliveries)
DELETE FROM hub_deposits;

-- 2. Supprimer toutes les livraisons
DELETE FROM deliveries;

-- 3. Réinitialiser les séquences si nécessaire (optionnel)
-- ALTER SEQUENCE IF EXISTS deliveries_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS hub_deposits_id_seq RESTART WITH 1;

-- Vérification finale
SELECT 'hub_deposits' as table_name, COUNT(*) as remaining_rows FROM hub_deposits
UNION ALL
SELECT 'deliveries' as table_name, COUNT(*) as remaining_rows FROM deliveries;
