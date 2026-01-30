package com.delivery.optimization.service;

import com.delivery.optimization.algorithm.AStar;
import com.delivery.optimization.algorithm.CostFunction;
import com.delivery.optimization.domain.Arc;
import com.delivery.optimization.domain.Node;
import com.delivery.optimization.dto.ShortestPathRequest;
import com.delivery.optimization.dto.ShortestPathResponse;
import com.delivery.optimization.repository.ArcRepository;
import com.delivery.optimization.repository.NodeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShortestPathServiceTest {

    @Mock
    private NodeRepository nodeRepository;

    @Mock
    private ArcRepository arcRepository;

    @Mock
    private AStar aStar;

    @InjectMocks
    private ShortestPathService shortestPathService;

    private Node node1;
    private Node node2;
    private Node node3;
    private Arc arc1;
    private Arc arc2;
    private ShortestPathRequest request;

    @BeforeEach
    void setUp() {
        node1 = Node.builder()
                .id("NODE_1")
                .type(Node.NodeType.DEPOT)
                .name("Depot")
                .latitude(48.8566)
                .longitude(2.3522)
                .build();

        node2 = Node.builder()
                .id("NODE_2")
                .type(Node.NodeType.CLIENT)
                .name("Client A")
                .latitude(48.8606)
                .longitude(2.3376)
                .build();

        node3 = Node.builder()
                .id("NODE_3")
                .type(Node.NodeType.CLIENT)
                .name("Client B")
                .latitude(48.8529)
                .longitude(2.3499)
                .build();

        arc1 = Arc.builder()
                .id(1L)
                .originId("NODE_1")
                .destinationId("NODE_2")
                .distance(5.0)
                .travelTime(300.0)
                .penibility(0.1)
                .weatherImpact(0.0)
                .fuelCost(1.5)
                .trafficFactor(1.0)
                .build();

        arc2 = Arc.builder()
                .id(2L)
                .originId("NODE_2")
                .destinationId("NODE_3")
                .distance(8.0)
                .travelTime(480.0)
                .penibility(0.2)
                .weatherImpact(0.1)
                .fuelCost(2.4)
                .trafficFactor(1.2)
                .build();

        request = ShortestPathRequest.builder()
                .origin("NODE_1")
                .destination("NODE_3")
                .costWeights(ShortestPathRequest.CostWeights.builder()
                        .alpha(1.0)
                        .beta(0.5)
                        .gamma(0.3)
                        .delta(0.2)
                        .eta(0.1)
                        .build())
                .build();
    }

    @Test
    void testCalculateShortestPath_Success() {
        // arrange
        List<String> expectedPath = Arrays.asList("NODE_1", "NODE_2", "NODE_3");
        AStar.PathResult pathResult = new AStar.PathResult(expectedPath, 15.5);

        when(nodeRepository.findAll()).thenReturn(Flux.just(node1, node2, node3));
        when(arcRepository.findAll()).thenReturn(Flux.just(arc1, arc2));
        when(aStar.findPath(anyString(), anyString(), anyMap(), anyMap(), any(CostFunction.Weights.class)))
                .thenReturn(pathResult);

        // act
        Mono<ShortestPathResponse> result = shortestPathService.calculateShortestPath(request);

        // assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertThat(response).isNotNull();
                    assertThat(response.getPath()).hasSize(3);
                    assertThat(response.getPath()).containsExactly("NODE_1", "NODE_2", "NODE_3");
                    assertThat(response.getTotalCost()).isEqualTo(15.5);
                    assertThat(response.getDistance()).isEqualTo(13.0); // 5 + 8
                    assertThat(response.getEstimatedTime()).isGreaterThan(0);
                    assertThat(response.getCostBreakdown()).isNotNull();
                    assertThat(response.getCostBreakdown()).containsKeys("Distance", "Time", "Penibility", "Weather", "Fuel");
                })
                .verifyComplete();

        verify(nodeRepository).findAll();
        verify(arcRepository).findAll();
        verify(aStar).findPath(eq("NODE_1"), eq("NODE_3"), anyMap(), anyMap(), any(CostFunction.Weights.class));
    }

    @Test
    void testCalculateShortestPath_NoPathFound() {
        // arrange
        when(nodeRepository.findAll()).thenReturn(Flux.just(node1, node2, node3));
        when(arcRepository.findAll()).thenReturn(Flux.just(arc1, arc2));
        when(aStar.findPath(anyString(), anyString(), anyMap(), anyMap(), any(CostFunction.Weights.class)))
                .thenReturn(null);

        // act
        Mono<ShortestPathResponse> result = shortestPathService.calculateShortestPath(request);

        // assert
        StepVerifier.create(result)
                .expectErrorMatches(throwable ->
                        throwable instanceof RuntimeException &&
                        throwable.getMessage().equals("Path not found"))
                .verify();

        verify(aStar).findPath(anyString(), anyString(), anyMap(), anyMap(), any(CostFunction.Weights.class));
    }

    @Test
    void testCalculateShortestPath_WithTrafficFactor() {
        // arrange
        arc1.setTrafficFactor(1.5);
        arc2.setTrafficFactor(2.0);

        List<String> expectedPath = Arrays.asList("NODE_1", "NODE_2", "NODE_3");
        AStar.PathResult pathResult = new AStar.PathResult(expectedPath, 20.0);

        when(nodeRepository.findAll()).thenReturn(Flux.just(node1, node2, node3));
        when(arcRepository.findAll()).thenReturn(Flux.just(arc1, arc2));
        when(aStar.findPath(anyString(), anyString(), anyMap(), anyMap(), any(CostFunction.Weights.class)))
                .thenReturn(pathResult);

        // act
        Mono<ShortestPathResponse> result = shortestPathService.calculateShortestPath(request);

        // assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertThat(response).isNotNull();
                    assertThat(response.getEstimatedTime()).isGreaterThan(780.0); // Base time with traffic
                })
                .verifyComplete();
    }

    @Test
    void testCalculateShortestPath_CompositeCosts() {
        // arrange
        List<String> expectedPath = Arrays.asList("NODE_1", "NODE_2", "NODE_3");
        AStar.PathResult pathResult = new AStar.PathResult(expectedPath, 10.0);

        when(nodeRepository.findAll()).thenReturn(Flux.just(node1, node2, node3));
        when(arcRepository.findAll()).thenReturn(Flux.just(arc1, arc2));
        when(aStar.findPath(anyString(), anyString(), anyMap(), anyMap(), any(CostFunction.Weights.class)))
                .thenReturn(pathResult);

        // act
        Mono<ShortestPathResponse> result = shortestPathService.calculateShortestPath(request);

        // assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertThat(response.getCostBreakdown()).isNotNull();
                    assertThat(response.getCostBreakdown().get("Distance")).isEqualTo(13.0 * request.getCostWeights().getAlpha());
                    assertThat(response.getCostBreakdown().get("Penibility")).isGreaterThan(0);
                    assertThat(response.getCostBreakdown().get("Weather")).isGreaterThanOrEqualTo(0);
                    assertThat(response.getCostBreakdown().get("Fuel")).isGreaterThan(0);
                })
                .verifyComplete();
    }

    @Test
    void testCalculateShortestPath_SingleNode() {
        // arrange
        List<String> expectedPath = Arrays.asList("NODE_1");
        AStar.PathResult pathResult = new AStar.PathResult(expectedPath, 0.0);

        ShortestPathRequest singleNodeRequest = ShortestPathRequest.builder()
                .origin("NODE_1")
                .destination("NODE_1")
                .costWeights(request.getCostWeights())
                .build();

        when(nodeRepository.findAll()).thenReturn(Flux.just(node1));
        when(arcRepository.findAll()).thenReturn(Flux.empty());
        when(aStar.findPath(anyString(), anyString(), anyMap(), anyMap(), any(CostFunction.Weights.class)))
                .thenReturn(pathResult);

        // act
        Mono<ShortestPathResponse> result = shortestPathService.calculateShortestPath(singleNodeRequest);

        // assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertThat(response.getPath()).hasSize(1);
                    assertThat(response.getTotalCost()).isEqualTo(0.0);
                    assertThat(response.getDistance()).isEqualTo(0.0);
                })
                .verifyComplete();
    }

    @Test
    void testCalculateShortestPath_WithDifferentWeights() {
        // arrange
        ShortestPathRequest customWeightsRequest = ShortestPathRequest.builder()
                .origin("NODE_1")
                .destination("NODE_3")
                .costWeights(ShortestPathRequest.CostWeights.builder()
                        .alpha(0.2)
                        .beta(1.5)
                        .gamma(0.8)
                        .delta(0.5)
                        .eta(0.3)
                        .build())
                .build();

        List<String> expectedPath = Arrays.asList("NODE_1", "NODE_2", "NODE_3");
        AStar.PathResult pathResult = new AStar.PathResult(expectedPath, 25.0);

        when(nodeRepository.findAll()).thenReturn(Flux.just(node1, node2, node3));
        when(arcRepository.findAll()).thenReturn(Flux.just(arc1, arc2));
        when(aStar.findPath(anyString(), anyString(), anyMap(), anyMap(), any(CostFunction.Weights.class)))
                .thenReturn(pathResult);

        // act
        Mono<ShortestPathResponse> result = shortestPathService.calculateShortestPath(customWeightsRequest);

        // assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertThat(response).isNotNull();
                    assertThat(response.getTotalCost()).isEqualTo(25.0);
                })
                .verifyComplete();
    }

    @Test
    void testUpdateArcTraffic_Success() {
        // arrange
        Long arcId = 1L;
        Double trafficFactor = 1.8;

        when(arcRepository.findById(arcId)).thenReturn(Mono.just(arc1));
        when(arcRepository.save(any(Arc.class))).thenReturn(Mono.just(arc1));

        // act
        Mono<Void> result = shortestPathService.updateArcTraffic(arcId, trafficFactor);

        // assert
        StepVerifier.create(result)
                .verifyComplete();

        verify(arcRepository).findById(arcId);
        verify(arcRepository).save(argThat(arc -> arc.getTrafficFactor().equals(trafficFactor)));
    }

    @Test
    void testUpdateArcTraffic_ArcNotFound() {
        // arrange
        Long arcId = 999L;
        Double trafficFactor = 1.5;

        when(arcRepository.findById(arcId)).thenReturn(Mono.empty());

        // act
        Mono<Void> result = shortestPathService.updateArcTraffic(arcId, trafficFactor);

        // assert
        StepVerifier.create(result)
                .verifyComplete();

        verify(arcRepository).findById(arcId);
        verify(arcRepository, never()).save(any(Arc.class));
    }

    @Test
    void testCalculateShortestPath_EmptyGraph() {
        // arrange
        when(nodeRepository.findAll()).thenReturn(Flux.empty());
        when(arcRepository.findAll()).thenReturn(Flux.empty());
        when(aStar.findPath(anyString(), anyString(), anyMap(), anyMap(), any(CostFunction.Weights.class)))
                .thenReturn(null);

        // act
        Mono<ShortestPathResponse> result = shortestPathService.calculateShortestPath(request);

        // assert
        StepVerifier.create(result)
                .expectError(RuntimeException.class)
                .verify();
    }

    @Test
    void testCalculateShortestPath_LongPath() {
        // arrange
        List<String> longPath = Arrays.asList("NODE_1", "NODE_2", "NODE_3", "NODE_4", "NODE_5");
        AStar.PathResult pathResult = new AStar.PathResult(longPath, 50.0);

        Arc arc3 = Arc.builder()
                .id(3L)
                .originId("NODE_3")
                .destinationId("NODE_4")
                .distance(10.0)
                .travelTime(600.0)
                .penibility(0.3)
                .weatherImpact(0.2)
                .fuelCost(3.0)
                .trafficFactor(1.0)
                .build();

        when(nodeRepository.findAll()).thenReturn(Flux.just(node1, node2, node3));
        when(arcRepository.findAll()).thenReturn(Flux.just(arc1, arc2, arc3));
        when(aStar.findPath(anyString(), anyString(), anyMap(), anyMap(), any(CostFunction.Weights.class)))
                .thenReturn(pathResult);

        // act
        Mono<ShortestPathResponse> result = shortestPathService.calculateShortestPath(request);

        // assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertThat(response.getPath()).hasSize(5);
                    assertThat(response.getTotalCost()).isEqualTo(50.0);
                })
                .verifyComplete();
    }
}
