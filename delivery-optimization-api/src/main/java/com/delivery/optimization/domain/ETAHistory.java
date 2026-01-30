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
@Table("eta_history")
public class ETAHistory {
    @Id
    private Long id;
    private String deliveryId;
    private Instant estimatedEta;
    private Instant actualArrival;
    private Double errorMargin;
    private Instant timestamp;
}
