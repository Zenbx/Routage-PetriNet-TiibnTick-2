package com.yowyob.petrinet.api.dto;

public class TokenDTO {
    public Object value;
    public long creationTimestamp;

    public TokenDTO() {
    }

    public TokenDTO(Object value, long creationTimestamp) {
        this.value = value;
        this.creationTimestamp = creationTimestamp;
    }
}
