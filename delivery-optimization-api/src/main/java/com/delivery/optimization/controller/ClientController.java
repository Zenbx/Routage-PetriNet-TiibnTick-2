package com.delivery.optimization.controller;

import com.delivery.optimization.domain.Delivery;
import com.delivery.optimization.dto.*;
import com.delivery.optimization.repository.DeliveryRepository;
import com.delivery.optimization.repository.NodeRepository;
import com.delivery.optimization.service.ETAService;
import com.delivery.optimization.service.ShortestPathService;
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
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Contrôleur pour les clients (création de demandes de livraison et suivi
 * public)
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
        private final ShortestPathService shortestPathService;
        private final ETAService etaService;
        private final NodeRepository nodeRepository;

        /**
         * Créer une nouvelle demande de livraison
         */
        @PostMapping("/delivery/request")
        @Operation(summary = "Créer demande de livraison", description = "Soumet une nouvelle demande de livraison. Retourne un code de tracking unique pour le suivi.")
        public Mono<DeliveryResponseDTO> createDeliveryRequest(
                        @Valid @RequestBody DeliveryRequestDTO request) {
                log.info("Creating new delivery request from {} to {}",
                                request.getSender().getName(),
                                request.getRecipient().getName());

                // Générer un tracking code unique
                return trackingCodeGenerator.generateUniqueTrackingCode()
                                .flatMap(trackingCode -> {
                                        // Créer la livraison
                                        Delivery delivery = Delivery.builder()
                                                        .id(UUID.randomUUID().toString())
                                                        .newEntity(true) // Marquer comme nouvelle entité pour Spring
                                                                         // Data R2DBC
                                                        .trackingCode(trackingCode)
                                                        .status(Delivery.DeliveryStatus.PENDING)
                                                        .createdAt(Instant.now())

                                                        // Sender info
                                                        .senderName(request.getSender().getName())
                                                        .senderPhone(request.getSender().getPhone())
                                                        .senderAddress(request.getSender().getAddress())
                                                        .senderLandmark(request.getSender().getLandmark())
                                                        .pickupType(request.getSender().getPickupType())
                                                        .pickupLocationId(request.getSender().getPickupLocationId())

                                                        // Recipient info
                                                        .recipientName(request.getRecipient().getName())
                                                        .recipientPhone(request.getRecipient().getPhone())
                                                        .recipientAddress(request.getRecipient().getAddress())
                                                        .recipientLandmark(request.getRecipient().getLandmark())
                                                        .deliveryType(request.getRecipient().getDeliveryType())
                                                        .deliveryLocationId(
                                                                        request.getRecipient().getDeliveryLocationId())

                                                        // Package info
                                                        .packageDescription(request.getPackageInfo().getDescription())
                                                        .weight(request.getPackageInfo().getWeight())
                                                        .packageLength(request.getPackageInfo().getLength())
                                                        .packageWidth(request.getPackageInfo().getWidth())
                                                        .packageHeight(request.getPackageInfo().getHeight())

                                                        // Deadline (optionnel)
                                                        .deadline(request.getPreferredDeadline())

                                                        // Pour compatibilité avec ancien système (nodes du graphe)
                                                        // Ces champs sont null pour les livraisons créées par l'API
                                                        // client
                                                        // Ils seront remplis plus tard lors de l'optimisation de
                                                        // tournée
                                                        .pickupNodeId(null)
                                                        .dropoffNodeId(null)

                                                        // Distance (km)
                                                        .distance(request.getDistance())

                                                        // Prix calculé (priorité au frontend, sinon fallback)
                                                        .price(request.getPrice() != null ? request.getPrice()
                                                                        : calculateEstimatedPrice(request))
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
        @Operation(summary = "Suivi public par code", description = "Permet à n'importe qui de suivre une livraison avec son code de tracking")
        public Mono<TrackingInfoDTO> trackDelivery(
                        @Parameter(description = "Code de tracking (ex: TRK-ABCD123EF)") @PathVariable String trackingCode) {
                log.info("Tracking delivery by code: {}", trackingCode);

                return deliveryRepository.findByTrackingCode(trackingCode)
                                .switchIfEmpty(Mono.error(new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Aucune livraison trouvée avec ce code de tracking")))
                                .map(this::mapToTrackingDTO)
                                .doOnSuccess(tracking -> log.info("Retrieved tracking info for {}", trackingCode))
                                .doOnError(error -> log.error("Failed to track delivery {}: {}", trackingCode,
                                                error.getMessage()));
        }

        /**
         * Calcul simplifié du prix
         * TODO: Améliorer avec calcul basé sur distance réelle et poids
         */
        private Double calculateEstimatedPrice(DeliveryRequestDTO request) {
                double basePrice = 5.0; // Prix de base

                // Majoration selon le poids
                double weight = request.getPackageInfo().getWeight();
                double weightSurcharge = weight > 5.0 ? (weight - 5.0) * 0.5 : 0.0;

                // Majoration pour livraison à domicile vs point relais
                double deliveryTypeSurcharge = request.getRecipient().getDeliveryType() == Delivery.DeliveryType.HOME
                                ? 3.0
                                : 0.0;

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
                                .distance(delivery.getDistance())
                                .sender(SenderInfoDTO.builder()
                                                .name(delivery.getSenderName())
                                                .phone(delivery.getSenderPhone())
                                                .address(delivery.getSenderAddress())
                                                .landmark(delivery.getSenderLandmark())
                                                .pickupType(delivery.getPickupType())
                                                .pickupLocationId(delivery.getPickupLocationId())
                                                .build())
                                .recipient(RecipientInfoDTO.builder()
                                                .name(delivery.getRecipientName())
                                                .phone(delivery.getRecipientPhone())
                                                .address(delivery.getRecipientAddress())
                                                .landmark(delivery.getRecipientLandmark())
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
                                .pickupLocation(parseLocation(delivery.getPickupLocationId(),
                                                delivery.getSenderAddress()))
                                .deliveryLocation(parseLocation(delivery.getDeliveryLocationId(),
                                                delivery.getRecipientAddress()))
                                .build();
        }

        /**
         * Mapping Delivery → TrackingInfoDTO (informations publiques limitées)
         */
        private TrackingInfoDTO mapToTrackingDTO(Delivery delivery) {
                TrackingInfoDTO.TrackingInfoDTOBuilder builder = TrackingInfoDTO.builder()
                                .trackingCode(delivery.getTrackingCode())
                                .status(delivery.getStatus())
                                .createdAt(delivery.getCreatedAt())
                                .acceptedAt(delivery.getAcceptedAt())
                                .pickedUpAt(delivery.getPickedUpAt())
                                .deliveredAt(delivery.getDeliveredAt())
                                .senderName(delivery.getSenderName())
                                .recipientName(delivery.getRecipientName())
                                .recipientAddress(delivery.getRecipientAddress())
                                .recipientLandmark(delivery.getRecipientLandmark())
                                .packageDescription(delivery.getPackageDescription())
                                .weight(delivery.getWeight())
                                .estimatedDeliveryTime(delivery.getDeadline())
                                .price(delivery.getPrice())
                                // Coordonnées GPS pour la carte
                                .pickupLocation(parseLocation(delivery.getPickupLocationId(),
                                                delivery.getSenderAddress()))
                                .deliveryLocation(parseLocation(delivery.getDeliveryLocationId(),
                                                delivery.getRecipientAddress()))
                                .driverLocation(null); // TODO: Position en temps réel via WebSocket

                // For active deliveries (PICKED_UP, IN_TRANSIT), calculate route and ETA
                if (delivery.getStatus() == Delivery.DeliveryStatus.PICKED_UP ||
                                delivery.getStatus() == Delivery.DeliveryStatus.IN_TRANSIT) {
                        try {
                                enrichWithRouteAndETA(delivery, builder);
                        } catch (Exception e) {
                                log.warn("Failed to enrich tracking data with route/ETA for {}: {}",
                                                delivery.getTrackingCode(), e.getMessage());
                        }
                }

                return builder.build();
        }

        /**
         * Enrich tracking DTO with route path and ETA information
         */
        private void enrichWithRouteAndETA(Delivery delivery, TrackingInfoDTO.TrackingInfoDTOBuilder builder) {
                try {
                        // Get origin and destination
                        String originId = delivery.getPickupLocationId();
                        String destId = delivery.getDeliveryLocationId();

                        if (originId == null || destId == null) {
                                log.debug("Missing location IDs for route calculation");
                                return;
                        }

                        // Calculate shortest path
                        var routeRequest = new ShortestPathRequest();
                        routeRequest.setOrigin(originId);
                        routeRequest.setDestination(destId);
                        routeRequest.setDriverId(delivery.getDriverId());

                        ShortestPathRequest.CostWeights defaultWeights = new ShortestPathRequest.CostWeights();
                        defaultWeights.setAlpha(1.0);
                        defaultWeights.setBeta(1.5);
                        defaultWeights.setGamma(1.0);
                        defaultWeights.setDelta(1.2);
                        defaultWeights.setEta(1.0);
                        routeRequest.setCostWeights(defaultWeights);

                        var pathResponse = shortestPathService.calculateShortestPath(routeRequest).block();

                        if (pathResponse != null && pathResponse.getPath() != null) {
                                // Convert node IDs to GPS coordinates
                                List<List<Double>> routePath = new ArrayList<>();
                                for (String nodeId : pathResponse.getPath()) {
                                        LocationDTO loc = parseLocationForNode(nodeId, delivery);
                                        if (loc != null && loc.getLatitude() != null && loc.getLongitude() != null) {
                                                routePath.add(Arrays.asList(loc.getLatitude(),
                                                                loc.getLongitude()));
                                        }
                                }

                                if (!routePath.isEmpty()) {
                                        builder.routePath(routePath);
                                        builder.totalDistance(pathResponse.getDistance());
                                }
                        }

                        // Get ETA and remaining distance
                        var etaStats = etaService.getLatestStats(delivery.getId()).block();
                        if (etaStats != null) {
                                builder.remainingDistance(etaStats.getRemainingDistance());
                                builder.estimatedArrival(etaStats.getEtaMin()); // Using min ETA

                                // Calculate progress percentage
                                if (etaStats.getKalmanState() != null) {
                                        double distCovered = etaStats.getKalmanState().getDistanceCovered();
                                        builder.progressPercentage(Math.min(100.0, distCovered * 100.0));
                                }
                        }
                } catch (Exception e) {
                        log.error("Error enriching route data: {}", e.getMessage(), e);
                }
        }

        /**
         * Parse location for a node in the route path
         */
        private LocationDTO parseLocationForNode(String nodeId, Delivery delivery) {
                // First check if it matches pickup or delivery location
                if (nodeId.equals(delivery.getPickupLocationId())) {
                        return parseLocation(delivery.getPickupLocationId(), delivery.getSenderAddress());
                }
                if (nodeId.equals(delivery.getDeliveryLocationId())) {
                        return parseLocation(delivery.getDeliveryLocationId(), delivery.getRecipientAddress());
                }

                // Try to parse as GPS coordinates
                LocationDTO loc = parseLocation(nodeId, null);
                if (loc != null) {
                        return loc;
                }

                // Try to fetch from Node repository
                try {
                        var node = nodeRepository.findById(nodeId).block();
                        if (node != null && node.getLatitude() != null && node.getLongitude() != null) {
                                return LocationDTO.builder()
                                                .latitude(node.getLatitude())
                                                .longitude(node.getLongitude())
                                                .address(node.getName())
                                                .build();
                        }
                } catch (Exception e) {
                        log.debug("Could not fetch node {} from repository: {}", nodeId, e.getMessage());
                }

                return null;
        }

        /**
         * Parse une chaîne de coordonnées au format "lat,lng" en LocationDTO
         * Si le format est "RELAY_XXX", retourne null pour l'instant (à améliorer)
         */
        private LocationDTO parseLocation(String locationId, String address) {
                if (locationId == null || locationId.isEmpty()) {
                        return null;
                }

                // Si c'est un point relais, on n'a pas les coordonnées pour l'instant
                if (locationId.startsWith("RELAY_")) {
                        return null; // TODO: Récupérer coordonnées depuis base de données des relais
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
