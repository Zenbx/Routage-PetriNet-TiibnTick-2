package com.delivery.optimization.controller;

import com.delivery.optimization.domain.Arc;
import com.delivery.optimization.domain.Node;
import com.delivery.optimization.repository.ArcRepository;
import com.delivery.optimization.repository.NodeRepository;
import com.delivery.optimization.service.GraphService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/graph")
@RequiredArgsConstructor
@Tag(name = "Graph", description = "Gestion du graphe routier (noeuds et arcs)")
public class GraphController {

    private final NodeRepository nodeRepository;
    private final ArcRepository arcRepository;
    private final GraphService graphService;

    @PostMapping("/initialize")
    @Operation(
        summary = "Initialiser le graphe routier",
        description = "Crée la structure complète du réseau avec tous les noeuds (intersections) et arcs (routes) avec leurs coûts initiaux"
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Graphe initialisé avec succès"),
        @ApiResponse(responseCode = "500", description = "Erreur lors de l'initialisation")
    })
    public Mono<Void> initialize() {
        return graphService.initializeGraph();
    }

    @GetMapping("/nodes")
    @Operation(
        summary = "Récupérer tous les noeuds",
        description = "Retourne la liste complète des noeuds du graphe (intersections/points de livraison) avec leurs coordonnées"
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Liste des noeuds récupérée avec succès",
                     content = @Content(schema = @Schema(implementation = Node.class)))
    })
    public Flux<Node> getNodes() {
        return nodeRepository.findAll();
    }

    @GetMapping("/arcs")
    @Operation(
        summary = "Récupérer tous les arcs",
        description = "Retourne la liste complète des arcs (routes) avec leurs coûts, distances et facteurs de trafic"
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Liste des arcs récupérée avec succès",
                     content = @Content(schema = @Schema(implementation = Arc.class)))
    })
    public Flux<Arc> getArcs() {
        return arcRepository.findAll();
    }

    @PutMapping("/arcs/{id}/cost")
    @Operation(
        summary = "Mettre à jour le coût d'un arc",
        description = "Modifie le coût (temps de parcours) d'un arc pour refléter les changements de conditions routières"
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Coût de l'arc mis à jour avec succès",
                     content = @Content(schema = @Schema(implementation = Arc.class))),
        @ApiResponse(responseCode = "404", description = "Arc non trouvé"),
        @ApiResponse(responseCode = "400", description = "Coût invalide (doit être positif)")
    })
    public Mono<Arc> updateArcCost(
        @Parameter(description = "ID de l'arc à modifier", required = true, example = "1")
        @PathVariable Long id,
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Nouveau coût de l'arc (en minutes)",
            required = true
        )
        @RequestBody Double newCost
    ) {
        return graphService.updateArcCost(id, newCost);
    }
}
