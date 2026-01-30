package com.delivery.optimization.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class PetriNetConfig {

    @Value("${petri-net.api.url:http://localhost:8081}")
    private String petriNetApiUrl;

    @Bean(name = "petriNetWebClient")
    public WebClient petriNetWebClient(WebClient.Builder builder) {
        return builder
                .baseUrl(petriNetApiUrl)
                .build();
    }
}
