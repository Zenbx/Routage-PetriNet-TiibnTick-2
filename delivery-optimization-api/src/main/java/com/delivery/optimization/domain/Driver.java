package com.delivery.optimization.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("drivers")
public class Driver implements Persistable<String> {
    @Id
    private String id;
    private String name;
    private String email;
    private String password;
    private String phone;
    private String vehicleType;
    private String licensePlate;
    private Double currentLatitude;
    private Double currentLongitude;
    private DriverStatus status;
    private Instant createdAt;

    @Transient
    @Builder.Default
    private boolean newEntity = false;

    @Override
    public boolean isNew() {
        return newEntity || createdAt == null;
    }

    public enum DriverStatus {
        AVAILABLE, BUSY, OFFLINE
    }

    public enum VehicleType {
        MOTO, VOITURE, VELO, CAMIONNETTE
    }
}
