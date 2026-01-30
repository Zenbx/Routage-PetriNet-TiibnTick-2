package com.delivery.optimization.service;

import com.delivery.optimization.algorithm.VRPSolver;
import com.delivery.optimization.dto.TourOptimizationRequest;
import com.delivery.optimization.dto.TourOptimizationResponse;
import com.delivery.optimization.repository.NodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class VRPOptimizationService {

        private final VRPSolver vrpSolver;
        private final NodeRepository nodeRepository;

        public Mono<TourOptimizationResponse> optimizeTour(TourOptimizationRequest request) {
                return nodeRepository.findAvailableRelays()
                                .collectList()
                                .map(relays -> vrpSolver.solve(request, relays));
        }
}
