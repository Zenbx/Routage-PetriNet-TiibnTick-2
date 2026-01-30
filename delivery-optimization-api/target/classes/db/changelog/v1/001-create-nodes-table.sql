CREATE TABLE nodes (
    id VARCHAR(50) PRIMARY KEY,
    type VARCHAR(20) NOT NULL, -- CLIENT, RELAY, DEPOT
    name VARCHAR(100),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    capacity INT DEFAULT 0,
    current_occupancy INT DEFAULT 0
);

CREATE INDEX idx_nodes_type ON nodes(type);
