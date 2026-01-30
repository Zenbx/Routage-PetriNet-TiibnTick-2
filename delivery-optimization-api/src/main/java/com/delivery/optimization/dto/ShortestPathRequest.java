package com.delivery.optimization.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShortestPathRequest {
    private String origin;
    private String destination;
    private Instant timestamp;
    private CostWeights costWeights;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CostWeights {
        private double alpha;
        private double beta;
        private double gamma;
        private double delta;
        private double eta;
    }
}
