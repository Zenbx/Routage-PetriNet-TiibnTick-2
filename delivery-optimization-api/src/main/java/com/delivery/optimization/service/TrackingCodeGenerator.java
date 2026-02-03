package com.delivery.optimization.service;

import com.delivery.optimization.repository.DeliveryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.security.SecureRandom;
import java.time.Instant;

/**
 * Service de génération de codes de tracking uniques
 * Format: TRK-XXXXYYYZZ (13 caractères)
 * - TRK: Préfixe
 * - XXXX: 4 lettres majuscules aléatoires
 * - YYY: 3 chiffres aléatoires
 * - ZZ: 2 lettres majuscules aléatoires
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class TrackingCodeGenerator {

    private final DeliveryRepository deliveryRepository;
    private final SecureRandom random = new SecureRandom();

    private static final String LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String DIGITS = "0123456789";
    private static final int MAX_RETRIES = 10;

    /**
     * Génère un code de tracking unique
     * Vérifie l'unicité dans la base de données
     * Retry jusqu'à MAX_RETRIES fois en cas de collision
     */
    public Mono<String> generateUniqueTrackingCode() {
        return generateCode()
                .flatMap(code -> deliveryRepository.existsByTrackingCode(code)
                        .flatMap(exists -> {
                            if (exists) {
                                log.warn("Tracking code collision detected: {}, regenerating...", code);
                                return retryGeneration(1);
                            }
                            log.info("Generated unique tracking code: {}", code);
                            return Mono.just(code);
                        })
                );
    }

    /**
     * Retry logic avec limite
     */
    private Mono<String> retryGeneration(int attempt) {
        if (attempt >= MAX_RETRIES) {
            log.error("Failed to generate unique tracking code after {} attempts", MAX_RETRIES);
            return Mono.error(new IllegalStateException("Cannot generate unique tracking code"));
        }

        return generateCode()
                .flatMap(code -> deliveryRepository.existsByTrackingCode(code)
                        .flatMap(exists -> exists
                                ? retryGeneration(attempt + 1)
                                : Mono.just(code)
                        )
                );
    }

    /**
     * Génère un code aléatoire sans vérification d'unicité
     * Format: TRK-XXXXYYYZZ
     */
    private Mono<String> generateCode() {
        return Mono.fromSupplier(() -> {
            StringBuilder code = new StringBuilder("TRK-");

            // 4 lettres
            for (int i = 0; i < 4; i++) {
                code.append(LETTERS.charAt(random.nextInt(LETTERS.length())));
            }

            // 3 chiffres
            for (int i = 0; i < 3; i++) {
                code.append(DIGITS.charAt(random.nextInt(DIGITS.length())));
            }

            // 2 lettres
            for (int i = 0; i < 2; i++) {
                code.append(LETTERS.charAt(random.nextInt(LETTERS.length())));
            }

            return code.toString();
        });
    }

    /**
     * Génère un code avec timestamp pour garantir l'unicité temporelle
     * Format alternatif: TRK-YYYYMMDD-XXXXX
     * Utile en cas de forte charge
     */
    public Mono<String> generateTrackingCodeWithTimestamp() {
        return Mono.fromSupplier(() -> {
            Instant now = Instant.now();
            String datePart = now.toString().substring(0, 10).replace("-", "");

            StringBuilder code = new StringBuilder("TRK-")
                    .append(datePart)
                    .append("-");

            // 5 caractères alphanumériques
            String alphanumeric = LETTERS + DIGITS;
            for (int i = 0; i < 5; i++) {
                code.append(alphanumeric.charAt(random.nextInt(alphanumeric.length())));
            }

            return code.toString();
        }).flatMap(code -> deliveryRepository.existsByTrackingCode(code)
                .flatMap(exists -> exists
                        ? generateTrackingCodeWithTimestamp() // Retry si collision
                        : Mono.just(code)
                )
        );
    }
}
