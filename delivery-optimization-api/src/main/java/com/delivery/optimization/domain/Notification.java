package com.delivery.optimization.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;

/**
 * Entité pour les notifications client
 * Stocke toutes les notifications envoyées aux clients concernant leurs
 * livraisons
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("notifications")
public class Notification {

    @Id
    private String id;

    @Transient
    private boolean newEntity = true;

    private String deliveryId;
    private String trackingCode;
    private String recipientPhone; // Pour cibler le destinataire

    private NotificationType type;
    private String title;
    private String message;

    private Instant createdAt;
    private Instant sentAt;
    private NotificationStatus status;

    private String metadata; // JSON additionnelle (optionnel)

    public enum NotificationType {
        DELIVERY_CREATED, // Livraison créée
        DRIVER_ASSIGNED, // Livreur assigné
        PACKAGE_PICKED_UP, // Colis récupéré par le livreur
        IN_TRANSIT, // En cours de livraison
        DEPOSITED_AT_HUB, // Déposé au hub
        READY_FOR_PICKUP, // Prêt à être récupéré au hub
        PICKED_UP_FROM_HUB, // Récupéré du hub
        DELIVERED, // Livré
        DELIVERY_DELAYED, // Retardé
        DELIVERY_FAILED // Échec de livraison
    }

    public enum NotificationStatus {
        PENDING, // En attente d'envoi
        SENT, // Envoyé
        DELIVERED, // Délivré (WebSocket ACK reçu)
        FAILED, // Échec d'envoi
        READ // Lu par le client
    }
}
