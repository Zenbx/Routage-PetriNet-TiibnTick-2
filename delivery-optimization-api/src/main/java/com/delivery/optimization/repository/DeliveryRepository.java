package com.delivery.optimization.repository;

import com.delivery.optimization.domain.Delivery;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface DeliveryRepository extends ReactiveCrudRepository<Delivery, String> {

    /**
     * Vérifie si un code de tracking existe déjà
     */
    Mono<Boolean> existsByTrackingCode(String trackingCode);

    /**
     * Trouve une livraison par son code de tracking
     */
    Mono<Delivery> findByTrackingCode(String trackingCode);

    /**
     * Trouve toutes les livraisons avec le statut PENDING (pour le feed livreur)
     */
    Flux<Delivery> findByStatus(Delivery.DeliveryStatus status);

    /**
     * Trouve toutes les livraisons d'un livreur spécifique
     */
    Flux<Delivery> findByDriverId(String driverId);
}
