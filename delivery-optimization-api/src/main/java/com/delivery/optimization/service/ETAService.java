package com.delivery.optimization.service;

import com.delivery.optimization.algorithm.KalmanFilter;
import com.delivery.optimization.domain.KalmanState;
import com.delivery.optimization.domain.Delivery;
import com.delivery.optimization.domain.Arc;
import com.delivery.optimization.dto.ETAResponse;
import com.delivery.optimization.dto.ETAUpdateRequest;
import com.delivery.optimization.repository.ArcRepository;
import com.delivery.optimization.repository.DeliveryRepository;
import com.delivery.optimization.repository.KalmanStateRepository;
import lombok.RequiredArgsConstructor;
import org.apache.commons.math3.linear.ArrayRealVector;
import org.apache.commons.math3.linear.MatrixUtils;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class ETAService {

        private final KalmanFilter kalmanFilter;
        private final DeliveryRepository deliveryRepository;
        private final KalmanStateRepository kalmanStateRepository;
        private final ArcRepository arcRepository;
        private final WebSocketBroadcaster webSocketBroadcaster;

        // Simple cache to avoid slamming the DB with findAll() on every pulse
        private List<Arc> cachedArcs = new CopyOnWriteArrayList<>();
        private Instant lastArcCacheUpdate = Instant.MIN;

        private Mono<List<Arc>> getArcs() {
                if (cachedArcs.isEmpty() || lastArcCacheUpdate.isBefore(Instant.now().minusSeconds(10))) {
                        return arcRepository.findAll().collectList()
                                        .doOnSuccess(list -> {
                                                cachedArcs.clear();
                                                cachedArcs.addAll(list);
                                                lastArcCacheUpdate = Instant.now();
                                        })
                                        .defaultIfEmpty(Collections.emptyList());
                }
                return Mono.just(cachedArcs);
        }

        public Mono<ETAResponse> updateETA(String deliveryId, ETAUpdateRequest request) {
                return kalmanStateRepository.findByDeliveryId(deliveryId)
                                .defaultIfEmpty(initializeState(deliveryId))
                                .flatMap(prevState -> {
                                        double dt = Math.max(0.001, getDeltaT(prevState.getTimestamp()));

                                        KalmanFilter.ExtendedState internalState = toInternal(prevState);
                                        var q = MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(0.01);
                                        var updatedInternal = kalmanFilter.predict(internalState, dt, q);
                                        updatedInternal = kalmanFilter.update(updatedInternal,
                                                        request.getDistanceCovered(),
                                                        request.getCurrentSpeed(),
                                                        0.01, 0.1);

                                        KalmanState newState = fromInternal(deliveryId, updatedInternal);
                                        newState.setTotalDistance(
                                                        request.getTotalDistance() > 0 ? request.getTotalDistance()
                                                                        : prevState.getTotalDistance());

                                        if (newState.getDistanceCovered() < prevState.getDistanceCovered()
                                                        && request.getDistanceCovered() > 0.01) {
                                                newState.setDistanceCovered(prevState.getDistanceCovered());
                                        }

                                        double confidence = Math.max(0, 1.0 - updatedInternal.getP().getTrace() / 10.0);

                                        return kalmanStateRepository.save(newState)
                                                        .flatMap(savedState -> Mono.zip(
                                                                        getArcs(),
                                                                        deliveryRepository.findById(deliveryId)
                                                                                        .defaultIfEmpty(new Delivery())))
                                                        .map(tuple -> {
                                                                List<Arc> allArcs = tuple.getT1();
                                                                double pathBias = 1.0;
                                                                try {
                                                                        // Calculer le facteur de ralentissement combiné
                                                                        // basé sur TOUS les critères
                                                                        pathBias = allArcs.stream()
                                                                                        .mapToDouble(arc -> {
                                                                                                double traffic = (arc
                                                                                                                .getTrafficFactor() != null
                                                                                                                && arc.getTrafficFactor() > 1.0)
                                                                                                                                ? arc.getTrafficFactor()
                                                                                                                                : 1.0;
                                                                                                double penibility = (arc
                                                                                                                .getPenibility() != null
                                                                                                                && arc.getPenibility() > 0)
                                                                                                                                ? (1.0 + arc.getPenibility()
                                                                                                                                                * 0.1)
                                                                                                                                : 1.0;
                                                                                                double weather = (arc
                                                                                                                .getWeatherImpact() != null
                                                                                                                && arc.getWeatherImpact() > 0)
                                                                                                                                ? (1.0 + arc.getWeatherImpact()
                                                                                                                                                * 0.15)
                                                                                                                                : 1.0;

                                                                                                // Facteur combiné:
                                                                                                // trafic * pénibilité *
                                                                                                // météo
                                                                                                // Exemple: trafic=1.5,
                                                                                                // penibility=2.0,
                                                                                                // weather=1.0
                                                                                                // => facteur = 1.5 *
                                                                                                // 1.2 * 1.0 = 1.8 (80%
                                                                                                // plus lent)
                                                                                                return traffic * penibility
                                                                                                                * weather;
                                                                                        })
                                                                                        .max()
                                                                                        .orElse(1.0);
                                                                } catch (Exception ex) {
                                                                        log.warn("Bias calc error for {}", deliveryId);
                                                                }

                                                                double remainingRatio = Math.max(0,
                                                                                1.0 - newState.getDistanceCovered());
                                                                double remainingDist = newState.getTotalDistance()
                                                                                * remainingRatio;

                                                                double realSpeedMs;
                                                                if (prevState.getTimestamp() != null && dt > 0.1) {
                                                                        double distanceDelta = Math.abs(newState
                                                                                        .getDistanceCovered()
                                                                                        - prevState.getDistanceCovered());
                                                                        double metersDelta = distanceDelta
                                                                                        * newState.getTotalDistance();
                                                                        realSpeedMs = metersDelta / dt;
                                                                        realSpeedMs = Math.max(0.5,
                                                                                        Math.min(50, realSpeedMs));
                                                                        double oldSpeed = (prevState
                                                                                        .getEstimatedSpeed() != null)
                                                                                                        ? prevState.getEstimatedSpeed()
                                                                                                                        / 3.6
                                                                                                        : 10.0;
                                                                        realSpeedMs = (realSpeedMs * 0.7)
                                                                                        + (oldSpeed * 0.3);
                                                                } else {
                                                                        realSpeedMs = Math.max(1.0, (newState
                                                                                        .getEstimatedSpeed() != null)
                                                                                                        ? newState.getEstimatedSpeed()
                                                                                                                        / 3.6
                                                                                                        : 8.33);
                                                                }

                                                                long secondsLeft = (long) ((remainingDist
                                                                                / realSpeedMs) * pathBias);
                                                                Instant eta = Instant.now().plusSeconds(secondsLeft);

                                                                ETAResponse response = ETAResponse.builder()
                                                                                .etaMin(DateTimeFormatter.ISO_INSTANT
                                                                                                .format(eta.minusSeconds(
                                                                                                                30)))
                                                                                .etaMax(DateTimeFormatter.ISO_INSTANT
                                                                                                .format(eta.plusSeconds(
                                                                                                                90)))
                                                                                .confidence(confidence)
                                                                                .remainingDistance(remainingDist)
                                                                                .kalmanState(ETAResponse.KalmanStateDTO
                                                                                                .builder()
                                                                                                .distanceCovered(
                                                                                                                newState.getDistanceCovered())
                                                                                                .estimatedSpeed(realSpeedMs
                                                                                                                * 3.6)
                                                                                                .trafficBias(pathBias
                                                                                                                - 1.0)
                                                                                                .build())
                                                                                .build();

                                                                try {
                                                                        // Broadcast ETA update to specific delivery
                                                                        // topic
                                                                        webSocketBroadcaster.sendToTopic(
                                                                                        "/topic/tracking/" + deliveryId,
                                                                                        response);
                                                                        // Broadcast to global fleet topic
                                                                        webSocketBroadcaster.sendToTopic("/topic/fleet",
                                                                                        Map.of("deliveryId", deliveryId,
                                                                                                        "data",
                                                                                                        response));
                                                                } catch (Exception ex) {
                                                                        log.warn("WS broadcast failure: {}",
                                                                                        ex.getMessage());
                                                                }
                                                                return response;
                                                        });
                                })
                                .onErrorResume(e -> {
                                        log.error("[KALMAN] Critical failure: {}", e.getMessage(), e);
                                        return Mono.error(e);
                                });
        }

        public Mono<ETAResponse> getLatestStats(String deliveryId) {
                return kalmanStateRepository.findByDeliveryId(deliveryId)
                                .defaultIfEmpty(initializeState(deliveryId))
                                .flatMap(state -> Mono.zip(
                                                getArcs(),
                                                deliveryRepository.findById(deliveryId).defaultIfEmpty(new Delivery()))
                                                .map(tuple -> {
                                                        List<Arc> allArcs = tuple.getT1();
                                                        double confidence = Math.max(0,
                                                                        1.0 - state.getVariance() / 3.3);
                                                        // Calculer le facteur de ralentissement combiné basé sur TOUS
                                                        // les critères
                                                        double pathBias = allArcs.stream()
                                                                        .mapToDouble(arc -> {
                                                                                double traffic = (arc
                                                                                                .getTrafficFactor() != null
                                                                                                && arc.getTrafficFactor() > 1.0)
                                                                                                                ? arc.getTrafficFactor()
                                                                                                                : 1.0;
                                                                                double penibility = (arc
                                                                                                .getPenibility() != null
                                                                                                && arc.getPenibility() > 0)
                                                                                                                ? (1.0 + arc.getPenibility()
                                                                                                                                * 0.1)
                                                                                                                : 1.0;
                                                                                double weather = (arc
                                                                                                .getWeatherImpact() != null
                                                                                                && arc.getWeatherImpact() > 0)
                                                                                                                ? (1.0 + arc.getWeatherImpact()
                                                                                                                                * 0.15)
                                                                                                                : 1.0;
                                                                                return traffic * penibility * weather;
                                                                        })
                                                                        .max()
                                                                        .orElse(1.0);

                                                        double remainingRatio = Math.max(0,
                                                                        1.0 - state.getDistanceCovered());
                                                        double remainingDist = state.getTotalDistance()
                                                                        * remainingRatio;
                                                        double speedMs = Math.max(1.0, state.getEstimatedSpeed() / 3.6);

                                                        long secondsLeft = (long) ((remainingDist * 1000.0 / speedMs)
                                                                        * pathBias);
                                                        Instant eta = Instant.now().plusSeconds(secondsLeft);

                                                        return ETAResponse.builder()
                                                                        .etaMin(DateTimeFormatter.ISO_INSTANT
                                                                                        .format(eta.minusSeconds(30)))
                                                                        .etaMax(DateTimeFormatter.ISO_INSTANT
                                                                                        .format(eta.plusSeconds(90)))
                                                                        .confidence(confidence)
                                                                        .remainingDistance(remainingDist)
                                                                        .kalmanState(ETAResponse.KalmanStateDTO
                                                                                        .builder()
                                                                                        .distanceCovered(state
                                                                                                        .getDistanceCovered())
                                                                                        .estimatedSpeed(state
                                                                                                        .getEstimatedSpeed())
                                                                                        .trafficBias(pathBias - 1.0)
                                                                                        .build())
                                                                        .build();
                                                }))
                                .switchIfEmpty(Mono.error(new RuntimeException("Delivery not found")));
        }

        private KalmanState initializeState(String deliveryId) {
                return KalmanState.builder()
                                .deliveryId(deliveryId)
                                .timestamp(Instant.now())
                                .distanceCovered(0.0)
                                .totalDistance(5.0) // Valeur par défaut en KM
                                .estimatedSpeed(30.0)
                                .trafficBias(1.0)
                                .variance(1.0)
                                .build();
        }

        private double getDeltaT(Instant last) {
                if (last == null)
                        return 1.0;
                return (Instant.now().toEpochMilli() - last.toEpochMilli()) / 1000.0;
        }

        private KalmanFilter.ExtendedState toInternal(KalmanState s) {
                return KalmanFilter.ExtendedState.builder()
                                .x(new ArrayRealVector(new double[] { s.getDistanceCovered(), s.getEstimatedSpeed(),
                                                s.getTrafficBias() }))
                                .p(MatrixUtils.createRealIdentityMatrix(3).scalarMultiply(s.getVariance()))
                                .build();
        }

        private KalmanState fromInternal(String deliveryId, KalmanFilter.ExtendedState s) {
                return KalmanState.builder()
                                .deliveryId(deliveryId)
                                .timestamp(Instant.now())
                                .distanceCovered(s.getX().getEntry(0))
                                .estimatedSpeed(s.getX().getEntry(1))
                                .trafficBias(s.getX().getEntry(2))
                                .variance(Math.max(0.1, s.getP().getTrace() / 3.0))
                                .build();
        }
}
