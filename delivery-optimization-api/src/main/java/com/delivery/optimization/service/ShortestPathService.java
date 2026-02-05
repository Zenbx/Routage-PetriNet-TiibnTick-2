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
import com.delivery.optimization.repository.DriverRepository;
import com.delivery.optimization.domain.Driver;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShortestPathService {

    private final NodeRepository nodeRepository;
    private final ArcRepository arcRepository;
    private final DriverRepository driverRepository;
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

                    // Récupérer les paramètres du livreur (ou valeurs par défaut)
                    return (request.getDriverId() != null
                            ? driverRepository.findById(request.getDriverId())
                            : Mono.<Driver>empty())
                            .defaultIfEmpty(Driver.builder()
                                    .averageSpeed(40.0)
                                    .fuelConsumption(8.0)
                                    .build())
                            .flatMap(driver -> {
                                double totalDistance = 0.0;
                                double estimatedTime = 0.0;
                                double totalPenibilityCost = 0.0;
                                double totalWeatherCost = 0.0;
                                double totalFuelCost = 0.0;

                                double avgSpeed = driver.getAverageSpeed() != null ? driver.getAverageSpeed() : 40.0;
                                double fuelCons = driver.getFuelConsumption() != null ? driver.getFuelConsumption()
                                        : 8.0;

                                List<List<Double>> geometryPath = new ArrayList<>();
                                List<String> pathNodes = result.getPath();

                                if (pathNodes.isEmpty()) {
                                    System.out.println("DEBUG: A* returned empty path for " + request.getOrigin()
                                            + " to " + request.getDestination());
                                } else {
                                    System.out.println("DEBUG: A* found path: " + pathNodes);
                                    // Si le trajet n'a qu'un seul point (origine == destination)
                                    if (pathNodes.size() == 1) {
                                        Node node = nodes.get(pathNodes.get(0));
                                        if (node != null) {
                                            geometryPath.add(Arrays.asList(node.getLatitude(), node.getLongitude()));
                                        }
                                    }
                                }

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

                                        // Temps = Distance / Vitesse (converti en minutes) * Trafic
                                        double travelTimeInHours = edge.getDistance() / avgSpeed;
                                        double trafficMult = (edge.getTrafficFactor() != null ? edge.getTrafficFactor()
                                                : 1.0);
                                        estimatedTime += (travelTimeInHours * 60.0) * trafficMult;

                                        totalPenibilityCost += edge.getPenibility() * weights.getGamma();
                                        totalWeatherCost += edge.getWeatherImpact() * weights.getDelta();

                                        double baseFuel = (fuelCons / 100.0) * edge.getDistance();
                                        totalFuelCost += (baseFuel
                                                + (edge.getFuelCost() != null ? edge.getFuelCost() : 0))
                                                * weights.getEta();

                                        // Accumuler la géométrie
                                        if (edge.getGeometry() != null && !edge.getGeometry().isEmpty()) {
                                            geometryPath.addAll(parseGeometry(edge.getGeometry()));
                                        } else {
                                            // Fallback: ligne droite entre les deux nœuds si pas de géométrie
                                            Node nFrom = nodes.get(from);
                                            Node nTo = nodes.get(to);
                                            if (nFrom != null && i == 0) {
                                                geometryPath
                                                        .add(Arrays.asList(nFrom.getLatitude(), nFrom.getLongitude()));
                                            }
                                            if (nTo != null) {
                                                geometryPath.add(Arrays.asList(nTo.getLatitude(), nTo.getLongitude()));
                                            } else {
                                                System.out.println("DEBUG: Node " + to + " not found in map for geom");
                                            }
                                        }
                                    } else {
                                        System.out.println("DEBUG: Edge " + from + " -> " + to + " not found!");
                                    }
                                }

                                Map<String, Double> breakdown = Map.of(
                                        "Distance", totalDistance * weights.getAlpha(),
                                        "Time", estimatedTime * weights.getBeta(),
                                        "Penibility", totalPenibilityCost,
                                        "Weather", totalWeatherCost,
                                        "Fuel", totalFuelCost);

                                System.out.println("DEBUG: Final geometryPath size: " + geometryPath.size());

                                return Mono.just(ShortestPathResponse.builder()
                                        .path(pathNodes)
                                        .totalCost(result.getTotalCost())
                                        .costBreakdown(breakdown)
                                        .estimatedTime(estimatedTime)
                                        .distance(totalDistance)
                                        .geometryPath(geometryPath)
                                        .build());
                            });
                });
    }

    public Mono<Void> updateArcTraffic(Long arcId, Double trafficFactor) {
        return arcRepository.findById(arcId)
                .flatMap(arc -> {
                    arc.setTrafficFactor(trafficFactor);
                    arc.setLastUpdated(java.time.Instant.now());
                    return arcRepository.save(arc);
                })
                .then();
    }

    public Mono<Void> updateArcWeather(Long arcId, Double weatherImpact) {
        return arcRepository.findById(arcId)
                .flatMap(arc -> {
                    arc.setWeatherImpact(weatherImpact);
                    arc.setLastUpdated(java.time.Instant.now());
                    return arcRepository.save(arc);
                })
                .then();
    }

    public Mono<Void> updateDriverVehicleSettings(String driverId, Double avgSpeed, Double fuelCons) {
        return driverRepository.findById(driverId)
                .flatMap(driver -> {
                    if (avgSpeed != null)
                        driver.setAverageSpeed(avgSpeed);
                    if (fuelCons != null)
                        driver.setFuelConsumption(fuelCons);
                    return driverRepository.save(driver);
                })
                .then();
    }

    private List<List<Double>> parseGeometry(String geometry) {
        List<List<Double>> points = new ArrayList<>();
        if (geometry == null || geometry.isEmpty())
            return points;

        // On supporte le format simple "lat,lng;lat,lng;..."
        String[] coordinatePairs = geometry.split(";");
        for (String pair : coordinatePairs) {
            String[] parts = pair.split(",");
            if (parts.length == 2) {
                try {
                    double lat = Double.parseDouble(parts[0].trim());
                    double lng = Double.parseDouble(parts[1].trim());
                    points.add(Arrays.asList(lat, lng));
                } catch (NumberFormatException e) {
                    // Ignore invalid coordinates
                }
            }
        }
        return points;
    }
}
