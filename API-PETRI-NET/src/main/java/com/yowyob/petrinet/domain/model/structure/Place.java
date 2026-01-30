package com.yowyob.petrinet.domain.model.structure;

import java.util.Objects;

/**
 * Represents a Place in the CTPN ($P$).
 * A place can hold tokens.
 * 
 * @author Thomas Djotio Ndié
 * @version V1.0
 * @since 30.09.25
 */
public class Place {
    private final String id;
    private final String name;

    /**
     * Constructs a new Place.
     * 
     * @param id The unique identifier of the place.
     * @param name The human-readable name of the place.
     */
    public Place(String id, String name) {
        this.id = Objects.requireNonNull(id, "id must not be null");
        this.name = Objects.requireNonNull(name, "name must not be null");
    }

    /**
     * Gets the unique identifier.
     * 
     * @return The id.
     */
    public String getId() {
        return id;
    }

    /**
     * Gets the name.
     * 
     * @return The name.
     */
    public String getName() {
        return name;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Place place = (Place) o;
        return Objects.equals(id, place.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Place{" +
                "id='" + id + '\'' +
                ", name='" + name + '\'' +
                '}';
    }
}
