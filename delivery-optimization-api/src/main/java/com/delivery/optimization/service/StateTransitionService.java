package com.delivery.optimization.service;

import com.delivery.optimization.domain.Delivery;
import com.delivery.optimization.repository.DeliveryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import java.time.Instant;
import java.util.Map;

/**
 * Service de gestion des transitions d'état des livraisons
 * Utilise l'API Petri Net pour validation formelle des transitions
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class StateTransitionService {

    private final DeliveryRepository deliveryRepository;
    private final PetriNetClient petriNetClient;

    // Mapping entre statuts de livraison et transitions Petri Net
    private static final Map<String, String> STATUS_TO_TRANSITION = Map.of(
            "ASSIGNED", "ASSIGN",
            "IN_TRANSIT", "START",
            "DELIVERED", "COMPLETE",
            "FAILED", "FAIL"
    );

    /**
     * Effectue une transition d'état avec validation Petri Net
     * @param deliveryId ID de la livraison
     * @param newStatus Nouveau statut (PENDING, ASSIGNED, IN_TRANSIT, DELIVERED, FAILED)
     * @param timestamp Timestamp de la transition
     * @return La livraison mise à jour
     */
    public Mono<Delivery> transitionState(String deliveryId, String newStatus, Instant timestamp) {
        log.info("Transitioning delivery {} to status {}", deliveryId, newStatus);

        return deliveryRepository.findById(deliveryId)
                .flatMap(delivery -> {
                    try {
                        // Valider le nouveau statut
                        Delivery.DeliveryStatus status = Delivery.DeliveryStatus.valueOf(newStatus);
                        String oldStatus = delivery.getStatus().name();

                        // Obtenir la transition Petri Net correspondante
                        String transition = STATUS_TO_TRANSITION.get(newStatus);

                        // Si une transition existe, appeler l'API Petri Net pour validation
                        Mono<Void> petriNetValidation = transition != null
                                ? petriNetClient.fireTransition(deliveryId, transition)
                                : Mono.empty();

                        // Effectuer la transition après validation (ou sans si pas de transition)
                        return petriNetValidation
                                .then(Mono.defer(() -> {
                                    log.info("Petri Net validation passed for {} → {}", oldStatus, newStatus);
                                    delivery.setStatus(status);
                                    // Note: actualStartTime et actualEndTime ne sont pas dans Delivery
                                    // Le tracking temporel est géré via createdAt et ETA
                                    return deliveryRepository.save(delivery);
                                }));

                    } catch (IllegalArgumentException e) {
                        log.error("Invalid status value: {}", newStatus);
                        return Mono.error(new IllegalArgumentException("Invalid status: " + newStatus));
                    }
                })
                .doOnSuccess(delivery -> log.info("Successfully transitioned delivery {} to {}", deliveryId, newStatus))
                .doOnError(error -> log.error("Failed to transition delivery {}: {}", deliveryId, error.getMessage()));
    }

    /**
     * Initialise un réseau de Petri pour une nouvelle livraison
     * Devrait être appelé lors de la création d'une livraison
     */
    public Mono<Void> initializeDeliveryWorkflow(String deliveryId) {
        log.info("Initializing Petri Net workflow for delivery {}", deliveryId);
        return petriNetClient.createDeliveryWorkflowNet(deliveryId)
                .then()
                .doOnSuccess(v -> log.info("Petri Net workflow initialized for delivery {}", deliveryId))
                .doOnError(error -> log.warn("Failed to initialize Petri Net workflow: {}", error.getMessage()))
                .onErrorResume(error -> Mono.empty()); // Continue même si Petri Net échoue
    }
}
