package com.delivery.optimization.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import java.time.Duration;

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
     * Crée un réseau de Petri coloré temporisé pour le workflow de livraison.
     * Format complet avec places, transitions, arcs et marquage initial.
     */
    public Mono<String> createDeliveryWorkflowNet(String deliveryId) {
        log.info("Creating full Petri Net workflow for delivery: {}", deliveryId);

        // Définition complète du réseau Petri
        Map<String, Object> netDto = new HashMap<>();
        netDto.put("id", deliveryId);
        netDto.put("name", "Delivery Workflow - " + deliveryId);

        // Places (États)
        List<Map<String, Object>> places = List.of(
                Map.of("id", "ASSIGNED", "colorType", "delivery"),
                Map.of("id", "PICKED_UP", "colorType", "delivery"),
                Map.of("id", "IN_TRANSIT", "colorType", "delivery"),
                Map.of("id", "DELIVERED", "colorType", "delivery"),
                Map.of("id", "DELAYED", "colorType", "delivery"));
        netDto.put("places", places);

        // Transitions
        List<Map<String, Object>> transitions = List.of(
                Map.of("id", "START", "var", "delivery", "minTime", 0.0, "maxTime", 0.0),
                Map.of("id", "DEPART", "var", "delivery", "minTime", 0.0, "maxTime", 0.0),
                Map.of("id", "COMPLETE", "var", "delivery", "minTime", 0.0, "maxTime", 0.0),
                Map.of("id", "DELAY", "var", "delivery", "minTime", 0.0, "maxTime", 0.0),
                Map.of("id", "RESUME", "var", "delivery", "minTime", 0.0, "maxTime", 0.0));
        netDto.put("transitions", transitions);

        // Arcs (Connexions)
        List<Map<String, Object>> arcs = List.of(
                // Workflow normal
                Map.of("source", "ASSIGNED", "target", "START", "weight", 1, "var", "delivery"),
                Map.of("source", "START", "target", "PICKED_UP", "weight", 1, "var", "delivery"),
                Map.of("source", "PICKED_UP", "target", "DEPART", "weight", 1, "var", "delivery"),
                Map.of("source", "DEPART", "target", "IN_TRANSIT", "weight", 1, "var", "delivery"),
                Map.of("source", "IN_TRANSIT", "target", "COMPLETE", "weight", 1, "var", "delivery"),
                Map.of("source", "COMPLETE", "target", "DELIVERED", "weight", 1, "var", "delivery"),
                // Gestion retards
                Map.of("source", "ASSIGNED", "target", "DELAY", "weight", 1, "var", "delivery"),
                Map.of("source", "PICKED_UP", "target", "DELAY", "weight", 1, "var", "delivery"),
                Map.of("source", "IN_TRANSIT", "target", "DELAY", "weight", 1, "var", "delivery"),
                Map.of("source", "DELAY", "target", "DELAYED", "weight", 1, "var", "delivery"),
                Map.of("source", "DELAYED", "target", "RESUME", "weight", 1, "var", "delivery"),
                Map.of("source", "RESUME", "target", "IN_TRANSIT", "weight", 1, "var", "delivery"));
        netDto.put("arcs", arcs);

        // Marquage initial (token dans ASSIGNED)
        Map<String, List<Map<String, Object>>> initialMarking = new HashMap<>();
        initialMarking.put("ASSIGNED", List.of(Map.of("type", "delivery", "value", deliveryId)));
        netDto.put("initialMarking", initialMarking);

        return petriNetWebClient.post()
                .uri("/api/nets")
                .bodyValue(netDto)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(10))
                .doOnSuccess(id -> log.info("Created complete Petri Net for delivery workflow: {}", id))
                .doOnError(error -> log.error("Failed to create Petri Net: {}", error.getMessage()))
                .onErrorResume(error -> {
                    log.warn("Petri Net API unavailable, proceeding without formal state management");
                    return Mono.just(deliveryId); // Fallback: continue without Petri Net
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
                .timeout(Duration.ofSeconds(10))
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
    @SuppressWarnings("unchecked")
    public Mono<Map<String, Object>> getNetState(String deliveryId) {
        return petriNetWebClient.get()
                .uri("/api/nets/{id}", deliveryId)
                .retrieve()
                .bodyToMono(Map.class)
                .timeout(Duration.ofSeconds(5))
                .map(map -> (Map<String, Object>) map)
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
                .timeout(Duration.ofSeconds(3))
                .map(response -> "UP".equals(response))
                .doOnSuccess(available -> log.info("Petri Net API available: {}", available))
                .onErrorResume(error -> {
                    log.warn("Petri Net API not available: {}", error.getMessage());
                    return Mono.just(false);
                });
    }
}
