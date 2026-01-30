package com.yowyob.petrinet.api;

import com.yowyob.petrinet.api.dto.NetDTO;
import com.yowyob.petrinet.api.dto.NetStateDTO;
import com.yowyob.petrinet.api.dto.TokenDTO;
import com.yowyob.petrinet.service.PetriNetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import reactor.core.publisher.Mono;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/nets")
@Tag(name = "Petri Net", description = "Gestion et validation des réseaux de Petri colorés temporisés")
public class PetriNetController {

    private final PetriNetService petriNetService;

    public PetriNetController(PetriNetService petriNetService) {
        this.petriNetService = petriNetService;
    }

    @GetMapping("/health")
    @Operation(
        summary = "Vérifier la santé de l'API",
        description = "Endpoint de health check pour vérifier que l'API Petri Net est opérationnelle"
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "API opérationnelle",
                     content = @Content(schema = @Schema(implementation = String.class, example = "UP")))
    })
    public Mono<String> health() {
        return Mono.just("UP");
    }

    @PostMapping
    @Operation(
        summary = "Créer un nouveau réseau de Petri",
        description = """
            Crée un réseau de Petri coloré temporisé (CTPN) avec:
            - Places (états possibles)
            - Transitions (règles de changement)
            - Arcs (flux entre places et transitions)
            - Marquage initial (placement des tokens)

            Utilisé pour valider les workflows d'état (ex: livraisons).
            """
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Réseau créé avec succès, retourne l'ID du réseau",
                     content = @Content(schema = @Schema(implementation = String.class))),
        @ApiResponse(responseCode = "400", description = "Définition du réseau invalide")
    })
    public Mono<String> createNet(
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Définition complète du réseau: places, transitions, arcs, marquage initial",
            required = true
        )
        @RequestBody NetDTO netDto
    ) {
        return petriNetService.createNet(netDto);
    }

    @GetMapping("/{id}")
    @Operation(
        summary = "Obtenir l'état actuel d'un réseau",
        description = """
            Retourne l'état complet d'un réseau de Petri:
            - Marquage actuel (distribution des tokens dans les places)
            - Temps réseau actuel
            - Configuration du réseau (places, transitions, arcs)

            Permet de visualiser l'état d'un workflow en cours.
            """
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "État du réseau récupéré",
                     content = @Content(schema = @Schema(implementation = NetStateDTO.class))),
        @ApiResponse(responseCode = "404", description = "Réseau non trouvé")
    })
    public Mono<ResponseEntity<NetStateDTO>> getNetState(
        @Parameter(description = "ID unique du réseau de Petri", required = true, example = "DEL-001")
        @PathVariable String id
    ) {
        return petriNetService.getNetState(id)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/fire/{transitionId}")
    @Operation(
        summary = "Déclencher une transition",
        description = """
            Exécute une transition dans le réseau de Petri si elle est activable:

            **Validation automatique**:
            - Vérifie que la transition est activable (tokens présents dans places sources)
            - Consomme les tokens des places d'entrée
            - Produit les tokens dans les places de sortie
            - Met à jour le marquage du réseau

            **Exemple**: Pour une livraison, déclencher START fait passer de ASSIGNED à IN_TRANSIT.

            **Binding**: Mapping entre variables de la transition et tokens concrets
            """
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Transition déclenchée avec succès"),
        @ApiResponse(responseCode = "400", description = "Transition non activable ou binding invalide"),
        @ApiResponse(responseCode = "404", description = "Réseau ou transition non trouvé")
    })
    public Mono<ResponseEntity<Void>> fireTransition(
        @Parameter(description = "ID du réseau de Petri", required = true, example = "DEL-001")
        @PathVariable String id,
        @Parameter(description = "ID de la transition à déclencher", required = true, example = "START")
        @PathVariable String transitionId,
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Binding: association entre les variables de la transition et les tokens concrets",
            required = true
        )
        @RequestBody Map<String, List<TokenDTO>> binding
    ) {
        return petriNetService.fireTransition(id, transitionId, binding)
                .then(Mono.just(ResponseEntity.ok().<Void>build()))
                .onErrorResume(IllegalArgumentException.class, e -> Mono.just(ResponseEntity.badRequest().build()));
    }
}
