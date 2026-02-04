package com.delivery.optimization.controller;

import com.delivery.optimization.domain.HubDeposit;
import com.delivery.optimization.dto.HubDepositRequest;
import com.delivery.optimization.dto.HubDepositResponse;
import com.delivery.optimization.dto.HubInfoDTO;
import com.delivery.optimization.service.HubDepositService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Contrôleur pour la gestion des dépôts de colis aux hubs
 */
@RestController
@RequestMapping("/hub")
@RequiredArgsConstructor
@Tag(name = "Hub Deposit", description = "Gestion des dépôts de colis aux hubs/points relais")
public class HubController {

    private final HubDepositService hubDepositService;

    /**
     * Obtenir la liste des hubs disponibles à proximité
     */
    @GetMapping("/nearby")
    @Operation(summary = "Hubs à proximité", description = "Obtenir la liste des hubs disponibles autour d'une position GPS")
    public Flux<HubInfoDTO> getNearbyHubs(
            @Parameter(description = "Latitude actuelle", required = true) @RequestParam Double lat,
            @Parameter(description = "Longitude actuelle", required = true) @RequestParam Double lng,
            @Parameter(description = "Rayon de recherche en kilomètres", example = "10.0") @RequestParam(defaultValue = "10.0") Double radiusKm) {
        return hubDepositService.getNearbyHubs(lat, lng, radiusKm);
    }

    /**
     * Déposer un colis au hub
     */
    @PostMapping("/deposit")
    @Operation(summary = "Déposer un colis au hub", description = "Permet à un livreur de déposer un colis dans un hub/point relais")
    public Mono<HubDepositResponse> depositPackage(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Informations de dépôt", required = true) @RequestBody HubDepositRequest request) {
        return hubDepositService.depositPackageAtHub(request);
    }

    /**
     * Obtenir tous les dépôts dans un hub spécifique
     */
    @GetMapping("/{hubId}/deposits")
    @Operation(summary = "Liste des colis au hub", description = "Obtenir tous les colis déposés dans un hub spécifique")
    public Flux<HubDeposit> getDepositsAtHub(
            @Parameter(description = "ID du hub", required = true) @PathVariable String hubId,
            @Parameter(description = "Filtrer par statut (optionnel)") @RequestParam(required = false) HubDeposit.DepositStatus status) {
        return hubDepositService.getDepositsAtHub(hubId, status);
    }

    /**
     * Obtenir le dépôt d'une livraison spécifique
     */
    @GetMapping("/deposit/delivery/{deliveryId}")
    @Operation(summary = "Dépôt d'une livraison", description = "Obtenir les informations de dépôt pour une livraison spécifique")
    public Mono<HubDeposit> getDepositByDeliveryId(
            @Parameter(description = "ID de la livraison", required = true) @PathVariable String deliveryId) {
        return hubDepositService.getDepositByDeliveryId(deliveryId);
    }

    /**
     * Vérifier si un colis est disponible au hub (données masquées)
     */
    @GetMapping("/check/{trackingCode}")
    @Operation(summary = "Vérifier disponibilité colis", description = "Vérifier si un colis est disponible à la récupération au hub (données sensibles masquées)")
    public Mono<com.delivery.optimization.dto.HubParcelInfoDTO> checkParcelAtHub(
            @Parameter(description = "Code de suivi", required = true) @PathVariable String trackingCode) {
        return hubDepositService.checkParcelAtHub(trackingCode);
    }

    /**
     * Récupérer un colis au hub avec validation d'identité
     */
    @PostMapping("/pickup")
    @Operation(summary = "Récupérer un colis au hub", description = "Permet au destinataire de récupérer son colis au hub avec vérification d'identité")
    public Mono<com.delivery.optimization.dto.HubPickupResponse> pickupPackage(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Informations de récupération avec validation d'identité", required = true) @RequestBody com.delivery.optimization.dto.HubPickupRequest request) {
        return hubDepositService.pickupPackageFromHub(request);
    }
}
