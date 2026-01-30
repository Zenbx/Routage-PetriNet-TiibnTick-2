package com.delivery.optimization.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShortestPathResponse {
    private List<String> path;
    private double totalCost;
    private Map<String, Double> costBreakdown;
    private double estimatedTime;
    private double distance;
}
