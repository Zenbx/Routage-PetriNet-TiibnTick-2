package com.delivery.optimization.dto;

import com.delivery.optimization.domain.Delivery.PickupType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/**
 * DTO pour les informations de l'expéditeur
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SenderInfoDTO {

    @NotBlank(message = "Le nom de l'expéditeur est obligatoire")
    private String name;

    @NotBlank(message = "Le téléphone de l'expéditeur est obligatoire")
    @Pattern(regexp = "^\\+?[0-9]{8,15}$", message = "Numéro de téléphone invalide")
    private String phone;

    @NotBlank(message = "L'adresse de l'expéditeur est obligatoire")
    private String address;

    @NotNull(message = "Le type de récupération est obligatoire")
    private PickupType pickupType;

    /**
     * ID du point relais ou coordonnées GPS du domicile
     * Format: "RELAY_XXX" pour point relais ou "lat,lng" pour domicile
     */
    @NotBlank(message = "L'emplacement de récupération est obligatoire")
    private String pickupLocationId;

    private String landmark; // Lieu-dit expéditeur
}
