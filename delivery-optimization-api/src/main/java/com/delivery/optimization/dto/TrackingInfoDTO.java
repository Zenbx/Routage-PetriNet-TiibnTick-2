package com.delivery.optimization.dto;

import com.delivery.optimization.domain.Delivery.DeliveryStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO pour les informations publiques de tracking
 * Informations limitées pour la consultation publique par code de tracking
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrackingInfoDTO {

    private String trackingCode;
    private DeliveryStatus status;

    // Timestamps
    private Instant createdAt;
    private Instant acceptedAt;
    private Instant pickedUpAt;
    private Instant deliveredAt;

    // Informations limitées (sans numéros de téléphone)
    private String senderName;
    private String recipientName;
    private String recipientAddress;
    private String recipientLandmark; // Lieu-dit destinataire

    // Informations de livraison
    private String currentLocation; // Position actuelle du livreur
    private Instant estimatedDeliveryTime;
    private Double progressPercentage;

    // Coordonnées GPS pour la carte
    private LocationDTO pickupLocation; // Coordonnées du point de récupération
    private LocationDTO deliveryLocation; // Coordonnées du point de livraison
    private LocationDTO driverLocation; // Position actuelle du livreur (si en cours)

    // Package info
    private String packageDescription;
    private Double weight;
}
