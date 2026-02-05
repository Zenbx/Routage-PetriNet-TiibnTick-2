package com.delivery.optimization.controller;

import com.delivery.optimization.domain.Delivery;
import com.delivery.optimization.dto.*;
import com.delivery.optimization.dto.LocationDTO;
import com.delivery.optimization.domain.Delivery.DeliveryStatus;
import com.delivery.optimization.domain.Driver;
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
import reactor.core.publisher.Flux;
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
        private final com.delivery.optimization.repository.DriverRepository driverRepository;

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
                                .flatMap(this::mapToResponseDTOReactive)
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
                                .flatMap(this::mapToTrackingDTOReactive)
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
         * Mapping Delivery → DeliveryResponseDTO (réactif)
         */
        private Mono<DeliveryResponseDTO> mapToResponseDTOReactive(Delivery delivery) {
                DeliveryResponseDTO.DeliveryResponseDTOBuilder builder = DeliveryResponseDTO.builder()
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
                                                .build());

                return Mono.zip(
                                resolveLocation(delivery.getPickupLocationId(), delivery.getSenderAddress())
                                                .defaultIfEmpty(new LocationDTO()),
                                resolveLocation(delivery.getDeliveryLocationId(), delivery.getRecipientAddress())
                                                .defaultIfEmpty(new LocationDTO()))
                                .map(tuple -> {
                                        builder.pickupLocation(tuple.getT1());
                                        builder.deliveryLocation(tuple.getT2());
                                        return builder.build();
                                });
        }

        /**
         * Mapping Delivery → DeliveryResponseDTO
         */
        private DeliveryResponseDTO mapToResponseDTO(Delivery delivery) {
                return mapToResponseDTOReactive(delivery).block();
        }

        /**
         * Mapping Delivery → TrackingInfoDTO (informations publiques limitées) de
         * manière réactive
         */
        private Mono<TrackingInfoDTO> mapToTrackingDTOReactive(Delivery delivery) {
                TrackingInfoDTO.TrackingInfoDTOBuilder builder = TrackingInfoDTO.builder()
                                .trackingCode(delivery.getTrackingCode())
                                .status(delivery.getStatus())
                                .createdAt(delivery.getCreatedAt())
                                .acceptedAt(delivery.getAcceptedAt())
                                .pickedUpAt(delivery.getPickedUpAt())
                                .deliveredAt(delivery.getDeliveredAt())
                                .senderName(delivery.getSenderName())
                                .senderAddress(delivery.getSenderAddress())
                                .senderLandmark(delivery.getSenderLandmark())
                                .senderCity(delivery.getSenderCity())
                                .senderRegion(delivery.getSenderRegion())
                                .senderCountry(delivery.getSenderCountry())
                                .recipientName(delivery.getRecipientName())
                                .recipientAddress(delivery.getRecipientAddress())
                                .recipientLandmark(delivery.getRecipientLandmark())
                                .recipientCity(delivery.getRecipientCity())
                                .recipientRegion(delivery.getRecipientRegion())
                                .recipientCountry(delivery.getRecipientCountry())
                                .packageDescription(delivery.getPackageDescription())
                                .weight(delivery.getWeight())
                                .estimatedDeliveryTime(delivery.getDeadline())
                                .price(delivery.getPrice());

                // Coordonnées et informations du livreur si assigné
                Mono<Driver> driverMono = (delivery.getDriverId() != null)
                                ? driverRepository.findById(delivery.getDriverId())
                                : Mono.empty();

                Mono<LocationDTO> driverLocMono = driverMono
                                .map(driver -> LocationDTO.builder()
                                                .latitude(driver.getCurrentLatitude())
                                                .longitude(driver.getCurrentLongitude())
                                                .address("Position en temps réel")
                                                .build())
                                .defaultIfEmpty(new LocationDTO());

                // Résolution des Hubs (Points Relais)
                List<String> hubIds = new ArrayList<>();
                String pId = delivery.getPickupLocationId() != null ? delivery.getPickupLocationId()
                                : delivery.getPickupNodeId();
                String dId = delivery.getDeliveryLocationId() != null ? delivery.getDeliveryLocationId()
                                : delivery.getDropoffNodeId();

                if (pId != null && pId.startsWith("RELAY_")) {
                        hubIds.add(pId);
                }
                if (dId != null && dId.startsWith("RELAY_")) {
                        hubIds.add(dId);
                }

                Mono<List<LocationDTO>> hubsMono = Flux.fromIterable(hubIds)
                                .flatMap(id -> nodeRepository.findById(id)
                                                .map(node -> LocationDTO.builder()
                                                                .latitude(node.getLatitude())
                                                                .longitude(node.getLongitude())
                                                                .address(node.getName())
                                                                .build()))
                                .collectList();

                return Mono.zip(
                                resolveLocation(pId, delivery.getSenderAddress())
                                                .defaultIfEmpty(new LocationDTO()),
                                resolveLocation(dId, delivery.getRecipientAddress())
                                                .defaultIfEmpty(new LocationDTO()),
                                driverLocMono,
                                hubsMono,
                                driverMono.defaultIfEmpty(new Driver()))
                                .map(tuple -> {
                                        LocationDTO pickup = tuple.getT1();
                                        LocationDTO deliveryLoc = tuple.getT2();
                                        LocationDTO driverLocation = tuple.getT3();
                                        List<LocationDTO> hubs = tuple.getT4();
                                        Driver driverData = tuple.getT5();

                                        if (pickup.getLatitude() != null)
                                                builder.pickupLocation(pickup);
                                        if (deliveryLoc.getLatitude() != null)
                                                builder.deliveryLocation(deliveryLoc);
                                        if (driverLocation.getLatitude() != null)
                                                builder.driverLocation(driverLocation);

                                        if (driverData != null) {
                                                builder.driverName(driverData.getName());
                                                builder.driverPhone(driverData.getPhone());
                                                builder.licensePlate(driverData.getLicensePlate());
                                        }

                                        builder.hubs(hubs);

                                        return builder;
                                })
                                .flatMap(b -> {
                                        // On enrichit systématiquement avec l'itinéraire et l'ETA (si disponible)
                                        // Cela permet de voir le trajet projeté même pour les livraisons en attente
                                        return enrichWithRouteAndETAReactive(delivery, b);
                                });
        }

        /**
         * Mapping Delivery → TrackingInfoDTO (OBSOLÈTE, pour compatibilité temporaire
         * si nécessaire)
         */
        private TrackingInfoDTO mapToTrackingDTO(Delivery delivery) {
                // Cette méthode est maintenant dépréciée au profit de la version réactive
                return mapToTrackingDTOReactive(delivery).block();
        }

        /**
         * Enrichit de manière réactive les données de tracking avec l'itinéraire et
         * l'ETA
         */
        private Mono<TrackingInfoDTO> enrichWithRouteAndETAReactive(Delivery delivery,
                        TrackingInfoDTO.TrackingInfoDTOBuilder builder) {
                String originId = delivery.getPickupLocationId() != null ? delivery.getPickupLocationId()
                                : delivery.getPickupNodeId();
                String destId = delivery.getDeliveryLocationId() != null ? delivery.getDeliveryLocationId()
                                : delivery.getDropoffNodeId();

                if (originId == null || destId == null) {
                        return Mono.just(builder.build());
                }

                // Préparer la requête d'itinéraire
                ShortestPathRequest routeRequest = ShortestPathRequest.builder()
                                .origin(originId)
                                .destination(destId)
                                .driverId(delivery.getDriverId())
                                .timestamp(Instant.now())
                                .costWeights(ShortestPathRequest.CostWeights.builder()
                                                .alpha(1.0).beta(1.5).gamma(1.0).delta(1.2).eta(1.0)
                                                .build())
                                .build();

                // Calculer l'itinéraire reactively
                Mono<TrackingInfoDTO.TrackingInfoDTOBuilder> routeMono = shortestPathService
                                .calculateShortestPath(routeRequest)
                                .doOnNext(path -> log.debug("Calculated path for {}: {} nodes, {} km",
                                                delivery.getTrackingCode(),
                                                path.getPath() != null ? path.getPath().size() : 0,
                                                path.getDistance()))
                                .flatMap(pathResponse -> {
                                        if (pathResponse == null || (pathResponse.getPath() == null
                                                        && pathResponse.getGeometryPath() == null)) {
                                                log.warn("Path not found for delivery {}", delivery.getTrackingCode());
                                                return Mono.just(builder);
                                        }

                                        log.info("Path found for {}: size={}, distance={}",
                                                        delivery.getTrackingCode(),
                                                        pathResponse.getPath() != null ? pathResponse.getPath().size()
                                                                        : 0,
                                                        pathResponse.getDistance());

                                        // Si on a déjà la géométrie détaillée (routes réelles), on l'utilise
                                        // directement
                                        if (pathResponse.getGeometryPath() != null
                                                        && !pathResponse.getGeometryPath().isEmpty()) {
                                                builder.routePath(pathResponse.getGeometryPath());
                                                builder.totalDistance(pathResponse.getDistance());
                                                log.debug("Enriched tracking info for {} with {} detailed road points",
                                                                delivery.getTrackingCode(),
                                                                pathResponse.getGeometryPath().size());
                                                return Mono.just(builder);
                                        }

                                        // Sinon (fallback), on résout les nodes un par un
                                        // (lignes droites entre nodes)
                                        // Utilisation de concatMap pour préserver l'ordre du
                                        // trajet
                                        return Flux.fromIterable(pathResponse.getPath())
                                                        .concatMap(nodeId -> resolveLocation(
                                                                        nodeId, null)
                                                                        .doOnNext(loc -> {
                                                                                if (loc.getLatitude() == null) {
                                                                                        log.warn("Failed to resolved coordinates for node {} in path of {}",
                                                                                                        nodeId,
                                                                                                        delivery.getTrackingCode());
                                                                                }
                                                                        }))
                                                        .collectList()
                                                        .map(locations -> {
                                                                List<List<Double>> routePath = new ArrayList<>();
                                                                for (LocationDTO loc : locations) {
                                                                        if (loc != null && loc
                                                                                        .getLatitude() != null) {
                                                                                routePath.add(Arrays.asList(
                                                                                                loc.getLatitude(),
                                                                                                loc.getLongitude()));
                                                                        }
                                                                }

                                                                if (routePath.isEmpty()) {
                                                                        log.warn("Empty route path coordinates for {}. Nodes in path: {}",
                                                                                        delivery.getTrackingCode(),
                                                                                        pathResponse.getPath());
                                                                } else {
                                                                        builder.routePath(
                                                                                        routePath);
                                                                        builder.totalDistance(
                                                                                        pathResponse.getDistance());
                                                                        log.info("Enriched tracking info for {} with {} node-to-node points",
                                                                                        delivery.getTrackingCode(),
                                                                                        routePath.size());
                                                                }
                                                                return builder;
                                                        });
                                })
                                .onErrorResume(e -> {
                                        log.error("Error calculating path for delivery {}: {}",
                                                        delivery.getTrackingCode(), e.getMessage());
                                        return Mono.just(builder); // Ne pas bloquer tout le tracking si l'itinéraire
                                                                   // échoue
                                })
                                .defaultIfEmpty(builder);

                // Récupérer les stats ETA reactively
                Mono<TrackingInfoDTO.TrackingInfoDTOBuilder> etaMono = etaService.getLatestStats(delivery.getId())
                                .map(etaStats -> {
                                        if (etaStats != null) {
                                                builder.remainingDistance(etaStats.getRemainingDistance());
                                                builder.estimatedArrival(etaStats.getEtaMin());

                                                if (etaStats.getKalmanState() != null) {
                                                        double distCovered = etaStats.getKalmanState()
                                                                        .getDistanceCovered();
                                                        builder.progressPercentage(
                                                                        Math.min(100.0, distCovered * 100.0));
                                                }
                                        }
                                        return builder;
                                })
                                .defaultIfEmpty(builder);

                return Mono.zip(routeMono, etaMono)
                                .map(tuple -> tuple.getT1().build());
        }

        /**
         * Résout une localisation par son ID de manière réactive
         */
        private Mono<LocationDTO> resolveLocation(String locationId, String address) {
                if (locationId == null || locationId.isEmpty()) {
                        return Mono.empty();
                }

                // Cas de coordonnées directes "lat,lng"
                try {
                        if (locationId.contains(",")) {
                                String[] parts = locationId.split(",");
                                if (parts.length == 2) {
                                        double latitude = Double.parseDouble(parts[0].trim());
                                        double longitude = Double.parseDouble(parts[1].trim());
                                        return Mono.just(LocationDTO.builder()
                                                        .latitude(latitude)
                                                        .longitude(longitude)
                                                        .address(address)
                                                        .build());
                                }
                        }
                } catch (Exception e) {
                        log.debug("Not direct coordinates: {}", locationId);
                }

                // Cas d'un ID de noeud (Point Relais ou autre noeud du graphe)
                return nodeRepository.findById(locationId)
                                .map(node -> LocationDTO.builder()
                                                .latitude(node.getLatitude())
                                                .longitude(node.getLongitude())
                                                .address(node.getName())
                                                .build())
                                .doOnError(e -> log.warn("Failed to resolve node {} from repository: {}",
                                                locationId, e.getMessage()))
                                .onErrorResume(e -> Mono.empty());
        }
}
