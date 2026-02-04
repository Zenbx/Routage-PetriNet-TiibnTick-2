package com.delivery.optimization.controller;

import com.delivery.optimization.dto.DriverAuthResponse;
import com.delivery.optimization.dto.DriverLoginRequest;
import com.delivery.optimization.dto.DriverRegisterRequest;
import com.delivery.optimization.service.DriverAuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/driver/auth")
@RequiredArgsConstructor
@Tag(name = "Driver Authentication", description = "Authentification des livreurs")
public class DriverAuthController {

    private final DriverAuthService authService;

    @PostMapping("/register")
    @Operation(
        summary = "Inscription livreur",
        description = "Créer un nouveau compte livreur avec email, mot de passe et informations du véhicule"
    )
    public Mono<DriverAuthResponse> register(@Valid @RequestBody DriverRegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    @Operation(
        summary = "Connexion livreur",
        description = "Authentifier un livreur avec email et mot de passe. Retourne un token d'authentification."
    )
    public Mono<DriverAuthResponse> login(@Valid @RequestBody DriverLoginRequest request) {
        return authService.login(request);
    }
}
