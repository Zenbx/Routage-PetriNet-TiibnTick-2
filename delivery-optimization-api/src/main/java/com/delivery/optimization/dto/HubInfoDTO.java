package com.delivery.optimization.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour les informations de hub avec disponibilité
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HubInfoDTO {
    private String id;
    private String name;
    private String address;
    private Double latitude;
    private Double longitude;
    private Integer capacity;
    private Integer currentOccupancy;
    private Integer availableSpace;
    private Double distanceKm; // Distance depuis la position actuelle du livreur
    private Boolean isAvailable; // Hub a de l'espace disponible
}
