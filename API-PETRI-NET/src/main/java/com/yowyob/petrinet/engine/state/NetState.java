package com.yowyob.petrinet.engine.state;

import com.yowyob.petrinet.domain.model.color.Token;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Represents the State of a CTPN execution ($M$ and Time).
 * Immutable implementation.
 * 
 * @author Thomas Djotio Ndié
 * @version V1.0
 * @since 30.09.25
 */
public class NetState {
    // Mapping PlaceID -> List of Tokens (Multiset)
    // snake_case for field
    private final Map<String, List<Token<?>>> marking;
    private final long current_time;

    /**
     * Creates an empty initial state at time 0.
     */
    public NetState() {
        this.marking = Collections.emptyMap();
        this.current_time = 0;
    }

    public NetState(long current_time) {
        this.marking = Collections.emptyMap();
        this.current_time = current_time;
    }

    public NetState addToken(String placeId, Token<?> token) {
        Map<String, List<Token<?>>> newMarking = new HashMap<>(this.marking);
        List<Token<?>> currentTokens = new ArrayList<>(newMarking.getOrDefault(placeId, Collections.emptyList()));
        currentTokens.add(token);
        newMarking.put(placeId, currentTokens);
        return new NetState(newMarking, this.current_time);
    }

    /**
     * Constructs a state.
     * 
     * @param marking      The marking map.
     * @param current_time The virtual time.
     */
    public NetState(Map<String, List<Token<?>>> marking, long current_time) {
        // Deep copy of the lists to ensure immutability of this State object
        Map<String, List<Token<?>>> copy = new HashMap<>();
        marking.forEach((k, v) -> copy.put(k, new ArrayList<>(v)));
        this.marking = Collections.unmodifiableMap(copy);
        this.current_time = current_time;
    }

    public long getCurrentTime() {
        return current_time;
    }

    /**
     * Returns tokens in a specific place.
     * 
     * @param placeId The place ID.
     * @return List of tokens (empty if none).
     */
    public List<Token<?>> getTokens(String placeId) {
        return marking.getOrDefault(placeId, Collections.emptyList());
    }

    /**
     * Creates a new State with added tokens.
     */
    public NetState withTokensAdded(String placeId, List<Token<?>> tokens) {
        Map<String, List<Token<?>>> newMarking = new HashMap<>(this.marking);
        List<Token<?>> currentTokens = new ArrayList<>(newMarking.getOrDefault(placeId, Collections.emptyList()));
        currentTokens.addAll(tokens);
        newMarking.put(placeId, currentTokens);
        return new NetState(newMarking, this.current_time);
    }

    /**
     * Creates a new State with removed tokens.
     * 
     * @throws IllegalArgumentException if tokens are not present.
     */
    public NetState withTokensConsumed(String placeId, List<Token<?>> tokensToConsume) {
        Map<String, List<Token<?>>> newMarking = new HashMap<>(this.marking);
        List<Token<?>> currentTokens = new ArrayList<>(newMarking.getOrDefault(placeId, Collections.emptyList()));

        for (Token<?> t : tokensToConsume) {
            if (!currentTokens.remove(t)) {
                // In CTPN, token equality usually includes Color + Timestamp.
                // If we need strict object identity or just color equality, it depends on
                // 'Token.equals'.
                // Record 'Token' implements equals based on all fields.
                throw new IllegalArgumentException("Token not found in place " + placeId + ": " + t);
            }
        }

        if (currentTokens.isEmpty()) {
            newMarking.remove(placeId);
        } else {
            newMarking.put(placeId, currentTokens);
        }
        return new NetState(newMarking, this.current_time);
    }

    /**
     * Returns a new state with advanced time.
     */
    public NetState advanceTime(long delta) {
        return new NetState(this.marking, this.current_time + delta);
    }

    @Override
    public String toString() {
        return "NetState{time=" + current_time + ", marking=" + marking + "}";
    }
}
