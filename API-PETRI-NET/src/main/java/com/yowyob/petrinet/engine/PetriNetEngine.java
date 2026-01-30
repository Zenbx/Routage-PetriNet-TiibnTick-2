package com.yowyob.petrinet.engine;

import com.yowyob.petrinet.domain.model.PetriNet;
import com.yowyob.petrinet.domain.model.color.Token;
import com.yowyob.petrinet.domain.model.structure.Arc;
import com.yowyob.petrinet.domain.model.structure.Transition;
import com.yowyob.petrinet.engine.state.NetState;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Execution Engine for CTPN.
 * Stateless service that computes next states.
 * 
 * @author Thomas Djotio Ndié
 * @version V1.1
 * @since 30.09.25
 */
public class PetriNetEngine {

    /**
     * Fires a transition with a specific binding.
     * 
     * @param net          The Petri Net model.
     * @param currentState The current state ($M$, Time).
     * @param transitionId The ID of the transition to fire.
     * @param binding      The color/binding object for arc expressions.
     * @return The StepResult containing new state and token details.
     * @throws IllegalArgumentException If firing is invalid.
     */
    public StepResult fireTransition(PetriNet net, NetState currentState, String transitionId, Object binding) {
        Transition t = net.getTransition(transitionId);

        List<Arc> inputArcs = net.getArcs().stream()
                .filter(a -> a.getTransitionId().equals(transitionId) && a.getType() == Arc.Type.INPUT)
                .toList();

        List<Arc> outputArcs = net.getArcs().stream()
                .filter(a -> a.getTransitionId().equals(transitionId) && a.getType() == Arc.Type.OUTPUT)
                .toList();

        NetState nextState = currentState;
        List<Token<?>> allConsumed = new ArrayList<>();
        long maxTokenTime = 0;

        // 1. Consume Tokens
        for (Arc arc : inputArcs) {
            List<Token<?>> requiredTokensDocs = arc.getExpression().evaluate(binding);
            String placeId = arc.getPlaceId();
            List<Token<?>> availableTokens = nextState.getTokens(placeId);

            for (Token<?> req : requiredTokensDocs) {
                Token<?> match = availableTokens.stream()
                        .filter(avail -> avail.value().equals(req.value()))
                        .findFirst()
                        .orElseThrow(() -> new IllegalArgumentException(
                                "Missing token in place " + placeId + ": " + req.value()));

                if (match.creation_timestamp() > maxTokenTime) {
                    maxTokenTime = match.creation_timestamp();
                }

                nextState = nextState.withTokensConsumed(placeId, List.of(match));
                allConsumed.add(match);
                // Refresh list for next iteration
                availableTokens = nextState.getTokens(placeId);
            }
        }

        // 2. Verify Time
        if (currentState.getCurrentTime() < maxTokenTime + t.getMinFiringDelay()) {
            throw new IllegalArgumentException("Time constraint violation: Transition " + transitionId + " not ready.");
        }

        // 3. Produce Tokens
        long productionTime = currentState.getCurrentTime();
        List<Token<?>> allProduced = new ArrayList<>();

        for (Arc arc : outputArcs) {
            List<Token<?>> tokensToProduce = arc.getExpression().evaluate(binding);
            List<Token<?>> timedTokens = tokensToProduce.stream()
                    .map(tok -> Token.create(tok.value(), productionTime))
                    .collect(Collectors.toList());

            nextState = nextState.withTokensAdded(arc.getPlaceId(), timedTokens);
            allProduced.addAll(timedTokens);
        }

        return new StepResult(nextState, allConsumed, allProduced);
    }
}
