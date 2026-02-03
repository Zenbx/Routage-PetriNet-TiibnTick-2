package com.delivery.optimization.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.config.CorsRegistry;
import org.springframework.web.reactive.config.WebFluxConfigurer;

/**
 * Configuration CORS pour WebFlux (serveur réactif Reactor Netty).
 * Remplace l'ancienne configuration MVC après migration complète vers WebFlux.
 */
@Configuration
public class WebFluxConfig implements WebFluxConfigurer {

    @Value("${FRONTEND_URL:http://localhost:3000}")
    private String frontendUrl;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns(
                    "http://localhost:3000",
                    "http://127.0.0.1:3000",
                    "https://tiibntick-frontend-routage.vercel.app",  // Vercel production URL
                    frontendUrl  // Railway production URL from environment variable
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
