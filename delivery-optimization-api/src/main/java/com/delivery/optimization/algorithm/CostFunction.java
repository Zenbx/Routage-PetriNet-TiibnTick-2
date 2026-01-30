package com.delivery.optimization.algorithm;

import com.delivery.optimization.domain.Arc;
import lombok.Builder;
import lombok.Data;
import org.springframework.stereotype.Component;

@Component
public class CostFunction {

    @Data
    @Builder
    public static class Weights {
        private double alpha; // distance
        private double beta; // time
        private double gamma; // penibility
        private double delta; // weather
        private double eta; // fuel
    }

    /**
     * Section 3.3.1 - Formulation Multi-Critères
     * Calculates the composite cost of an arc based on weighted criteria.
     */
    public double calculate(Arc arc, Weights weights) {
        // In a real scenario, these would be normalized using (val - min) / (max - min)
        // Here we assume standardized inputs for the demo

        return weights.getAlpha() * arc.getDistance()
                + weights.getBeta() * arc.getTravelTime()
                + weights.getGamma() * arc.getPenibility()
                + weights.getDelta() * arc.getWeatherImpact()
                + weights.getEta() * arc.getFuelCost();
    }
}
