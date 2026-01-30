package com.delivery.optimization.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Client pour communiquer avec l'API Petri Net
 * Gère les transitions d'états des livraisons via un réseau de Petri formel
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class PetriNetClient {

    @Qualifier("petriNetWebClient")
    private final WebClient petriNetWebClient;

    /**
     * Crée un réseau de Petri pour le workflow de livraison
     * Places: PENDING → ASSIGNED → IN_TRANSIT → DELIVERED
     */
    public Mono<String> createDeliveryWorkflowNet(String netId) {
        Map<String, Object> netDto = new HashMap<>();
        netDto.put("id", netId);
        netDto.put("name", "Delivery Workflow");
        netDto.put("places", List.of("PENDING", "ASSIGNED", "IN_TRANSIT", "DELIVERED", "FAILED"));
        netDto.put("transitions", List.of(
                Map.of("id", "ASSIGN", "from", "PENDING", "to", "ASSIGNED"),
                Map.of("id", "START", "from", "ASSIGNED", "to", "IN_TRANSIT"),
                Map.of("id", "COMPLETE", "from", "IN_TRANSIT", "to", "DELIVERED"),
                Map.of("id", "FAIL", "from", "IN_TRANSIT", "to", "FAILED")
        ));

        return petriNetWebClient.post()
                .uri("/api/nets")
                .bodyValue(netDto)
                .retrieve()
                .bodyToMono(String.class)
                .doOnSuccess(id -> log.info("Created Petri Net for delivery workflow: {}", id))
                .doOnError(error -> log.error("Failed to create Petri Net: {}", error.getMessage()))
                .onErrorResume(error -> {
                    log.warn("Petri Net API unavailable, proceeding without formal state management");
                    return Mono.just(netId); // Fallback: continue without Petri Net
                });
    }

    /**
     * Déclenche une transition dans le réseau de Petri
     */
    public Mono<Void> fireTransition(String deliveryId, String transitionId) {
        // Binding vide pour les réseaux de Petri simples sans jetons colorés
        Map<String, List<Object>> binding = Collections.emptyMap();

        return petriNetWebClient.post()
                .uri("/api/nets/{id}/fire/{transitionId}", deliveryId, transitionId)
                .bodyValue(binding)
                .retrieve()
                .toBodilessEntity()
                .then()
                .doOnSuccess(v -> log.info("Fired transition {} for delivery {}", transitionId, deliveryId))
                .doOnError(error -> log.error("Failed to fire transition {}: {}", transitionId, error.getMessage()))
                .onErrorResume(error -> {
                    log.warn("Petri Net transition failed, continuing without formal validation");
                    return Mono.empty(); // Fallback: continue even if Petri Net fails
                });
    }

    /**
     * Obtient l'état actuel du réseau de Petri pour une livraison
     */
    public Mono<Map<String, Object>> getNetState(String deliveryId) {
        return petriNetWebClient.get()
                .uri("/api/nets/{id}", deliveryId)
                .retrieve()
                .bodyToMono(Map.class)
                .doOnSuccess(state -> log.debug("Retrieved Petri Net state for delivery {}: {}", deliveryId, state))
                .doOnError(error -> log.error("Failed to get Petri Net state: {}", error.getMessage()))
                .onErrorResume(error -> Mono.just(Collections.emptyMap()));
    }

    /**
     * Vérifie si l'API Petri Net est disponible
     */
    public Mono<Boolean> isAvailable() {
        return petriNetWebClient.get()
                .uri("/api/nets/health")
                .retrieve()
                .bodyToMono(String.class)
                .map(response -> "UP".equals(response))
                .doOnSuccess(available -> log.info("Petri Net API available: {}", available))
                .onErrorResume(error -> {
                    log.warn("Petri Net API not available: {}", error.getMessage());
                    return Mono.just(false);
                });
    }
}
