package com.delivery.optimization.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour les coordonnées GPS
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationDTO {
    private Double latitude;
    private Double longitude;
    private String address;
}
