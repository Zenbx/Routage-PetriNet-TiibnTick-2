package com.delivery.optimization.controller;

import com.delivery.optimization.domain.Delivery;
import com.delivery.optimization.domain.Driver;
import com.delivery.optimization.dto.DeliveryDetailsDTO;
import com.delivery.optimization.dto.DeliveryResponseDTO;
import com.delivery.optimization.dto.LocationDTO;
import com.delivery.optimization.dto.PackageInfoDTO;
import com.delivery.optimization.dto.RecipientInfoDTO;
import com.delivery.optimization.dto.SenderInfoDTO;
import com.delivery.optimization.repository.DeliveryRepository;
import com.delivery.optimization.repository.DriverRepository;
import com.delivery.optimization.service.StateTransitionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Map;

/**
 * Contrôleur pour les livreurs - Application de livraison
 * (feed, acceptation, mise à jour de statut)
 */
@RestController
@RequestMapping("/api/v1/delivery-driver")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Delivery Driver API", description = "Endpoints pour les livreurs (feed, acceptation, livraison)")
public class DeliveryDriverController {

    private final DeliveryRepository deliveryRepository;
    private final DriverRepository driverRepository;
    private final StateTransitionService stateTransitionService;

    /**
     * Feed des livraisons disponibles (statut PENDING)
     * Les livreurs voient toutes les livraisons en attente d'acceptation
     */
    @GetMapping("/feed")
    @Operation(
        summary = "Feed des livraisons disponibles",
        description = "Retourne toutes les livraisons avec le statut PENDING (en attente d'un livreur)"
    )
    public Flux<DeliveryResponseDTO> getAvailableDeliveries() {
        log.info("Fetching available deliveries feed");

        return deliveryRepository.findByStatus(Delivery.DeliveryStatus.PENDING)
                .map(this::mapToResponseDTO)
                .doOnComplete(() -> log.info("Feed retrieved successfully"))
                .doOnError(error -> log.error("Failed to fetch feed: {}", error.getMessage()));
    }

    /**
     * Accepter une livraison
     * Le livreur accepte une livraison du feed → passe à ACCEPTED
     */
    @PostMapping("/delivery/{deliveryId}/accept")
    @Operation(
        summary = "Accepter une livraison",
        description = "Le livreur accepte une livraison. Change le statut de PENDING → ACCEPTED et assigne le livreur."
    )
    public Mono<DeliveryResponseDTO> acceptDelivery(
            @Parameter(description = "ID de la livraison")
            @PathVariable String deliveryId,
            @Parameter(description = "ID du livreur")
            @RequestParam String driverId
    ) {
        log.info("Driver {} accepting delivery {}", driverId, deliveryId);

        return deliveryRepository.findById(deliveryId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Livraison introuvable"
                )))
                .flatMap(delivery -> {
                    // Vérifier que la livraison est bien PENDING
                    if (delivery.getStatus() != Delivery.DeliveryStatus.PENDING) {
                        return Mono.error(new ResponseStatusException(
                                HttpStatus.CONFLICT,
                                "Cette livraison n'est plus disponible (statut: " + delivery.getStatus() + ")"
                        ));
                    }

                    // Assigner le livreur et changer le statut
                    delivery.setDriverId(driverId);
                    delivery.setStatus(Delivery.DeliveryStatus.ACCEPTED);
                    delivery.setAcceptedAt(Instant.now());

                    return deliveryRepository.save(delivery);
                })
                .flatMap(delivery -> {
                    // Mettre à jour le statut du livreur à BUSY
                    return driverRepository.findById(driverId)
                            .flatMap(driver -> {
                                driver.setStatus(Driver.DriverStatus.BUSY);
                                return driverRepository.save(driver);
                            })
                            .thenReturn(delivery);
                })
                .flatMap(delivery -> {
                    // Transition Petri Net: ASSIGNED → ACCEPTED
                    return stateTransitionService.transitionState(
                            delivery.getId(),
                            "ACCEPTED",
                            Instant.now()
                    ).thenReturn(delivery);
                })
                .map(this::mapToResponseDTO)
                .doOnSuccess(response -> log.info("Driver {} accepted delivery {} and status changed to BUSY", driverId, deliveryId))
                .doOnError(error -> log.error("Failed to accept delivery: {}", error.getMessage()));
    }

    /**
     * Marquer comme récupéré
     * Le livreur a récupéré le colis → passe à PICKED_UP
     */
    @PostMapping("/delivery/{deliveryId}/pickup")
    @Operation(
        summary = "Marquer comme récupéré",
        description = "Le livreur confirme avoir récupéré le colis. Change le statut ACCEPTED → PICKED_UP."
    )
    public Mono<DeliveryResponseDTO> markAsPickedUp(
            @Parameter(description = "ID de la livraison")
            @PathVariable String deliveryId,
            @Parameter(description = "ID du livreur (vérification)")
            @RequestParam String driverId
    ) {
        log.info("Driver {} marking delivery {} as picked up", driverId, deliveryId);

        return deliveryRepository.findById(deliveryId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Livraison introuvable"
                )))
                .flatMap(delivery -> {
                    // Vérifier que c'est bien le livreur assigné
                    if (!driverId.equals(delivery.getDriverId())) {
                        return Mono.error(new ResponseStatusException(
                                HttpStatus.FORBIDDEN,
                                "Vous n'êtes pas le livreur assigné à cette livraison"
                        ));
                    }

                    // Vérifier le statut
                    if (delivery.getStatus() != Delivery.DeliveryStatus.ACCEPTED) {
                        return Mono.error(new ResponseStatusException(
                                HttpStatus.CONFLICT,
                                "Impossible de récupérer une livraison avec le statut: " + delivery.getStatus()
                        ));
                    }

                    delivery.setStatus(Delivery.DeliveryStatus.PICKED_UP);
                    delivery.setPickedUpAt(Instant.now());

                    return deliveryRepository.save(delivery);
                })
                .flatMap(delivery -> {
                    // Transition Petri Net
                    return stateTransitionService.transitionState(
                            delivery.getId(),
                            "PICKED_UP",
                            Instant.now()
                    ).thenReturn(delivery);
                })
                .map(this::mapToResponseDTO)
                .doOnSuccess(response -> log.info("Delivery {} marked as picked up", deliveryId))
                .doOnError(error -> log.error("Failed to mark as picked up: {}", error.getMessage()));
    }

    /**
     * Démarrer la livraison
     * Le livreur démarre le trajet → passe à IN_TRANSIT
     */
    @PostMapping("/delivery/{deliveryId}/start")
    @Operation(
        summary = "Démarrer la livraison",
        description = "Le livreur démarre le trajet vers la destination. Change le statut PICKED_UP → IN_TRANSIT."
    )
    public Mono<DeliveryResponseDTO> startDelivery(
            @Parameter(description = "ID de la livraison")
            @PathVariable String deliveryId,
            @Parameter(description = "ID du livreur (vérification)")
            @RequestParam String driverId
    ) {
        log.info("Driver {} starting delivery {}", driverId, deliveryId);

        return deliveryRepository.findById(deliveryId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Livraison introuvable"
                )))
                .flatMap(delivery -> {
                    if (!driverId.equals(delivery.getDriverId())) {
                        return Mono.error(new ResponseStatusException(
                                HttpStatus.FORBIDDEN,
                                "Vous n'êtes pas le livreur assigné"
                        ));
                    }

                    if (delivery.getStatus() != Delivery.DeliveryStatus.PICKED_UP) {
                        return Mono.error(new ResponseStatusException(
                                HttpStatus.CONFLICT,
                                "Impossible de démarrer depuis le statut: " + delivery.getStatus()
                        ));
                    }

                    delivery.setStatus(Delivery.DeliveryStatus.IN_TRANSIT);
                    return deliveryRepository.save(delivery);
                })
                .flatMap(delivery -> {
                    return stateTransitionService.transitionState(
                            delivery.getId(),
                            "IN_TRANSIT",
                            Instant.now()
                    ).thenReturn(delivery);
                })
                .map(this::mapToResponseDTO)
                .doOnSuccess(response -> log.info("Delivery {} started", deliveryId))
                .doOnError(error -> log.error("Failed to start delivery: {}", error.getMessage()));
    }

    /**
     * Marquer comme livré
     * Le livreur a livré le colis → passe à DELIVERED
     */
    @PostMapping("/delivery/{deliveryId}/deliver")
    @Operation(
        summary = "Marquer comme livré",
        description = "Le livreur confirme avoir livré le colis. Change le statut IN_TRANSIT → DELIVERED."
    )
    public Mono<Map<String, Object>> markAsDelivered(
            @Parameter(description = "ID de la livraison")
            @PathVariable String deliveryId,
            @Parameter(description = "ID du livreur (vérification)")
            @RequestParam String driverId
    ) {
        log.info("Driver {} marking delivery {} as delivered", driverId, deliveryId);

        return deliveryRepository.findById(deliveryId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Livraison introuvable"
                )))
                .flatMap(delivery -> {
                    if (!driverId.equals(delivery.getDriverId())) {
                        return Mono.error(new ResponseStatusException(
                                HttpStatus.FORBIDDEN,
                                "Vous n'êtes pas le livreur assigné"
                        ));
                    }

                    if (delivery.getStatus() != Delivery.DeliveryStatus.IN_TRANSIT) {
                        return Mono.error(new ResponseStatusException(
                                HttpStatus.CONFLICT,
                                "Impossible de livrer depuis le statut: " + delivery.getStatus()
                        ));
                    }

                    delivery.setStatus(Delivery.DeliveryStatus.DELIVERED);
                    delivery.setDeliveredAt(Instant.now());

                    return deliveryRepository.save(delivery);
                })
                .flatMap(delivery -> {
                    // Mettre à jour le statut du livreur à AVAILABLE
                    return driverRepository.findById(driverId)
                            .flatMap(driver -> {
                                driver.setStatus(Driver.DriverStatus.AVAILABLE);
                                return driverRepository.save(driver);
                            })
                            .thenReturn(delivery);
                })
                .flatMap(delivery -> {
                    return stateTransitionService.transitionState(
                            delivery.getId(),
                            "DELIVERED",
                            Instant.now()
                    ).thenReturn(delivery);
                })
                .map(delivery -> {
                    Map<String, Object> response = new java.util.HashMap<>();
                    response.put("success", true);
                    response.put("deliveryId", delivery.getId());
                    response.put("trackingCode", delivery.getTrackingCode());
                    response.put("deliveredAt", delivery.getDeliveredAt());
                    response.put("message", "Livraison terminée avec succès");
                    return response;
                })
                .doOnSuccess(response -> log.info("Delivery {} marked as delivered, driver {} status changed to AVAILABLE", deliveryId, driverId))
                .doOnError(error -> log.error("Failed to mark as delivered: {}", error.getMessage()));
    }

    /**
     * Récupérer les livraisons actives d'un livreur
     * Toutes les livraisons assignées mais pas encore livrées
     */
    @GetMapping("/deliveries")
    @Operation(
        summary = "Livraisons actives du livreur",
        description = "Retourne toutes les livraisons actives (ACCEPTED, PICKED_UP, IN_TRANSIT) d'un livreur"
    )
    public Flux<DeliveryResponseDTO> getDriverDeliveries(
            @Parameter(description = "ID du livreur")
            @RequestParam String driverId
    ) {
        log.info("Fetching active deliveries for driver {}", driverId);

        return deliveryRepository.findByDriverId(driverId)
                .filter(delivery -> delivery.getStatus() != Delivery.DeliveryStatus.DELIVERED
                        && delivery.getStatus() != Delivery.DeliveryStatus.CANCELLED)
                .map(this::mapToResponseDTO)
                .doOnComplete(() -> log.info("Retrieved active deliveries for driver {}", driverId))
                .doOnError(error -> log.error("Failed to fetch driver deliveries: {}", error.getMessage()));
    }

    /**
     * Récupérer les détails complets d'une livraison avec coordonnées GPS
     * Utilisé pour la navigation et l'affichage de la carte
     */
    @GetMapping("/delivery/{id}/details")
    @Operation(
        summary = "Détails complets d'une livraison",
        description = "Retourne tous les détails d'une livraison incluant les coordonnées GPS pour la navigation"
    )
    public Mono<DeliveryDetailsDTO> getDeliveryDetails(
            @Parameter(description = "ID de la livraison")
            @PathVariable String id
    ) {
        log.info("Fetching delivery details for {}", id);

        return deliveryRepository.findById(id)
                .switchIfEmpty(Mono.error(new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Livraison non trouvée"
                )))
                .map(this::mapToDetailsDTO)
                .doOnSuccess(details -> log.info("Retrieved details for delivery {}", id))
                .doOnError(error -> log.error("Failed to fetch delivery details: {}", error.getMessage()));
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
     * Mapping Delivery → DeliveryDetailsDTO (avec coordonnées GPS)
     */
    private DeliveryDetailsDTO mapToDetailsDTO(Delivery delivery) {
        return DeliveryDetailsDTO.builder()
                .id(delivery.getId())
                .trackingCode(delivery.getTrackingCode())
                .status(delivery.getStatus())
                .createdAt(delivery.getCreatedAt())
                .acceptedAt(delivery.getAcceptedAt())
                .pickedUpAt(delivery.getPickedUpAt())
                .deliveredAt(delivery.getDeliveredAt())
                .deadline(delivery.getDeadline())

                // Sender info
                .senderName(delivery.getSenderName())
                .senderPhone(delivery.getSenderPhone())
                .senderAddress(delivery.getSenderAddress())
                .pickupType(delivery.getPickupType())
                .pickupLocationId(delivery.getPickupLocationId())
                .pickupLocation(parseLocation(delivery.getPickupLocationId(), delivery.getSenderAddress()))

                // Recipient info
                .recipientName(delivery.getRecipientName())
                .recipientPhone(delivery.getRecipientPhone())
                .recipientAddress(delivery.getRecipientAddress())
                .deliveryType(delivery.getDeliveryType())
                .deliveryLocationId(delivery.getDeliveryLocationId())
                .deliveryLocation(parseLocation(delivery.getDeliveryLocationId(), delivery.getRecipientAddress()))

                // Package info
                .packageDescription(delivery.getPackageDescription())
                .weight(delivery.getWeight())
                .packageLength(delivery.getPackageLength())
                .packageWidth(delivery.getPackageWidth())
                .packageHeight(delivery.getPackageHeight())

                // Price and driver
                .price(delivery.getPrice())
                .driverId(delivery.getDriverId())
                .build();
    }

    /**
     * Parse une chaîne de coordonnées au format "lat,lng" en LocationDTO
     */
    private LocationDTO parseLocation(String locationId, String address) {
        if (locationId == null || locationId.isEmpty()) {
            return null;
        }

        // Si c'est un point relais, on n'a pas les coordonnées pour l'instant
        if (locationId.startsWith("RELAY_")) {
            return null;
        }

        // Parser le format "lat,lng"
        try {
            String[] parts = locationId.split(",");
            if (parts.length == 2) {
                double latitude = Double.parseDouble(parts[0].trim());
                double longitude = Double.parseDouble(parts[1].trim());
                return LocationDTO.builder()
                        .latitude(latitude)
                        .longitude(longitude)
                        .address(address)
                        .build();
            }
        } catch (NumberFormatException e) {
            log.warn("Failed to parse location coordinates: {}", locationId);
        }

        return null;
    }
}
