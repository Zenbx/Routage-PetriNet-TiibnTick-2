package com.delivery.optimization.repository;

import com.delivery.optimization.domain.ETAHistory;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ETAHistoryRepository extends ReactiveCrudRepository<ETAHistory, Long> {
}
