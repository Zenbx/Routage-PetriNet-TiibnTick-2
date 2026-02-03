package com.delivery.optimization.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

/**
 * DTO pour créer une demande de livraison
 * Utilisé par les clients pour soumettre une nouvelle livraison
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryRequestDTO {

    @NotNull(message = "Les informations de l'expéditeur sont obligatoires")
    @Valid
    private SenderInfoDTO sender;

    @NotNull(message = "Les informations du destinataire sont obligatoires")
    @Valid
    private RecipientInfoDTO recipient;

    @NotNull(message = "Les informations du colis sont obligatoires")
    @Valid
    @JsonProperty("package_")
    @JsonAlias({"package", "package_"})
    private PackageInfoDTO package_;

    /**
     * Date limite de livraison souhaitée (optionnelle)
     */
    @Future(message = "La date limite doit être dans le futur")
    private Instant preferredDeadline;

    /**
     * Instructions spéciales pour la livraison (optionnel)
     */
    private String specialInstructions;
}
