package com.delivery.optimization.repository;

import com.delivery.optimization.domain.Driver;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface DriverRepository extends ReactiveCrudRepository<Driver, String> {
    Mono<Driver> findByEmail(String email);
    Mono<Boolean> existsByEmail(String email);
}
