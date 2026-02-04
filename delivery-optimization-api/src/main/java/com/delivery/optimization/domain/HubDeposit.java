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

/**
 * Entité pour tracker les dépôts de colis aux hubs/points relais
 * Utilisé pour la logistique multi-hop où le livreur dépose un colis au hub
 * avant qu'un autre livreur ou le client ne le récupère
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("hub_deposits")
public class HubDeposit implements Persistable<String> {

    @Id
    private String id;

    @Transient
    private boolean newEntity;

    // Livraison concernée
    private String deliveryId;

    // Hub où le colis a été déposé
    private String hubNodeId;

    // Livreur qui a effectué le dépôt
    private String depositedByDriverId;

    // Date et heure du dépôt
    private Instant depositTime;

    // Date et heure de récupération (null si pas encore récupéré)
    private Instant pickupTime;

    // Personne qui a récupéré (ID client ou nouveau livreur)
    private String pickedUpBy;

    // Téléphone de récupération (pour validation)
    private String pickupPhone;

    // Statut du dépôt
    private DepositStatus status;

    // Notes supplémentaires
    private String notes;

    // Emplacement dans le hub (rack, étagère, etc.)
    private String storageLocation;

    // Signature ou preuve de dépôt (URL ou base64)
    private String depositProof;

    // Signature ou preuve de récupération (URL ou base64)
    private String pickupProof;

    public enum DepositStatus {
        DEPOSITED, // Colis déposé, en attente de récupération
        AWAITING_PICKUP, // Destinataire notifié, peut récupérer
        PICKED_UP, // Colis récupéré
        EXPIRED, // Délai de récupération dépassé
        LOST // Colis perdu/introuvable
    }

    @Override
    public String getId() {
        return id;
    }

    @Override
    public boolean isNew() {
        return newEntity || id == null;
    }
}
