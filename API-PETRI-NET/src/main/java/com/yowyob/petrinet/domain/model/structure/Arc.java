package com.yowyob.petrinet.domain.model.structure;

import java.util.Objects;

/**
 * Represents an Arc in the CTPN.
 * Connects a Place and a Transition.
 * 
 * @author Thomas Djotio Ndié
 * @version V1.0
 * @since 30.09.25
 */
public class Arc {
    public enum Type {
        INPUT, // Place -> Transition (Pre)
        OUTPUT, // Transition -> Place (Post)
        INHIBITOR // Place -o Transition
    }

    private final String place_id;
    private final String transition_id;
    private final Type type;
    private final ArcExpression expression;

    /**
     * Constructs an Arc.
     * 
     * @param place_id      The ID of the connected place.
     * @param transition_id The ID of the connected transition.
     * @param type          The direction/type of the arc.
     * @param expression    The function determining token flow.
     */
    public Arc(String place_id, String transition_id, Type type, ArcExpression expression) {
        this.place_id = Objects.requireNonNull(place_id);
        this.transition_id = Objects.requireNonNull(transition_id);
        this.type = Objects.requireNonNull(type);
        this.expression = Objects.requireNonNull(expression);
    }

    public String getPlaceId() {
        return place_id;
    }

    public String getTransitionId() {
        return transition_id;
    }

    public Type getType() {
        return type;
    }

    public ArcExpression getExpression() {
        return expression;
    }
}
