package com.delivery.optimization.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.relational.core.mapping.Table;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("tour_stops")
public class TourStop {
    private String tourId;
    private String nodeId;
    private Integer stopOrder;
    private StopType stopType;

    public enum StopType {
        PICKUP, DROPOFF, RELAY
    }
}
