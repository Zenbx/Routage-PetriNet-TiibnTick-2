package com.yowyob.petrinet.config;

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
 * Configuration OpenAPI 3.0 (Swagger) pour l'API Petri Net.
 *
 * Documentation accessible via:
 * - Swagger UI: http://localhost:8081/swagger-ui.html
 * - OpenAPI JSON: http://localhost:8081/v3/api-docs
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI petriNetOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("TiibnTick - Petri Net Validation Engine")
                        .description("""
                                API de validation formelle avec réseaux de Petri colorés temporisés (CTPN).

                                ## Fonctionnalités principales:

                                ### 🎯 Validation Formelle
                                - Création de réseaux de Petri colorés temporisés (CTPN)
                                - Définition de places (états), transitions et arcs
                                - Validation des workflows d'état

                                ### 🔄 Gestion de Transitions
                                - Déclenchement de transitions avec validation
                                - Vérification des conditions de tir
                                - Mise à jour du marquage (placement des tokens)

                                ### 📊 État et Marquage
                                - Consultation de l'état actuel du réseau
                                - Visualisation du marquage (tokens dans les places)
                                - Historique des transitions déclenchées

                                ### 🎨 Workflows Prédéfinis
                                **Delivery Lifecycle Management**:
                                - Places: PENDING, ASSIGNED, IN_TRANSIT, DELIVERED, FAILED
                                - Transitions: ASSIGN, START, COMPLETE, FAIL
                                - Validation des transitions d'état de livraison

                                ### 🔬 Concepts Théoriques
                                - **Réseau de Petri**: Modèle mathématique pour systèmes concurrents
                                - **Place**: État possible du système
                                - **Transition**: Règle de changement d'état
                                - **Token**: Instance dans un état (jeton)
                                - **Marquage**: Distribution actuelle des tokens
                                - **Tir**: Exécution d'une transition

                                ### ✅ Garanties Formelles
                                - Cohérence: Un token ne peut être que dans une seule place
                                - Atomicité: Les transitions sont atomiques
                                - Validation: Impossible de tirer une transition non activable
                                - Traçabilité: Historique complet des changements

                                ## Architecture
                                - **Backend**: Spring Boot 3.x WebFlux (Reactive)
                                - **Base de données**: PostgreSQL 15 (petri_db) avec R2DBC
                                - **Moteur**: PetriNetEngine avec validation CTPN
                                - **Intégration**: Utilisé par delivery-optimization-api (port 8080)
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
                                .url("http://localhost:8081")
                                .description("Serveur de développement local"),
                        new Server()
                                .url("https://tiibntick-petri-api.onrender.com")
                                .description("Serveur de production (Render)")))
                .tags(List.of(
                        new Tag()
                                .name("Petri Net")
                                .description("Gestion des réseaux de Petri (création, consultation, suppression)"),
                        new Tag()
                                .name("Transitions")
                                .description("Déclenchement et validation des transitions d'état"),
                        new Tag()
                                .name("State")
                                .description("Consultation de l'état et du marquage actuel"),
                        new Tag()
                                .name("Health")
                                .description("Endpoints de santé et monitoring")));
    }
}
