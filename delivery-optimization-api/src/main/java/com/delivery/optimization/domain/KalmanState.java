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
@Table("kalman_states")
public class KalmanState {
    @Id
    private Long id;
    private String deliveryId;
    private Instant timestamp;
    private Double distanceCovered; // percentage (0..1)
    private Double totalDistance; // actual geometry distance
    private Double estimatedSpeed;
    private Double trafficBias;
    private Double variance;
}
