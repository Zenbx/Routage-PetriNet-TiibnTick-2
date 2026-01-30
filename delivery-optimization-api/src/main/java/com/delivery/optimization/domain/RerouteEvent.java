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
@Table("reroute_events")
public class RerouteEvent {
    @Id
    private Long id;
    private String deliveryId;
    private String reason;
    private Double oldPathCost;
    private Double newPathCost;
    private Boolean hysteresisMet;
    private Instant timestamp;
}
