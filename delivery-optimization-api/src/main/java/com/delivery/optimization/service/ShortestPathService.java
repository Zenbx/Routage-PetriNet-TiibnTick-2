package com.delivery.optimization.service;

import com.delivery.optimization.algorithm.AStar;
import com.delivery.optimization.algorithm.CostFunction;
import com.delivery.optimization.domain.Arc;
import com.delivery.optimization.domain.Node;
import com.delivery.optimization.dto.ShortestPathRequest;
import com.delivery.optimization.dto.ShortestPathResponse;
import com.delivery.optimization.repository.ArcRepository;
import com.delivery.optimization.repository.NodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShortestPathService {

    private final NodeRepository nodeRepository;
    private final ArcRepository arcRepository;
    private final AStar aStar;

    public Mono<ShortestPathResponse> calculateShortestPath(ShortestPathRequest request) {
        return Mono.zip(
                nodeRepository.findAll().collectMap(Node::getId, Function.identity()),
                arcRepository.findAll().collect(Collectors.groupingBy(Arc::getOriginId))).flatMap(tuple -> {
                    Map<String, Node> nodes = tuple.getT1();
                    Map<String, List<Arc>> adjacencyList = tuple.getT2();

                    CostFunction.Weights weights = CostFunction.Weights.builder()
                            .alpha(request.getCostWeights().getAlpha())
                            .beta(request.getCostWeights().getBeta())
                            .gamma(request.getCostWeights().getGamma())
                            .delta(request.getCostWeights().getDelta())
                            .eta(request.getCostWeights().getEta())
                            .build();

                    AStar.PathResult result = aStar.findPath(
                            request.getOrigin(),
                            request.getDestination(),
                            nodes,
                            adjacencyList,
                            weights);

                    if (result == null) {
                        return Mono.error(new RuntimeException("Path not found"));
                    }

                    double totalDistance = 0.0;
                    double estimatedTime = 0.0;
                    double totalPenibilityCost = 0.0;
                    double totalWeatherCost = 0.0;
                    double totalFuelCost = 0.0;

                    List<String> pathNodes = result.getPath();

                    for (int i = 0; i < pathNodes.size() - 1; i++) {
                        String from = pathNodes.get(i);
                        String to = pathNodes.get(i + 1);
                        List<Arc> outgoing = adjacencyList.getOrDefault(from, List.of());
                        Arc edge = outgoing.stream()
                                .filter(a -> a.getDestinationId().equals(to))
                                .findFirst()
                                .orElse(null);
                        if (edge != null) {
                            totalDistance += edge.getDistance();
                            estimatedTime += edge.getTravelTime()
                                    * (edge.getTrafficFactor() != null ? edge.getTrafficFactor() : 1.0);

                            totalPenibilityCost += edge.getPenibility() * weights.getGamma();
                            totalWeatherCost += edge.getWeatherImpact() * weights.getDelta();
                            totalFuelCost += edge.getFuelCost() * weights.getEta();
                        }
                    }

                    Map<String, Double> breakdown = Map.of(
                            "Distance", totalDistance * weights.getAlpha(),
                            "Time", estimatedTime * weights.getBeta(),
                            "Penibility", totalPenibilityCost,
                            "Weather", totalWeatherCost,
                            "Fuel", totalFuelCost);

                    return Mono.just(ShortestPathResponse.builder()
                            .path(pathNodes)
                            .totalCost(result.getTotalCost())
                            .costBreakdown(breakdown)
                            .estimatedTime(estimatedTime)
                            .distance(totalDistance)
                            .build());
                });
    }

    public Mono<Void> updateArcTraffic(Long arcId, Double trafficFactor) {
        return arcRepository.findById(arcId)
                .flatMap(arc -> {
                    arc.setTrafficFactor(trafficFactor);
                    return arcRepository.save(arc);
                })
                .then();
    }
}
