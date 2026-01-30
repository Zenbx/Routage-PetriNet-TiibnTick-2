package com.delivery.optimization.service;

import com.delivery.optimization.algorithm.KalmanFilter;
import com.delivery.optimization.domain.Arc;
import com.delivery.optimization.domain.Delivery;
import com.delivery.optimization.domain.KalmanState;
import com.delivery.optimization.dto.ETAResponse;
import com.delivery.optimization.dto.ETAUpdateRequest;
import com.delivery.optimization.repository.ArcRepository;
import com.delivery.optimization.repository.DeliveryRepository;
import com.delivery.optimization.repository.KalmanStateRepository;
import org.apache.commons.math3.linear.ArrayRealVector;
import org.apache.commons.math3.linear.MatrixUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Instant;
import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ETAServiceTest {

    @Mock
    private KalmanFilter kalmanFilter;

    @Mock
    private DeliveryRepository deliveryRepository;

    @Mock
    private KalmanStateRepository kalmanStateRepository;

    @Mock
    private ArcRepository arcRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private ETAService etaService;

    private String testDeliveryId;
    private KalmanState initialState;
    private ETAUpdateRequest updateRequest;
    private Delivery testDelivery;
    private Arc testArc;

    @BeforeEach
    void setUp() {
        testDeliveryId = "DELIVERY_001";

        initialState = KalmanState.builder()
                .id(1L)
                .deliveryId(testDeliveryId)
                .timestamp(Instant.now().minusSeconds(10))
                .distanceCovered(0.3)
                .totalDistance(10000.0)
                .estimatedSpeed(30.0)
                .trafficBias(1.0)
                .variance(0.5)
                .build();

        updateRequest = ETAUpdateRequest.builder()
                .currentPosition(new ETAUpdateRequest.Position(48.8566, 2.3522))
                .currentSpeed(35.0)
                .distanceCovered(0.35)
                .totalDistance(10000.0)
                .timestamp(Instant.now())
                .build();

        testDelivery = Delivery.builder()
                .id(testDeliveryId)
                .pickupNodeId("NODE_1")
                .dropoffNodeId("NODE_2")
                .weight(10.0)
                .status(Delivery.DeliveryStatus.IN_TRANSIT)
                .createdAt(Instant.now().minusSeconds(3600))
                .build();

        testArc = Arc.builder()
                .id(1L)
                .originId("NODE_1")
                .destinationId("NODE_2")
                .distance(10.0)
                .travelTime(600.0)
                .penibility(0.1)
                .weatherImpact(0.0)
                .fuelCost(2.5)
                .trafficFactor(1.2)
                .build();
    }

    @Test
    void testUpdateETA_WithExistingState() {
        // arrange
        KalmanFilter.ExtendedState predictedState = KalmanFilter.ExtendedState.builder()
                .x(new ArrayRealVector(new double[]{0.35, 32.0, 1.1}))
                .p(MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(0.3))
                .build();

        KalmanFilter.ExtendedState updatedState = KalmanFilter.ExtendedState.builder()
                .x(new ArrayRealVector(new double[]{0.36, 33.0, 1.05}))
                .p(MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(0.2))
                .build();

        when(kalmanStateRepository.findByDeliveryId(testDeliveryId)).thenReturn(Mono.just(initialState));
        when(kalmanFilter.predict(any(), anyDouble(), any())).thenReturn(predictedState);
        when(kalmanFilter.update(any(), anyDouble(), anyDouble(), anyDouble(), anyDouble())).thenReturn(updatedState);
        when(kalmanStateRepository.save(any(KalmanState.class))).thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));
        when(arcRepository.findAll()).thenReturn(Flux.just(testArc));
        when(deliveryRepository.findById(testDeliveryId)).thenReturn(Mono.just(testDelivery));

        // act
        Mono<ETAResponse> result = etaService.updateETA(testDeliveryId, updateRequest);

        // assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertThat(response).isNotNull();
                    assertThat(response.getEtaMin()).isNotNull();
                    assertThat(response.getEtaMax()).isNotNull();
                    assertThat(response.getConfidence()).isGreaterThanOrEqualTo(0.0);
                    assertThat(response.getConfidence()).isLessThanOrEqualTo(1.0);
                    assertThat(response.getRemainingDistance()).isGreaterThanOrEqualTo(0.0);
                    assertThat(response.getKalmanState()).isNotNull();
                    assertThat(response.getKalmanState().getDistanceCovered()).isGreaterThan(0);
                    assertThat(response.getKalmanState().getEstimatedSpeed()).isGreaterThan(0);
                })
                .verifyComplete();

        verify(kalmanStateRepository).findByDeliveryId(testDeliveryId);
        verify(kalmanFilter).predict(any(), anyDouble(), any());
        verify(kalmanFilter).update(any(), anyDouble(), anyDouble(), anyDouble(), anyDouble());
        verify(kalmanStateRepository).save(any(KalmanState.class));
    }

    @Test
    void testUpdateETA_WithNewState() {
        // arrange
        KalmanFilter.ExtendedState predictedState = KalmanFilter.ExtendedState.builder()
                .x(new ArrayRealVector(new double[]{0.1, 30.0, 1.0}))
                .p(MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(1.0))
                .build();

        KalmanFilter.ExtendedState updatedState = KalmanFilter.ExtendedState.builder()
                .x(new ArrayRealVector(new double[]{0.15, 32.0, 1.0}))
                .p(MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(0.8))
                .build();

        when(kalmanStateRepository.findByDeliveryId(testDeliveryId)).thenReturn(Mono.empty());
        when(kalmanFilter.predict(any(), anyDouble(), any())).thenReturn(predictedState);
        when(kalmanFilter.update(any(), anyDouble(), anyDouble(), anyDouble(), anyDouble())).thenReturn(updatedState);
        when(kalmanStateRepository.save(any(KalmanState.class))).thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));
        when(arcRepository.findAll()).thenReturn(Flux.just(testArc));
        when(deliveryRepository.findById(testDeliveryId)).thenReturn(Mono.just(testDelivery));

        // act
        Mono<ETAResponse> result = etaService.updateETA(testDeliveryId, updateRequest);

        // assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertThat(response).isNotNull();
                    assertThat(response.getEtaMin()).isNotNull();
                    assertThat(response.getEtaMax()).isNotNull();
                })
                .verifyComplete();

        verify(kalmanStateRepository).findByDeliveryId(testDeliveryId);
        verify(kalmanFilter).predict(any(), anyDouble(), any());
        verify(kalmanFilter).update(any(), anyDouble(), anyDouble(), anyDouble(), anyDouble());
    }

    @Test
    void testUpdateETA_WithTrafficBias() {
        // arrange
        Arc heavyTrafficArc = Arc.builder()
                .id(2L)
                .originId("NODE_1")
                .destinationId("NODE_3")
                .distance(15.0)
                .travelTime(900.0)
                .trafficFactor(1.8)
                .build();

        KalmanFilter.ExtendedState predictedState = KalmanFilter.ExtendedState.builder()
                .x(new ArrayRealVector(new double[]{0.4, 28.0, 1.5}))
                .p(MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(0.5))
                .build();

        KalmanFilter.ExtendedState updatedState = KalmanFilter.ExtendedState.builder()
                .x(new ArrayRealVector(new double[]{0.42, 29.0, 1.6}))
                .p(MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(0.4))
                .build();

        when(kalmanStateRepository.findByDeliveryId(testDeliveryId)).thenReturn(Mono.just(initialState));
        when(kalmanFilter.predict(any(), anyDouble(), any())).thenReturn(predictedState);
        when(kalmanFilter.update(any(), anyDouble(), anyDouble(), anyDouble(), anyDouble())).thenReturn(updatedState);
        when(kalmanStateRepository.save(any(KalmanState.class))).thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));
        when(arcRepository.findAll()).thenReturn(Flux.just(testArc, heavyTrafficArc));
        when(deliveryRepository.findById(testDeliveryId)).thenReturn(Mono.just(testDelivery));

        // act
        Mono<ETAResponse> result = etaService.updateETA(testDeliveryId, updateRequest);

        // assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertThat(response.getKalmanState().getTrafficBias()).isGreaterThan(0);
                })
                .verifyComplete();
    }

    @Test
    void testUpdateETA_DistanceCoveredDecreasing() {
        // arrange
        ETAUpdateRequest badRequest = ETAUpdateRequest.builder()
                .currentPosition(new ETAUpdateRequest.Position(48.8566, 2.3522))
                .currentSpeed(30.0)
                .distanceCovered(0.25)  // Less than initialState (0.3)
                .totalDistance(10000.0)
                .timestamp(Instant.now())
                .build();

        KalmanFilter.ExtendedState predictedState = KalmanFilter.ExtendedState.builder()
                .x(new ArrayRealVector(new double[]{0.25, 30.0, 1.0}))
                .p(MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(0.5))
                .build();

        KalmanFilter.ExtendedState updatedState = KalmanFilter.ExtendedState.builder()
                .x(new ArrayRealVector(new double[]{0.25, 30.0, 1.0}))
                .p(MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(0.4))
                .build();

        when(kalmanStateRepository.findByDeliveryId(testDeliveryId)).thenReturn(Mono.just(initialState));
        when(kalmanFilter.predict(any(), anyDouble(), any())).thenReturn(predictedState);
        when(kalmanFilter.update(any(), anyDouble(), anyDouble(), anyDouble(), anyDouble())).thenReturn(updatedState);
        when(kalmanStateRepository.save(any(KalmanState.class))).thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));
        when(arcRepository.findAll()).thenReturn(Flux.just(testArc));
        when(deliveryRepository.findById(testDeliveryId)).thenReturn(Mono.just(testDelivery));

        // act
        Mono<ETAResponse> result = etaService.updateETA(testDeliveryId, badRequest);

        // assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    // Should keep previous distance covered
                    assertThat(response.getKalmanState().getDistanceCovered()).isGreaterThanOrEqualTo(initialState.getDistanceCovered());
                })
                .verifyComplete();
    }

    @Test
    void testGetLatestStats_Success() {
        // arrange
        when(kalmanStateRepository.findByDeliveryId(testDeliveryId)).thenReturn(Mono.just(initialState));
        when(arcRepository.findAll()).thenReturn(Flux.just(testArc));
        when(deliveryRepository.findById(testDeliveryId)).thenReturn(Mono.just(testDelivery));

        // act
        Mono<ETAResponse> result = etaService.getLatestStats(testDeliveryId);

        // assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertThat(response).isNotNull();
                    assertThat(response.getEtaMin()).isNotNull();
                    assertThat(response.getEtaMax()).isNotNull();
                    assertThat(response.getConfidence()).isGreaterThanOrEqualTo(0.0);
                    assertThat(response.getRemainingDistance()).isGreaterThan(0);
                    assertThat(response.getKalmanState()).isNotNull();
                    assertThat(response.getKalmanState().getDistanceCovered()).isEqualTo(initialState.getDistanceCovered());
                })
                .verifyComplete();

        verify(kalmanStateRepository).findByDeliveryId(testDeliveryId);
    }

    @Test
    void testGetLatestStats_NoStateFound() {
        // arrange
        when(kalmanStateRepository.findByDeliveryId(testDeliveryId)).thenReturn(Mono.empty());
        when(arcRepository.findAll()).thenReturn(Flux.just(testArc));
        when(deliveryRepository.findById(testDeliveryId)).thenReturn(Mono.just(testDelivery));

        // act
        Mono<ETAResponse> result = etaService.getLatestStats(testDeliveryId);

        // assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    // Should use initialized state
                    assertThat(response).isNotNull();
                    assertThat(response.getKalmanState().getDistanceCovered()).isEqualTo(0.0);
                })
                .verifyComplete();
    }

    @Test
    void testGetLatestStats_WithHighVariance() {
        // arrange
        KalmanState highVarianceState = KalmanState.builder()
                .id(1L)
                .deliveryId(testDeliveryId)
                .timestamp(Instant.now())
                .distanceCovered(0.5)
                .totalDistance(10000.0)
                .estimatedSpeed(25.0)
                .trafficBias(1.0)
                .variance(3.0)
                .build();

        when(kalmanStateRepository.findByDeliveryId(testDeliveryId)).thenReturn(Mono.just(highVarianceState));
        when(arcRepository.findAll()).thenReturn(Flux.just(testArc));
        when(deliveryRepository.findById(testDeliveryId)).thenReturn(Mono.just(testDelivery));

        // act
        Mono<ETAResponse> result = etaService.getLatestStats(testDeliveryId);

        // assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    // High variance should lead to low confidence
                    assertThat(response.getConfidence()).isLessThan(0.5);
                })
                .verifyComplete();
    }

    @Test
    void testUpdateETA_WithError() {
        // arrange
        when(kalmanStateRepository.findByDeliveryId(testDeliveryId))
                .thenReturn(Mono.error(new RuntimeException("Database error")));

        // act
        Mono<ETAResponse> result = etaService.updateETA(testDeliveryId, updateRequest);

        // assert
        StepVerifier.create(result)
                .expectError(RuntimeException.class)
                .verify();

        verify(kalmanStateRepository).findByDeliveryId(testDeliveryId);
    }

    @Test
    void testUpdateETA_CalculatesRealSpeed() {
        // arrange
        KalmanState oldState = KalmanState.builder()
                .id(1L)
                .deliveryId(testDeliveryId)
                .timestamp(Instant.now().minusSeconds(60))
                .distanceCovered(0.2)
                .totalDistance(10000.0)
                .estimatedSpeed(25.0)
                .trafficBias(1.0)
                .variance(0.5)
                .build();

        ETAUpdateRequest progressRequest = ETAUpdateRequest.builder()
                .currentPosition(new ETAUpdateRequest.Position(48.8566, 2.3522))
                .currentSpeed(35.0)
                .distanceCovered(0.3)
                .totalDistance(10000.0)
                .timestamp(Instant.now())
                .build();

        KalmanFilter.ExtendedState predictedState = KalmanFilter.ExtendedState.builder()
                .x(new ArrayRealVector(new double[]{0.3, 30.0, 1.0}))
                .p(MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(0.5))
                .build();

        KalmanFilter.ExtendedState updatedState = KalmanFilter.ExtendedState.builder()
                .x(new ArrayRealVector(new double[]{0.32, 32.0, 1.0}))
                .p(MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(0.4))
                .build();

        when(kalmanStateRepository.findByDeliveryId(testDeliveryId)).thenReturn(Mono.just(oldState));
        when(kalmanFilter.predict(any(), anyDouble(), any())).thenReturn(predictedState);
        when(kalmanFilter.update(any(), anyDouble(), anyDouble(), anyDouble(), anyDouble())).thenReturn(updatedState);
        when(kalmanStateRepository.save(any(KalmanState.class))).thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));
        when(arcRepository.findAll()).thenReturn(Flux.just(testArc));
        when(deliveryRepository.findById(testDeliveryId)).thenReturn(Mono.just(testDelivery));

        // act
        Mono<ETAResponse> result = etaService.updateETA(testDeliveryId, progressRequest);

        // assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertThat(response.getKalmanState().getEstimatedSpeed()).isGreaterThan(0);
                })
                .verifyComplete();
    }

    @Test
    void testUpdateETA_NearCompletion() {
        // arrange
        KalmanState nearCompleteState = KalmanState.builder()
                .id(1L)
                .deliveryId(testDeliveryId)
                .timestamp(Instant.now().minusSeconds(5))
                .distanceCovered(0.95)
                .totalDistance(10000.0)
                .estimatedSpeed(40.0)
                .trafficBias(1.0)
                .variance(0.3)
                .build();

        ETAUpdateRequest nearCompleteRequest = ETAUpdateRequest.builder()
                .currentPosition(new ETAUpdateRequest.Position(48.8566, 2.3522))
                .currentSpeed(40.0)
                .distanceCovered(0.98)
                .totalDistance(10000.0)
                .timestamp(Instant.now())
                .build();

        KalmanFilter.ExtendedState predictedState = KalmanFilter.ExtendedState.builder()
                .x(new ArrayRealVector(new double[]{0.98, 40.0, 1.0}))
                .p(MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(0.2))
                .build();

        KalmanFilter.ExtendedState updatedState = KalmanFilter.ExtendedState.builder()
                .x(new ArrayRealVector(new double[]{0.99, 40.0, 1.0}))
                .p(MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(0.15))
                .build();

        when(kalmanStateRepository.findByDeliveryId(testDeliveryId)).thenReturn(Mono.just(nearCompleteState));
        when(kalmanFilter.predict(any(), anyDouble(), any())).thenReturn(predictedState);
        when(kalmanFilter.update(any(), anyDouble(), anyDouble(), anyDouble(), anyDouble())).thenReturn(updatedState);
        when(kalmanStateRepository.save(any(KalmanState.class))).thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));
        when(arcRepository.findAll()).thenReturn(Flux.just(testArc));
        when(deliveryRepository.findById(testDeliveryId)).thenReturn(Mono.just(testDelivery));

        // act
        Mono<ETAResponse> result = etaService.updateETA(testDeliveryId, nearCompleteRequest);

        // assert
        StepVerifier.create(result)
                .assertNext(response -> {
                    assertThat(response.getRemainingDistance()).isLessThan(500.0);
                })
                .verifyComplete();
    }
}
