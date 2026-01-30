package com.yowyob.petrinet.persistence.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("petri_transitions")
public class TransitionEntity {
    @Id
    private Long id;
    private UUID netId;
    private String transitionId;
    private String name;
    private Long minFiringDelay;
    private Long maxFiringDelay;
}
