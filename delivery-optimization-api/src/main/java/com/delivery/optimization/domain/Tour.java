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
@Table("tours")
public class Tour {
    @Id
    private String id;
    private String driverId;
    private TourStatus status;
    private Double totalCost;
    private Double totalDistance;
    private Integer estimatedDuration;
    private Instant createdAt;

    public enum TourStatus {
        PLANNED, ACTIVE, COMPLETED
    }
}
