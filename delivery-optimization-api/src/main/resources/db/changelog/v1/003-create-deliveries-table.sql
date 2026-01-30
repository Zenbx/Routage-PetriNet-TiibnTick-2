CREATE TABLE deliveries (
    id VARCHAR(50) PRIMARY KEY,
    pickup_node_id VARCHAR(50) REFERENCES nodes(id),
    dropoff_node_id VARCHAR(50) REFERENCES nodes(id),
    weight DOUBLE PRECISION,
    deadline TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, ASSIGNED, PICKED_UP, IN_TRANSIT, DELIVERED, DELAYED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_deliveries_status ON deliveries(status);
