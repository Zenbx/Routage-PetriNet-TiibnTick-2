package com.delivery.optimization.repository;

import com.delivery.optimization.domain.Driver;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DriverRepository extends ReactiveCrudRepository<Driver, String> {
}
