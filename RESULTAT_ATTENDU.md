# Prompt détaillé pour l'agent Antigravity

## Contexte du Projet

Je veux développer un **système complet de Collecte et Livraison (Pick and Drop)** basé sur une modélisation mathématique rigoureuse pour le contexte camerounais. Il s'agit d'un projet étudiant qui doit être **techniquement impressionnant, bien documenté et démonstratif**.

Le système doit implémenter les algorithmes décrits dans le document de modélisation mathématique, incluant :
- Optimisation de routes (VRP/VRPTW)
- Calcul de plus court chemin (A*)
- Estimation temps réel de l'ETA avec filtre de Kalman
- Reroutage dynamique avec hystérésis
- Gestion des points relais
- Fonction de coût composite multi-critères

---

## Architecture Technique

### Backend - API Spring Boot WebFlux

**Technologies requises :**
- Spring Boot 3.x avec WebFlux (programmation réactive)
- PostgreSQL pour la base de données
- Liquibase pour la gestion des migrations
- Spring Data R2DBC pour l'accès réactif à la BD
- WebSocket pour les mises à jour temps réel
- Lombok pour réduire le boilerplate
- MapStruct pour le mapping DTO/Entity

**Structure de l'API :**

L'API doit exposer les endpoints suivants :

#### 1. Gestion du Graphe Routier
```
POST /api/v1/graph/initialize - Initialiser le réseau routier
GET /api/v1/graph/nodes - Récupérer les nœuds (clients, relais, dépôts)
GET /api/v1/graph/arcs - Récupérer les arcs avec leurs coûts
PUT /api/v1/graph/arcs/{id}/cost - Mettre à jour le coût d'un arc (conditions temps réel)
```

#### 2. Calcul de Plus Court Chemin (SPP)
```
POST /api/v1/routing/shortest-path - Calculer le plus court chemin entre deux points
  Body: {
    "origin": "node_id",
    "destination": "node_id",
    "timestamp": "2025-01-23T10:00:00Z",
    "costWeights": {
      "alpha": 0.2,  // distance
      "beta": 0.5,   // temps
      "gamma": 0.15, // pénibilité
      "delta": 0.1,  // météo
      "eta": 0.05    // carburant
    }
  }
  Response: {
    "path": ["node1", "node2", ...],
    "totalCost": 45.67,
    "costBreakdown": {...},
    "estimatedTime": 1800, // secondes
    "distance": 12.5 // km
  }
```

#### 3. Optimisation de Tournées (VRP)
```
POST /api/v1/tours/optimize - Optimiser une tournée
  Body: {
    "driverId": "driver_123",
    "deliveries": [
      {
        "id": "delivery_1",
        "pickupLocation": "node_p1",
        "dropoffLocation": "node_d1",
        "weight": 2.5,
        "deadline": "2025-01-23T16:00:00Z"
      },
      ...
    ],
    "vehicleCapacity": 50,
    "useRelayPoints": true
  }
  Response: {
    "tourId": "tour_456",
    "orderedStops": [...],
    "totalCost": 123.45,
    "estimatedDuration": 7200,
    "relayPointsUsed": ["relay_1"]
  }
```

#### 4. Estimation ETA
```
GET /api/v1/delivery/{id}/eta - Calculer l'ETA initiale
POST /api/v1/delivery/{id}/eta/update - Mettre à jour l'ETA avec filtre de Kalman
  Body: {
    "currentPosition": {
      "lat": 3.8480,
      "lon": 11.5021
    },
    "currentSpeed": 25.5, // km/h
    "timestamp": "2025-01-23T10:15:30Z"
  }
  Response: {
    "etaMin": "2025-01-23T10:45:00Z",
    "etaMax": "2025-01-23T11:05:00Z",
    "confidence": 0.8,
    "kalmanState": {
      "distanceCovered": 5.2,
      "estimatedSpeed": 24.8,
      "trafficBias": 0.15
    }
  }
```

#### 5. Reroutage Dynamique
```
POST /api/v1/delivery/{id}/reroute - Vérifier et effectuer un reroutage si nécessaire
  Body: {
    "currentPosition": "node_current",
    "trafficConditions": {...},
    "weatherCondition": "RAIN"
  }
  Response: {
    "rerouteRequired": true,
    "reason": "TRAFFIC_CONGESTION",
    "newPath": [...],
    "costImprovement": 15.3,
    "hysteresisMet": true
  }
```

#### 6. WebSocket pour Temps Réel
```
WS /ws/delivery/{deliveryId} - Flux temps réel des mises à jour
  Messages envoyés:
  - Position du coursier
  - ETA mise à jour
  - Changement de route
  - Événements (collecte effectuée, livraison effectuée)
```

#### 7. Intégration avec l'API de Transitions d'États
```
POST /api/v1/delivery/{id}/state-transition - Notifier un changement d'état
  Body: {
    "event": "PICKED_UP" | "IN_TRANSIT" | "DELIVERED" | "DELAYED",
    "timestamp": "2025-01-23T10:30:00Z",
    "metadata": {...}
  }
```

**Modèle de Données PostgreSQL :**

Tables principales :
- `nodes` : nœuds du graphe (clients, relais, dépôts)
- `arcs` : arcs du graphe avec coûts composites
- `deliveries` : livraisons à effectuer
- `tours` : tournées optimisées
- `drivers` : coursiers
- `relay_points` : points relais avec capacité
- `eta_history` : historique des ETAs pour calibration
- `kalman_states` : états du filtre de Kalman
- `reroute_events` : historique des reroutages

**Scripts Liquibase :** Créer les migrations pour initialiser toutes les tables avec contraintes, index et données de test.

---

### Frontend - Next.js 14+

**Technologies requises :**
- Next.js 14+ (App Router)
- TypeScript strict
- TailwindCSS pour le styling
- Shadcn/ui pour les composants
- React Query (TanStack Query) pour le fetching
- Zustand pour l'état global
- Recharts pour les visualisations
- Leaflet ou Mapbox GL pour les cartes
- WebSocket client pour temps réel

**Palette de Couleurs :**
- Bleu clair : #3B82F6, #60A5FA, #93C5FD
- Gris : #1F2937, #374151, #6B7280, #9CA3AF, #F3F4F6
- Blanc/Noir : #FFFFFF, #000000
- Accents : #10B981 (succès), #EF4444 (erreur), #F59E0B (warning)

**Pages et Composants Requis :**

#### 1. Dashboard Principal (`/dashboard`)
- Vue d'ensemble des livraisons actives
- Carte interactive montrant tous les coursiers en temps réel
- Statistiques clés (livraisons en cours, taux de réussite, temps moyen)
- Graphiques de performance (évolution des coûts, ETAs vs réels)

#### 2. Visualisation du Graphe Routier (`/network`)
- Affichage interactif du réseau routier
- Nœuds colorés par type (client bleu, relais vert, dépôt orange)
- Arcs avec épaisseur proportionnelle au coût
- Possibilité de sélectionner deux nœuds et calculer le plus court chemin
- Affichage du chemin optimal en surbrillance
- Panneau latéral montrant les détails du calcul (fonction de coût décomposée)

#### 3. Page de Planification de Tournée (`/tours/plan`)
- Formulaire pour créer une nouvelle tournée
- Liste des livraisons à assigner
- Drag & drop pour organiser manuellement
- Bouton "Optimiser automatiquement" qui appelle l'API VRP
- Visualisation avant/après optimisation
- Affichage des métriques (coût total, temps estimé, distance)
- Détails sur l'utilisation des points relais

#### 4. Suivi Temps Réel d'une Livraison (`/delivery/[id]`)
- Carte avec position temps réel du coursier
- Tracé du chemin planifié vs chemin réel
- Graphique de l'ETA évoluant avec le filtre de Kalman
- Visualisation de l'intervalle de confiance [ETAmin, ETAmax]
- Logs des événements (collecte, reroutage, livraison)
- État du filtre de Kalman (position, vitesse, biais trafic)
- Conditions actuelles (météo, trafic)

#### 5. Page d'Analyse de Reroutage (`/delivery/[id]/rerouting`)
- Comparaison visuelle chemin actuel vs nouveau chemin
- Tableau comparatif des coûts
- Historique des reroutages avec raisons
- Visualisation du seuil d'hystérésis
- Indicateurs : gain de coût, critère déclenché

#### 6. Tableau de Bord Analytique (`/analytics`)
- Graphiques statistiques sur les performances :
  - Distribution des temps de trajet réels vs prédits
  - Précision des ETAs (écart moyen)
  - Fréquence des reroutages
  - Utilisation des points relais
  - Coûts par composante (distance, temps, pénibilité, météo, carburant)
- Filtres par période, coursier, zone géographique

#### 7. Composant Interactif : Simulateur de Coût
- Sliders pour ajuster les poids α, β, γ, δ, η
- Visualisation immédiate de l'impact sur le calcul de route
- Graphique radar montrant la contribution de chaque critère
- Comparaison de plusieurs configurations de poids

**Composants Réutilisables :**

- `<CostBreakdownChart />` - Graphique en barres décomposant le coût composite
- `<ETAConfidenceInterval />` - Visualisation de l'intervalle de confiance
- `<KalmanStateDisplay />` - Affichage de l'état du filtre de Kalman
- `<RouteMap />` - Carte avec tracé de route
- `<DeliveryTimeline />` - Timeline des événements d'une livraison
- `<LiveMetrics />` - Métriques temps réel (WebSocket)
- `<ReroutingAlert />` - Notification de reroutage avec détails

**Intégration API de Transitions d'États :**

Créer un service `StateTransitionService` qui :
- Notifie l'API externe à chaque changement d'état
- Affiche l'état actuel dans l'UI avec code couleur
- Permet la visualisation de l'historique des transitions
- Gère les webhooks de retour (si applicable)

---

## Exigences Fonctionnelles Détaillées

### Implémentation des Algorithmes

#### 1. Algorithme A* pour Plus Court Chemin
- Implémenter la fonction heuristique `h(n) = α · dHaversine(n, d) / vmax`
- Structure de données : Priority Queue (PriorityQueue Java)
- Retourner non seulement le chemin mais aussi :
  - Coût total décomposé
  - Nœuds explorés (pour visualisation)
  - Temps de calcul

#### 2. Optimisation VRP avec OR-Tools
- Intégrer Google OR-Tools (via JNI ou subprocess)
- Modéliser les contraintes MTZ pour élimination sous-tours
- Implémenter les contraintes de précédence (pickup avant dropoff)
- Gérer les fenêtres temporelles souples avec pénalités
- Support des points relais conditionnels

#### 3. Filtre de Kalman Étendu (EKF)
- Implémenter les matrices de transition Ft et observation Ht
- Mettre à jour l'état à chaque réception GPS (via WebSocket)
- Calculer la matrice de covariance Pt|t
- Persister l'état en base de données pour reprise après crash
- Exposer les paramètres internes pour visualisation

#### 4. Reroutage avec Hystérésis
- Calculer le coût résiduel du chemin actuel vs alternatif
- Vérifier `C(pcurrent) > C(pnew) + ε_hysteresis + C_switch`
- Logger chaque évaluation de reroutage (pris ou refusé)
- Implémenter un cooldown minimum entre deux reroutages (30 secondes)

#### 5. Fonction de Coût Composite
Implémenter le calcul exact :
```java
double compositeUost = alpha * normalizedDistance
                     + beta * normalizedTime
                     + gamma * roadPenibility
                     + delta * weatherPenalty
                     + eta * fuelCost;
```

Avec normalisation :
```java
double normalized = (value - min) / (max - min);
```

Gérer le cas limite `max == min` → retourner 0.

---

## Exigences Non-Fonctionnelles

### Performance
- API : Temps de réponse < 200ms pour calcul SPP
- API : Temps de réponse < 2s pour optimisation VRP (n ≤ 30 livraisons)
- WebSocket : Latence < 100ms pour mises à jour position
- Frontend : First Contentful Paint < 1.5s

### Qualité du Code
- Couverture de tests unitaires > 70%
- Tests d'intégration pour tous les endpoints critiques
- Documentation OpenAPI/Swagger complète
- Logs structurés (SLF4J + Logback)
- Gestion d'erreurs avec messages explicites

### Observabilité
- Métriques Prometheus exposées sur `/actuator/prometheus`
- Health checks sur `/actuator/health`
- Logging des performances algorithmiques (temps de calcul A*, VRP, Kalman)

---

## Données de Test

Générer un jeu de données réaliste pour Yaoundé :

- **50 nœuds clients** (coordonnées GPS réelles)
- **10 points relais** avec capacités variées (5-20 colis)
- **1 dépôt** (position initiale coursier)
- **~200 arcs** connectant les nœuds
- **Coûts réalistes** :
  - Distance : 0.5 - 15 km
  - Temps : 5 - 45 minutes (avec variabilité)
  - Pénibilité : 0-1 (route bitumée vs piste)
  - Météo : probabilité pluie variant selon heure (plus élevée après-midi)
  - Carburant : proportionnel distance

- **10 livraisons test** avec contraintes variées :
  - Poids : 1-10 kg
  - Deadlines : certaines serrées, d'autres flexibles
  - Localisations dispersées pour tester l'optimisation

---

## Fonctionnalités Bonus (Impressionnantes)

1. **Visualisation 3D du graphe** avec Three.js (hauteur = coût)
2. **Replay d'une livraison** : rejouer l'historique avec animation
3. **Mode comparaison** : comparer plusieurs stratégies de routage côte à côte
4. **Export de rapports PDF** avec graphiques et métriques
5. **Dashboard admin** avec gestion des paramètres (poids α, β, γ, δ, η)
6. **Simulation de scénarios** : injecter événements (embouteillage, pluie) et voir l'impact

---

## Livrables Attendus

### Code Source
1. **Backend Spring Boot WebFlux** :
   - Structure Maven/Gradle propre
   - Packages organisés (controller, service, repository, domain, dto, algorithm)
   - Configuration application.yml documentée
   - Scripts Liquibase migrations
   - README avec instructions démarrage

2. **Frontend Next.js** :
   - Structure App Router claire
   - Components réutilisables dans `/components`
   - Services API dans `/lib/api`
   - Types TypeScript stricts
   - README avec instructions développement

### Documentation
- **README principal** expliquant l'architecture globale
- **Documentation API** (Swagger/OpenAPI accessible sur `/swagger-ui`)
- **Guide utilisateur Frontend** avec captures d'écran
- **Document technique** expliquant l'implémentation des algorithmes

### Docker Compose
Fichier `docker-compose.yml` pour démarrer :
- PostgreSQL
- Backend Spring Boot
- Frontend Next.js
- (Optionnel) Prometheus + Grafana

---

## Instructions Spécifiques pour l'Agent

**Antigravity, voici ce que j'attends de toi :**

1. **Génère le code complet et fonctionnel** pour le backend et frontend selon les spécifications ci-dessus.

2. **Respecte rigoureusement la modélisation mathématique** :
   - Implémente correctement les formules (coût composite, Kalman, hystérésis)
   - Utilise les notations du document (α, β, γ, δ, η, μ, σ, etc.)
   - Commente le code en référençant les sections du document (ex: `// Section 3.3.1 - Formulation Multi-Critères`)

3. **Priorise la clarté et la maintenabilité** :
   - Noms de variables explicites
   - Fonctions courtes et ciblées
   - Commentaires pour la logique complexe
   - Séparation des responsabilités (SRP)

4. **Assure la cohérence entre backend et frontend** :
   - DTOs identiques (TypeScript types = Java POJOs)
   - Endpoints API documentés et utilisés correctement
   - Gestion d'erreurs cohérente

5. **Fais un frontend professionnel et démonstratif** :
   - Design sobre (bleus clairs, gris)
   - Visualisations claires et informatives
   - Responsive (desktop + mobile)
   - Animations fluides mais subtiles

6. **Inclus des données de test significatives** :
   - Graphe routier réaliste de Yaoundé
   - Livraisons avec diversité de contraintes
   - Historique de positions GPS pour simuler le Kalman

7. **Génère une structure de projet professionnelle** :
   - `.gitignore` approprié
   - `README.md` détaillés
   - Scripts de démarrage (`start.sh`, `docker-compose up`)
   - Variables d'environnement bien gérées

8. **Assure que tout fonctionne ensemble** :
   - Tests de bout en bout possibles
   - WebSocket fonctionnel pour temps réel
   - Intégration API externe de transitions d'états (mockée si nécessaire)

---

## Critères de Réussite

Le projet sera considéré comme réussi si :

✅ Le backend expose tous les endpoints spécifiés et répond correctement  
✅ L'algorithme A* trouve le plus court chemin optimal  
✅ L'optimisation VRP génère une tournée cohérente respectant les contraintes  
✅ Le filtre de Kalman met à jour l'ETA de manière réaliste  
✅ Le reroutage se déclenche selon le critère d'hystérésis  
✅ Le frontend affiche toutes les pages avec données réelles  
✅ Les visualisations sont claires et démonstratives  
✅ Le système peut tourner en local avec Docker Compose  
✅ Le code est bien documenté et compréhensible  
✅ Le style visuel est professionnel et cohérent  

---

Structure de Projet à Générer
Backend Spring Boot
Antigravity, génère la structure Maven complète suivante :
delivery-optimization-api/
├── pom.xml (avec toutes les dépendances)
├── src/
│   ├── main/
│   │   ├── java/com/delivery/optimization/
│   │   │   ├── DeliveryOptimizationApplication.java
│   │   │   ├── config/
│   │   │   │   ├── WebFluxConfig.java
│   │   │   │   ├── R2dbcConfig.java
│   │   │   │   └── WebSocketConfig.java
│   │   │   ├── controller/
│   │   │   │   ├── GraphController.java
│   │   │   │   ├── RoutingController.java
│   │   │   │   ├── TourController.java
│   │   │   │   ├── DeliveryController.java
│   │   │   │   └── WebSocketController.java
│   │   │   ├── service/
│   │   │   │   ├── GraphService.java
│   │   │   │   ├── ShortestPathService.java (A*)
│   │   │   │   ├── VRPOptimizationService.java
│   │   │   │   ├── ETAService.java
│   │   │   │   ├── KalmanFilterService.java
│   │   │   │   ├── ReroutingService.java
│   │   │   │   └── StateTransitionService.java
│   │   │   ├── algorithm/
│   │   │   │   ├── AStar.java
│   │   │   │   ├── KalmanFilter.java
│   │   │   │   ├── CostFunction.java
│   │   │   │   └── VRPSolver.java
│   │   │   ├── domain/
│   │   │   │   ├── Node.java
│   │   │   │   ├── Arc.java
│   │   │   │   ├── Delivery.java
│   │   │   │   ├── Tour.java
│   │   │   │   ├── Driver.java
│   │   │   │   ├── RelayPoint.java
│   │   │   │   └── KalmanState.java
│   │   │   ├── dto/
│   │   │   │   ├── ShortestPathRequest.java
│   │   │   │   ├── ShortestPathResponse.java
│   │   │   │   ├── TourOptimizationRequest.java
│   │   │   │   ├── TourOptimizationResponse.java
│   │   │   │   ├── ETAUpdateRequest.java
│   │   │   │   └── ETAResponse.java
│   │   │   ├── repository/
│   │   │   │   ├── NodeRepository.java
│   │   │   │   ├── ArcRepository.java
│   │   │   │   ├── DeliveryRepository.java
│   │   │   │   └── TourRepository.java
│   │   │   └── exception/
│   │   │       ├── GlobalExceptionHandler.java
│   │   │       └── CustomExceptions.java
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       ├── db/changelog/
│   │       │   ├── db.changelog-master.xml
│   │       │   ├── v1/
│   │       │   │   ├── 001-create-nodes-table.sql
│   │       │   │   ├── 002-create-arcs-table.sql
│   │       │   │   ├── 003-create-deliveries-table.sql
│   │       │   │   ├── 004-create-tours-table.sql
│   │       │   │   └── 005-insert-test-data.sql
│   │       └── static/ (si nécessaire)
│   └── test/
│       └── java/com/delivery/optimization/
│           ├── service/
│           ├── algorithm/
│           └── integration/
├── Dockerfile
└── README.md
Dépendances Maven requises dans pom.xml :
xml<dependencies>
    <!-- Spring WebFlux -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-webflux</artifactId>
    </dependency>
    
    <!-- R2DBC PostgreSQL -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-r2dbc</artifactId>
    </dependency>
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>r2dbc-postgresql</artifactId>
    </dependency>
    
    <!-- Liquibase (nécessite JDBC pour migrations) -->
    <dependency>
        <groupId>org.liquibase</groupId>
        <artifactId>liquibase-core</artifactId>
    </dependency>
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <scope>runtime</scope>
    </dependency>
    
    <!-- WebSocket -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-websocket</artifactId>
    </dependency>
    
    <!-- Lombok -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
    
    <!-- MapStruct -->
    <dependency>
        <groupId>org.mapstruct</groupId>
        <artifactId>mapstruct</artifactId>
        <version>1.5.5.Final</version>
    </dependency>
    
    <!-- Validation -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    
    <!-- Actuator (métriques) -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
    
    <!-- Micrometer Prometheus -->
    <dependency>
        <groupId>io.micrometer</groupId>
        <artifactId>micrometer-registry-prometheus</artifactId>
    </dependency>
    
    <!-- Commons Math (pour calculs scientifiques) -->
    <dependency>
        <groupId>org.apache.commons</groupId>
        <artifactId>commons-math3</artifactId>
        <version>3.6.1</version>
    </dependency>
    
    <!-- Tests -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>io.projectreactor</groupId>
        <artifactId>reactor-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

### Frontend Next.js

**Génère également la structure Next.js 14+ complète :**
```
delivery-optimization-frontend/
├── package.json (avec toutes les dépendances)
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── .env.local
├── public/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── network/
│   │   │   └── page.tsx
│   │   ├── tours/
│   │   │   ├── plan/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── delivery/
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── rerouting/
│   │   │           └── page.tsx
│   │   └── analytics/
│   │       └── page.tsx
│   ├── components/
│   │   ├── ui/ (shadcn/ui components)
│   │   ├── maps/
│   │   │   ├── RouteMap.tsx
│   │   │   └── NetworkGraph.tsx
│   │   ├── charts/
│   │   │   ├── CostBreakdownChart.tsx
│   │   │   ├── ETAConfidenceInterval.tsx
│   │   │   └── KalmanStateDisplay.tsx
│   │   ├── delivery/
│   │   │   ├── DeliveryTimeline.tsx
│   │   │   └── LiveMetrics.tsx
│   │   └── tours/
│   │       └── TourOptimizer.tsx
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── graph.ts
│   │   │   ├── routing.ts
│   │   │   ├── tours.ts
│   │   │   └── delivery.ts
│   │   ├── websocket/
│   │   │   └── useWebSocket.ts
│   │   └── utils/
│   │       ├── formatting.ts
│   │       └── calculations.ts
│   ├── types/
│   │   ├── api.ts
│   │   ├── delivery.ts
│   │   └── graph.ts
│   └── stores/
│       └── useDeliveryStore.ts (Zustand)
├── Dockerfile
└── README.md
Dépendances npm requises dans package.json :
json{
  "dependencies": {
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tanstack/react-query": "^5.17.0",
    "zustand": "^4.5.0",
    "tailwindcss": "^3.4.0",
    "lucide-react": "latest",
    "recharts": "^2.10.0",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "date-fns": "^3.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/leaflet": "^1.9.8",
    "typescript": "^5",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33"
  }
}

**Antigravity, c'est un projet étudiant important pour moi. Je compte sur toi pour produire un travail de qualité professionnelle qui impressionnera mon jury. Montre tout le potentiel de ce système de livraison optimisé ! 🚀**