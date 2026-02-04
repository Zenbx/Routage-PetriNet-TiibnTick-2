package com.delivery.optimization.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO pour la réponse de récupération de colis au hub
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HubPickupResponse {
    private String depositId;
    private String deliveryId;
    private String trackingCode;
    private String hubName;
    private Instant pickupTime;
    private String pickedUpBy;
    private String message;
    private boolean success;
}
