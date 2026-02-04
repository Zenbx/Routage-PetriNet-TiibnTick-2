package com.delivery.optimization.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour la requête de récupération de colis au hub
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HubPickupRequest {
    private String trackingCode;
    private String pickupPhone; // Téléphone du récupérateur pour validation
    private String pickupName; // Nom du récupérateur
    private String pickupProof; // Signature ou photo (base64/URL)
    private String hubId; // ID du hub où se trouve le colis
}
