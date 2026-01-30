CREATE TABLE IF NOT EXISTS petri_nets (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    current_net_time BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS petri_places (
    id SERIAL PRIMARY KEY,
    net_id UUID NOT NULL REFERENCES petri_nets(id) ON DELETE CASCADE,
    place_id VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    UNIQUE(net_id, place_id)
);

CREATE TABLE IF NOT EXISTS petri_transitions (
    id SERIAL PRIMARY KEY,
    net_id UUID NOT NULL REFERENCES petri_nets(id) ON DELETE CASCADE,
    transition_id VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    min_firing_delay BIGINT NOT NULL DEFAULT 0,
    max_firing_delay BIGINT NOT NULL DEFAULT 1000,
    UNIQUE(net_id, transition_id)
);

CREATE TABLE IF NOT EXISTS petri_arcs (
    id SERIAL PRIMARY KEY,
    net_id UUID NOT NULL REFERENCES petri_nets(id) ON DELETE CASCADE,
    place_id VARCHAR(255) NOT NULL,
    transition_id VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL, -- INPUT, OUTPUT, INHIBITOR
    weight INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS petri_tokens (
    id SERIAL PRIMARY KEY,
    net_id UUID NOT NULL REFERENCES petri_nets(id) ON DELETE CASCADE,
    place_id VARCHAR(255) NOT NULL,
    value JSONB,
    creation_timestamp BIGINT NOT NULL
);
