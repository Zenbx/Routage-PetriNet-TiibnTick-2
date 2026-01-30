package com.delivery.optimization.controller;

import com.delivery.optimization.dto.ETAResponse;
import com.delivery.optimization.dto.ETAUpdateRequest;
import com.delivery.optimization.service.ETAService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/tracking")
@RequiredArgsConstructor
@Tag(name = "Tracking", description = "Suivi GPS temps réel et prédiction ETA avec filtre de Kalman")
public class TrackingController {

    private final ETAService etaService;

    @PostMapping("/{id}/update")
    @Operation(
        summary = "Mettre à jour la position GPS",
        description = "Intègre de nouvelles données de tracking GPS (vitesse, distance parcourue) et recalcule l'ETA via filtre de Kalman pour réduire le bruit des mesures"
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Position mise à jour et ETA recalculé",
                     content = @Content(schema = @Schema(implementation = ETAResponse.class))),
        @ApiResponse(responseCode = "400", description = "Données GPS invalides (vitesse négative, distance incohérente)"),
        @ApiResponse(responseCode = "404", description = "Livraison non trouvée")
    })
    public Mono<ETAResponse> updateTracking(
        @Parameter(description = "ID de la livraison à tracker", required = true, example = "DEL-001")
        @PathVariable String id,
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Données GPS: vitesse actuelle (km/h), distance parcourue (km), timestamp",
            required = true
        )
        @RequestBody ETAUpdateRequest request
    ) {
        // Ensure timestamp is present
        if (request.getTimestamp() == null) {
            request.setTimestamp(Instant.now());
        }

        return etaService.updateETA(id, request);
    }

    @GetMapping("/{id}/stats")
    @Operation(
        summary = "Récupérer les statistiques de tracking",
        description = "Retourne l'état actuel du suivi: ETA estimé, variance (incertitude), vitesse moyenne, distance restante avec intervalle de confiance"
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Statistiques récupérées avec succès",
                     content = @Content(schema = @Schema(implementation = ETAResponse.class))),
        @ApiResponse(responseCode = "404", description = "Livraison non trouvée ou aucune donnée de tracking disponible")
    })
    public Mono<ETAResponse> getStats(
        @Parameter(description = "ID de la livraison", required = true, example = "DEL-001")
        @PathVariable String id
    ) {
        return etaService.getLatestStats(id);
    }
}
