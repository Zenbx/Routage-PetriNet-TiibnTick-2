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
@Table("drivers")
public class Driver {
    @Id
    private String id;
    private String name;
    private Double currentLatitude;
    private Double currentLongitude;
    private DriverStatus status;

    public enum DriverStatus {
        AVAILABLE, BUSY, OFFLINE
    }
}
