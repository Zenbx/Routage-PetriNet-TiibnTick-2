package com.delivery.optimization.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("relay_points")
public class RelayPoint {
    @Id
    private String id;
    private String name;
    private Integer capacity;
    private Integer currentOccupancy;
    private Double latitude;
    private Double longitude;
}
