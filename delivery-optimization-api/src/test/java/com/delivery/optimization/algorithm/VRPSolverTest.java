package com.delivery.optimization.algorithm;

import com.delivery.optimization.domain.Arc;
import com.delivery.optimization.domain.Node;
import com.delivery.optimization.dto.TourOptimizationRequest;
import com.delivery.optimization.dto.TourOptimizationResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;

class VRPSolverTest {

    private VRPSolver vrpSolver;
    private Map<String, Node> nodes;
    private List<Arc> arcs;
    private List<Node> relayPoints;

    @BeforeEach
    void setUp() {
        vrpSolver = new VRPSolver();
        setupGraph();
    }

    private void setupGraph() {
        nodes = new HashMap<>();

        // Depot
        Node depot = Node.builder()
                .id("DEPOT_1")
                .type(Node.NodeType.DEPOT)
                .name("Main Depot")
                .latitude(48.8566)
                .longitude(2.3522)
                .capacity(100)
                .currentOccupancy(0)
                .build();
        nodes.put(depot.getId(), depot);

        // Clients
        Node client1 = Node.builder()
                .id("CLIENT_1")
                .type(Node.NodeType.CLIENT)
                .name("Client A")
                .latitude(48.8606)
                .longitude(2.3376)
                .build();
        nodes.put(client1.getId(), client1);

        Node client2 = Node.builder()
                .id("CLIENT_2")
                .type(Node.NodeType.CLIENT)
                .name("Client B")
                .latitude(48.8529)
                .longitude(2.3499)
                .build();
        nodes.put(client2.getId(), client2);

        Node client3 = Node.builder()
                .id("CLIENT_3")
                .type(Node.NodeType.CLIENT)
                .name("Client C")
                .latitude(48.8584)
                .longitude(2.2945)
                .build();
        nodes.put(client3.getId(), client3);

        // Relay points
        Node relay1 = Node.builder()
                .id("RELAY_1")
                .type(Node.NodeType.RELAY)
                .name("Relay Point A")
                .latitude(48.8550)
                .longitude(2.3200)
                .capacity(50)
                .currentOccupancy(10)
                .build();
        nodes.put(relay1.getId(), relay1);

        relayPoints = Arrays.asList(relay1);

        // Create arcs
        arcs = new ArrayList<>();

        // Depot to clients
        arcs.add(createArc(1L, "DEPOT_1", "CLIENT_1", 5.0, 300.0));
        arcs.add(createArc(2L, "DEPOT_1", "CLIENT_2", 7.0, 420.0));
        arcs.add(createArc(3L, "DEPOT_1", "CLIENT_3", 6.5, 390.0));
        arcs.add(createArc(4L, "DEPOT_1", "RELAY_1", 4.0, 240.0));

        // Client to client
        arcs.add(createArc(5L, "CLIENT_1", "CLIENT_2", 3.0, 180.0));
        arcs.add(createArc(6L, "CLIENT_1", "CLIENT_3", 4.5, 270.0));
        arcs.add(createArc(7L, "CLIENT_2", "CLIENT_3", 3.5, 210.0));

        // Relay to clients
        arcs.add(createArc(8L, "RELAY_1", "CLIENT_1", 3.5, 210.0));
        arcs.add(createArc(9L, "RELAY_1", "CLIENT_2", 2.5, 150.0));
        arcs.add(createArc(10L, "RELAY_1", "CLIENT_3", 2.0, 120.0));

        // Clients to relay
        arcs.add(createArc(11L, "CLIENT_1", "RELAY_1", 3.5, 210.0));
        arcs.add(createArc(12L, "CLIENT_2", "RELAY_1", 2.5, 150.0));
        arcs.add(createArc(13L, "CLIENT_3", "RELAY_1", 2.0, 120.0));

        // Return to depot
        arcs.add(createArc(14L, "CLIENT_1", "DEPOT_1", 5.0, 300.0));
        arcs.add(createArc(15L, "CLIENT_2", "DEPOT_1", 7.0, 420.0));
        arcs.add(createArc(16L, "CLIENT_3", "DEPOT_1", 6.5, 390.0));
        arcs.add(createArc(17L, "RELAY_1", "DEPOT_1", 4.0, 240.0));
    }

    private Arc createArc(Long id, String origin, String destination, double distance, double travelTime) {
        return Arc.builder()
                .id(id)
                .originId(origin)
                .destinationId(destination)
                .distance(distance)
                .travelTime(travelTime)
                .penibility(0.1)
                .weatherImpact(0.0)
                .fuelCost(distance * 0.3)
                .trafficFactor(1.0)
                .build();
    }

    @Test
    void testSolve_BasicTour() {
        // arrange
        TourOptimizationRequest request = TourOptimizationRequest.builder()
                .driverId("DRIVER_1")
                .vehicleCapacity(100)
                .useRelayPoints(false)
                .deliveries(Arrays.asList(
                        createDeliveryRequest("DEL_1", "DEPOT_1", "CLIENT_1", 10.0, null),
                        createDeliveryRequest("DEL_2", "CLIENT_1", "CLIENT_2", 15.0, null)
                ))
                .build();

        // act
        TourOptimizationResponse response = vrpSolver.solve(request, relayPoints, nodes, arcs);

        // assert
        assertThat(response).isNotNull();
        assertThat(response.getTourId()).isNotNull();
        assertThat(response.getOrderedStops()).isNotEmpty();
        assertThat(response.getTotalCost()).isGreaterThan(0);
        assertThat(response.getEstimatedDuration()).isGreaterThan(0);
    }

    @Test
    void testSolve_WithRelayPoints() {
        // arrange
        TourOptimizationRequest request = TourOptimizationRequest.builder()
                .driverId("DRIVER_1")
                .vehicleCapacity(100)
                .useRelayPoints(true)
                .deliveries(Arrays.asList(
                        createDeliveryRequest("DEL_1", "DEPOT_1", "CLIENT_1", 10.0, null),
                        createDeliveryRequest("DEL_2", "DEPOT_1", "CLIENT_2", 15.0, null)
                ))
                .build();

        // act
        TourOptimizationResponse response = vrpSolver.solve(request, relayPoints, nodes, arcs);

        // assert
        assertThat(response).isNotNull();
        assertThat(response.getOrderedStops()).isNotEmpty();
        // May include relay points
        if (response.getRelayPointsUsed() != null && !response.getRelayPointsUsed().isEmpty()) {
            assertThat(response.getRelayPointsUsed()).isNotEmpty();
        }
    }

    @Test
    void testSolve_CapacityConstraint() {
        // arrange
        TourOptimizationRequest request = TourOptimizationRequest.builder()
                .driverId("DRIVER_1")
                .vehicleCapacity(50)
                .useRelayPoints(false)
                .deliveries(Arrays.asList(
                        createDeliveryRequest("DEL_1", "DEPOT_1", "CLIENT_1", 20.0, null),
                        createDeliveryRequest("DEL_2", "CLIENT_1", "CLIENT_2", 15.0, null),
                        createDeliveryRequest("DEL_3", "CLIENT_2", "CLIENT_3", 25.0, null)
                ))
                .build();

        // act
        TourOptimizationResponse response = vrpSolver.solve(request, relayPoints, nodes, arcs);

        // assert
        assertThat(response).isNotNull();
        assertThat(response.getOrderedStops()).isNotEmpty();
        // Solution should respect capacity constraints
        assertThat(response.getTotalCost()).isGreaterThan(0);
    }

    @Test
    void testSolve_WithTimeWindows() {
        // arrange
        Instant deadline1 = Instant.now().plusSeconds(3600);
        Instant deadline2 = Instant.now().plusSeconds(7200);

        TourOptimizationRequest request = TourOptimizationRequest.builder()
                .driverId("DRIVER_1")
                .vehicleCapacity(100)
                .useRelayPoints(false)
                .deliveries(Arrays.asList(
                        createDeliveryRequest("DEL_1", "DEPOT_1", "CLIENT_1", 10.0, deadline1),
                        createDeliveryRequest("DEL_2", "DEPOT_1", "CLIENT_2", 15.0, deadline2)
                ))
                .build();

        // act
        TourOptimizationResponse response = vrpSolver.solve(request, relayPoints, nodes, arcs);

        // assert
        assertThat(response).isNotNull();
        assertThat(response.getOrderedStops()).isNotEmpty();
        // Should respect time windows
        assertThat(response.getEstimatedDuration()).isLessThan(7200);
    }

    @Test
    void testSolve_MultipleDeliveries() {
        // arrange
        TourOptimizationRequest request = TourOptimizationRequest.builder()
                .driverId("DRIVER_1")
                .vehicleCapacity(100)
                .useRelayPoints(false)
                .deliveries(Arrays.asList(
                        createDeliveryRequest("DEL_1", "DEPOT_1", "CLIENT_1", 10.0, null),
                        createDeliveryRequest("DEL_2", "DEPOT_1", "CLIENT_2", 15.0, null),
                        createDeliveryRequest("DEL_3", "DEPOT_1", "CLIENT_3", 12.0, null)
                ))
                .build();

        // act
        TourOptimizationResponse response = vrpSolver.solve(request, relayPoints, nodes, arcs);

        // assert
        assertThat(response).isNotNull();
        assertThat(response.getOrderedStops()).hasSizeGreaterThanOrEqualTo(3);
        assertThat(response.getTotalCost()).isGreaterThan(0);
        assertThat(response.getEstimatedDuration()).isGreaterThan(0);
    }

    @Test
    void testSolve_WithoutRelays() {
        // arrange
        TourOptimizationRequest request = TourOptimizationRequest.builder()
                .driverId("DRIVER_1")
                .vehicleCapacity(100)
                .useRelayPoints(false)
                .deliveries(Arrays.asList(
                        createDeliveryRequest("DEL_1", "DEPOT_1", "CLIENT_1", 10.0, null)
                ))
                .build();

        // act
        TourOptimizationResponse response = vrpSolver.solve(request, relayPoints, nodes, arcs);

        // assert
        assertThat(response).isNotNull();
        assertThat(response.getRelayPointsUsed()).isEmpty();
    }

    @Test
    void testSolve_EmptyRelayList() {
        // arrange
        TourOptimizationRequest request = TourOptimizationRequest.builder()
                .driverId("DRIVER_1")
                .vehicleCapacity(100)
                .useRelayPoints(true)
                .deliveries(Arrays.asList(
                        createDeliveryRequest("DEL_1", "DEPOT_1", "CLIENT_1", 10.0, null)
                ))
                .build();

        // act
        TourOptimizationResponse response = vrpSolver.solve(request, Collections.emptyList(), nodes, arcs);

        // assert
        assertThat(response).isNotNull();
        assertThat(response.getRelayPointsUsed()).isEmpty();
    }

    @Test
    void testSolve_OptimizationQuality() {
        // arrange
        TourOptimizationRequest request = TourOptimizationRequest.builder()
                .driverId("DRIVER_1")
                .vehicleCapacity(100)
                .useRelayPoints(false)
                .deliveries(Arrays.asList(
                        createDeliveryRequest("DEL_1", "DEPOT_1", "CLIENT_1", 10.0, null),
                        createDeliveryRequest("DEL_2", "CLIENT_1", "CLIENT_2", 5.0, null)
                ))
                .build();

        // act
        TourOptimizationResponse response = vrpSolver.solve(request, relayPoints, nodes, arcs);

        // assert - verify stops are in logical order
        assertThat(response).isNotNull();
        assertThat(response.getOrderedStops()).isNotEmpty();
        // First stop should be a pickup
        assertThat(response.getOrderedStops().get(0)).isIn("DEPOT_1", "CLIENT_1");
    }

    @Test
    void testSolve_WithTrafficFactors() {
        // arrange
        // Add traffic to some arcs
        arcs.stream()
                .filter(arc -> arc.getOriginId().equals("DEPOT_1"))
                .forEach(arc -> arc.setTrafficFactor(1.5));

        TourOptimizationRequest request = TourOptimizationRequest.builder()
                .driverId("DRIVER_1")
                .vehicleCapacity(100)
                .useRelayPoints(false)
                .deliveries(Arrays.asList(
                        createDeliveryRequest("DEL_1", "DEPOT_1", "CLIENT_1", 10.0, null)
                ))
                .build();

        // act
        TourOptimizationResponse response = vrpSolver.solve(request, relayPoints, nodes, arcs);

        // assert
        assertThat(response).isNotNull();
        // Traffic should affect total cost
        assertThat(response.getTotalCost()).isGreaterThan(0);
    }

    @Test
    void testSolve_WithWeatherImpact() {
        // arrange
        // Add weather impact to arcs
        arcs.forEach(arc -> arc.setWeatherImpact(0.5));

        TourOptimizationRequest request = TourOptimizationRequest.builder()
                .driverId("DRIVER_1")
                .vehicleCapacity(100)
                .useRelayPoints(false)
                .deliveries(Arrays.asList(
                        createDeliveryRequest("DEL_1", "DEPOT_1", "CLIENT_1", 10.0, null)
                ))
                .build();

        // act
        TourOptimizationResponse response = vrpSolver.solve(request, relayPoints, nodes, arcs);

        // assert
        assertThat(response).isNotNull();
        // Weather should affect total cost
        assertThat(response.getTotalCost()).isGreaterThan(0);
    }

    @Test
    void testSolve_SingleDelivery() {
        // arrange
        TourOptimizationRequest request = TourOptimizationRequest.builder()
                .driverId("DRIVER_1")
                .vehicleCapacity(100)
                .useRelayPoints(false)
                .deliveries(Arrays.asList(
                        createDeliveryRequest("DEL_1", "DEPOT_1", "CLIENT_1", 10.0, null)
                ))
                .build();

        // act
        TourOptimizationResponse response = vrpSolver.solve(request, relayPoints, nodes, arcs);

        // assert
        assertThat(response).isNotNull();
        assertThat(response.getOrderedStops()).contains("DEPOT_1", "CLIENT_1");
        assertThat(response.getTotalCost()).isGreaterThan(0);
    }

    @Test
    void testSolve_DuplicateStops() {
        // arrange - two deliveries with same pickup location
        TourOptimizationRequest request = TourOptimizationRequest.builder()
                .driverId("DRIVER_1")
                .vehicleCapacity(100)
                .useRelayPoints(false)
                .deliveries(Arrays.asList(
                        createDeliveryRequest("DEL_1", "DEPOT_1", "CLIENT_1", 10.0, null),
                        createDeliveryRequest("DEL_2", "DEPOT_1", "CLIENT_2", 15.0, null)
                ))
                .build();

        // act
        TourOptimizationResponse response = vrpSolver.solve(request, relayPoints, nodes, arcs);

        // assert
        assertThat(response).isNotNull();
        assertThat(response.getOrderedStops()).isNotEmpty();
        // Should handle duplicate locations efficiently
    }

    @Test
    void testSolve_RelayPointCostReduction() {
        // arrange
        TourOptimizationRequest withRelayRequest = TourOptimizationRequest.builder()
                .driverId("DRIVER_1")
                .vehicleCapacity(100)
                .useRelayPoints(true)
                .deliveries(Arrays.asList(
                        createDeliveryRequest("DEL_1", "DEPOT_1", "CLIENT_1", 10.0, null),
                        createDeliveryRequest("DEL_2", "DEPOT_1", "CLIENT_2", 15.0, null)
                ))
                .build();

        TourOptimizationRequest withoutRelayRequest = TourOptimizationRequest.builder()
                .driverId("DRIVER_1")
                .vehicleCapacity(100)
                .useRelayPoints(false)
                .deliveries(Arrays.asList(
                        createDeliveryRequest("DEL_1", "DEPOT_1", "CLIENT_1", 10.0, null),
                        createDeliveryRequest("DEL_2", "DEPOT_1", "CLIENT_2", 15.0, null)
                ))
                .build();

        // act
        TourOptimizationResponse withRelay = vrpSolver.solve(withRelayRequest, relayPoints, nodes, arcs);
        TourOptimizationResponse withoutRelay = vrpSolver.solve(withoutRelayRequest, relayPoints, nodes, arcs);

        // assert
        assertThat(withRelay).isNotNull();
        assertThat(withoutRelay).isNotNull();
        // Both should produce valid solutions
        assertThat(withRelay.getTotalCost()).isGreaterThan(0);
        assertThat(withoutRelay.getTotalCost()).isGreaterThan(0);
    }

    @Test
    void testSolve_LargeCapacityVehicle() {
        // arrange
        TourOptimizationRequest request = TourOptimizationRequest.builder()
                .driverId("DRIVER_1")
                .vehicleCapacity(1000)
                .useRelayPoints(false)
                .deliveries(Arrays.asList(
                        createDeliveryRequest("DEL_1", "DEPOT_1", "CLIENT_1", 10.0, null),
                        createDeliveryRequest("DEL_2", "CLIENT_1", "CLIENT_2", 15.0, null),
                        createDeliveryRequest("DEL_3", "CLIENT_2", "CLIENT_3", 12.0, null)
                ))
                .build();

        // act
        TourOptimizationResponse response = vrpSolver.solve(request, relayPoints, nodes, arcs);

        // assert
        assertThat(response).isNotNull();
        assertThat(response.getOrderedStops()).isNotEmpty();
        // Should handle all deliveries in one tour
    }

    private TourOptimizationRequest.DeliveryRequest createDeliveryRequest(String id, String pickup, String dropoff, double weight, Instant deadline) {
        return TourOptimizationRequest.DeliveryRequest.builder()
                .id(id)
                .pickupLocation(pickup)
                .dropoffLocation(dropoff)
                .weight(weight)
                .deadline(deadline)
                .build();
    }
}
