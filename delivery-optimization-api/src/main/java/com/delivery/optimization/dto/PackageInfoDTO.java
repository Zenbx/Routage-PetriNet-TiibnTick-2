package com.delivery.optimization.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * DTO pour les informations du colis
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PackageInfoDTO {

    @NotBlank(message = "La description du colis est obligatoire")
    private String description;

    @NotNull(message = "Le poids est obligatoire")
    @Positive(message = "Le poids doit être positif")
    private Double weight; // kg

    @Positive(message = "La longueur doit être positive")
    private Double length; // cm

    @Positive(message = "La largeur doit être positive")
    private Double width; // cm

    @Positive(message = "La hauteur doit être positive")
    private Double height; // cm
}
