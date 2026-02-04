package com.delivery.optimization.dto;

import com.delivery.optimization.domain.HubDeposit;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO pour les réponses de dépôt de colis au hub
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HubDepositResponse {
    private String depositId;
    private String deliveryId;
    private String trackingCode;
    private String hubNodeId;
    private String hubName;
    private String hubAddress;
    private HubDeposit.DepositStatus status;
    private Instant depositTime;
    private String storageLocation;
    private String message;
}
