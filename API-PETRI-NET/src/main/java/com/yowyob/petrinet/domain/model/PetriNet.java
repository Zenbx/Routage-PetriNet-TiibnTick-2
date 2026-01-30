package com.yowyob.petrinet.domain.model;

import com.yowyob.petrinet.domain.model.structure.Arc;
import com.yowyob.petrinet.domain.model.structure.Place;
import com.yowyob.petrinet.domain.model.structure.Transition;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.Objects;

/**
 * Represents the Static Model of a Colored Timed Petri Net ($R$).
 * $R = <P, T, Pre, Post, C>$
 * 
 * @author Thomas Djotio Ndié
 * @version V1.0
 * @since 30.09.25
 */
public class PetriNet {
    private final Set<Place> places;
    private final Set<Transition> transitions;
    private final Set<Arc> arcs;

    /**
     * Constructs the Petri Net.
     * Verifies that Places and Transitions are disjoint sets (inherently true by
     * type,
     * but specific ID checks could be added).
     * 
     * @param places      Set of Places.
     * @param transitions Set of Transitions.
     * @param arcs        Set of Arcs.
     */
    public PetriNet(Set<Place> places, Set<Transition> transitions, Set<Arc> arcs) {
        this.places = Collections.unmodifiableSet(new HashSet<>(Objects.requireNonNull(places)));
        this.transitions = Collections.unmodifiableSet(new HashSet<>(Objects.requireNonNull(transitions)));
        this.arcs = Collections.unmodifiableSet(new HashSet<>(Objects.requireNonNull(arcs)));

        // Validation could be added here (e.g. Arc IDs must exist in
        // Places/Transitions)
    }

    public Set<Place> getPlaces() {
        return places;
    }

    public Set<Transition> getTransitions() {
        return transitions;
    }

    public Set<Arc> getArcs() {
        return arcs;
    }

    /**
     * Helper to find a transition by ID.
     */
    public Transition getTransition(String id) {
        return transitions.stream()
                .filter(t -> t.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Transition not found: " + id));
    }
}
