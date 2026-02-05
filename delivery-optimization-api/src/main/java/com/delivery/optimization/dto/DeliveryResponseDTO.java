package com.delivery.optimization.dto;

import com.delivery.optimization.domain.Delivery.DeliveryStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO pour la réponse après création d'une livraison
 * Contient le code de tracking et les informations essentielles
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryResponseDTO {

    private String id;
    private String trackingCode;
    private DeliveryStatus status;
    private Double estimatedPrice;
    private Instant estimatedDeliveryTime;
    private Instant createdAt;
    private Double distance;

    private SenderInfoDTO sender;
    private RecipientInfoDTO recipient;
    private PackageInfoDTO package_;
}
