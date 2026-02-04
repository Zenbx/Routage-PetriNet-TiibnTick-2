-- Liquibase changeset: 017-create-hub-deposits-table
-- Description: Création de la table hub_deposits pour tracker les dépôts de colis aux hubs/points relais

CREATE TABLE IF NOT EXISTS hub_deposits (
    id VARCHAR(255) PRIMARY KEY,
    delivery_id VARCHAR(255) NOT NULL,
    hub_node_id VARCHAR(255) NOT NULL,
    deposited_by_driver_id VARCHAR(255) NOT NULL,
    deposit_time TIMESTAMP NOT NULL,
    pickup_time TIMESTAMP,
    picked_up_by VARCHAR(255),
    pickup_phone VARCHAR(50),
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    storage_location VARCHAR(255),
    deposit_proof TEXT,
    pickup_proof TEXT,
    CONSTRAINT fk_hub_deposit_delivery FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE CASCADE,
    CONSTRAINT fk_hub_deposit_hub FOREIGN KEY (hub_node_id) REFERENCES nodes(id) ON DELETE CASCADE
);

-- Index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_hub_deposits_delivery_id ON hub_deposits(delivery_id);
CREATE INDEX IF NOT EXISTS idx_hub_deposits_hub_node_id ON hub_deposits(hub_node_id);
CREATE INDEX IF NOT EXISTS idx_hub_deposits_status ON hub_deposits(status);
CREATE INDEX IF NOT EXISTS idx_hub_deposits_deposited_by ON hub_deposits(deposited_by_driver_id);
