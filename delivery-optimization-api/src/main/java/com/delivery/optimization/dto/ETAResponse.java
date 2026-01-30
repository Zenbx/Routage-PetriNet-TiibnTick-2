package com.delivery.optimization.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ETAResponse {
    private String etaMin;
    private String etaMax;
    private double confidence;
    private double remainingDistance; // in meters
    private KalmanStateDTO kalmanState;

    @Data
    @Builder
    public static class KalmanStateDTO {
        private double distanceCovered;
        private double estimatedSpeed;
        private double trafficBias;
    }
}
