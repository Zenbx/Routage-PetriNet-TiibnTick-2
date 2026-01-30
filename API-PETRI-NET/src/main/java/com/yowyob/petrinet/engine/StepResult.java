package com.yowyob.petrinet.engine;

import com.yowyob.petrinet.domain.model.color.Token;
import com.yowyob.petrinet.engine.state.NetState;
import java.util.List;

/**
 * Result of a transition firing step.
 * Includes the new state and details for observability.
 */
public record StepResult(
        NetState newState,
        List<Token<?>> consumedTokens,
        List<Token<?>> producedTokens) {
}
