package com.delivery.optimization.controller;

import com.delivery.optimization.dto.TourOptimizationRequest;
import com.delivery.optimization.dto.TourOptimizationResponse;
import com.delivery.optimization.service.VRPOptimizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/tours")
@RequiredArgsConstructor
public class TourController {

    private final VRPOptimizationService vrpOptimizationService;

    @PostMapping("/optimize")
    public Mono<TourOptimizationResponse> optimizeTour(@RequestBody TourOptimizationRequest request) {
        return vrpOptimizationService.optimizeTour(request);
    }
}
