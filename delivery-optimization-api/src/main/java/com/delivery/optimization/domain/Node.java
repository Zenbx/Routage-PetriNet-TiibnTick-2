package com.delivery.optimization.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("nodes")
public class Node {
    @Id
    private String id;
    private NodeType type;
    private String name;
    private Double latitude;
    private Double longitude;
    private Integer capacity;
    private Integer currentOccupancy;

    public enum NodeType {
        CLIENT, RELAY, DEPOT
    }
}
