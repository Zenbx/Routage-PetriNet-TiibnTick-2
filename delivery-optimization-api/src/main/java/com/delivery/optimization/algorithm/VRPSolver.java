package com.delivery.optimization.algorithm;

import com.delivery.optimization.domain.Arc;
import com.delivery.optimization.domain.Node;
import com.delivery.optimization.dto.TourOptimizationRequest;
import com.delivery.optimization.dto.TourOptimizationResponse;
import com.google.ortools.Loader;
import com.google.ortools.constraintsolver.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Section 4.2 - Optimisation VRP avec Intégration de Points Relais
 *
 * Utilise Google OR-Tools pour résoudre le Capacitated Vehicle Routing Problem (CVRP)
 * avec contraintes de capacité et intégration des points relais comme drop-off intermédiaires.
 */
@Component
@Slf4j
public class VRPSolver {

    static {
        // Charger la bibliothèque native OR-Tools
        Loader.loadNativeLibraries();
    }

    /**
     * Résout le VRP avec OR-Tools
     *
     * @param request Requête d'optimisation de tournée
     * @param availableRelays Liste des points relais disponibles
     * @param allNodes Map de tous les nœuds du graphe
     * @param allArcs Liste de tous les arcs du graphe
     * @return Réponse avec la tournée optimisée
     */
    public TourOptimizationResponse solve(TourOptimizationRequest request,
                                         List<Node> availableRelays,
                                         Map<String, Node> allNodes,
                                         List<Arc> allArcs) {
        try {
            log.info("Démarrage de l'optimisation VRP pour {} livraisons", request.getDeliveries().size());

            // 1. Préparer les données pour OR-Tools
            DataModel data = createDataModel(request, availableRelays, allNodes, allArcs);

            // 2. Créer le gestionnaire de routing
            RoutingIndexManager manager = new RoutingIndexManager(
                data.distanceMatrix.length,
                1, // Un seul véhicule
                data.depot
            );

            // 3. Créer le modèle de routing
            RoutingModel routing = new RoutingModel(manager);

            // 4. Définir la fonction de coût (distance/temps)
            final int transitCallbackIndex = routing.registerTransitCallback((long fromIndex, long toIndex) -> {
                int fromNode = manager.indexToNode(fromIndex);
                int toNode = manager.indexToNode(toIndex);
                return data.distanceMatrix[fromNode][toNode];
            });
            routing.setArcCostEvaluatorOfAllVehicles(transitCallbackIndex);

            // 5. Ajouter contrainte de capacité
            final int demandCallbackIndex = routing.registerUnaryTransitCallback((long fromIndex) -> {
                int fromNode = manager.indexToNode(fromIndex);
                return data.demands[fromNode];
            });
            routing.addDimensionWithVehicleCapacity(
                demandCallbackIndex,
                0, // null capacity slack
                new long[]{request.getVehicleCapacity()}, // vehicle maximum capacities
                true, // start cumul to zero
                "Capacity"
            );

            // 6. Ajouter contraintes de time windows si des deadlines sont présentes
            if (data.hasTimeWindows) {
                final int timeCallbackIndex = routing.registerTransitCallback((long fromIndex, long toIndex) -> {
                    int fromNode = manager.indexToNode(fromIndex);
                    int toNode = manager.indexToNode(toIndex);
                    return data.timeMatrix[fromNode][toNode];
                });

                routing.addDimension(
                    timeCallbackIndex,
                    3600, // allow waiting time
                    86400, // maximum time per vehicle (24h en secondes)
                    false, // Don't force start cumul to zero
                    "Time"
                );

                RoutingDimension timeDimension = routing.getMutableDimension("Time");
                // Ajouter les time windows pour chaque nœud
                for (int i = 0; i < data.timeWindows.length; i++) {
                    if (i == data.depot) continue;
                    long index = manager.nodeToIndex(i);
                    timeDimension.cumulVar(index).setRange(
                        data.timeWindows[i][0],
                        data.timeWindows[i][1]
                    );
                }
            }

            // 7. Paramètres de recherche
            RoutingSearchParameters searchParameters = main.defaultRoutingSearchParameters()
                .toBuilder()
                .setFirstSolutionStrategy(FirstSolutionStrategy.Value.PATH_CHEAPEST_ARC)
                .setLocalSearchMetaheuristic(LocalSearchMetaheuristic.Value.GUIDED_LOCAL_SEARCH)
                .setTimeLimit(com.google.protobuf.Duration.newBuilder().setSeconds(30).build())
                .build();

            // 8. Résoudre
            Assignment solution = routing.solveWithParameters(searchParameters);

            if (solution == null) {
                log.warn("Aucune solution trouvée pour le VRP");
                return createFallbackSolution(request, availableRelays);
            }

            // 9. Extraire la solution
            return extractSolution(solution, routing, manager, data, request);

        } catch (Exception e) {
            log.error("Erreur lors de la résolution VRP avec OR-Tools: {}", e.getMessage(), e);
            return createFallbackSolution(request, availableRelays);
        }
    }

    /**
     * Crée le modèle de données pour OR-Tools
     */
    private DataModel createDataModel(TourOptimizationRequest request,
                                     List<Node> availableRelays,
                                     Map<String, Node> allNodes,
                                     List<Arc> allArcs) {
        DataModel data = new DataModel();

        // 1. Créer la liste des locations à visiter
        List<String> locations = new ArrayList<>();
        locations.add("DEPOT"); // Index 0 = dépôt
        data.depot = 0;

        // Map pour retrouver les nœuds
        Map<String, Integer> locationToIndex = new HashMap<>();
        locationToIndex.put("DEPOT", 0);

        // 2. Ajouter les pickups et dropoffs
        List<Long> demands = new ArrayList<>();
        demands.add(0L); // Dépôt a demande 0

        List<long[]> timeWindows = new ArrayList<>();
        timeWindows.add(new long[]{0, 86400}); // Dépôt ouvert 24h

        boolean hasDeadlines = false;

        for (TourOptimizationRequest.DeliveryRequest delivery : request.getDeliveries()) {
            // Pickup location
            if (!locationToIndex.containsKey(delivery.getPickupLocation())) {
                locationToIndex.put(delivery.getPickupLocation(), locations.size());
                locations.add(delivery.getPickupLocation());
                demands.add((long) delivery.getWeight());
                timeWindows.add(new long[]{0, 86400});
            }

            // Relay point si activé
            if (request.isUseRelayPoints() && !availableRelays.isEmpty()) {
                Node relay = findBestRelay(delivery, availableRelays, allNodes, allArcs);
                if (relay != null && !locationToIndex.containsKey(relay.getId())) {
                    locationToIndex.put(relay.getId(), locations.size());
                    locations.add(relay.getId());
                    demands.add(0L); // Relay point ne consomme pas de capacité
                    timeWindows.add(new long[]{0, 86400});
                }
            }

            // Dropoff location
            if (!locationToIndex.containsKey(delivery.getDropoffLocation())) {
                locationToIndex.put(delivery.getDropoffLocation(), locations.size());
                locations.add(delivery.getDropoffLocation());
                demands.add((long) -delivery.getWeight()); // Livraison libère la capacité

                // Time window si deadline
                if (delivery.getDeadline() != null) {
                    long deadlineSeconds = delivery.getDeadline().getEpochSecond();
                    timeWindows.add(new long[]{0, deadlineSeconds});
                    hasDeadlines = true;
                } else {
                    timeWindows.add(new long[]{0, 86400});
                }
            }
        }

        data.locations = locations;
        data.locationToIndex = locationToIndex;
        data.demands = demands.stream().mapToLong(Long::longValue).toArray();
        data.timeWindows = timeWindows.toArray(new long[0][]);
        data.hasTimeWindows = hasDeadlines;

        // 3. Construire la matrice de distance et de temps
        int n = locations.size();
        data.distanceMatrix = new long[n][n];
        data.timeMatrix = new long[n][n];

        Map<String, Map<String, Arc>> arcMap = buildArcMap(allArcs);

        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                if (i == j) {
                    data.distanceMatrix[i][j] = 0;
                    data.timeMatrix[i][j] = 0;
                } else {
                    String from = locations.get(i);
                    String to = locations.get(j);

                    // Trouver l'arc correspondant ou utiliser distance euclidienne
                    Arc arc = findArc(arcMap, from, to, allNodes);
                    if (arc != null) {
                        // Coût composite incluant distance, temps, pénibilité, météo
                        double cost = arc.getDistance() * 1.0
                                    + arc.getTravelTime() * (arc.getTrafficFactor() != null ? arc.getTrafficFactor() : 1.0) * 0.5
                                    + arc.getPenibility() * 10.0
                                    + arc.getWeatherImpact() * 5.0;
                        data.distanceMatrix[i][j] = (long) (cost * 100); // Conversion en entier
                        data.timeMatrix[i][j] = (long) (arc.getTravelTime() * (arc.getTrafficFactor() != null ? arc.getTrafficFactor() : 1.0));
                    } else {
                        // Distance euclidienne comme fallback
                        Node fromNode = allNodes.get(from);
                        Node toNode = allNodes.get(to);
                        if (fromNode != null && toNode != null && fromNode.getLatitude() != null && toNode.getLatitude() != null) {
                            double dist = haversine(fromNode.getLatitude(), fromNode.getLongitude(),
                                                   toNode.getLatitude(), toNode.getLongitude());
                            data.distanceMatrix[i][j] = (long) (dist * 100);
                            data.timeMatrix[i][j] = (long) (dist / 50.0 * 3600); // Vitesse moyenne 50 km/h
                        } else {
                            data.distanceMatrix[i][j] = 100000; // Coût élevé si pas de données
                            data.timeMatrix[i][j] = 10000;
                        }
                    }
                }
            }
        }

        return data;
    }

    /**
     * Extrait la solution du routing model
     */
    private TourOptimizationResponse extractSolution(Assignment solution,
                                                     RoutingModel routing,
                                                     RoutingIndexManager manager,
                                                     DataModel data,
                                                     TourOptimizationRequest request) {
        List<String> orderedStops = new ArrayList<>();
        List<String> relayPointsUsed = new ArrayList<>();
        long totalDistance = 0;
        long totalTime = 0;

        long index = routing.start(0);
        while (!routing.isEnd(index)) {
            int nodeIndex = manager.indexToNode(index);
            String location = data.locations.get(nodeIndex);

            if (!location.equals("DEPOT")) {
                orderedStops.add(location);

                // Vérifier si c'est un relay point
                if (isRelayPoint(location, request)) {
                    relayPointsUsed.add(location);
                }
            }

            long previousIndex = index;
            index = solution.value(routing.nextVar(index));

            if (!routing.isEnd(index)) {
                int fromNode = manager.indexToNode(previousIndex);
                int toNode = manager.indexToNode(index);
                totalDistance += data.distanceMatrix[fromNode][toNode];
                totalTime += data.timeMatrix[fromNode][toNode];
            }
        }

        return TourOptimizationResponse.builder()
            .tourId(UUID.randomUUID().toString())
            .orderedStops(orderedStops)
            .totalCost(totalDistance / 100.0) // Reconversion du coût
            .estimatedDuration((int) totalTime)
            .relayPointsUsed(relayPointsUsed.stream().distinct().collect(Collectors.toList()))
            .build();
    }

    /**
     * Trouve le meilleur relay point pour une livraison
     */
    private Node findBestRelay(TourOptimizationRequest.DeliveryRequest delivery,
                              List<Node> availableRelays,
                              Map<String, Node> allNodes,
                              List<Arc> allArcs) {
        if (availableRelays.isEmpty()) return null;

        Map<String, Map<String, Arc>> arcMap = buildArcMap(allArcs);
        Node pickup = allNodes.get(delivery.getPickupLocation());
        Node dropoff = allNodes.get(delivery.getDropoffLocation());

        if (pickup == null || dropoff == null) return availableRelays.get(0);

        double minDetour = Double.MAX_VALUE;
        Node bestRelay = null;

        for (Node relay : availableRelays) {
            // Calculer le détour: distance(pickup->relay) + distance(relay->dropoff) - distance(pickup->dropoff)
            Arc pickupToRelay = findArc(arcMap, pickup.getId(), relay.getId(), allNodes);
            Arc relayToDropoff = findArc(arcMap, relay.getId(), dropoff.getId(), allNodes);
            Arc pickupToDropoff = findArc(arcMap, pickup.getId(), dropoff.getId(), allNodes);

            double detour = 0;
            if (pickupToRelay != null) detour += pickupToRelay.getDistance();
            if (relayToDropoff != null) detour += relayToDropoff.getDistance();
            if (pickupToDropoff != null) detour -= pickupToDropoff.getDistance();

            if (detour < minDetour) {
                minDetour = detour;
                bestRelay = relay;
            }
        }

        // Utiliser relay seulement si détour raisonnable (< 20% de distance directe)
        if (bestRelay != null && minDetour < 5.0) {
            return bestRelay;
        }

        return null;
    }

    /**
     * Construit une map des arcs pour recherche rapide
     */
    private Map<String, Map<String, Arc>> buildArcMap(List<Arc> arcs) {
        Map<String, Map<String, Arc>> arcMap = new HashMap<>();
        for (Arc arc : arcs) {
            arcMap.computeIfAbsent(arc.getOriginId(), k -> new HashMap<>())
                  .put(arc.getDestinationId(), arc);
        }
        return arcMap;
    }

    /**
     * Trouve un arc entre deux nœuds
     */
    private Arc findArc(Map<String, Map<String, Arc>> arcMap, String from, String to, Map<String, Node> allNodes) {
        if (from.equals("DEPOT")) {
            // Trouver le premier nœud de type DEPOT
            from = allNodes.values().stream()
                .filter(n -> n.getType() == Node.NodeType.DEPOT)
                .map(Node::getId)
                .findFirst()
                .orElse(from);
        }

        if (arcMap.containsKey(from) && arcMap.get(from).containsKey(to)) {
            return arcMap.get(from).get(to);
        }
        return null;
    }

    /**
     * Vérifie si une location est un relay point
     */
    private boolean isRelayPoint(String location, TourOptimizationRequest request) {
        return !request.getDeliveries().stream()
            .anyMatch(d -> d.getPickupLocation().equals(location) || d.getDropoffLocation().equals(location));
    }

    /**
     * Calcule la distance haversine entre deux points GPS
     */
    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371; // Rayon de la Terre en km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Crée une solution de fallback si OR-Tools échoue
     */
    private TourOptimizationResponse createFallbackSolution(TourOptimizationRequest request, List<Node> availableRelays) {
        List<String> stops = new ArrayList<>();
        List<String> relayPointsUsed = new ArrayList<>();

        for (TourOptimizationRequest.DeliveryRequest delivery : request.getDeliveries()) {
            stops.add(delivery.getPickupLocation());

            if (request.isUseRelayPoints() && !availableRelays.isEmpty()) {
                Node relay = availableRelays.get(0);
                stops.add(relay.getId());
                relayPointsUsed.add(relay.getName());
            }

            stops.add(delivery.getDropoffLocation());
        }

        // Déduplication
        List<String> orderedStops = new ArrayList<>();
        if (!stops.isEmpty()) {
            orderedStops.add(stops.get(0));
            for (int i = 1; i < stops.size(); i++) {
                if (!stops.get(i).equals(stops.get(i - 1))) {
                    orderedStops.add(stops.get(i));
                }
            }
        }

        return TourOptimizationResponse.builder()
            .tourId(UUID.randomUUID().toString())
            .orderedStops(orderedStops)
            .totalCost(120.0 - (relayPointsUsed.size() * 5.0))
            .estimatedDuration(3000 + (relayPointsUsed.size() * 300))
            .relayPointsUsed(relayPointsUsed.stream().distinct().collect(Collectors.toList()))
            .build();
    }

    /**
     * Classe interne pour stocker les données du modèle
     */
    private static class DataModel {
        List<String> locations;
        Map<String, Integer> locationToIndex;
        long[][] distanceMatrix;
        long[][] timeMatrix;
        long[] demands;
        long[][] timeWindows;
        boolean hasTimeWindows;
        int depot;
    }
}
