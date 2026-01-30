package com.delivery.optimization.repository;

import com.delivery.optimization.domain.KalmanState;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface KalmanStateRepository extends ReactiveCrudRepository<KalmanState, Long> {
    @Query("SELECT * FROM kalman_states WHERE delivery_id = :deliveryId ORDER BY id DESC LIMIT 1")
    Mono<KalmanState> findByDeliveryId(String deliveryId);
}
