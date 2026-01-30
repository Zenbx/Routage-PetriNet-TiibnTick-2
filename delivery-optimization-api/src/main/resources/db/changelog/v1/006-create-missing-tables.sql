CREATE TABLE relay_points (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    capacity INT DEFAULT 0,
    current_occupancy INT DEFAULT 0
);

CREATE TABLE eta_history (
    id SERIAL PRIMARY KEY,
    delivery_id VARCHAR(50) REFERENCES deliveries(id),
    estimated_eta TIMESTAMP WITH TIME ZONE,
    actual_arrival TIMESTAMP WITH TIME ZONE,
    error_margin DOUBLE PRECISION,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reroute_events (
    id SERIAL PRIMARY KEY,
    delivery_id VARCHAR(50) REFERENCES deliveries(id),
    reason VARCHAR(255),
    old_path_cost DOUBLE PRECISION,
    new_path_cost DOUBLE PRECISION,
    hysteresis_met BOOLEAN,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
