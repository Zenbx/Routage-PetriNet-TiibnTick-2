package com.yowyob.petrinet.api.dto;

public class TransitionDTO {
    public String id;
    public String name;
    public long minFiringDelay;
    public long maxFiringDelay;

    public TransitionDTO() {
    }

    public TransitionDTO(String id, String name, long minFiringDelay, long maxFiringDelay) {
        this.id = id;
        this.name = name;
        this.minFiringDelay = minFiringDelay;
        this.maxFiringDelay = maxFiringDelay;
    }
}
