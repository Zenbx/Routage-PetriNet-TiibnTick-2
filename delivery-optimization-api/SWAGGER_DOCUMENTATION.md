# Documentation Swagger OpenAPI - Delivery Optimization API

## Vue d'ensemble

Tous les controllers REST de l'API ont été enrichis avec les annotations Swagger OpenAPI pour générer automatiquement une documentation interactive complète.

## Controllers documentés

### 1. GraphController
**Fichier:** `src/main/java/com/delivery/optimization/controller/GraphController.java`  
**Tag:** `Graph`  
**Description:** Gestion du graphe routier (noeuds et arcs)

#### Endpoints:
- `POST /api/v1/graph/initialize` - Initialiser le graphe routier
- `GET /api/v1/graph/nodes` - Récupérer tous les noeuds (intersections)
- `GET /api/v1/graph/arcs` - Récupérer tous les arcs (routes)
- `PUT /api/v1/graph/arcs/{id}/cost` - Mettre à jour le coût d'un arc

---

### 2. RoutingController (Pathfinding)
**Fichier:** `src/main/java/com/delivery/optimization/controller/RoutingController.java`  
**Tag:** `Routing`  
**Description:** Algorithme A* pour le calcul de plus court chemin

#### Endpoints:
- `POST /api/v1/routing/shortest-path` - Calculer le plus court chemin avec A*
  - Utilise l'heuristique de distance euclidienne
  - Prend en compte les facteurs de trafic
- `POST /api/v1/routing/arcs/{id}/traffic` - Mettre à jour le trafic d'un arc
  - Facteur 1.0 = normal, >1.0 = congestion

---

### 3. TourController (VRP)
**Fichier:** `src/main/java/com/delivery/optimization/controller/TourController.java`  
**Tag:** `VRP`  
**Description:** Vehicle Routing Problem - Optimisation de tournées multi-livraisons

#### Endpoints:
- `POST /api/v1/tours/optimize` - Optimiser une tournée de livraison
  - Heuristique nearest-neighbor
  - Minimise la distance/temps total

---

### 4. TrackingController
**Fichier:** `src/main/java/com/delivery/optimization/controller/TrackingController.java`  
**Tag:** `Tracking`  
**Description:** Suivi GPS temps réel et prédiction ETA avec filtre de Kalman

#### Endpoints:
- `POST /api/v1/tracking/{id}/update` - Mettre à jour la position GPS
  - Intègre données GPS (vitesse, distance)
  - Recalcule ETA via filtre de Kalman
- `GET /api/v1/tracking/{id}/stats` - Récupérer les statistiques de tracking
  - ETA estimé avec intervalle de confiance
  - Variance, vitesse moyenne, distance restante

---

### 5. DeliveryController (avec Reroutage)
**Fichier:** `src/main/java/com/delivery/optimization/controller/DeliveryController.java`  
**Tag:** `Deliveries`  
**Description:** Gestion complète des livraisons

#### Endpoints clés:
- `GET /api/v1/delivery` - Liste de toutes les livraisons
- `GET /api/v1/delivery/{id}` - Détails d'une livraison
- `GET /api/v1/delivery/stats` - Statistiques globales
- `GET /api/v1/delivery/{id}/eta` - Obtenir l'ETA actuel
- `POST /api/v1/delivery/{id}/eta/update` - Mettre à jour l'ETA avec données GPS
- `POST /api/v1/delivery/{id}/reroute` - Vérifier le besoin de reroutage (hystérésis)
- `POST /api/v1/delivery/{id}/state-transition` - Transition d'état (Petri Net)

---

## Structure des annotations

### Au niveau classe
```java
@Tag(name = "Nom du Tag", description = "Description du module")
```

### Au niveau méthode
```java
@Operation(
    summary = "Titre court de l'opération",
    description = "Description détaillée avec contexte technique"
)
@ApiResponses({
    @ApiResponse(responseCode = "200", description = "Succès",
                 content = @Content(schema = @Schema(implementation = ResponseClass.class))),
    @ApiResponse(responseCode = "400", description = "Requête invalide"),
    @ApiResponse(responseCode = "404", description = "Ressource non trouvée"),
    @ApiResponse(responseCode = "500", description = "Erreur serveur")
})
```

### Pour les paramètres
```java
@Parameter(description = "Description du paramètre", required = true, example = "exemple-valeur")
@PathVariable String id
```

### Pour les Request Body
```java
@io.swagger.v3.oas.annotations.parameters.RequestBody(
    description = "Description du body",
    required = true
)
@RequestBody RequestClass request
```

---

## Codes HTTP documentés

- **200** - Opération réussie
- **400** - Requête invalide (paramètres manquants/incorrects)
- **404** - Ressource non trouvée
- **500** - Erreur serveur interne

---

## Accès à la documentation

### Swagger UI (Interface interactive)
```
http://localhost:8080/swagger-ui.html
```

### OpenAPI JSON
```
http://localhost:8080/v3/api-docs
```

---

## Fonctionnalités Swagger UI

1. **Navigation par tags** - Les endpoints sont organisés par module fonctionnel
2. **Test interactif** - Possibilité d'exécuter les requêtes directement depuis l'interface
3. **Schémas de données** - Visualisation des structures de requête/réponse
4. **Exemples de valeurs** - Exemples pré-remplis pour les tests
5. **Documentation des codes HTTP** - Explication de chaque code de retour possible

---

## Style de documentation

La documentation suit ces principes:

- **Clarté** - Descriptions concises et compréhensibles
- **Contexte technique** - Mention des algorithmes et méthodes utilisés (A*, Kalman, Petri Net, VRP)
- **Exhaustivité** - Tous les codes HTTP possibles sont documentés
- **Cohérence** - Style uniforme sur tous les controllers
- **Orientée utilisateur** - Focus sur l'usage et les cas d'erreur

---

## Exemple complet

```java
@GetMapping("/{id}/stats")
@Operation(
    summary = "Récupérer les statistiques de tracking",
    description = "Retourne l'état actuel du suivi: ETA estimé, variance (incertitude), vitesse moyenne, distance restante avec intervalle de confiance"
)
@ApiResponses({
    @ApiResponse(responseCode = "200", description = "Statistiques récupérées avec succès",
                 content = @Content(schema = @Schema(implementation = ETAResponse.class))),
    @ApiResponse(responseCode = "404", description = "Livraison non trouvée ou aucune donnée de tracking disponible")
})
public Mono<ETAResponse> getStats(
    @Parameter(description = "ID de la livraison", required = true, example = "DEL-001")
    @PathVariable String id
) {
    return etaService.getLatestStats(id);
}
```

---

## Maintenance

Pour ajouter de nouveaux endpoints:

1. Ajouter `@Operation` avec summary et description
2. Ajouter `@ApiResponses` avec tous les codes HTTP possibles
3. Documenter tous les paramètres avec `@Parameter`
4. Maintenir le même style que les endpoints existants

---

## Dépendances requises

```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webflux-ui</artifactId>
    <version>2.3.0</version>
</dependency>
```

Cette dépendance est déjà présente dans le `pom.xml` du projet.
