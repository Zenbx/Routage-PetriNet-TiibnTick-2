package com.yowyob.petrinet.domain.model.color;

import java.time.Instant;

/**
 * Represents a Token in the Colored Timed Petri Net (CTPN).
 * Corresponds to an element of the multiset M(p).
 * <p>
 * This record wraps the 'value' (Color) and the 'timestamp' (Creation Time).
 * 
 * @param <T> The type of the value (Color) carried by the token.
 * 
 * @author Thomas Djotio Ndié
 * @version V1.0
 * @since 30.09.25
 */
public record Token<T>(
    T value,
    long creation_timestamp
) {
    /**
     * Creates a new token with the given value and the current timestamp.
     * @param value The value (Color) of the token.
     * @param current_time The current virtual time.
     * @return A new Token instance.
     */
    public static <T> Token<T> create(T value, long current_time) {
        return new Token<>(value, current_time);
    }
}
