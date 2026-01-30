package com.delivery.optimization.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Configuration OpenAPI 3.0 (Swagger) pour l'API de livraison optimisée.
 *
 * Documentation accessible via:
 * - Swagger UI: http://localhost:8080/swagger-ui.html
 * - OpenAPI JSON: http://localhost:8080/v3/api-docs
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI deliveryOptimizationOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("TiibnTick - Delivery Optimization API")
                        .description("""
                                API de gestion et optimisation de livraisons avec algorithmes avancés.

                                ## Fonctionnalités principales:

                                ### 🚚 Gestion de Livraisons
                                - CRUD complet des livraisons
                                - Transitions d'état avec validation Petri Net
                                - Statistiques en temps réel

                                ### 📊 Prédiction ETA (Kalman Filter)
                                - Filtrage de Kalman étendu pour prédiction ETA
                                - Mise à jour temps réel avec WebSocket
                                - Prise en compte du trafic dynamique

                                ### 🗺️ Graphe Routier
                                - Gestion des nœuds (clients, relais)
                                - Gestion des arcs avec coûts multicritères
                                - Mise à jour dynamique des facteurs de trafic

                                ### 🧭 Algorithmes d'Optimisation
                                - **A*** : Recherche de chemin optimal avec coûts composites
                                - **VRP** : Vehicle Routing Problem avec OR-Tools
                                - **Rerouting** : Recalcul dynamique avec hystérésis

                                ### 📡 Suivi Temps Réel
                                - WebSocket STOMP pour mises à jour live
                                - Tracking GPS avec Kalman Filter
                                - Notifications d'événements

                                ### 🎯 Validation Formelle
                                - Intégration Petri Net API (port 8081)
                                - Validation des transitions d'état
                                - Garantie de cohérence

                                ## Architecture
                                - **Backend**: Spring Boot 3.x WebFlux (Reactive)
                                - **Base de données**: PostgreSQL 15 avec R2DBC
                                - **Migrations**: Liquibase
                                - **Algorithmes**: A*, Kalman Filter, VRP (OR-Tools)
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("TiibnTick Team")
                                .email("contact@tiibntick.com")
                                .url("https://tiibntick.com"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:8080")
                                .description("Serveur de développement local"),
                        new Server()
                                .url("https://tiibntick-delivery-api.onrender.com")
                                .description("Serveur de production (Render)")))
                .tags(List.of(
                        new Tag()
                                .name("Deliveries")
                                .description("Gestion des livraisons (CRUD, stats, transitions)"),
                        new Tag()
                                .name("Graph")
                                .description("Gestion du graphe routier (nœuds, arcs, coûts)"),
                        new Tag()
                                .name("Pathfinding")
                                .description("Algorithme A* pour recherche de chemin optimal"),
                        new Tag()
                                .name("VRP")
                                .description("Vehicle Routing Problem - optimisation de tournées"),
                        new Tag()
                                .name("Tracking")
                                .description("Suivi GPS temps réel avec Kalman Filter"),
                        new Tag()
                                .name("Rerouting")
                                .description("Recalcul dynamique de route avec hystérésis"),
                        new Tag()
                                .name("Analytics")
                                .description("Statistiques et métriques de performance"),
                        new Tag()
                                .name("Health")
                                .description("Endpoints de santé et monitoring")));
    }
}
