package com.delivery.optimization.service;

import com.delivery.optimization.domain.Delivery;
import com.delivery.optimization.domain.HubDeposit;
import com.delivery.optimization.domain.Node;
import com.delivery.optimization.dto.HubDepositRequest;
import com.delivery.optimization.dto.HubDepositResponse;
import com.delivery.optimization.dto.HubInfoDTO;
import com.delivery.optimization.repository.DeliveryRepository;
import com.delivery.optimization.repository.HubDepositRepository;
import com.delivery.optimization.repository.NodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

/**
 * Service pour gérer les dépôts de colis aux hubs
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class HubDepositService {

        private final HubDepositRepository hubDepositRepository;
        private final NodeRepository nodeRepository;
        private final DeliveryRepository deliveryRepository;
        private final StateTransitionService stateTransitionService;
        private final WebSocketBroadcaster webSocketBroadcaster;
        private final NotificationService notificationService;

        /**
         * Obtenir la liste des hubs disponibles à proximité avec leur disponibilité
         */
        public Flux<HubInfoDTO> getNearbyHubs(Double currentLat, Double currentLng, Double radiusKm) {
                return nodeRepository.findByType(Node.NodeType.RELAY)
                                .flatMap(hub -> {
                                        // Calculer la distance
                                        double distance = calculateDistance(currentLat, currentLng, hub.getLatitude(),
                                                        hub.getLongitude());

                                        if (distance > radiusKm) {
                                                return Mono.empty();
                                        }

                                        // Obtenir le nombre de colis actuellement au hub
                                        return hubDepositRepository.countActiveDepositsAtHub(hub.getId())
                                                        .map(activeCount -> {
                                                                int availableSpace = hub.getCapacity()
                                                                                - activeCount.intValue();

                                                                return HubInfoDTO.builder()
                                                                                .id(hub.getId())
                                                                                .name(hub.getName())
                                                                                .address(hub.getName()) // TODO: ajouter
                                                                                                        // champ address
                                                                                                        // dans Node
                                                                                .latitude(hub.getLatitude())
                                                                                .longitude(hub.getLongitude())
                                                                                .capacity(hub.getCapacity())
                                                                                .currentOccupancy(
                                                                                                activeCount.intValue())
                                                                                .availableSpace(availableSpace)
                                                                                .distanceKm(distance)
                                                                                .isAvailable(availableSpace > 0)
                                                                                .build();
                                                        });
                                })
                                .sort((h1, h2) -> Double.compare(h1.getDistanceKm(), h2.getDistanceKm())); // Trier par
                                                                                                           // distance
        }

        /**
         * Déposer un colis au hub
         */
        public Mono<HubDepositResponse> depositPackageAtHub(HubDepositRequest request) {
                log.info("Processing hub deposit for delivery: {} at hub: {}", request.getDeliveryId(),
                                request.getHubNodeId());

                return deliveryRepository.findById(request.getDeliveryId())
                                .switchIfEmpty(
                                                Mono.error(new IllegalArgumentException(
                                                                "Delivery not found: " + request.getDeliveryId())))
                                .flatMap(delivery -> {
                                        // Valider que le livreur est bien assigné à cette livraison
                                        if (!request.getDriverId().equals(delivery.getDriverId())) {
                                                return Mono.error(new IllegalArgumentException(
                                                                "Driver not assigned to this delivery"));
                                        }

                                        // Valider le statut de la livraison
                                        if (delivery.getStatus() != Delivery.DeliveryStatus.PICKED_UP &&
                                                        delivery.getStatus() != Delivery.DeliveryStatus.IN_TRANSIT) {
                                                return Mono.error(new IllegalArgumentException(
                                                                "Invalid delivery status for hub deposit: "
                                                                                + delivery.getStatus()));
                                        }

                                        // Vérifier la disponibilité du hub
                                        return nodeRepository.findById(request.getHubNodeId())
                                                        .switchIfEmpty(Mono
                                                                        .error(new IllegalArgumentException(
                                                                                        "Hub not found: " + request
                                                                                                        .getHubNodeId())))
                                                        .flatMap(hub -> hubDepositRepository
                                                                        .countActiveDepositsAtHub(hub.getId())
                                                                        .flatMap(activeCount -> {
                                                                                if (activeCount >= hub.getCapacity()) {
                                                                                        return Mono.error(
                                                                                                        new IllegalArgumentException(
                                                                                                                        "Hub is at full capacity"));
                                                                                }

                                                                                // Créer l'enregistrement de dépôt
                                                                                HubDeposit deposit = HubDeposit
                                                                                                .builder()
                                                                                                .id(UUID.randomUUID()
                                                                                                                .toString())
                                                                                                .newEntity(true)
                                                                                                .deliveryId(delivery
                                                                                                                .getId())
                                                                                                .hubNodeId(hub.getId())
                                                                                                .depositedByDriverId(
                                                                                                                request.getDriverId())
                                                                                                .depositTime(Instant
                                                                                                                .now())
                                                                                                .status(HubDeposit.DepositStatus.DEPOSITED)
                                                                                                .notes(request.getNotes())
                                                                                                .storageLocation(request
                                                                                                                .getStorageLocation())
                                                                                                .depositProof(request
                                                                                                                .getDepositProof())
                                                                                                .build();

                                                                                return hubDepositRepository
                                                                                                .save(deposit)
                                                                                                .flatMap(savedDeposit -> {
                                                                                                        // Mettre à jour
                                                                                                        // le statut de
                                                                                                        // la livraison
                                                                                                        // à AT_HUB
                                                                                                        delivery.setStatus(
                                                                                                                        Delivery.DeliveryStatus.AT_HUB);
                                                                                                        delivery.setNewEntity(
                                                                                                                        false);

                                                                                                        return deliveryRepository
                                                                                                                        .save(delivery)
                                                                                                                        .flatMap(updatedDelivery -> {
                                                                                                                                // Notifier
                                                                                                                                // via
                                                                                                                                // WebSocket
                                                                                                                                webSocketBroadcaster
                                                                                                                                                .broadcastDeliveryUpdate(
                                                                                                                                                                delivery.getId(),
                                                                                                                                                                "DEPOSITED_AT_HUB",
                                                                                                                                                                "Colis déposé au hub: "
                                                                                                                                                                                + hub.getName());

                                                                                                                                // Construire
                                                                                                                                // la
                                                                                                                                // réponse
                                                                                                                                return Mono.just(
                                                                                                                                                HubDepositResponse
                                                                                                                                                                .builder()
                                                                                                                                                                .depositId(savedDeposit
                                                                                                                                                                                .getId())
                                                                                                                                                                .deliveryId(delivery
                                                                                                                                                                                .getId())
                                                                                                                                                                .trackingCode(delivery
                                                                                                                                                                                .getTrackingCode())
                                                                                                                                                                .hubNodeId(hub.getId())
                                                                                                                                                                .hubName(hub.getName())
                                                                                                                                                                .hubAddress(hub.getName()) // TODO:
                                                                                                                                                                                           // address
                                                                                                                                                                .status(savedDeposit
                                                                                                                                                                                .getStatus())
                                                                                                                                                                .depositTime(savedDeposit
                                                                                                                                                                                .getDepositTime())
                                                                                                                                                                .storageLocation(
                                                                                                                                                                                savedDeposit.getStorageLocation())
                                                                                                                                                                .message("Colis déposé avec succès au hub "
                                                                                                                                                                                + hub.getName())
                                                                                                                                                                .build());
                                                                                                                        });
                                                                                                });
                                                                        }));
                                })
                                .doOnSuccess(response -> log.info("Hub deposit successful: {}",
                                                response.getDepositId()))
                                .doOnError(error -> log.error("Hub deposit failed: {}", error.getMessage()));
        }

        /**
         * Obtenir tous les dépôts dans un hub spécifique
         */
        public Flux<HubDeposit> getDepositsAtHub(String hubNodeId, HubDeposit.DepositStatus status) {
                if (status != null) {
                        return hubDepositRepository.findByHubNodeIdAndStatus(hubNodeId, status);
                }
                return hubDepositRepository.findByHubNodeId(hubNodeId);
        }

        /**
         * Obtenir un dépôt par ID de livraison
         */
        public Mono<HubDeposit> getDepositByDeliveryId(String deliveryId) {
                return hubDepositRepository.findByDeliveryId(deliveryId);
        }

        /**
         * Récupérer un colis au hub avec vérification d'identité
         */
        public Mono<com.delivery.optimization.dto.HubPickupResponse> pickupPackageFromHub(
                        com.delivery.optimization.dto.HubPickupRequest request) {
                log.info("Processing hub pickup for tracking code: {}", request.getTrackingCode());

                return deliveryRepository.findByTrackingCode(request.getTrackingCode())
                                .switchIfEmpty(Mono
                                                .error(new IllegalArgumentException("Tracking code not found: "
                                                                + request.getTrackingCode())))
                                .flatMap(delivery -> {
                                        // Vérifier que l'identité correspond (téléphone du destinataire)
                                        if (!delivery.getRecipientPhone().equals(request.getPickupPhone())) {
                                                log.warn("Phone number mismatch for tracking code: {}",
                                                                request.getTrackingCode());
                                                return Mono.error(new IllegalArgumentException(
                                                                "Numéro de téléphone invalide. Veuillez fournir le téléphone du destinataire."));
                                        }

                                        // Récupérer le dépôt au hub
                                        return hubDepositRepository.findByDeliveryId(delivery.getId())
                                                        .switchIfEmpty(Mono.error(new IllegalArgumentException(
                                                                        "Ce colis n'est pas déposé à un hub")))
                                                        .flatMap(deposit -> {
                                                                // Vérifier le statut du dépôt
                                                                if (deposit.getStatus() == HubDeposit.DepositStatus.PICKED_UP) {
                                                                        return Mono.error(new IllegalArgumentException(
                                                                                        "Ce colis a déjà été récupéré"));
                                                                }

                                                                if (deposit.getStatus() != HubDeposit.DepositStatus.DEPOSITED
                                                                                &&
                                                                                deposit.getStatus() != HubDeposit.DepositStatus.AWAITING_PICKUP) {
                                                                        return Mono.error(new IllegalArgumentException(
                                                                                        "Ce colis n'est pas disponible à la récupération (statut: "
                                                                                                        +
                                                                                                        deposit.getStatus()
                                                                                                        + ")"));
                                                                }

                                                                // Mettre à jour le statut du dépôt
                                                                deposit.setStatus(HubDeposit.DepositStatus.PICKED_UP);
                                                                deposit.setPickupTime(Instant.now());
                                                                deposit.setPickupProof(request.getPickupProof());
                                                                deposit.setNewEntity(false);

                                                                return hubDepositRepository.save(deposit)
                                                                                .flatMap(updatedDeposit -> {
                                                                                        // Mettre à jour le statut de la
                                                                                        // livraison à IN_TRANSIT
                                                                                        delivery.setStatus(
                                                                                                        Delivery.DeliveryStatus.IN_TRANSIT);
                                                                                        delivery.setNewEntity(false);

                                                                                        return deliveryRepository
                                                                                                        .save(delivery)
                                                                                                        .flatMap(updatedDelivery -> nodeRepository
                                                                                                                        .findById(deposit
                                                                                                                                        .getHubNodeId())
                                                                                                                        .flatMap(hub -> {
                                                                                                                                // Notifier
                                                                                                                                // via
                                                                                                                                // WebSocket
                                                                                                                                webSocketBroadcaster
                                                                                                                                                .broadcastDeliveryUpdate(
                                                                                                                                                                delivery.getId(),
                                                                                                                                                                "PICKED_UP_FROM_HUB",
                                                                                                                                                                "Colis récupéré au hub: "
                                                                                                                                                                                + hub.getName());

                                                                                                                                // Construire
                                                                                                                                // la
                                                                                                                                // réponse
                                                                                                                                return Mono.just(
                                                                                                                                                com.delivery.optimization.dto.HubPickupResponse
                                                                                                                                                                .builder()
                                                                                                                                                                .success(true)
                                                                                                                                                                .depositId(updatedDeposit
                                                                                                                                                                                .getId())
                                                                                                                                                                .deliveryId(delivery
                                                                                                                                                                                .getId())
                                                                                                                                                                .trackingCode(
                                                                                                                                                                                delivery.getTrackingCode())
                                                                                                                                                                .hubName(hub.getName())
                                                                                                                                                                .pickupTime(
                                                                                                                                                                                updatedDeposit.getPickupTime())
                                                                                                                                                                .pickedUpBy(request
                                                                                                                                                                                .getPickupName())
                                                                                                                                                                .message("Colis récupéré avec succès")
                                                                                                                                                                .build());
                                                                                                                        })
                                                                                                                        .defaultIfEmpty(
                                                                                                                                        com.delivery.optimization.dto.HubPickupResponse
                                                                                                                                                        .builder()
                                                                                                                                                        .success(true)
                                                                                                                                                        .depositId(updatedDeposit
                                                                                                                                                                        .getId())
                                                                                                                                                        .deliveryId(delivery
                                                                                                                                                                        .getId())
                                                                                                                                                        .trackingCode(delivery
                                                                                                                                                                        .getTrackingCode())
                                                                                                                                                        .hubName("Hub")
                                                                                                                                                        .pickupTime(updatedDeposit
                                                                                                                                                                        .getPickupTime())
                                                                                                                                                        .pickedUpBy(request
                                                                                                                                                                        .getPickupName())
                                                                                                                                                        .message("Colis récupéré avec succès")
                                                                                                                                                        .build()));
                                                                                });
                                                        });
                                })
                                .doOnSuccess(response -> log.info("Hub pickup successful for tracking: {}",
                                                request.getTrackingCode()))
                                .doOnError(error -> log.error("Hub pickup failed: {}", error.getMessage()));
        }

        /**
         * Vérifier si un colis est disponible au hub (masque les données sensibles)
         */
        public Mono<com.delivery.optimization.dto.HubParcelInfoDTO> checkParcelAtHub(String trackingCode) {
                return deliveryRepository.findByTrackingCode(trackingCode)
                                .switchIfEmpty(Mono.error(new IllegalArgumentException("Tracking code not found")))
                                .flatMap(delivery -> hubDepositRepository.findByDeliveryId(delivery.getId())
                                                .flatMap(deposit -> nodeRepository.findById(deposit.getHubNodeId())
                                                                .map(hub -> {
                                                                        // Masquer les données sensibles
                                                                        String maskedPhone = maskPhoneNumber(
                                                                                        delivery.getRecipientPhone());
                                                                        String maskedName = maskName(
                                                                                        delivery.getRecipientName());

                                                                        return com.delivery.optimization.dto.HubParcelInfoDTO
                                                                                        .builder()
                                                                                        .trackingCode(delivery
                                                                                                        .getTrackingCode())
                                                                                        .hubName(hub.getName())
                                                                                        .recipientNameMasked(maskedName)
                                                                                        .recipientPhoneMasked(
                                                                                                        maskedPhone)
                                                                                        .status(deposit.getStatus())
                                                                                        .storageLocation(deposit
                                                                                                        .getStorageLocation())
                                                                                        .availableForPickup(deposit
                                                                                                        .getStatus() == HubDeposit.DepositStatus.DEPOSITED
                                                                                                        ||
                                                                                                        deposit.getStatus() == HubDeposit.DepositStatus.AWAITING_PICKUP)
                                                                                        .depositTime(deposit
                                                                                                        .getDepositTime()
                                                                                                        .toString())
                                                                                        .packageDescription(delivery
                                                                                                        .getPackageDescription())
                                                                                        .build();
                                                                }))
                                                .switchIfEmpty(Mono.error(
                                                                new IllegalArgumentException("Package not at hub"))));
        }

        /**
         * Masquer le numéro de téléphone (ex: +237 6** *** **2)
         */
        private String maskPhoneNumber(String phone) {
                if (phone == null || phone.length() < 4)
                        return "***";

                String start = phone.substring(0, Math.min(phone.length(), 7));
                String end = phone.substring(phone.length() - 1);
                return start + "** *** **" + end;
        }

        /**
         * Masquer le nom (ex: John D****)
         */
        private String maskName(String name) {
                if (name == null || name.isEmpty())
                        return "***";

                String[] parts = name.split(" ");
                if (parts.length == 0)
                        return "***";

                String firstName = parts[0];
                String lastName = parts.length > 1 ? parts[1].substring(0, 1) + "****" : "";

                return firstName + " " + lastName;
        }

        /**
         * Calculer la distance entre deux points GPS (formule Haversine)
         */
        private double calculateDistance(Double lat1, Double lon1, Double lat2, Double lon2) {
                final int R = 6371; // Rayon de la Terre en km

                double latDistance = Math.toRadians(lat2 - lat1);
                double lonDistance = Math.toRadians(lon2 - lon1);
                double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                                                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
                double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

                return R * c; // Distance en kilomètres
        }
}
