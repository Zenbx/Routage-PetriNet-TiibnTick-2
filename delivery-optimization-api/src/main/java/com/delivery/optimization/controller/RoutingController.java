package com.delivery.optimization.controller;

import com.delivery.optimization.dto.ShortestPathRequest;
import com.delivery.optimization.dto.ShortestPathResponse;
import com.delivery.optimization.dto.TrafficUpdateRequest;
import com.delivery.optimization.service.ShortestPathService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/routing")
@RequiredArgsConstructor
public class RoutingController {

    private final ShortestPathService shortestPathService;

    @PostMapping("/shortest-path")
    public Mono<ShortestPathResponse> getShortestPath(@RequestBody ShortestPathRequest request) {
        return shortestPathService.calculateShortestPath(request);
    }

    @PostMapping("/arcs/{id}/traffic")
    public Mono<Void> updateArcTraffic(@PathVariable Long id, @RequestBody TrafficUpdateRequest request) {
        return shortestPathService.updateArcTraffic(id, request.getTrafficFactor());
    }
}
