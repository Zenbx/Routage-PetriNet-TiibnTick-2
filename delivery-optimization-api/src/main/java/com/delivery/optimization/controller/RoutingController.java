package com.delivery.optimization.controller;

import com.delivery.optimization.dto.ShortestPathRequest;
import com.delivery.optimization.dto.ShortestPathResponse;
import com.delivery.optimization.dto.TrafficUpdateRequest;
import com.delivery.optimization.service.ShortestPathService;
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

@RestController
@RequestMapping("/api/v1/routing")
@RequiredArgsConstructor
@Tag(name = "Routing", description = "Algorithme A* pour le calcul de plus court chemin")
public class RoutingController {

    private final ShortestPathService shortestPathService;

    @PostMapping("/shortest-path")
    @Operation(
        summary = "Calculer le plus court chemin",
        description = "Utilise l'algorithme A* avec heuristique de distance euclidienne pour trouver le chemin optimal entre deux noeuds en tenant compte du trafic"
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Chemin calculé avec succès",
                     content = @Content(schema = @Schema(implementation = ShortestPathResponse.class))),
        @ApiResponse(responseCode = "400", description = "Requête invalide (noeud source/destination manquant)"),
        @ApiResponse(responseCode = "404", description = "Noeud source ou destination non trouvé"),
        @ApiResponse(responseCode = "500", description = "Aucun chemin trouvé entre les noeuds")
    })
    public Mono<ShortestPathResponse> getShortestPath(
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Requête avec noeud source et destination (IDs)",
            required = true
        )
        @RequestBody ShortestPathRequest request
    ) {
        return shortestPathService.calculateShortestPath(request);
    }

    @PostMapping("/arcs/{id}/traffic")
    @Operation(
        summary = "Mettre à jour le trafic d'un arc",
        description = "Applique un facteur de trafic (1.0 = normal, >1.0 = congestion) qui multiplie le coût de base de l'arc pour simuler les conditions réelles"
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Trafic mis à jour avec succès"),
        @ApiResponse(responseCode = "404", description = "Arc non trouvé"),
        @ApiResponse(responseCode = "400", description = "Facteur de trafic invalide (doit être >= 1.0)")
    })
    public Mono<Void> updateArcTraffic(
        @Parameter(description = "ID de l'arc à modifier", required = true, example = "1")
        @PathVariable Long id,
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Facteur de trafic (1.0 = normal, 1.5 = +50% temps, 2.0 = embouteillage)",
            required = true
        )
        @RequestBody TrafficUpdateRequest request
    ) {
        return shortestPathService.updateArcTraffic(id, request.getTrafficFactor());
    }
}
