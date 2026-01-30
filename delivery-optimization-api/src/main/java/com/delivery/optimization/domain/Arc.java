package com.delivery.optimization.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("arcs")
public class Arc {
    @Id
    private Long id;
    private String originId;
    private String destinationId;
    private Double distance;
    private Double travelTime;
    private Double penibility;
    private Double weatherImpact;
    private Double fuelCost;
    private Double trafficFactor; // 1.0 = normal, >1.0 = congested
    private Instant lastUpdated;
}
