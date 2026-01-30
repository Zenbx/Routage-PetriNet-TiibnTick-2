package com.delivery.optimization.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TourOptimizationResponse {
    private String tourId;
    private List<String> orderedStops;
    private double totalCost;
    private int estimatedDuration;
    private List<String> relayPointsUsed;
}
