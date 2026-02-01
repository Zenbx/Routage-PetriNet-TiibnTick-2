package com.delivery.optimization.config;

import com.delivery.optimization.websocket.ReactiveWebSocketHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.HandlerMapping;
import org.springframework.web.reactive.handler.SimpleUrlHandlerMapping;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.server.support.WebSocketHandlerAdapter;

import java.util.HashMap;
import java.util.Map;

/**
 * Configuration WebSocket réactive pour WebFlux.
 * Remplace WebSocketConfig (MVC/STOMP) par une solution native WebFlux.
 *
 * Endpoint WebSocket: ws://host/ws
 */
@Configuration
public class WebFluxWebSocketConfig {

    /**
     * Mapper les chemins URL vers les handlers WebSocket.
     */
    @Bean
    public HandlerMapping webSocketHandlerMapping(ReactiveWebSocketHandler handler) {
        Map<String, WebSocketHandler> map = new HashMap<>();
        map.put("/ws", handler);  // Endpoint compatible avec l'ancien /ws de STOMP

        SimpleUrlHandlerMapping handlerMapping = new SimpleUrlHandlerMapping();
        handlerMapping.setOrder(1);  // Priorité haute
        handlerMapping.setUrlMap(map);
        return handlerMapping;
    }

    /**
     * Adapter pour connecter les handlers WebSocket à WebFlux.
     */
    @Bean
    public WebSocketHandlerAdapter handlerAdapter() {
        return new WebSocketHandlerAdapter();
    }
}
