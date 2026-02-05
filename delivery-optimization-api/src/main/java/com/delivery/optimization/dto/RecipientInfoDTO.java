package com.delivery.optimization.dto;

import com.delivery.optimization.domain.Delivery.DeliveryType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/**
 * DTO pour les informations du destinataire
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipientInfoDTO {

    @NotBlank(message = "Le nom du destinataire est obligatoire")
    private String name;

    @NotBlank(message = "Le téléphone du destinataire est obligatoire")
    @Pattern(regexp = "^\\+?[0-9]{8,15}$", message = "Numéro de téléphone invalide")
    private String phone;

    @NotBlank(message = "L'adresse du destinataire est obligatoire")
    private String address;

    @NotNull(message = "Le type de livraison est obligatoire")
    private DeliveryType deliveryType;

    /**
     * ID du point relais ou coordonnées GPS du domicile
     * Format: "RELAY_XXX" pour point relais ou "lat,lng" pour domicile
     */
    @NotBlank(message = "L'emplacement de livraison est obligatoire")
    private String deliveryLocationId;

    private String landmark; // Lieu-dit destinataire
}
