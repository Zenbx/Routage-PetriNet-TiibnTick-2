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
public class RerouteResponse {
    private boolean rerouteRequired;
    private String reason;
    private List<String> newPath;
    private double costImprovement;
    private boolean hysteresisMet;
}
