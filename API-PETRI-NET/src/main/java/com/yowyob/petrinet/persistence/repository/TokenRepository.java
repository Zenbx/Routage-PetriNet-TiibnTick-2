package com.yowyob.petrinet.persistence.repository;

import com.yowyob.petrinet.persistence.entity.TokenEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import java.util.UUID;

public interface TokenRepository extends ReactiveCrudRepository<TokenEntity, Long> {
    Flux<TokenEntity> findAllByNetId(UUID netId);

    reactor.core.publisher.Mono<Void> deleteAllByNetId(UUID netId);
}
