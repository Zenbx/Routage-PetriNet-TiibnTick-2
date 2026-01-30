package com.delivery.optimization.service;

import com.delivery.optimization.domain.Arc;
import com.delivery.optimization.repository.ArcRepository;
import com.delivery.optimization.repository.NodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.Random;

@Service
@RequiredArgsConstructor
public class GraphService {

    private final NodeRepository nodeRepository;
    private final ArcRepository arcRepository;

    public Mono<Void> initializeGraph() {
        // Logic to reset or seed the graph if necessary
        return Mono.empty();
    }

    public Mono<Arc> updateArcCost(Long arcId, Double newCost) {
        return arcRepository.findById(arcId)
                .flatMap(arc -> {
                    arc.setWeatherImpact(newCost);
                    return arcRepository.save(arc);
                });
    }

    public Mono<Void> simulateTraffic() {
        Random rand = new Random();
        return arcRepository.findAll()
                .flatMap(arc -> {
                    // Randomly increase penibility on 30% of arcs
                    if (rand.nextDouble() < 0.3) {
                        arc.setPenibility(Math.min(1.0, arc.getPenibility() + 0.4));
                        return arcRepository.save(arc);
                    }
                    return Mono.just(arc);
                }, 5)
                .then();
    }

    public Mono<Void> applyRain(boolean active) {
        double penalty = active ? 0.5 : 0.0; // Section 3.3.5 phi_pluie
        return arcRepository.findAll()
                .flatMap(arc -> {
                    arc.setWeatherImpact(penalty);
                    return arcRepository.save(arc);
                }, 5)
                .then();
    }

    public Mono<Void> simulateReroute() {
        // Reset costs to baseline to simulate a "fresh" routing environment
        // Using a concurrency limit to prevent connection pool exhaustion
        return arcRepository.findAll()
                .flatMap(arc -> {
                    arc.setPenibility(0.0);
                    arc.setWeatherImpact(0.0);
                    arc.setTrafficFactor(1.0);
                    return arcRepository.save(arc);
                }, 5) // Concurrency limit
                .then();
    }
}
