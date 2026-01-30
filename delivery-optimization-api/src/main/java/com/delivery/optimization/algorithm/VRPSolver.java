package com.delivery.optimization.algorithm;

import com.delivery.optimization.domain.Node;
import com.delivery.optimization.dto.TourOptimizationRequest;
import com.delivery.optimization.dto.TourOptimizationResponse;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class VRPSolver {

        /**
         * Section 4.2 - Optimisation VRP avec Intégration de Points Relais
         * 
         * Cette implémentation simule l'usage des relais comme points de consolidation.
         */
        public TourOptimizationResponse solve(TourOptimizationRequest request, List<Node> availableRelays) {
                List<String> stops = new ArrayList<>();
                List<String> relayPointsUsed = new ArrayList<>();

                // 1. Simulation de l'ordre optimal (MTZ logic basics)
                // Pour chaque livraison, on vérifie si un passage par relais est pertinent
                for (TourOptimizationRequest.DeliveryRequest delivery : request.getDeliveries()) {
                        stops.add(delivery.getPickupLocation());

                        // Heuristique Relais: Si activé, on cherche un relais avec capacité
                        if (request.isUseRelayPoints() && !availableRelays.isEmpty()) {
                                Node relay = availableRelays.get(0); // Simplification: prend le premier disponible
                                stops.add(relay.getId());
                                relayPointsUsed.add(relay.getName());
                        }

                        stops.add(delivery.getDropoffLocation());
                }

                // 2. Déduplication des arrêts consécutifs (si pickup = relay ou relay =
                // dropoff)
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
                                .totalCost(120.0 - (relayPointsUsed.size() * 5.0)) // Simulation du gain via relais
                                .estimatedDuration(3000 + (relayPointsUsed.size() * 300))
                                .relayPointsUsed(relayPointsUsed.stream().distinct().collect(Collectors.toList()))
                                .build();
        }
}
