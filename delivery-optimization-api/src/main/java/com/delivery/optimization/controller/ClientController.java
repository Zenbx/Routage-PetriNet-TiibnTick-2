package com.delivery.optimization.controller;

import com.delivery.optimization.domain.Delivery;
import com.delivery.optimization.dto.*;
import com.delivery.optimization.repository.DeliveryRepository;
import com.delivery.optimization.service.StateTransitionService;
import com.delivery.optimization.service.TrackingCodeGenerator;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

/**
 * Contrôleur pour les clients (création de demandes de livraison et suivi public)
 */
@RestController
@RequestMapping("/api/v1/client")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Client API", description = "Endpoints pour les clients (demande de livraison et suivi)")
public class ClientController {

    private final DeliveryRepository deliveryRepository;
    private final TrackingCodeGenerator trackingCodeGenerator;
    private final StateTransitionService stateTransitionService;

    /**
     * Créer une nouvelle demande de livraison
     */
    @PostMapping("/delivery/request")
    @Operation(
        summary = "Créer demande de livraison",
        description = "Soumet une nouvelle demande de livraison. Retourne un code de tracking unique pour le suivi."
    )
    public Mono<DeliveryResponseDTO> createDeliveryRequest(
            @Valid @RequestBody DeliveryRequestDTO request
    ) {
        log.info("Creating new delivery request from {} to {}",
                request.getSender().getName(),
                request.getRecipient().getName());

        // Générer un tracking code unique
        return trackingCodeGenerator.generateUniqueTrackingCode()
                .flatMap(trackingCode -> {
                    // Créer la livraison
                    Delivery delivery = Delivery.builder()
                            .id(UUID.randomUUID().toString())
                            .newEntity(true)  // Marquer comme nouvelle entité pour Spring Data R2DBC
                            .trackingCode(trackingCode)
                            .status(Delivery.DeliveryStatus.PENDING)
                            .createdAt(Instant.now())

                            // Sender info
                            .senderName(request.getSender().getName())
                            .senderPhone(request.getSender().getPhone())
                            .senderAddress(request.getSender().getAddress())
                            .pickupType(request.getSender().getPickupType())
                            .pickupLocationId(request.getSender().getPickupLocationId())

                            // Recipient info
                            .recipientName(request.getRecipient().getName())
                            .recipientPhone(request.getRecipient().getPhone())
                            .recipientAddress(request.getRecipient().getAddress())
                            .deliveryType(request.getRecipient().getDeliveryType())
                            .deliveryLocationId(request.getRecipient().getDeliveryLocationId())

                            // Package info
                            .packageDescription(request.getPackage_().getDescription())
                            .weight(request.getPackage_().getWeight())
                            .packageLength(request.getPackage_().getLength())
                            .packageWidth(request.getPackage_().getWidth())
                            .packageHeight(request.getPackage_().getHeight())

                            // Deadline (optionnel)
                            .deadline(request.getPreferredDeadline())

                            // Pour compatibilité avec ancien système (nodes du graphe)
                            // Ces champs sont null pour les livraisons créées par l'API client
                            // Ils seront remplis plus tard lors de l'optimisation de tournée
                            .pickupNodeId(null)
                            .dropoffNodeId(null)

                            // Prix calculé (simplifié pour l'instant, à améliorer)
                            .price(calculateEstimatedPrice(request))
                            .build();

                    return deliveryRepository.save(delivery);
                })
                .flatMap(savedDelivery -> {
                    // Initialiser le workflow Petri Net
                    return stateTransitionService.initializeDeliveryWorkflow(savedDelivery.getId())
                            .thenReturn(savedDelivery);
                })
                .map(this::mapToResponseDTO)
                .doOnSuccess(response -> log.info("Created delivery {} with tracking code {}",
                        response.getId(), response.getTrackingCode()))
                .doOnError(error -> log.error("Failed to create delivery: {}", error.getMessage()));
    }

    /**
     * Suivi public par code de tracking
     */
    @GetMapping("/tracking/{trackingCode}")
    @Operation(
        summary = "Suivi public par code",
        description = "Permet à n'importe qui de suivre une livraison avec son code de tracking"
    )
    public Mono<TrackingInfoDTO> trackDelivery(
            @Parameter(description = "Code de tracking (ex: TRK-ABCD123EF)")
            @PathVariable String trackingCode
    ) {
        log.info("Tracking delivery by code: {}", trackingCode);

        return deliveryRepository.findByTrackingCode(trackingCode)
                .switchIfEmpty(Mono.error(new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Aucune livraison trouvée avec ce code de tracking"
                )))
                .map(this::mapToTrackingDTO)
                .doOnSuccess(tracking -> log.info("Retrieved tracking info for {}", trackingCode))
                .doOnError(error -> log.error("Failed to track delivery {}: {}", trackingCode, error.getMessage()));
    }

    /**
     * Calcul simplifié du prix
     * TODO: Améliorer avec calcul basé sur distance réelle et poids
     */
    private Double calculateEstimatedPrice(DeliveryRequestDTO request) {
        double basePrice = 5.0; // Prix de base

        // Majoration selon le poids
        double weight = request.getPackage_().getWeight();
        double weightSurcharge = weight > 5.0 ? (weight - 5.0) * 0.5 : 0.0;

        // Majoration pour livraison à domicile vs point relais
        double deliveryTypeSurcharge = request.getRecipient().getDeliveryType() == Delivery.DeliveryType.HOME
                ? 3.0 : 0.0;

        return basePrice + weightSurcharge + deliveryTypeSurcharge;
    }

    /**
     * Mapping Delivery → DeliveryResponseDTO
     */
    private DeliveryResponseDTO mapToResponseDTO(Delivery delivery) {
        return DeliveryResponseDTO.builder()
                .id(delivery.getId())
                .trackingCode(delivery.getTrackingCode())
                .status(delivery.getStatus())
                .estimatedPrice(delivery.getPrice())
                .estimatedDeliveryTime(delivery.getDeadline())
                .createdAt(delivery.getCreatedAt())
                .sender(SenderInfoDTO.builder()
                        .name(delivery.getSenderName())
                        .phone(delivery.getSenderPhone())
                        .address(delivery.getSenderAddress())
                        .pickupType(delivery.getPickupType())
                        .pickupLocationId(delivery.getPickupLocationId())
                        .build())
                .recipient(RecipientInfoDTO.builder()
                        .name(delivery.getRecipientName())
                        .phone(delivery.getRecipientPhone())
                        .address(delivery.getRecipientAddress())
                        .deliveryType(delivery.getDeliveryType())
                        .deliveryLocationId(delivery.getDeliveryLocationId())
                        .build())
                .package_(PackageInfoDTO.builder()
                        .description(delivery.getPackageDescription())
                        .weight(delivery.getWeight())
                        .length(delivery.getPackageLength())
                        .width(delivery.getPackageWidth())
                        .height(delivery.getPackageHeight())
                        .build())
                .build();
    }

    /**
     * Mapping Delivery → TrackingInfoDTO (informations publiques limitées)
     */
    private TrackingInfoDTO mapToTrackingDTO(Delivery delivery) {
        return TrackingInfoDTO.builder()
                .trackingCode(delivery.getTrackingCode())
                .status(delivery.getStatus())
                .createdAt(delivery.getCreatedAt())
                .acceptedAt(delivery.getAcceptedAt())
                .pickedUpAt(delivery.getPickedUpAt())
                .deliveredAt(delivery.getDeliveredAt())
                .senderName(delivery.getSenderName())
                .recipientName(delivery.getRecipientName())
                .recipientAddress(delivery.getRecipientAddress())
                .packageDescription(delivery.getPackageDescription())
                .weight(delivery.getWeight())
                .estimatedDeliveryTime(delivery.getDeadline())
                // TODO: Ajouter currentLocation et progressPercentage via GPS tracking
                .currentLocation(null) // À implémenter avec WebSocket
                .progressPercentage(null) // À calculer depuis position actuelle
                .build();
    }
}
