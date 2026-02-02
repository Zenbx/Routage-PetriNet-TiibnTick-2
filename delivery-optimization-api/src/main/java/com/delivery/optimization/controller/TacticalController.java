package com.delivery.optimization.controller;

import com.delivery.optimization.repository.ArcRepository;
import com.delivery.optimization.domain.Arc;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Contrôleur pour les simulations tactiques de congestion massive.
 * Permet de simuler différents scénarios: rush hour, accident, météo.
 */
@RestController
@RequestMapping("/api/v1/tactical")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Tactical Simulation", description = "Simulation de scénarios de congestion massive")
public class TacticalController {

    private final ArcRepository arcRepository;

    /**
     * Simule une heure de pointe avec congestion sur plusieurs zones.
     */
    @PostMapping("/scenario/rush-hour")
    @Operation(
        summary = "Simuler heure de pointe",
        description = "Applique un facteur de trafic élevé (3-5×) sur les zones: downtown, highway"
    )
    public Mono<Map<String, Object>> simulateRushHour() {
        log.info("Simulating rush hour scenario");

        return arcRepository.findAll()
                .filter(arc -> {
                    // Identifier les arcs de zones congestionnées
                    // Pour simplifier, on applique à tous les arcs avec pénibilité faible (routes principales)
                    return arc.getPenibility() != null && arc.getPenibility() < 2.0;
                })
                .flatMap(arc -> {
                    // Appliquer facteur de trafic 3-5×
                    double trafficFactor = 3.0 + Math.random() * 2.0;
                    arc.setTrafficFactor(trafficFactor);
                    arc.setLastUpdated(Instant.now());
                    return arcRepository.save(arc);
                })
                .collectList()
                .map(affectedArcs -> Map.of(
                        "scenario", "rush-hour",
                        "affectedArcs", affectedArcs.size(),
                        "trafficRange", "3.0-5.0×",
                        "message", "Heure de pointe simulée sur " + affectedArcs.size() + " arcs"
                ));
    }

    /**
     * Simule un accident majeur bloquant une route.
     */
    @PostMapping("/scenario/accident")
    @Operation(
        summary = "Simuler accident majeur",
        description = "Bloque complètement un arc aléatoire (trafficFactor = 10×)"
    )
    public Mono<Map<String, Object>> simulateAccident(
            @Parameter(description = "ID de l'arc à bloquer (optionnel, aléatoire si non spécifié)")
            @RequestParam(required = false) Long arcId
    ) {
        log.info("Simulating major accident on arc: {}", arcId);

        Mono<Arc> targetArcMono = arcId != null
                ? arcRepository.findById(arcId)
                : arcRepository.findAll()
                        .skip((long) (Math.random() * 100))
                        .next();

        return targetArcMono
                .flatMap(arc -> {
                    // Route bloquée!
                    arc.setTrafficFactor(10.0);
                    arc.setWeatherImpact(0.0); // Pas lié à la météo
                    arc.setLastUpdated(Instant.now());
                    return arcRepository.save(arc);
                })
                .map(blockedArc -> Map.of(
                        "scenario", "accident",
                        "affectedArc", blockedArc.getId(),
                        "origin", blockedArc.getOriginId(),
                        "destination", blockedArc.getDestinationId(),
                        "trafficFactor", 10.0,
                        "message", "Accident majeur simulé sur arc " + blockedArc.getId()
                ));
    }

    /**
     * Simule des conditions météo dégradées (pluie, neige).
     */
    @PostMapping("/scenario/weather")
    @Operation(
        summary = "Simuler conditions météo",
        description = "Applique un impact météo (2-4×) sur tous les arcs"
    )
    public Mono<Map<String, Object>> simulateWeather(
            @Parameter(description = "Intensité: light, moderate, severe")
            @RequestParam(defaultValue = "moderate") String intensity
    ) {
        log.info("Simulating weather scenario: {}", intensity);

        double weatherImpact = switch (intensity.toLowerCase()) {
            case "light" -> 1.0 + Math.random();        // 1-2×
            case "severe" -> 3.0 + Math.random() * 2.0;  // 3-5×
            default -> 2.0 + Math.random();              // 2-3× (moderate)
        };

        return arcRepository.findAll()
                .flatMap(arc -> {
                    arc.setWeatherImpact(weatherImpact);
                    arc.setLastUpdated(Instant.now());
                    return arcRepository.save(arc);
                })
                .collectList()
                .map(affectedArcs -> Map.of(
                        "scenario", "weather",
                        "intensity", intensity,
                        "affectedArcs", affectedArcs.size(),
                        "weatherImpact", String.format("%.1f×", weatherImpact),
                        "message", "Conditions météo " + intensity + " appliquées"
                ));
    }

    /**
     * Réinitialise tous les facteurs de trafic et météo à la normale.
     */
    @PostMapping("/reset")
    @Operation(
        summary = "Réinitialiser conditions",
        description = "Remet tous les arcs à des conditions normales (trafic et météo à 1.0)"
    )
    public Mono<Map<String, Object>> resetConditions() {
        log.info("Resetting all traffic and weather conditions");

        return arcRepository.findAll()
                .flatMap(arc -> {
                    arc.setTrafficFactor(1.0);
                    arc.setWeatherImpact(0.0);
                    arc.setLastUpdated(Instant.now());
                    return arcRepository.save(arc);
                })
                .collectList()
                .map(affectedArcs -> Map.of(
                        "scenario", "reset",
                        "affectedArcs", affectedArcs.size(),
                        "message", "Conditions réinitialisées à la normale"
                ));
    }

    /**
     * Injection ciblée de trafic sur une zone spécifique.
     */
    @PostMapping("/inject-congestion")
    @Operation(
        summary = "Injecter congestion ciblée",
        description = "Applique un facteur de trafic sur les arcs d'une zone définie par origine/destination"
    )
    public Mono<Map<String, Object>> injectCongestion(
            @RequestBody Map<String, Object> request
    ) {
        @SuppressWarnings("unchecked")
        List<String> targetNodes = (List<String>) request.get("targetNodes");
        Double trafficFactor = ((Number) request.getOrDefault("trafficFactor", 3.0)).doubleValue();

        log.info("Injecting congestion on nodes: {} with factor: {}", targetNodes, trafficFactor);

        return arcRepository.findAll()
                .filter(arc -> targetNodes.contains(arc.getOriginId())
                            || targetNodes.contains(arc.getDestinationId()))
                .flatMap(arc -> {
                    arc.setTrafficFactor(trafficFactor);
                    arc.setLastUpdated(Instant.now());
                    return arcRepository.save(arc);
                })
                .collectList()
                .map(affectedArcs -> Map.of(
                        "scenario", "targeted-congestion",
                        "affectedArcs", affectedArcs.size(),
                        "trafficFactor", trafficFactor,
                        "message", "Congestion appliquée sur " + affectedArcs.size() + " arcs"
                ));
    }

    /**
     * Récupère l'état actuel de tous les arcs avec leurs facteurs.
     */
    @GetMapping("/status")
    @Operation(
        summary = "État actuel du réseau",
        description = "Retourne tous les arcs avec leurs facteurs de trafic et météo actuels"
    )
    public Flux<Arc> getNetworkStatus() {
        return arcRepository.findAll();
    }
}
