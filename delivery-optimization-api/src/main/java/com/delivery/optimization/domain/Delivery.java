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
@Table("deliveries")
public class Delivery {
    @Id
    private String id;
    private String pickupNodeId;
    private String dropoffNodeId;
    private Double weight;
    private Instant deadline;
    private DeliveryStatus status;
    private Instant createdAt;

    public enum DeliveryStatus {
        PENDING, ASSIGNED, PICKED_UP, IN_TRANSIT, DELIVERED, DELAYED
    }
}
