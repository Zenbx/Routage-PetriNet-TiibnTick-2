package com.yowyob.petrinet.persistence.repository;

import com.yowyob.petrinet.persistence.entity.PlaceEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import java.util.UUID;

public interface PlaceRepository extends ReactiveCrudRepository<PlaceEntity, Long> {
    Flux<PlaceEntity> findAllByNetId(UUID netId);
}
