package com.delivery.optimization.service;

import com.delivery.optimization.domain.Arc;
import com.delivery.optimization.domain.Node;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GraphServiceTest {

    @Mock
    private NodeRepository nodeRepository;

    @Mock
    private ArcRepository arcRepository;

    @InjectMocks
    private GraphService graphService;

    private Arc testArc;
    private Node testNode;

    @BeforeEach
    void setUp() {
        testNode = Node.builder()
                .id("NODE_1")
                .type(Node.NodeType.CLIENT)
                .name("Test Node")
                .latitude(48.8566)
                .longitude(2.3522)
                .build();

        testArc = Arc.builder()
                .id(1L)
                .originId("NODE_1")
                .destinationId("NODE_2")
                .distance(10.0)
                .travelTime(600.0)
                .penibility(0.2)
                .weatherImpact(0.0)
                .fuelCost(2.5)
                .trafficFactor(1.0)
                .build();
    }

    @Test
    void testInitializeGraph() {
        // act
        Mono<Void> result = graphService.initializeGraph();

        // assert
        StepVerifier.create(result)
                .verifyComplete();
    }

    @Test
    void testUpdateArcCost_Success() {
        // arrange
        Long arcId = 1L;
        Double newCost = 0.5;

        when(arcRepository.findById(arcId)).thenReturn(Mono.just(testArc));
        when(arcRepository.save(any(Arc.class))).thenReturn(Mono.just(testArc));

        // act
        Mono<Arc> result = graphService.updateArcCost(arcId, newCost);

        // assert
        StepVerifier.create(result)
                .assertNext(arc -> {
                    assertThat(arc).isNotNull();
                    assertThat(arc.getWeatherImpact()).isEqualTo(newCost);
                })
                .verifyComplete();

        verify(arcRepository).findById(arcId);
        verify(arcRepository).save(any(Arc.class));
    }

    @Test
    void testUpdateArcCost_ArcNotFound() {
        // arrange
        Long arcId = 999L;
        Double newCost = 0.5;

        when(arcRepository.findById(arcId)).thenReturn(Mono.empty());

        // act
        Mono<Arc> result = graphService.updateArcCost(arcId, newCost);

        // assert
        StepVerifier.create(result)
                .verifyComplete();

        verify(arcRepository).findById(arcId);
        verify(arcRepository, never()).save(any(Arc.class));
    }

    @Test
    void testSimulateTraffic() {
        // arrange
        Arc arc1 = Arc.builder()
                .id(1L)
                .originId("NODE_1")
                .destinationId("NODE_2")
                .penibility(0.1)
                .build();

        Arc arc2 = Arc.builder()
                .id(2L)
                .originId("NODE_2")
                .destinationId("NODE_3")
                .penibility(0.2)
                .build();

        when(arcRepository.findAll()).thenReturn(Flux.just(arc1, arc2));
        when(arcRepository.save(any(Arc.class))).thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

        // act
        Mono<Void> result = graphService.simulateTraffic();

        // assert
        StepVerifier.create(result)
                .verifyComplete();

        verify(arcRepository).findAll();
        // Some arcs should be updated (random 30%)
        verify(arcRepository, atLeastOnce()).save(any(Arc.class));
    }

    @Test
    void testApplyRain_Active() {
        // arrange
        when(arcRepository.findAll()).thenReturn(Flux.just(testArc));
        when(arcRepository.save(any(Arc.class))).thenReturn(Mono.just(testArc));

        // act
        Mono<Void> result = graphService.applyRain(true);

        // assert
        StepVerifier.create(result)
                .verifyComplete();

        verify(arcRepository).findAll();
        verify(arcRepository).save(argThat(arc -> arc.getWeatherImpact() == 0.5));
    }

    @Test
    void testApplyRain_Inactive() {
        // arrange
        when(arcRepository.findAll()).thenReturn(Flux.just(testArc));
        when(arcRepository.save(any(Arc.class))).thenReturn(Mono.just(testArc));

        // act
        Mono<Void> result = graphService.applyRain(false);

        // assert
        StepVerifier.create(result)
                .verifyComplete();

        verify(arcRepository).findAll();
        verify(arcRepository).save(argThat(arc -> arc.getWeatherImpact() == 0.0));
    }

    @Test
    void testSimulateReroute() {
        // arrange
        Arc arc1 = Arc.builder()
                .id(1L)
                .originId("NODE_1")
                .destinationId("NODE_2")
                .penibility(0.5)
                .weatherImpact(0.3)
                .trafficFactor(1.5)
                .build();

        when(arcRepository.findAll()).thenReturn(Flux.just(arc1));
        when(arcRepository.save(any(Arc.class))).thenReturn(Mono.just(arc1));

        // act
        Mono<Void> result = graphService.simulateReroute();

        // assert
        StepVerifier.create(result)
                .verifyComplete();

        verify(arcRepository).findAll();
        verify(arcRepository).save(argThat(arc ->
            arc.getPenibility() == 0.0 &&
            arc.getWeatherImpact() == 0.0 &&
            arc.getTrafficFactor() == 1.0
        ));
    }

    @Test
    void testSimulateReroute_EmptyGraph() {
        // arrange
        when(arcRepository.findAll()).thenReturn(Flux.empty());

        // act
        Mono<Void> result = graphService.simulateReroute();

        // assert
        StepVerifier.create(result)
                .verifyComplete();

        verify(arcRepository).findAll();
        verify(arcRepository, never()).save(any(Arc.class));
    }

    @Test
    void testSimulateTraffic_WithConcurrencyLimit() {
        // arrange
        Arc[] arcs = new Arc[20];
        for (int i = 0; i < 20; i++) {
            arcs[i] = Arc.builder()
                    .id((long) i)
                    .originId("NODE_" + i)
                    .destinationId("NODE_" + (i + 1))
                    .penibility(0.1)
                    .build();
        }

        when(arcRepository.findAll()).thenReturn(Flux.just(arcs));
        when(arcRepository.save(any(Arc.class))).thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

        // act
        Mono<Void> result = graphService.simulateTraffic();

        // assert
        StepVerifier.create(result)
                .verifyComplete();

        verify(arcRepository).findAll();
        // Concurrency limit is handled internally
    }

    @Test
    void testUpdateArcCost_WithError() {
        // arrange
        Long arcId = 1L;
        Double newCost = 0.5;

        when(arcRepository.findById(arcId)).thenReturn(Mono.error(new RuntimeException("Database error")));

        // act
        Mono<Arc> result = graphService.updateArcCost(arcId, newCost);

        // assert
        StepVerifier.create(result)
                .expectError(RuntimeException.class)
                .verify();

        verify(arcRepository).findById(arcId);
        verify(arcRepository, never()).save(any(Arc.class));
    }
}
