package com.yowyob.petrinet.domain.model.structure;

import java.util.Objects;

/**
 * Represents a Transition in the CTPN ($T$).
 * Includes time constraints: [min_firing_delay, max_firing_delay].
 * 
 * @author Thomas Djotio Ndié
 * @version V1.0
 * @since 30.09.25
 */
public class Transition {
    private final String id;
    private final String name;
    private final long min_firing_delay;
    private final long max_firing_delay;

    /**
     * Constructs a new Transition.
     * 
     * @param id               Unique identifier.
     * @param name             Human readable name.
     * @param min_firing_delay Minimum delay before firing after enablement.
     * @param max_firing_delay Maximum delay (can be Long.MAX_VALUE for infinity).
     */
    public Transition(String id, String name, long min_firing_delay, long max_firing_delay) {
        this.id = Objects.requireNonNull(id, "id must not be null");
        this.name = Objects.requireNonNull(name, "name must not be null");
        if (min_firing_delay < 0)
            throw new IllegalArgumentException("min_firing_delay must be >= 0");
        if (max_firing_delay < min_firing_delay)
            throw new IllegalArgumentException("max_firing_delay must be >= min_firing_delay");

        this.min_firing_delay = min_firing_delay;
        this.max_firing_delay = max_firing_delay;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public long getMinFiringDelay() {
        return min_firing_delay;
    }

    public long getMaxFiringDelay() {
        return max_firing_delay;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        Transition that = (Transition) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
