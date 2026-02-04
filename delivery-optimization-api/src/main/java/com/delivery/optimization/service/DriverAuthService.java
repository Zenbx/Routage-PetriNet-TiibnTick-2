package com.delivery.optimization.service;

import com.delivery.optimization.domain.Driver;
import com.delivery.optimization.dto.DriverAuthResponse;
import com.delivery.optimization.dto.DriverLoginRequest;
import com.delivery.optimization.dto.DriverRegisterRequest;
import com.delivery.optimization.repository.DriverRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DriverAuthService {

    private final DriverRepository driverRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Inscription d'un nouveau livreur
     */
    public Mono<DriverAuthResponse> register(DriverRegisterRequest request) {
        log.info("Attempting to register new driver: {}", request.getEmail());

        return driverRepository.existsByEmail(request.getEmail())
                .flatMap(exists -> {
                    if (exists) {
                        return Mono.error(new ResponseStatusException(
                                HttpStatus.CONFLICT,
                                "Un livreur avec cet email existe déjà"
                        ));
                    }

                    Driver driver = Driver.builder()
                            .id(UUID.randomUUID().toString())
                            .newEntity(true)
                            .name(request.getName())
                            .email(request.getEmail())
                            .password(passwordEncoder.encode(request.getPassword()))
                            .phone(request.getPhone())
                            .vehicleType(request.getVehicleType())
                            .licensePlate(request.getLicensePlate())
                            .status(Driver.DriverStatus.AVAILABLE)
                            .createdAt(Instant.now())
                            .build();

                    return driverRepository.save(driver);
                })
                .map(this::buildAuthResponse)
                .doOnSuccess(response -> log.info("Driver registered successfully: {}", request.getEmail()))
                .doOnError(error -> log.error("Failed to register driver: {}", error.getMessage()));
    }

    /**
     * Connexion d'un livreur
     */
    public Mono<DriverAuthResponse> login(DriverLoginRequest request) {
        log.info("Attempting to login driver: {}", request.getEmail());

        return driverRepository.findByEmail(request.getEmail())
                .switchIfEmpty(Mono.error(new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Email ou mot de passe incorrect"
                )))
                .flatMap(driver -> {
                    if (!passwordEncoder.matches(request.getPassword(), driver.getPassword())) {
                        return Mono.error(new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "Email ou mot de passe incorrect"
                        ));
                    }
                    return Mono.just(driver);
                })
                .map(this::buildAuthResponse)
                .doOnSuccess(response -> log.info("Driver logged in successfully: {}", request.getEmail()))
                .doOnError(error -> log.error("Failed to login driver: {}", error.getMessage()));
    }

    /**
     * Construction de la réponse d'authentification
     */
    private DriverAuthResponse buildAuthResponse(Driver driver) {
        String token = generateToken(driver);

        return DriverAuthResponse.builder()
                .token(token)
                .driver(DriverAuthResponse.DriverInfo.builder()
                        .id(driver.getId())
                        .name(driver.getName())
                        .email(driver.getEmail())
                        .phone(driver.getPhone())
                        .vehicleType(driver.getVehicleType())
                        .licensePlate(driver.getLicensePlate())
                        .status(driver.getStatus())
                        .build())
                .build();
    }

    /**
     * Génération d'un token simple (à remplacer par JWT en production)
     */
    private String generateToken(Driver driver) {
        String payload = driver.getId() + ":" + driver.getEmail() + ":" + System.currentTimeMillis();
        return Base64.getEncoder().encodeToString(payload.getBytes());
    }
}
