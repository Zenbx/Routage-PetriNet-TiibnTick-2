package com.delivery.optimization.service;

import com.delivery.optimization.algorithm.VRPSolver;
import com.delivery.optimization.dto.TourOptimizationRequest;
import com.delivery.optimization.dto.TourOptimizationResponse;
import com.delivery.optimization.repository.ArcRepository;
import com.delivery.optimization.repository.NodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VRPOptimizationService {

    private final VRPSolver vrpSolver;
    private final NodeRepository nodeRepository;
    private final ArcRepository arcRepository;

    public Mono<TourOptimizationResponse> optimizeTour(TourOptimizationRequest request) {
        return Mono.zip(
                nodeRepository.findAvailableRelays().collectList(),
                nodeRepository.findAll().collectList(),
                arcRepository.findAll().collectList()
        ).map(tuple -> {
            var relays = tuple.getT1();
            var allNodesList = tuple.getT2();
            var allArcs = tuple.getT3();

            // Convertir la liste de nœuds en Map pour accès rapide
            java.util.Map<String, com.delivery.optimization.domain.Node> allNodesMap =
                    new java.util.HashMap<>();
            for (var node : allNodesList) {
                allNodesMap.put(node.getId(), node);
            }

            return vrpSolver.solve(request, relays, allNodesMap, allArcs);
        });
    }
}
