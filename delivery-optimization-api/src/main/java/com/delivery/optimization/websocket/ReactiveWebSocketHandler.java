package com.delivery.optimization.websocket;

import com.delivery.optimization.service.WebSocketBroadcaster;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketMessage;
import org.springframework.web.reactive.socket.WebSocketSession;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * Handler WebSocket réactif pour WebFlux.
 * Gère les connexions WebSocket et les abonnements aux topics.
 *
 * Protocole simple:
 * - Client se connecte et reçoit automatiquement les messages du topic "/topic/fleet"
 * - Serveur broadcast les mises à jour en temps réel (ETA, positions, etc.)
 */
@Component
public class ReactiveWebSocketHandler implements WebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(ReactiveWebSocketHandler.class);

    private final WebSocketBroadcaster broadcaster;
    private final ObjectMapper objectMapper;

    public ReactiveWebSocketHandler(WebSocketBroadcaster broadcaster, ObjectMapper objectMapper) {
        this.broadcaster = broadcaster;
        this.objectMapper = objectMapper;
    }

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        log.info("Nouvelle connexion WebSocket: {}", session.getId());

        // Traiter les messages entrants du client (pour extensions futures)
        Mono<Void> input = session.receive()
            .map(WebSocketMessage::getPayloadAsText)
            .doOnNext(message -> handleClientMessage(session, message))
            .doOnError(error -> log.error("Erreur WebSocket session {}: {}", session.getId(), error.getMessage()))
            .then();

        // Flux de messages sortants: broadcaster -> client
        // Par défaut, abonner automatiquement au topic "/topic/fleet" (notifications globales)
        Flux<WebSocketMessage> output = broadcaster.subscribeTo("/topic/fleet")
            .map(session::textMessage)
            .doOnNext(msg -> log.debug("Envoi message à session {}", session.getId()))
            .doOnComplete(() -> log.info("Flux terminé pour session {}", session.getId()));

        // Envoyer les messages et écouter les entrées en parallèle
        return session.send(output)
            .and(input)
            .doFinally(signalType -> log.info("Connexion WebSocket fermée: {} ({})", session.getId(), signalType));
    }

    /**
     * Gérer les messages reçus du client (pour extensions futures: subscribe/unsubscribe).
     */
    private void handleClientMessage(WebSocketSession session, String message) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, String> payload = objectMapper.readValue(message, Map.class);

            String action = payload.get("action");
            String topic = payload.get("topic");

            if ("subscribe".equals(action) && topic != null) {
                log.info("Client {} demande abonnement au topic: {}", session.getId(), topic);
                // Pour l'instant, tous les clients reçoivent /topic/fleet
                // Extension future: gérer des topics individuels
            } else if ("unsubscribe".equals(action) && topic != null) {
                log.info("Client {} se désabonne du topic: {}", session.getId(), topic);
            } else if ("ping".equals(action)) {
                log.debug("Ping reçu de {}", session.getId());
            }

        } catch (Exception e) {
            log.error("Erreur traitement message de {}: {}", session.getId(), e.getMessage());
        }
    }
}
