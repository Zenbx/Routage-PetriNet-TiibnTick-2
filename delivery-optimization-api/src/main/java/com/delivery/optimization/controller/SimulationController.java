package com.delivery.optimization.controller;

import com.delivery.optimization.service.GraphService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/simulation")
@RequiredArgsConstructor
public class SimulationController {

    private final GraphService graphService;

    @PostMapping("/traffic")
    public Mono<Void> simulateTraffic() {
        return graphService.simulateTraffic();
    }

    @PostMapping("/weather")
    public Mono<Void> simulateWeather(@RequestBody Map<String, Boolean> body) {
        boolean rain = body.getOrDefault("rain", false);
        return graphService.applyRain(rain);
    }

    @PostMapping("/reroute")
    public Mono<Void> simulateReroute() {
        return graphService.simulateReroute();
    }
}
