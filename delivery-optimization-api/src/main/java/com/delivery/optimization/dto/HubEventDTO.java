package com.delivery.optimization.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO pour les événements liés aux hubs (dépôts, retraits)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HubEventDTO {

    private String eventType; // "DEPOSIT" ou "PICKUP"
    private Instant timestamp;
    private String hubId;
    private String hubName;
    private String hubAddress;
    private String driverName; // Nom du livreur qui a déposé/récupéré
    private String deliveryId; // ID de la livraison concernée
    private String notes; // Notes additionnelles
}
