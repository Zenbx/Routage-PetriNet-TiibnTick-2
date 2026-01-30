package com.delivery.optimization.controller;

import com.delivery.optimization.domain.Driver;
import com.delivery.optimization.repository.DriverRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/v1/drivers")
@RequiredArgsConstructor
public class DriverController {

    private final DriverRepository driverRepository;

    @GetMapping
    public Flux<Driver> getAllDrivers() {
        return driverRepository.findAll();
    }
}
