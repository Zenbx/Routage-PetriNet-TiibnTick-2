package com.delivery.optimization.repository;

import com.delivery.optimization.domain.Arc;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface ArcRepository extends ReactiveCrudRepository<Arc, Long> {
    Flux<Arc> findByOriginId(String originId);
}
