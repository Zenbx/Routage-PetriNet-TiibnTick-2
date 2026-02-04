package com.delivery.optimization.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO pour les requêtes de dépôt de colis au hub
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HubDepositRequest {
    private String deliveryId;
    private String hubNodeId;
    private String driverId;
    private String notes;
    private String storageLocation;
    private String depositProof; // URL ou base64 de la photo/signature
}
