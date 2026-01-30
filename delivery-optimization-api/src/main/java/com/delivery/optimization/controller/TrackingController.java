package com.delivery.optimization.controller;

import com.delivery.optimization.dto.ETAResponse;
import com.delivery.optimization.dto.ETAUpdateRequest;
import com.delivery.optimization.service.ETAService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/tracking")
@RequiredArgsConstructor
public class TrackingController {

    private final ETAService etaService;

    @PostMapping("/{id}/update")
    public Mono<ETAResponse> updateTracking(
            @PathVariable String id,
            @RequestBody ETAUpdateRequest request) {

        // Ensure timestamp is present
        if (request.getTimestamp() == null) {
            request.setTimestamp(Instant.now());
        }

        return etaService.updateETA(id, request);
    }

    @GetMapping("/{id}/stats")
    public Mono<ETAResponse> getStats(@PathVariable String id) {
        return etaService.getLatestStats(id);
    }
}
