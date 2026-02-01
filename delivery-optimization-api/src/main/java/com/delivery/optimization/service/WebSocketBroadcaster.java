package com.delivery.optimization.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service de broadcast WebSocket réactif pour WebFlux.
 * Remplace SimpMessagingTemplate de Spring MVC STOMP.
 *
 * Utilise Reactor Sinks pour broadcaster les messages à plusieurs clients.
 */
@Service
@Slf4j
public class WebSocketBroadcaster {

    private final ObjectMapper objectMapper;

    // Stockage des sinks par topic (ex: "/topic/tracking/DEL-001", "/topic/fleet")
    private final Map<String, Sinks.Many<String>> topicSinks = new ConcurrentHashMap<>();

    public WebSocketBroadcaster(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Envoie un message à un topic spécifique (broadcast à tous les abonnés).
     *
     * Exemple:
     * broadcaster.sendToTopic("/topic/tracking/DEL-001", etaResponse);
     *
     * @param topic Le topic destination (ex: "/topic/tracking/DEL-001")
     * @param message L'objet à envoyer (sera sérialisé en JSON)
     */
    public void sendToTopic(String topic, Object message) {
        try {
            String json = objectMapper.writeValueAsString(message);

            // Récupérer ou créer le sink pour ce topic
            Sinks.Many<String> sink = topicSinks.computeIfAbsent(
                topic,
                k -> Sinks.many().multicast().onBackpressureBuffer()
            );

            // Émettre le message (tous les abonnés le recevront)
            sink.tryEmitNext(json);

            log.debug("Message envoyé au topic {}: {}", topic, json);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi du message au topic " + topic, e);
        }
    }

    /**
     * S'abonner à un topic pour recevoir les messages en flux réactif.
     *
     * Exemple dans un WebSocketHandler:
     * Flux<String> messages = broadcaster.subscribeTo("/topic/tracking/DEL-001");
     *
     * @param topic Le topic à écouter
     * @return Un Flux de messages JSON
     */
    public Flux<String> subscribeTo(String topic) {
        Sinks.Many<String> sink = topicSinks.computeIfAbsent(
            topic,
            k -> Sinks.many().multicast().onBackpressureBuffer()
        );

        return sink.asFlux();
    }

    /**
     * Nettoyer un topic (utile pour libérer la mémoire).
     */
    public void removeTopic(String topic) {
        Sinks.Many<String> sink = topicSinks.remove(topic);
        if (sink != null) {
            sink.tryEmitComplete();
        }
    }

    /**
     * Obtenir le nombre de topics actifs (pour monitoring).
     */
    public int getActiveTopicsCount() {
        return topicSinks.size();
    }
}
