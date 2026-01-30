package com.delivery.optimization.controller;

import com.delivery.optimization.dto.TourOptimizationRequest;
import com.delivery.optimization.dto.TourOptimizationResponse;
import com.delivery.optimization.service.VRPOptimizationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/tours")
@RequiredArgsConstructor
@Tag(name = "VRP", description = "Vehicle Routing Problem - Optimisation de tournées multi-livraisons")
public class TourController {

    private final VRPOptimizationService vrpOptimizationService;

    @PostMapping("/optimize")
    @Operation(
        summary = "Optimiser une tournée de livraison",
        description = "Résout le VRP en utilisant une heuristique nearest-neighbor pour minimiser la distance/temps total d'une tournée visitant plusieurs points de livraison"
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Tournée optimisée avec succès",
                     content = @Content(schema = @Schema(implementation = TourOptimizationResponse.class))),
        @ApiResponse(responseCode = "400", description = "Requête invalide (liste de livraisons vide ou noeud de départ manquant)"),
        @ApiResponse(responseCode = "404", description = "Un ou plusieurs noeuds de livraison non trouvés"),
        @ApiResponse(responseCode = "500", description = "Erreur lors de l'optimisation")
    })
    public Mono<TourOptimizationResponse> optimizeTour(
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Liste des IDs de livraisons à inclure dans la tournée + noeud de départ",
            required = true
        )
        @RequestBody TourOptimizationRequest request
    ) {
        return vrpOptimizationService.optimizeTour(request);
    }
}
