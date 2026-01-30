package com.delivery.optimization.repository;

import com.delivery.optimization.domain.Node;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface NodeRepository extends ReactiveCrudRepository<Node, String> {
    Flux<Node> findByType(Node.NodeType type);

    @Query("SELECT * FROM nodes WHERE type = 'RELAY' AND (capacity - COALESCE(current_occupancy, 0)) > 0")
    Flux<Node> findAvailableRelays();
}
