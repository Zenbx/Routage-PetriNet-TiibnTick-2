package com.delivery.optimization.dto;

import com.delivery.optimization.domain.HubDeposit;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour vérifier si un colis est disponible à la récupération
 * Utilisé par le personnel du hub pour afficher les infos sans révéler toutes
 * les données
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HubParcelInfoDTO {
    private String trackingCode;
    private String hubName;
    private String recipientNameMasked; // Ex: "John D****"
    private String recipientPhoneMasked; // Ex: "+237 6** *** **2"
    private HubDeposit.DepositStatus status;
    private String storageLocation;
    private boolean availableForPickup;
    private String depositTime;
    private String packageDescription;
}
