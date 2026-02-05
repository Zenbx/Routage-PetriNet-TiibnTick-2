-- Ajout de la colonne geometry pour stocker le tracé réel des routes (waypoints)
ALTER TABLE arcs ADD COLUMN geometry TEXT;

COMMENT ON COLUMN arcs.geometry IS 'Liste de points [lat,lng] séparés par des points-virgules, ou format Polyline encodé';
