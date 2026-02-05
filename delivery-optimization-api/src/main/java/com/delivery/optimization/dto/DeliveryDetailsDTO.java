package com.delivery.optimization.dto;

import com.delivery.optimization.domain.Delivery.DeliveryStatus;
import com.delivery.optimization.domain.Delivery.DeliveryType;
import com.delivery.optimization.domain.Delivery.PickupType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO détaillé pour une livraison (vue livreur)
 * Inclut toutes les informations nécessaires pour effectuer la livraison
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryDetailsDTO {

    private String id;
    private String trackingCode;
    private DeliveryStatus status;

    // Timestamps
    private Instant createdAt;
    private Instant acceptedAt;
    private Instant pickedUpAt;
    private Instant deliveredAt;
    private Instant deadline;

    // Sender information
    private String senderName;
    private String senderPhone;
    private String senderAddress;
    private PickupType pickupType;
    private String pickupLocationId;
    private String senderLandmark;
    private LocationDTO pickupLocation; // Coordonnées GPS

    // Recipient information
    private String recipientName;
    private String recipientPhone;
    private String recipientAddress;
    private DeliveryType deliveryType;
    private String deliveryLocationId;
    private String recipientLandmark;
    private LocationDTO deliveryLocation; // Coordonnées GPS

    // Package information
    private String packageDescription;
    private Double weight;
    private Double packageLength;
    private Double packageWidth;
    private Double packageHeight;

    // Pricing
    private Double price;
    private Double distance;

    // Driver info
    private String driverId;
}
