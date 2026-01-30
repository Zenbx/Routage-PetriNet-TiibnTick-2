package com.delivery.optimization.repository;

import com.delivery.optimization.domain.RerouteEvent;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RerouteEventRepository extends ReactiveCrudRepository<RerouteEvent, Long> {
}
