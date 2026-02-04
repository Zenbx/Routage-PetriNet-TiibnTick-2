package com.delivery.optimization.repository;

import com.delivery.optimization.domain.Notification;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface NotificationRepository extends ReactiveCrudRepository<Notification, String> {

    /**
     * Trouver toutes les notifications pour une livraison spécifique
     */
    Flux<Notification> findByDeliveryIdOrderByCreatedAtDesc(String deliveryId);

    /**
     * Trouver toutes les notifications pour un code de tracking
     */
    Flux<Notification> findByTrackingCodeOrderByCreatedAtDesc(String trackingCode);

    /**
     * Trouver les notifications non lues pour un téléphone
     */
    @Query("SELECT * FROM notifications WHERE recipient_phone = :phone AND status != 'READ' ORDER BY created_at DESC")
    Flux<Notification> findUnreadByPhone(String phone);

    /**
     * Compter les notifications non lues
     */
    @Query("SELECT COUNT(*) FROM notifications WHERE recipient_phone = :phone AND status != 'READ'")
    Mono<Long> countUnreadByPhone(String phone);

    /**
     * Marquer toutes les notifications comme lues
     */
    @Query("UPDATE notifications SET status = 'READ' WHERE recipient_phone = :phone AND status != 'READ'")
    Mono<Void> markAllAsRead(String phone);
}
