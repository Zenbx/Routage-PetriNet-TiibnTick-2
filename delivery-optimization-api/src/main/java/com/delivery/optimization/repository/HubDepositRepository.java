package com.delivery.optimization.repository;

import com.delivery.optimization.domain.HubDeposit;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Repository pour gérer les dépôts de colis aux hubs
 */
@Repository
public interface HubDepositRepository extends ReactiveCrudRepository<HubDeposit, String> {

    /**
     * Trouver un dépôt par ID de livraison
     */
    Mono<HubDeposit> findByDeliveryId(String deliveryId);

    /**
     * Trouver tous les dépôts dans un hub spécifique
     */
    Flux<HubDeposit> findByHubNodeId(String hubNodeId);

    /**
     * Trouver tous les dépôts dans un hub avec un statut spécifique
     */
    Flux<HubDeposit> findByHubNodeIdAndStatus(String hubNodeId, HubDeposit.DepositStatus status);

    /**
     * Trouver tous les dépôts effectués par un livreur
     */
    Flux<HubDeposit> findByDepositedByDriverId(String driverId);

    /**
     * Compter le nombre de colis actuellement au hub (DEPOSITED ou AWAITING_PICKUP)
     */
    @Query("SELECT COUNT(*) FROM hub_deposits WHERE hub_node_id = :hubNodeId AND status IN ('DEPOSITED', 'AWAITING_PICKUP')")
    Mono<Long> countActiveDepositsAtHub(String hubNodeId);

    /**
     * Trouver les dépôts expirés (plus de X jours)
     */
    @Query("SELECT * FROM hub_deposits WHERE status IN ('DEPOSITED', 'AWAITING_PICKUP') AND deposit_time < :expiryTime")
    Flux<HubDeposit> findExpiredDeposits(java.time.Instant expiryTime);
}
