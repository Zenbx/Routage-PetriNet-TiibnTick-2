package com.delivery.optimization.controller;

import com.delivery.optimization.domain.Arc;
import com.delivery.optimization.domain.Node;
import com.delivery.optimization.repository.ArcRepository;
import com.delivery.optimization.repository.NodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import com.delivery.optimization.service.GraphService;

@RestController
@RequestMapping("/api/v1/graph")
@RequiredArgsConstructor
public class GraphController {

    private final NodeRepository nodeRepository;
    private final ArcRepository arcRepository;
    private final GraphService graphService;

    @PostMapping("/initialize")
    public Mono<Void> initialize() {
        return graphService.initializeGraph();
    }

    @GetMapping("/nodes")
    public Flux<Node> getNodes() {
        return nodeRepository.findAll();
    }

    @GetMapping("/arcs")
    public Flux<Arc> getArcs() {
        return arcRepository.findAll();
    }

    @PutMapping("/arcs/{id}/cost")
    public Mono<Arc> updateArcCost(@PathVariable Long id, @RequestBody Double newCost) {
        return graphService.updateArcCost(id, newCost);
    }
}
