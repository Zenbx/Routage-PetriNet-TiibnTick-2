CREATE TABLE arcs (
    id SERIAL PRIMARY KEY,
    origin_id VARCHAR(50) REFERENCES nodes(id),
    destination_id VARCHAR(50) REFERENCES nodes(id),
    distance DOUBLE PRECISION NOT NULL, -- km
    travel_time DOUBLE PRECISION NOT NULL, -- seconds
    penibility DOUBLE PRECISION DEFAULT 0.0, -- 0 to 1
    weather_impact DOUBLE PRECISION DEFAULT 0.0, -- 0 to 1
    fuel_cost DOUBLE PRECISION DEFAULT 0.0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_arcs_origin_dest ON arcs(origin_id, destination_id);
