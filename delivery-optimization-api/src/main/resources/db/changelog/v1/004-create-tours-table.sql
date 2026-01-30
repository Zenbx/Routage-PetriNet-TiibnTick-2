CREATE TABLE drivers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100),
    current_latitude DOUBLE PRECISION,
    current_longitude DOUBLE PRECISION,
    status VARCHAR(20) DEFAULT 'AVAILABLE' -- AVAILABLE, BUSY, OFFLINE
);

CREATE TABLE tours (
    id VARCHAR(50) PRIMARY KEY,
    driver_id VARCHAR(50) REFERENCES drivers(id),
    status VARCHAR(20) DEFAULT 'PLANNED', -- PLANNED, ACTIVE, COMPLETED
    total_cost DOUBLE PRECISION,
    total_distance DOUBLE PRECISION,
    estimated_duration INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tour_stops (
    tour_id VARCHAR(50) REFERENCES tours(id),
    node_id VARCHAR(50) REFERENCES nodes(id),
    stop_order INT,
    stop_type VARCHAR(20), -- PICKUP, DROPOFF, RELAY
    PRIMARY KEY (tour_id, stop_order)
);

CREATE TABLE kalman_states (
    id SERIAL PRIMARY KEY,
    delivery_id VARCHAR(50) REFERENCES deliveries(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    distance_covered DOUBLE PRECISION,
    estimated_speed DOUBLE PRECISION,
    traffic_bias DOUBLE PRECISION,
    variance DOUBLE PRECISION
);
