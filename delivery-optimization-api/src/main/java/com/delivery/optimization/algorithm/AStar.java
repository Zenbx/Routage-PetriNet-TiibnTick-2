package com.delivery.optimization.algorithm;

import com.delivery.optimization.domain.Arc;
import com.delivery.optimization.domain.Node;
import lombok.Value;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class AStar {

    @Value
    public static class PathResult {
        List<String> path;
        double totalCost;
    }

    /**
     * Section 4.1 - Algorithme A* pour Plus Court Chemin
     * Finds the optimal path between origin and destination using the composite
     * cost.
     */
    public PathResult findPath(String originId, String destinationId, Map<String, Node> nodes,
            Map<String, List<Arc>> adjacencyList, CostFunction.Weights weights) {
        PriorityQueue<NodeScore> openSet = new PriorityQueue<>(Comparator.comparingDouble(NodeScore::getFScore));
        Map<String, String> cameFrom = new HashMap<>();
        Map<String, Double> gScore = new HashMap<>();

        gScore.put(originId, 0.0);
        openSet.add(new NodeScore(originId, heuristic(originId, destinationId, nodes)));

        while (!openSet.isEmpty()) {
            NodeScore current = openSet.poll();
            String currentId = current.getNodeId();

            if (currentId.equals(destinationId)) {
                return new PathResult(reconstructPath(cameFrom, currentId), gScore.get(currentId));
            }

            for (Arc arc : adjacencyList.getOrDefault(currentId, Collections.emptyList())) {
                String neighborId = arc.getDestinationId();
                double tentativeGScore = gScore.get(currentId) + calculateCost(arc, weights);

                if (tentativeGScore < gScore.getOrDefault(neighborId, Double.MAX_VALUE)) {
                    cameFrom.put(neighborId, currentId);
                    gScore.put(neighborId, tentativeGScore);
                    double fScore = tentativeGScore + heuristic(neighborId, destinationId, nodes);

                    if (openSet.stream().noneMatch(ns -> ns.getNodeId().equals(neighborId))) {
                        openSet.add(new NodeScore(neighborId, fScore));
                    }
                }
            }
        }

        return null; // Path not found
    }

    private double calculateCost(Arc arc, CostFunction.Weights weights) {
        // Implementation of Section 3.3.1 with Dynamic Traffic Adjustment
        double tf = arc.getTrafficFactor() != null ? arc.getTrafficFactor() : 1.0;
        return weights.getAlpha() * arc.getDistance()
                + weights.getBeta() * (arc.getTravelTime() * tf)
                + weights.getGamma() * arc.getPenibility()
                + weights.getDelta() * arc.getWeatherImpact()
                + weights.getEta() * arc.getFuelCost();
    }

    /**
     * Heuristic function h(n) = α · dHaversine(n, d) / vmax
     */
    private double heuristic(String nodeId, String targetId, Map<String, Node> nodes) {
        Node n = nodes.get(nodeId);
        Node d = nodes.get(targetId);
        if (n == null || d == null)
            return 0;

        double dHaversine = haversine(n.getLatitude(), n.getLongitude(), d.getLatitude(), d.getLongitude());
        double vmax = 60.0; // Max speed in km/h for normalization
        return dHaversine / vmax;
    }

    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371; // Earth radius in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private List<String> reconstructPath(Map<String, String> cameFrom, String current) {
        List<String> path = new ArrayList<>();
        path.add(current);
        while (cameFrom.containsKey(current)) {
            current = cameFrom.get(current);
            path.add(0, current);
        }
        return path;
    }

    @Value
    private static class NodeScore {
        String nodeId;
        double fScore;
    }
}
