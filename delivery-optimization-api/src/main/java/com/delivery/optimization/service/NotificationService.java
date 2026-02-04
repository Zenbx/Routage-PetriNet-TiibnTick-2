package com.delivery.optimization.service;

import com.delivery.optimization.domain.Notification;
import com.delivery.optimization.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

/**
 * Service de gestion des notifications client
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final WebSocketBroadcaster webSocketBroadcaster;

    /**
     * Créer et envoyer une notification
     */
    public Mono<Notification> sendNotification(
            String deliveryId,
            String trackingCode,
            String recipientPhone,
            Notification.NotificationType type,
            String title,
            String message) {

        log.info("Sending notification - Delivery: {}, Type: {}, Phone: {}", deliveryId, type, recipientPhone);

        Notification notification = Notification.builder()
                .id(UUID.randomUUID().toString())
                .newEntity(true)
                .deliveryId(deliveryId)
                .trackingCode(trackingCode)
                .recipientPhone(recipientPhone)
                .type(type)
                .title(title)
                .message(message)
                .createdAt(Instant.now())
                .sentAt(Instant.now())
                .status(Notification.NotificationStatus.SENT)
                .build();

        return notificationRepository.save(notification)
                .doOnSuccess(saved -> {
                    // Broadcaster via WebSocket
                    String topic = "/topic/notifications/" + trackingCode;
                    webSocketBroadcaster.sendToTopic(topic, saved);

                    log.info("Notification sent successfully: {} to topic: {}", saved.getId(), topic);
                })
                .doOnError(error -> log.error("Failed to send notification: {}", error.getMessage()));
    }

    /**
     * Obtenir toutes les notifications pour un code de tracking
     */
    public Flux<Notification> getNotificationsByTrackingCode(String trackingCode) {
        return notificationRepository.findByTrackingCodeOrderByCreatedAtDesc(trackingCode);
    }

    /**
     * Obtenir les notifications non lues pour un téléphone
     */
    public Flux<Notification> getUnreadNotifications(String phone) {
        return notificationRepository.findUnreadByPhone(phone);
    }

    /**
     * Compter les notifications non lues
     */
    public Mono<Long> countUnreadNotifications(String phone) {
        return notificationRepository.countUnreadByPhone(phone);
    }

    /**
     * Marquer une notification comme lue
     */
    public Mono<Notification> markAsRead(String notificationId) {
        return notificationRepository.findById(notificationId)
                .flatMap(notification -> {
                    notification.setStatus(Notification.NotificationStatus.READ);
                    notification.setNewEntity(false);
                    return notificationRepository.save(notification);
                });
    }

    /**
     * Marquer toutes les notifications comme lues pour un téléphone
     */
    public Mono<Void> markAllAsRead(String phone) {
        return notificationRepository.markAllAsRead(phone);
    }

    // ===== Méthodes helper pour envoyer des notifications pour des événements
    // spécifiques =====

    public Mono<Notification> notifyDeliveryCreated(String deliveryId, String trackingCode, String recipientPhone) {
        return sendNotification(
                deliveryId,
                trackingCode,
                recipientPhone,
                Notification.NotificationType.DELIVERY_CREATED,
                "Livraison créée",
                "Votre demande de livraison a été créée avec succès. Code de suivi: " + trackingCode);
    }

    public Mono<Notification> notifyDriverAssigned(String deliveryId, String trackingCode, String recipientPhone,
            String driverName) {
        return sendNotification(
                deliveryId,
                trackingCode,
                recipientPhone,
                Notification.NotificationType.DRIVER_ASSIGNED,
                "Livreur assigné",
                "Un livreur a accepté votre livraison et sera bientôt chez vous.");
    }

    public Mono<Notification> notifyPackagePickedUp(String deliveryId, String trackingCode, String recipientPhone) {
        return sendNotification(
                deliveryId,
                trackingCode,
                recipientPhone,
                Notification.NotificationType.PACKAGE_PICKED_UP,
                "Colis récupéré",
                "Le livreur a récupéré votre colis et est en route.");
    }

    public Mono<Notification> notifyInTransit(String deliveryId, String trackingCode, String recipientPhone) {
        return sendNotification(
                deliveryId,
                trackingCode,
                recipientPhone,
                Notification.NotificationType.IN_TRANSIT,
                "En cours de livraison",
                "Votre colis est en route vers sa destination.");
    }

    public Mono<Notification> notifyDepositedAtHub(String deliveryId, String trackingCode, String recipientPhone,
            String hubName) {
        return sendNotification(
                deliveryId,
                trackingCode,
                recipientPhone,
                Notification.NotificationType.DEPOSITED_AT_HUB,
                "Colis déposé au hub",
                "Votre colis a été déposé au hub: " + hubName + ". Vous pouvez le récupérer.");
    }

    public Mono<Notification> notifyPickedUpFromHub(String deliveryId, String trackingCode, String recipientPhone) {
        return sendNotification(
                deliveryId,
                trackingCode,
                recipientPhone,
                Notification.NotificationType.PICKED_UP_FROM_HUB,
                "Colis récupéré du hub",
                "Votre colis a été récupéré du hub et est en route pour livraison finale.");
    }

    public Mono<Notification> notifyDelivered(String deliveryId, String trackingCode, String recipientPhone) {
        return sendNotification(
                deliveryId,
                trackingCode,
                recipientPhone,
                Notification.NotificationType.DELIVERED,
                "Colis livré ! 🎉",
                "Votre colis a été livré avec succès. Merci d'avoir utilisé nos services !");
    }
}
