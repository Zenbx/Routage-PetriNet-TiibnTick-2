package com.yowyob.petrinet.api.dto;

public class ArcDTO {
    public String placeId;
    public String transitionId;
    public String type; // INPUT, OUTPUT, INHIBITOR
    public Integer weight; // Simple integer weight for now

    public ArcDTO() {
    }

    public ArcDTO(String placeId, String transitionId, String type, Integer weight) {
        this.placeId = placeId;
        this.transitionId = transitionId;
        this.type = type;
        this.weight = weight;
    }
}
