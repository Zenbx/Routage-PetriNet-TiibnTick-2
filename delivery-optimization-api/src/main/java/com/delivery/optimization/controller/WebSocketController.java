package com.delivery.optimization.controller;

import com.delivery.optimization.dto.ETAUpdateRequest;
import com.delivery.optimization.dto.ETAResponse;
import com.delivery.optimization.service.ETAService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import reactor.core.publisher.Mono;

@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketController {

    private final ETAService etaService;

    @MessageMapping("/delivery/{deliveryId}/update")
    @SendTo("/topic/delivery/{deliveryId}")
    public Mono<ETAResponse> handleDeliveryUpdate(@DestinationVariable String deliveryId, ETAUpdateRequest request) {
        log.info("Received real-time update for delivery {}: {}", deliveryId, request);
        return etaService.updateETA(deliveryId, request);
    }
}
