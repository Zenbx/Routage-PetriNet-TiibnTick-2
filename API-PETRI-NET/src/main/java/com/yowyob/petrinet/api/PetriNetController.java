package com.yowyob.petrinet.api;

import com.yowyob.petrinet.api.dto.NetDTO;
import com.yowyob.petrinet.api.dto.NetStateDTO;
import com.yowyob.petrinet.api.dto.TokenDTO;
import com.yowyob.petrinet.service.PetriNetService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import reactor.core.publisher.Mono;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/nets")
public class PetriNetController {

    private final PetriNetService petriNetService;

    public PetriNetController(PetriNetService petriNetService) {
        this.petriNetService = petriNetService;
    }

    @GetMapping("/health")
    public Mono<String> health() {
        return Mono.just("UP");
    }

    @PostMapping
    public Mono<String> createNet(@RequestBody NetDTO netDto) {
        return petriNetService.createNet(netDto);
    }

    @GetMapping("/{id}")
    public Mono<ResponseEntity<NetStateDTO>> getNetState(@PathVariable String id) {
        return petriNetService.getNetState(id)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/fire/{transitionId}")
    public Mono<ResponseEntity<Void>> fireTransition(
            @PathVariable String id,
            @PathVariable String transitionId,
            @RequestBody Map<String, List<TokenDTO>> binding) {
        return petriNetService.fireTransition(id, transitionId, binding)
                .then(Mono.just(ResponseEntity.ok().<Void>build()))
                .onErrorResume(IllegalArgumentException.class, e -> Mono.just(ResponseEntity.badRequest().build()));
    }
}
