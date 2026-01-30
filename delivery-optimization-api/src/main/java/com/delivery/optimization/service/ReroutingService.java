package com.delivery.optimization.service;

import com.delivery.optimization.algorithm.CostFunction;
import com.delivery.optimization.domain.Arc;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReroutingService {

    private final ShortestPathService shortestPathService;

    // Section 3.7.1 - Critère de Déclenchement du Reroutage (Hystérésis)
    private static final double EPSILON_FACTOR = 0.15; // 15% of initial cost
    private static final double DELTA_COGNITIF = 1.0;
    private static final double DELTA_DEMI_TOUR = 1.0;
    private static final double C_SWITCH = DELTA_COGNITIF + DELTA_DEMI_TOUR;

    /**
     * Checks if a rerouting is required based on hysteresis criteria from Chapter
     * 3.7.1.
     * C(p_current, t) > C(p_new, t) + ε_hysteresis + C_switch
     * ε_hysteresis = 0.15 * C(p_current, t0)
     */
    public boolean isRerouteJustified(double currentPathRemainderCost, double newPathCost, double initialPathCost) {
        double epsilonHysteresis = EPSILON_FACTOR * initialPathCost;
        return currentPathRemainderCost > (newPathCost + epsilonHysteresis + C_SWITCH);
    }

    public double getHysteresisThreshold(double initialPathCost) {
        return (EPSILON_FACTOR * initialPathCost) + C_SWITCH;
    }
}
