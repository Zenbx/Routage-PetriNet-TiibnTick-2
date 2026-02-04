package com.delivery.optimization.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Table;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("deliveries")
public class Delivery implements Persistable<String> {
    @Id
    private String id;

    @Transient
    private boolean newEntity;

    // Existing fields (keep for compatibility)
    private String pickupNodeId;
    private String dropoffNodeId;
    private Double weight;
    private Instant deadline;
    private DeliveryStatus status;
    private Instant createdAt;

    // New fields for real logistics application
    private String trackingCode; // Code de suivi unique (ex: TRK-ABC123XYZ)
    private String driverId; // ID du livreur assigné

    // Sender information
    private String senderName;
    private String senderPhone;
    private String senderAddress;
    private PickupType pickupType; // RELAY_POINT ou HOME
    private String pickupLocationId; // ID du point relais ou coordonnées domicile

    // Recipient information
    private String recipientName;
    private String recipientPhone;
    private String recipientAddress;
    private DeliveryType deliveryType; // RELAY_POINT ou HOME
    private String deliveryLocationId; // ID du point relais ou coordonnées domicile

    // Package information
    private String packageDescription;
    private Double packageLength; // cm
    private Double packageWidth; // cm
    private Double packageHeight; // cm

    // Timestamps
    private Instant acceptedAt; // Quand le livreur a accepté
    private Instant pickedUpAt; // Quand le colis a été récupéré
    private Instant deliveredAt; // Quand le colis a été livré

    // Pricing
    private Double price; // Prix de la livraison

    public enum DeliveryStatus {
        PENDING, // En attente d'un livreur
        ASSIGNED, // Assignée à un livreur (ancien)
        ACCEPTED, // Livreur a accepté la livraison
        PICKED_UP, // Colis récupéré
        AT_HUB, // Colis déposé au hub/point relais
        IN_TRANSIT, // En cours de livraison
        DELIVERED, // Livré
        DELAYED, // Retardé
        CANCELLED // Annulé
    }

    public enum PickupType {
        RELAY_POINT, // Récupération au point relais
        HOME // Récupération au domicile
    }

    public enum DeliveryType {
        RELAY_POINT, // Livraison au point relais
        HOME // Livraison au domicile
    }

    // Persistable implementation pour contrôler quand l'entité est considérée comme
    // nouvelle
    @Override
    public String getId() {
        return id;
    }

    @Override
    public boolean isNew() {
        return newEntity || id == null;
    }
}
