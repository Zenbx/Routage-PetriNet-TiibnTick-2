package com.yowyob.petrinet.api.dto;

import java.util.List;
import java.util.Map;

public class NetStateDTO {
    public long currentTime;
    public Map<String, List<TokenDTO>> marking;

    public NetStateDTO() {
    }

    public NetStateDTO(long currentTime, Map<String, List<TokenDTO>> marking) {
        this.currentTime = currentTime;
        this.marking = marking;
    }
}
