package com.yowyob.petrinet.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yowyob.petrinet.api.dto.*;
import com.yowyob.petrinet.application.CTPNService;
import com.yowyob.petrinet.domain.model.PetriNet;
import com.yowyob.petrinet.domain.model.color.Token;
import com.yowyob.petrinet.domain.model.structure.Arc;
import com.yowyob.petrinet.domain.model.structure.ArcExpression;
import com.yowyob.petrinet.domain.model.structure.Place;
import com.yowyob.petrinet.domain.model.structure.Transition;
import com.yowyob.petrinet.engine.state.NetState;
import com.yowyob.petrinet.persistence.entity.*;
import com.yowyob.petrinet.persistence.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
public class PetriNetService {

    private final PetriNetRepository petriNetRepository;
    private final PlaceRepository placeRepository;
    private final TransitionRepository transitionRepository;
    private final ArcRepository arcRepository;
    private final TokenRepository tokenRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final Map<String, CTPNService> activeNets = new ConcurrentHashMap<>();

    public PetriNetService(PetriNetRepository petriNetRepository,
            PlaceRepository placeRepository,
            TransitionRepository transitionRepository,
            ArcRepository arcRepository,
            TokenRepository tokenRepository) {
        this.petriNetRepository = petriNetRepository;
        this.placeRepository = placeRepository;
        this.transitionRepository = transitionRepository;
        this.arcRepository = arcRepository;
        this.tokenRepository = tokenRepository;
    }

    public Mono<String> createNet(NetDTO netDto) {
        UUID id = UUID.randomUUID();
        String idStr = id.toString();

        PetriNetEntity netEntity = PetriNetEntity.builder()
                .id(id)
                .name(netDto.name != null ? netDto.name : "Net-" + idStr)
                .currentTime(0L)
                .isNew(true)
                .build();

        // First, save the net entity
        return petriNetRepository.save(netEntity)
                .flatMap(savedNet -> {
                    // Once the net is saved, save all related entities in parallel
                    Mono<Void> savePlaces = Flux
                            .fromIterable(netDto.places != null ? netDto.places : Collections.emptyList())
                            .flatMap(pId -> placeRepository
                                    .save(PlaceEntity.builder().netId(id).placeId(pId).name(pId).build()))
                            .then();

                    Mono<Void> saveTransitions = Flux
                            .fromIterable(netDto.transitions != null ? netDto.transitions : Collections.emptyList())
                            .flatMap(tDto -> transitionRepository.save(TransitionEntity.builder()
                                    .netId(id)
                                    .transitionId(tDto.id)
                                    .name(tDto.name)
                                    .minFiringDelay(tDto.minFiringDelay)
                                    .maxFiringDelay(tDto.maxFiringDelay)
                                    .build()))
                            .then();

                    Mono<Void> saveArcs = Flux.fromIterable(netDto.arcs != null ? netDto.arcs : Collections.emptyList())
                            .flatMap(aDto -> arcRepository.save(ArcEntity.builder()
                                    .netId(id)
                                    .placeId(aDto.placeId)
                                    .transitionId(aDto.transitionId)
                                    .type(aDto.type)
                                    .weight(1)
                                    .build()))
                            .then();

                    // Wait for all related entities to be saved
                    return Mono.when(savePlaces, saveTransitions, saveArcs)
                            .thenReturn(idStr);
                });
    }

    public Mono<NetStateDTO> getNetState(String id) {
        return getOrLoadService(id)
                .map(this::convertStateToDTO);
    }

    public Mono<Void> fireTransition(String netId, String transitionId, Map<String, List<TokenDTO>> bindingDto) {
        return getOrLoadService(netId)
                .flatMap(service -> {
                    Map<String, List<Token<?>>> domainBinding = new HashMap<>();
                    bindingDto.forEach((k, v) -> {
                        List<Token<?>> tokens = v.stream()
                                .map(t -> Token.create(t.value, t.creationTimestamp))
                                .collect(Collectors.toList());
                        domainBinding.put(k, tokens);
                    });

                    service.fire(transitionId, domainBinding);
                    return saveNetState(netId, service);
                });
    }

    private Mono<CTPNService> getOrLoadService(String id) {
        if (activeNets.containsKey(id)) {
            return Mono.just(activeNets.get(id));
        }

        UUID uuid;
        try {
            uuid = UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            return Mono.empty();
        }

        return petriNetRepository.findById(uuid)
                .flatMap(netEntity -> {
                    Mono<List<PlaceEntity>> placesMono = placeRepository.findAllByNetId(uuid).collectList();
                    Mono<List<TransitionEntity>> transitionsMono = transitionRepository.findAllByNetId(uuid)
                            .collectList();
                    Mono<List<ArcEntity>> arcsMono = arcRepository.findAllByNetId(uuid).collectList();
                    Mono<List<TokenEntity>> tokensMono = tokenRepository.findAllByNetId(uuid).collectList();

                    return Mono.zip(placesMono, transitionsMono, arcsMono, tokensMono)
                            .map(tuple -> {
                                Set<Place> places = tuple.getT1().stream()
                                        .map(p -> new Place(p.getPlaceId(), p.getName()))
                                        .collect(Collectors.toSet());
                                Set<Transition> transitions = tuple.getT2().stream()
                                        .map(t -> new Transition(t.getTransitionId(), t.getName(),
                                                t.getMinFiringDelay(), t.getMaxFiringDelay()))
                                        .collect(Collectors.toSet());
                                Set<Arc> arcs = tuple.getT3().stream()
                                        .map(a -> {
                                            Arc.Type type = Arc.Type.valueOf(a.getType());
                                            ArcExpression expr = binding -> {
                                                if (binding instanceof Map) {
                                                    Map<?, ?> map = (Map<?, ?>) binding;
                                                    Object val = map.get(a.getPlaceId());
                                                    if (val instanceof List)
                                                        return (List<Token<?>>) val;
                                                }
                                                return Collections.emptyList();
                                            };
                                            return new Arc(a.getPlaceId(), a.getTransitionId(), type, expr);
                                        })
                                        .collect(Collectors.toSet());

                                PetriNet net = new PetriNet(places, transitions, arcs);
                                CTPNService service = new CTPNService(net);

                                NetState state = new NetState(netEntity.getCurrentTime());
                                for (TokenEntity te : tuple.getT4()) {
                                    try {
                                        Object value = objectMapper.readValue(te.getValue(), Object.class);
                                        state = state.addToken(te.getPlaceId(),
                                                Token.create(value, te.getCreationTimestamp()));
                                    } catch (Exception e) {
                                        log.error("Failed to parse token value", e);
                                    }
                                }
                                service.setInitialState(state);
                                activeNets.put(id, service);
                                return service;
                            });
                });
    }

    private Mono<Void> saveNetState(String id, CTPNService service) {
        UUID uuid = UUID.fromString(id);
        NetState state = service.getCurrentState();

        return petriNetRepository.findById(uuid)
                .flatMap(netEntity -> {
                    netEntity.setCurrentTime(state.getCurrentTime());
                    return petriNetRepository.save(netEntity);
                })
                .then(tokenRepository.deleteAllByNetId(uuid))
                .then(Flux.fromIterable(service.getModel().getPlaces())
                        .flatMap(p -> {
                            List<Token<?>> tokens = state.getTokens(p.getId());
                            return Flux.fromIterable(tokens)
                                    .flatMap(t -> {
                                        try {
                                            String jsonValue = objectMapper.writeValueAsString(t.value());
                                            return tokenRepository.save(TokenEntity.builder()
                                                    .netId(uuid)
                                                    .placeId(p.getId())
                                                    .value(jsonValue)
                                                    .creationTimestamp(t.creation_timestamp())
                                                    .build());
                                        } catch (JsonProcessingException e) {
                                            return Mono.error(e);
                                        }
                                    });
                        }).then())
                .then();
    }

    private NetStateDTO convertStateToDTO(CTPNService service) {
        var state = service.getCurrentState();
        Map<String, List<TokenDTO>> markingMap = new HashMap<>();

        for (Place p : service.getModel().getPlaces()) {
            List<Token<?>> tokens = state.getTokens(p.getId());
            if (!tokens.isEmpty()) {
                List<TokenDTO> dtos = tokens.stream()
                        .map(t -> new TokenDTO(t.value(), t.creation_timestamp()))
                        .collect(Collectors.toList());
                markingMap.put(p.getId(), dtos);
            }
        }

        return new NetStateDTO(state.getCurrentTime(), markingMap);
    }
}
