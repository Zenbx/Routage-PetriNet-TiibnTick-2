package com.delivery.optimization.controller;

import com.delivery.optimization.domain.Notification;
import com.delivery.optimization.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Contrôleur REST pour les notifications client
 */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Gestion des notifications client")
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * Obtenir toutes les notifications pour un code de tracking
     */
    @GetMapping("/tracking/{trackingCode}")
    @Operation(summary = "Notifications par tracking code", description = "Récupérer toutes les notifications pour un code de suivi")
    public Flux<Notification> getNotificationsByTrackingCode(
            @Parameter(description = "Code de suivi", required = true) @PathVariable String trackingCode) {
        return notificationService.getNotificationsByTrackingCode(trackingCode);
    }

    /**
     * Obtenir les notifications non lues pour un téléphone
     */
    @GetMapping("/unread")
    @Operation(summary = "Notifications non lues", description = "Récupérer les notifications non lues pour un numéro de téléphone")
    public Flux<Notification> getUnreadNotifications(
            @Parameter(description = "Numéro de téléphone", required = true) @RequestParam String phone) {
        return notificationService.getUnreadNotifications(phone);
    }

    /**
     * Compter les notifications non lues
     */
    @GetMapping("/unread/count")
    @Operation(summary = "Nombre de notifications non lues", description = "Compter les notifications non lues pour un téléphone")
    public Mono<Long> countUnreadNotifications(
            @Parameter(description = "Numéro de téléphone", required = true) @RequestParam String phone) {
        return notificationService.countUnreadNotifications(phone);
    }

    /**
     * Marquer une notification comme lue
     */
    @PutMapping("/{notificationId}/read")
    @Operation(summary = "Marquer comme lu", description = "Marquer une notification comme lue")
    public Mono<Notification> markAsRead(
            @Parameter(description = "ID de la notification", required = true) @PathVariable String notificationId) {
        return notificationService.markAsRead(notificationId);
    }

    /**
     * Marquer toutes les notifications comme lues pour un téléphone
     */
    @PutMapping("/read-all")
    @Operation(summary = "Marquer tout comme lu", description = "Marquer toutes les notifications comme lues pour un téléphone")
    public Mono<Void> markAllAsRead(
            @Parameter(description = "Numéro de téléphone", required = true) @RequestParam String phone) {
        return notificationService.markAllAsRead(phone);
    }
}
