package com.delivery.optimization.repository;

import com.delivery.optimization.domain.Delivery;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DeliveryRepository extends ReactiveCrudRepository<Delivery, String> {
}
