package com.yowyob.petrinet.persistence.repository;

import com.yowyob.petrinet.persistence.entity.ArcEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import java.util.UUID;

public interface ArcRepository extends ReactiveCrudRepository<ArcEntity, Long> {
    Flux<ArcEntity> findAllByNetId(UUID netId);
}
