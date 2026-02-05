-- Ajout de Points Relais supplémentaires dans les grandes villes du Cameroun
-- Structure: id, type, name, latitude, longitude, capacity, current_occupancy

-- YAOUNDE (Dense Network for Testing)
INSERT INTO nodes (id, type, name, latitude, longitude, capacity, current_occupancy)
VALUES ('RELAY_YDE_CENTRE_VILLE', 'RELAY', 'Point Relais Centre-Ville (Yaoundé)', 3.8667, 11.5167, 100, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO nodes (id, type, name, latitude, longitude, capacity, current_occupancy)
VALUES ('RELAY_YDE_BASTOS', 'RELAY', 'Point Relais Bastos (Yaoundé)', 3.8833, 11.5167, 80, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO nodes (id, type, name, latitude, longitude, capacity, current_occupancy)
VALUES ('RELAY_YDE_MESSASSI', 'RELAY', 'Point Relais Messassi (Yaoundé)', 3.9167, 11.5333, 50, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO nodes (id, type, name, latitude, longitude, capacity, current_occupancy)
VALUES ('RELAY_YDE_MVAN', 'RELAY', 'Point Relais Mvan (Gare)', 3.8167, 11.5167, 150, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO nodes (id, type, name, latitude, longitude, capacity, current_occupancy)
VALUES ('RELAY_YDE_ETOUDI', 'RELAY', 'Point Relais Etoudi', 3.9000, 11.5167, 70, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO nodes (id, type, name, latitude, longitude, capacity, current_occupancy)
VALUES ('RELAY_YDE_MENDONG', 'RELAY', 'Point Relais Mendong', 3.8333, 11.4833, 60, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO nodes (id, type, name, latitude, longitude, capacity, current_occupancy)
VALUES ('RELAY_YDE_NSAM', 'RELAY', 'Point Relais Nsam (SCDP)', 3.8167, 11.5000, 100, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO nodes (id, type, name, latitude, longitude, capacity, current_occupancy)
VALUES ('RELAY_YDE_NGOUSSO', 'RELAY', 'Point Relais Ngousso (Hôpital)', 3.8833, 11.5500, 50, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO nodes (id, type, name, latitude, longitude, capacity, current_occupancy)
VALUES ('RELAY_YDE_BIYEM_ASSI', 'RELAY', 'Point Relais Biyem-Assi', 3.8333, 11.4833, 90, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO nodes (id, type, name, latitude, longitude, capacity, current_occupancy)
VALUES ('RELAY_YDE_EKOUNOU', 'RELAY', 'Point Relais Ekounou', 3.8333, 11.5333, 60, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO nodes (id, type, name, latitude, longitude, capacity, current_occupancy)
VALUES ('RELAY_YDE_DAMAS', 'RELAY', 'Point Relais Damas', 3.8167, 11.4833, 40, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO nodes (id, type, name, latitude, longitude, capacity, current_occupancy)
VALUES ('RELAY_YDE_MADAGASCAR', 'RELAY', 'Point Relais Madagascar', 3.8667, 11.4833, 50, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO nodes (id, type, name, latitude, longitude, capacity, current_occupancy)
VALUES ('RELAY_YDE_SOBUM', 'RELAY', 'Point Relais Omnisports', 3.8833, 11.5333, 80, 0)
ON CONFLICT (id) DO NOTHING;

-- DOUALA
INSERT INTO nodes (id, type, name, latitude, longitude, capacity, current_occupancy)
VALUES ('RELAY_DLA_AKWA', 'RELAY', 'Point Relais Akwa (Douala)', 4.0500, 9.7000, 120, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO nodes (id, type, name, latitude, longitude, capacity, current_occupancy)
VALUES ('RELAY_DLA_BONAPRISO', 'RELAY', 'Point Relais Bonapriso (Douala)', 4.0333, 9.6833, 90, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO nodes (id, type, name, latitude, longitude, capacity, current_occupancy)
VALUES ('RELAY_DLA_LOGPOM', 'RELAY', 'Point Relais Logpom (Douala)', 4.0667, 9.7667, 60, 0)
ON CONFLICT (id) DO NOTHING;

-- BAFOUSSAM
INSERT INTO nodes (id, type, name, latitude, longitude, capacity, current_occupancy)
VALUES ('RELAY_BAF_CENTRE', 'RELAY', 'Point Relais Bafoussam Centre', 5.4833, 10.4167, 70, 0)
ON CONFLICT (id) DO NOTHING;

-- GAROUA
INSERT INTO nodes (id, type, name, latitude, longitude, capacity, current_occupancy)
VALUES ('RELAY_GAR_CENTRE', 'RELAY', 'Point Relais Garoua Centre', 9.3000, 13.4000, 50, 0)
ON CONFLICT (id) DO NOTHING;

-- BAMENDA
INSERT INTO nodes (id, type, name, latitude, longitude, capacity, current_occupancy)
VALUES ('RELAY_BAM_CENTRE', 'RELAY', 'Point Relais Bamenda Centre', 5.9667, 10.1500, 60, 0)
ON CONFLICT (id) DO NOTHING;

-- KRIBI
INSERT INTO nodes (id, type, name, latitude, longitude, capacity, current_occupancy)
VALUES ('RELAY_KRI_COTIERE', 'RELAY', 'Point Relais Kribi Côtière', 2.9333, 9.9167, 40, 0)
ON CONFLICT (id) DO NOTHING;

-- DSCHANG
INSERT INTO nodes (id, type, name, latitude, longitude, capacity, current_occupancy)
VALUES ('RELAY_DSCH_UNIV', 'RELAY', 'Point Relais Dschang Université', 5.4500, 10.0667, 40, 0)
ON CONFLICT (id) DO NOTHING;

-- BUEA
INSERT INTO nodes (id, type, name, latitude, longitude, capacity, current_occupancy)
VALUES ('RELAY_BUEA_MOUNTAIN', 'RELAY', 'Point Relais Buea Road', 4.1500, 9.2333, 50, 0)
ON CONFLICT (id) DO NOTHING;
