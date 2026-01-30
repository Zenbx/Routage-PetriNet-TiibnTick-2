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
public class ETAUpdateRequest {
    private Position currentPosition;
    private double currentSpeed;
    private double distanceCovered;
    private double totalDistance;
    private Instant timestamp;

    @Data
    @AllArgsConstructor
    public static class Position {
        private double lat;
        private double lon;
    }
}
