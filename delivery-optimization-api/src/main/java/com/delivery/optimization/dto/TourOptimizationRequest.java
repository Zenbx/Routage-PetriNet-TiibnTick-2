package com.delivery.optimization.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TourOptimizationRequest {
    private String driverId;
    private List<DeliveryRequest> deliveries;
    private int vehicleCapacity;
    private boolean useRelayPoints;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeliveryRequest {
        private String id;
        private String pickupLocation;
        private String dropoffLocation;
        private double weight;
        private Instant deadline;
    }
}
