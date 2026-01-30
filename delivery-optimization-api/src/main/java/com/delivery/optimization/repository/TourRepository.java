package com.delivery.optimization.repository;

import com.delivery.optimization.domain.Tour;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TourRepository extends ReactiveCrudRepository<Tour, String> {
}
