package com.delivery.optimization.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.*;

/**
 * Service d'initialisation automatique des réseaux de Petri pour les livraisons.
 * Crée un réseau Petri pour valider les transitions d'état de chaque livraison.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PetriNetInitializationService {

    private final WebClient.Builder webClientBuilder;

    @Value("${petri-net.api.url:http://localhost:8081}")
    private String petriNetApiUrl;

    /**
     * Crée un réseau Petri pour une livraison avec les états et transitions standards.
     *
     * États possibles:
     * - ASSIGNED: Livraison assignée à un chauffeur
     * - PICKED_UP: Colis récupéré par le chauffeur
     * - IN_TRANSIT: En cours de livraison
     * - DELIVERED: Livré avec succès
     * - DELAYED: Retardé (état d'exception)
     *
     * Transitions:
     * - START: ASSIGNED → PICKED_UP
     * - DEPART: PICKED_UP → IN_TRANSIT
     * - COMPLETE: IN_TRANSIT → DELIVERED
     * - DELAY: * → DELAYED (depuis n'importe quel état)
     * - RESUME: DELAYED → état précédent
     */
    public Mono<String> initializePetriNetForDelivery(String deliveryId) {
        log.info("Initializing Petri Net for delivery: {}", deliveryId);

        // Définition du réseau Petri
        Map<String, Object> netDto = new HashMap<>();
        netDto.put("id", deliveryId);
        netDto.put("name", "Delivery Workflow - " + deliveryId);

        // Places (États)
        List<Map<String, Object>> places = new ArrayList<>();
        places.add(createPlace("ASSIGNED", "delivery", 1)); // État initial avec 1 token
        places.add(createPlace("PICKED_UP", "delivery", 0));
        places.add(createPlace("IN_TRANSIT", "delivery", 0));
        places.add(createPlace("DELIVERED", "delivery", 0));
        places.add(createPlace("DELAYED", "delivery", 0));
        netDto.put("places", places);

        // Transitions
        List<Map<String, Object>> transitions = new ArrayList<>();
        transitions.add(createTransition("START", "delivery", 0.0, 0.0));
        transitions.add(createTransition("DEPART", "delivery", 0.0, 0.0));
        transitions.add(createTransition("COMPLETE", "delivery", 0.0, 0.0));
        transitions.add(createTransition("DELAY", "delivery", 0.0, 0.0));
        transitions.add(createTransition("RESUME", "delivery", 0.0, 0.0));
        netDto.put("transitions", transitions);

        // Arcs (Connexions)
        List<Map<String, Object>> arcs = new ArrayList<>();

        // Workflow normal: ASSIGNED → PICKED_UP → IN_TRANSIT → DELIVERED
        arcs.add(createArc("ASSIGNED", "START", 1, "delivery"));
        arcs.add(createArc("START", "PICKED_UP", 1, "delivery"));

        arcs.add(createArc("PICKED_UP", "DEPART", 1, "delivery"));
        arcs.add(createArc("DEPART", "IN_TRANSIT", 1, "delivery"));

        arcs.add(createArc("IN_TRANSIT", "COMPLETE", 1, "delivery"));
        arcs.add(createArc("COMPLETE", "DELIVERED", 1, "delivery"));

        // Gestion des retards (depuis n'importe quel état)
        arcs.add(createArc("ASSIGNED", "DELAY", 1, "delivery"));
        arcs.add(createArc("PICKED_UP", "DELAY", 1, "delivery"));
        arcs.add(createArc("IN_TRANSIT", "DELAY", 1, "delivery"));
        arcs.add(createArc("DELAY", "DELAYED", 1, "delivery"));

        // Reprise après retard
        arcs.add(createArc("DELAYED", "RESUME", 1, "delivery"));
        arcs.add(createArc("RESUME", "IN_TRANSIT", 1, "delivery"));

        netDto.put("arcs", arcs);

        // Marquage initial
        Map<String, List<Map<String, Object>>> initialMarking = new HashMap<>();
        List<Map<String, Object>> assignedTokens = new ArrayList<>();
        assignedTokens.add(createToken("delivery", deliveryId));
        initialMarking.put("ASSIGNED", assignedTokens);
        netDto.put("initialMarking", initialMarking);

        // Créer le réseau via l'API Petri Net
        return webClientBuilder.build()
                .post()
                .uri(petriNetApiUrl + "/api/nets")
                .bodyValue(netDto)
                .retrieve()
                .bodyToMono(String.class)
                .doOnSuccess(id -> log.info("Petri Net created for delivery {}: {}", deliveryId, id))
                .doOnError(error -> log.error("Failed to create Petri Net for delivery {}: {}",
                        deliveryId, error.getMessage()))
                .onErrorResume(error -> {
                    log.warn("Petri Net creation failed, continuing without validation for {}", deliveryId);
                    return Mono.just("ERROR");
                });
    }

    /**
     * Déclenche une transition dans le réseau Petri d'une livraison.
     */
    public Mono<Void> fireTransition(String deliveryId, String transitionId) {
        log.info("Firing transition {} for delivery {}", transitionId, deliveryId);

        Map<String, List<Map<String, Object>>> binding = new HashMap<>();
        List<Map<String, Object>> tokens = new ArrayList<>();
        tokens.add(createToken("delivery", deliveryId));
        binding.put("delivery", tokens);

        return webClientBuilder.build()
                .post()
                .uri(petriNetApiUrl + "/api/nets/" + deliveryId + "/fire/" + transitionId)
                .bodyValue(binding)
                .retrieve()
                .bodyToMono(Void.class)
                .doOnSuccess(v -> log.info("Transition {} fired successfully for {}", transitionId, deliveryId))
                .doOnError(error -> log.error("Failed to fire transition {} for {}: {}",
                        transitionId, deliveryId, error.getMessage()))
                .onErrorResume(error -> Mono.empty());
    }

    private Map<String, Object> createPlace(String id, String colorType, int initialTokens) {
        Map<String, Object> place = new HashMap<>();
        place.put("id", id);
        place.put("colorType", colorType);
        return place;
    }

    private Map<String, Object> createTransition(String id, String var, double minTime, double maxTime) {
        Map<String, Object> transition = new HashMap<>();
        transition.put("id", id);
        transition.put("var", var);
        transition.put("minTime", minTime);
        transition.put("maxTime", maxTime);
        return transition;
    }

    private Map<String, Object> createArc(String source, String target, int weight, String var) {
        Map<String, Object> arc = new HashMap<>();
        arc.put("source", source);
        arc.put("target", target);
        arc.put("weight", weight);
        arc.put("var", var);
        return arc;
    }

    private Map<String, Object> createToken(String type, String value) {
        Map<String, Object> token = new HashMap<>();
        token.put("type", type);
        token.put("value", value);
        return token;
    }
}
