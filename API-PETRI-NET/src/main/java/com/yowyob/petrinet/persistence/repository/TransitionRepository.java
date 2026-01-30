package com.yowyob.petrinet.persistence.repository;

import com.yowyob.petrinet.persistence.entity.TransitionEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import java.util.UUID;

public interface TransitionRepository extends ReactiveCrudRepository<TransitionEntity, Long> {
    Flux<TransitionEntity> findAllByNetId(UUID netId);
}
