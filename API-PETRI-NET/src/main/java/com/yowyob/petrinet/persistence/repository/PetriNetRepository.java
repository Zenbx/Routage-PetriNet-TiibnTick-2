package com.yowyob.petrinet.persistence.repository;

import com.yowyob.petrinet.persistence.entity.PetriNetEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;

import java.util.UUID;

public interface PetriNetRepository extends ReactiveCrudRepository<PetriNetEntity, UUID> {
}
