# Rapport d'Implémentation Technique - Système TiibnTick
## Plateforme d'Optimisation de Livraisons avec VRP et Réseaux de Petri

**Auteur** : Équipe Projet  
**Date** : Janvier 2026  
**Version** : 1.0

---

## Table des Matières

1. [Vue d'Ensemble du Système](#1-vue-densemble)
2. [Architecture et Technologies](#2-architecture-et-technologies)
3. [API Petri Net - Gestion d'États](#3-api-petri-net)
4. [API Delivery Optimization - Cœur Métier](#4-api-delivery-optimization)
5. [Frontend - Interface Tactique](#5-frontend-interface-tactique)
6. [Guide d'Utilisation](#6-guide-dutilisation)
7. [Déploiement](#7-déploiement)

---

## 1. Vue d'Ensemble

### 1.1 Objectif du Projet

TiibnTick est une plateforme web d'optimisation logistique résolvant le **Vehicle Routing Problem (VRP)** avec gestion formelle d'états via **Réseaux de Petri**. Le système calcule des tournées optimales en temps réel avec simulation de conditions dynamiques (trafic, météo).

### 1.2 Fonctionnalités Principales

✅ **Optimisation VRP** : Calcul de tournées multi-véhicules avec points relais  
✅ **Plus Court Chemin** : Algorithme A* avec fonction de coût composite personnalisable  
✅ **Gestion d'États** : Workflow Petri Net (PENDING → IN_TRANSIT → DELIVERED)  
✅ **Temps Réel** : WebSocket avec STOMP pour notifications instantanées  
✅ **Simulation** : Trafic, météo, reroutage dynamique  
✅ **Visualisation** : Carte interactive Leaflet avec design glassmorphique  
✅ **ETA Intelligent** : Prédiction avec filtre de Kalman

### 1.3 Stack Technique Complet

| Composant | Technologies |
|-----------|-------------|
| **Frontend** | Next.js 14.1, React 18, TypeScript 5.3, Tailwind CSS 3.4 |
| **Cartographie** | Leaflet 1.9.4, React-Leaflet 4.2.1 |
| **Visualisation** | Recharts 2.10, Lucide React Icons |
| **State Management** | Zustand 4.5, React Query 5.17 |
| **WebSocket Client** | @stomp/stompjs 7.2.1 |
| **Backend API** | Spring Boot 3.2.2 / 3.4.0, WebFlux, R2DBC |
| **Base de Données** | PostgreSQL 15 + PostGIS (R2DBC non-bloquant) |
| **Migrations** | Liquibase Core |
| **Algorithmes** | Apache Commons Math 3.6.1 |
| **Mapping** | MapStruct 1.5.5 |
| **Validation** | Spring Validation, Lombok |
| **Métriques** | Micrometer + Prometheus |
| **Build** | Maven 3.8+, Node.js 18+ |

---

## 2. Architecture et Technologies

### 2.1 Architecture 3 Couches

```
┌──────────────────────────────────────────────────────────┐
│          FRONTEND - Next.js 14 (Port 3000)                │
│  - Pages: Dashboard, Network, Deliveries, Analytics       │
│  - Components: Maps (Leaflet), Charts (Recharts)         │
│  - WebSocket Consumer (STOMP)                            │
└────────┬──────────────────────────────────┬──────────────┘
         │ HTTP REST                         │ WebSocket
         ▼                                   ▼
┌───────────────────────────┐      ┌────────────────────────┐
│ DELIVERY OPTIMIZATION API │◄────►│   PETRI NET API        │
│ (Port 8080)                │ HTTP │   (Port 8081)          │
│                            │      │                        │
│ Controllers (8):           │      │ Controllers (1):       │
│ - DeliveryController       │      │ - PetriNetController   │
│ - GraphController          │      │                        │
│ - RoutingController        │      │ Services:              │
│ - TourController           │      │ - PetriNetService      │
│ - SimulationController     │      │ - PlaceService         │
│ - DriverController         │      │ - TransitionService    │
│ - TrackingController       │      │ - TokenService         │
│ - WebSocketController      │      │                        │
│                            │      │ Entities:              │
│ Services (6):              │      │ - PetriNet, Place,     │
│ - ShortestPathService      │      │ - Transition, Token    │
│ - VRPOptimizationService   │      │                        │
│ - ETAService               │      └────────┬───────────────┘
│ - ReroutingService         │               │ R2DBC
│ - StateTransitionService   │               ▼
│ - GraphService             │      ┌────────────────────────┐
│                            │      │  PostgreSQL 15         │
│ Algorithms (4):            │      │  + PostGIS Extension   │
│ - AStar (A* pathfinding)   │      │                        │
│ - VRPSolver                │      │ Tables:                │
│ - CostFunction             │      │ - nodes, arcs          │
│ - KalmanFilter             │      │ - deliveries, drivers  │
│                            │      │ - tours                │
│ Repositories (R2DBC):      │      │ - petri_nets, places   │
│ - NodeRepository           │      │ - transitions, tokens  │
│ - ArcRepository            │      │                        │
│ - DeliveryRepository       │      │ Migrations: Liquibase  │
│ - DriverRepository         │      │ Types: POINT, ENUM     │
│ - TourRepository           │      │                        │
└────────┬──────────────────┘      └────────────────────────┘
         │ R2DBC (Non-bloquant)
         ▼
```

### 2.2 Choix Architecturaux

#### **Programmation Réactive (WebFlux + R2DBC)**

Contrairement à Spring MVC (Thread-per-Request bloquant), **Spring WebFlux** utilise un modèle événementiel avec **Project Reactor** :

- **Types réactifs** : `Mono<T>` (0-1 élément), `Flux<T>` (0-N éléments)
- **I/O non-bloquant** : R2DBC PostgreSQL (vs JDBC classique)
- **Scalabilité** : Gère 1000+ connexions avec quelques threads
- **Backpressure** : Contrôle automatique du flux de données

**Exemple Service Réactif** :
```java
public Flux<Delivery> getAllDeliveries() {
    return deliveryRepository.findAll(); // Non-bloquant
}
```

#### **Séparation Petri Net API**

- Microservice dédié pour gestion formelle d'états
- Réutilisable par d'autres systèmes
- Isolation des pannes

---

## 3. API Petri Net (Port 8081)

### 3.1 Rôle et Responsabilités

Gère le workflow formel des livraisons via un moteur de **Réseaux de Petri**. Permet de modéliser des états (Places), transitions, et jetons (Tokens) représentant l'instance d'une livraison.

### 3.2 Stack Technique

- **Framework** : Spring Boot 3.4.0 WebFlux
- **Persistence** : R2DBC PostgreSQL (réactive)
- **Build** : Maven
- **Java** : 17

### 3.3 Modèle de Données

**Entités** :
- **`PetriNet`** : Définition du réseau (id, name, description)
- **`Place`** : État possible (ex: "EN_ATTENTE", "EN_ROUTE", "LIVRÉ")
- **`Transition`** : Règle de changement d'état avec conditions
- **`Token`** : Instance d'un état pour une livraison spécifique

**Relations** :
- 1 PetriNet → N Places
- 1 PetriNet → N Transitions
- 1 Place → N Tokens (état actuel)

### 3.4 Endpoints REST

```
POST   /api/nets                     Créer un réseau Petri
GET    /api/nets/{id}                Obtenir l'état du réseau
POST   /api/nets/{id}/fire/{transitionId}  Déclencher transition
```

**Exemple Requête - Créer Réseau** :
```json
POST /api/nets
{
  "name": "Workflow Livraison",
  "places": ["PENDING", "ASSIGNED", "IN_TRANSIT", "DELIVERED"],
  "transitions": [
    {"from": "PENDING", "to": "ASSIGNED", "event": "ASSIGN_DRIVER"},
    {"from": "ASSIGNED", "to": "IN_TRANSIT", "event": "START_DELIVERY"},
    {"from": "IN_TRANSIT", "to": "DELIVERED", "event": "COMPLETE"}
  ]
}
```

### 3.5 Services Implémentés

- **`PetriNetService`** : CRUD réseaux, logique création
- **`PlaceService`** : Gestion des places (états)
- **`TransitionService`** : Logique de tir de transitions
- **`TokenService`** : Tracking instances (jetons)

Tous retournent `Mono<T>` ou `Flux<T>` pour programmation réactive.

---

## 4. API Delivery Optimization (Port 8080)

### 4.1 Architecture Détaillée

**8 Contrôleurs REST** :
1. **DeliveryController** (`/api/v1/delivery`)
2. **GraphController** (`/api/v1/graph`)
3. **RoutingController** (`/api/v1/routing`)
4. **TourController** (`/api/v1/tours`)
5. **SimulationController** (`/api/v1/simulation`)
6. **DriverController** (`/api/v1/drivers`)
7. **TrackingController** (`/api/v1/tracking`)
8. **WebSocketController** (WebSocket STOMP)

**6 Services Métier** :
1. **ShortestPathService** : A* avec coût composite
2. **VRPOptimizationService** : Résolution VRP
3. **ETAService** : Prédiction temps d'arrivée (Kalman)
4. **ReroutingService** : Décisions reroutage
5. **StateTransitionService** : Appel Petri Net API
6. **GraphService** : Initialisation réseau

**4 Algorithmes** :
1. **AStar** : Plus court chemin
2. **VRPSolver** : Optimisation tournées
3. **CostFunction** : Calcul coût composite
4. **KalmanFilter** : Filtre prédictif ETA

### 4.2 Endpoints Complets

#### **Livraisons** (`/api/v1/delivery`)
```
GET    /api/v1/delivery                    Liste toutes livraisons
GET    /api/v1/delivery/{id}               Détails livraison
GET    /api/v1/delivery/stats              Statistiques dashboard
POST   /api/v1/delivery/{id}/eta/update    Mise à jour ETA
POST   /api/v1/delivery/{id}/reroute       Vérifier si reroute nécessaire
POST   /api/v1/delivery/{id}/state-transition  Changer état (Petri Net)
```

#### **Graphe Réseau** (`/api/v1/graph`)
```
GET    /api/v1/graph/nodes                 Liste nœuds (CLIENT, RELAY, DEPOT)
GET    /api/v1/graph/arcs                  Liste arcs (liens nœuds)
POST   /api/v1/graph/initialize             Initialiser graphe par défaut
PUT    /api/v1/graph/arcs/{id}/cost        Modifier coût arc
```

#### **Routage** (`/api/v1/routing`)
```
POST   /api/v1/routing/shortest-path       Calcul A* avec poids custom
POST   /api/v1/routing/arcs/{id}/traffic   Mettre à jour traffic_factor
```

**Exemple Shortest Path avec Poids** :
```json
POST /api/v1/routing/shortest-path
{
  "origin": "NODE_A",
  "destination": "NODE_Z",
  "costWeights": {
    "alpha": 0.3,   // Distance
    "beta": 0.4,    // Temps
    "gamma": 0.1,   // Pénibilité
    "delta": 0.1,   // Météo
    "eta": 0.1      // Carburant
  }
}
Response:
{
  "path": ["NODE_A", "NODE_C", "NODE_F", "NODE_Z"],
  "distance": 45.2,
  "totalCost": 67.8,
  "costBreakdown": {
    "Distance": 13.56,
    "Time": 26.88,
    "Penibility": 6.72,
    "Weather": 6.72,
    "Fuel": 13.92
  }
}
```

#### **Tournées VRP** (`/api/v1/tours`)
```
POST   /api/v1/tours/optimize              Lancer optimisation VRP
```

#### **Simulation** (`/api/v1/simulation`)
```
POST   /api/v1/simulation/traffic          Augmenter traffic_factor aléatoirement
POST   /api/v1/simulation/weather          Simuler impact météo
POST   /api/v1/simulation/reroute          Recalculer toutes routes
```

#### **Chauffeurs** (`/api/v1/drivers`)
```
GET    /api/v1/drivers                     Liste chauffeurs disponibles
```

#### **Tracking** (`/api/v1/tracking`)
```
POST   /api/v1/tracking/{id}/update        Mettre à jour position chauffeur
GET    /api/v1/tracking/{id}/stats         Statistiques tracking
```

### 4.3 Algorithmes en Détail

#### **A\* (Classe `AStar.java`)**

```java
public PathResult findPath(String originId, String destinationId,
                            Map<String, Node> nodes,
                            Map<String, List<Arc>> adjacencyList,
                            CostFunction.Weights weights)
```

**Fonction de Coût Composite** :
```
Cost(arc) = α·distance + β·(time × traffic_factor) 
          + γ·penibility + δ·weather_impact + η·fuel_cost
```

**Heuristique** :
```
h(n) = Haversine_Distance(n, destination) / v_max
```

**Optimisations** :
- PriorityQueue pour open set (tri par f-score)
- Détection nœud déjà visité
- Early exit si destination atteinte

#### **VRP Solver (Classe `VRPSolver.java`)**

```java
public TourOptimizationResponse solve(TourOptimizationRequest request,
                                       List<Node> availableRelays)
```

**Approche** :
1. Heuristique glouton : allocation livraisons → véhicules
2. Insertion points relais si `useRelayPoints = true`
3. Déduplication arrêts consécutifs
4. Calcul coût total avec bonus relais : `cost = 120.0 - (nbRelays × 5.0)`

**Retour** :
```json
{
  "tourId": "uuid",
  "orderedStops": ["DEPOT", "NODE_1", "RELAY_A", "NODE_2", "DEPOT"],
  "totalCost": 115.0,
  "estimatedDuration": 3600,
  "relayPointsUsed": ["RELAY_A"]
}
```

#### **Filtre de Kalman (Classe `KalmanFilter.java`)**

Utilisé par `ETAService` pour prédiction robuste de l'ETA en temps réel :

```java
public void predict();
public void update(double measurement);
public double getEstimate();
```

Fusionne prédictions théoriques ET mesures GPS réelles pour minimiser variance.

### 4.4 WebSocket STOMP

**Configuration** : `WebSocketConfig.java` + `WebFluxConfig.java`

**Endpoint** : `ws://localhost:8080/ws`

**Topics Disponibles** :
- `/topic/deliveries` : Mises à jour livraisons (création, changement statut)
- `/topic/drivers` : Positions chauffeurs en temps réel
- `/topic/network` : Changements réseau (arcs, trafic)

**Utilisation Frontend** :
```typescript
const client = new Client({
  brokerURL: 'ws://localhost:8080/ws',
  onConnect: () => {
    client.subscribe('/topic/deliveries', (message) => {
      const delivery = JSON.parse(message.body);
      // Update UI  
    });
  }
});
```

---

## 5. Frontend - Interface Tactique

### 5.1 Architecture Next.js 14

**App Router avec Server Components** :
```
src/
├── app/                       Pages (routes)
│   ├── layout.tsx            Layout global (Sidebar, Poppins font)
│   ├── page.tsx              Redirect dashboard
│   ├── dashboard/
│   │   └── page.tsx          Vue d'ensemble
│   ├── delivery/
│   │   ├── page.tsx          Liste missions (Mission Control)
│   │   └── [id]/page.tsx     Tracking individuel
│   ├── network/
│   │   └── page.tsx          Centre commande réseau (glassmorphic)
│   ├── analytics/
│   │   └── page.tsx          Terminal intelligence métriques
│   └── tours/
│       └── page.tsx          Visualisation tournées VRP
├── components/
│   ├── layout/
│   │   └── Sidebar.tsx       Navigation flottante
│   ├── maps/
│   │   ├── NetworkGraph.tsx  Carte Leaflet principale
│   │   └── DeliveryMap.tsx   Carte tracking
│   ├── charts/
│   │   └── CostBreakdownChart.tsx  Répartition coûts
│   └── network/
│       └── CostSimulator.tsx  Sliders poids A*
├── lib/
│   └── api/
│       ├── client.ts         Fetch wrapper
│       ├── graph.ts          Endpoints graphe
│       └── routing.ts        Endpoints routage
└── types/
    └── graph.ts              Node, Arc TypeScript
```

### 5.2 Pages Détaillées

#### **Dashboard (`/dashboard`)**

**Composants** :
- 4 cartes statistiques (total livraisons, actives, taux succès, taux reroutage)
- Carte réseau en fond (NetworkGraph)
- Liste livraisons récentes
- Indicateurs temps réel via WebSocket

**Data Fetching** :
```typescript
useEffect(() => {
  fetchApi('/api/v1/delivery/stats').then(setStats);
}, []);
```

#### **Network Command Center (`/network`)**

**Design** : Carte plein écran (100vh) + modules glassmorphiques flottants

**Modules** :
1. **Top Header** : Nœuds count, Arcs count, Status synchronisation
2. **Intelligence Nœud (Gauche)** :
   - Détails nœud sélectionné (ID, type, lat/long)
   - Arcs connectés
   - Boutons "Départ" / "Arrivée"
3. **Scénarios Globaux (Droite)** :
   - Boutons Trafic / Météo
   - Reroute Global
4. **Cost Simulator** :
   - 5 sliders (α, β, γ, δ, η)
   - Bouton "Calculer SPP"
5. **Mission Parameters** :
   - Nœud A (départ) / Nœud B (arrivée)
   - Distance, Coût total
   - Graphique répartition coûts

**Workflow Utilisateur** :
1. Clic sur nœud → Affiche détails + option "Départ"
2. Clic sur autre nœud → Option "Arrivée"
3. Ajust sliders poids
4. Bouton "Calculer SPP" → POST `/api/v1/routing/shortest-path`
5. Path affiché sur carte avec polyline bleue

#### **Delivery List (`/delivery`)**

Grid tactique de cartes missions :
- Badge statut coloré (PENDING=bleu, IN_TRANSIT=orange, DELIVERED=vert)
- Nœuds pickup → dropoff
- Distance, poids
- Bouton "Suivre" → Redirect `/delivery/{id}`

#### **Tracking (`/delivery/[id]`)**

Animation temps réel du trajet :
- Polyline route optimale
- Marker animé position actuelle (pulse)
- Panel infos : ETA, distance restante, statut

#### **Analytics Terminal (`/analytics`)**

Dashboard haute densité inspiration terminaux techniques :
- Métriques clés : Précision ETA, Volume livraisons, Optimisation coût
- Graphiques distribution statuts
- Table performance réseau (arcs plus utilisés)

### 5.3 Design System Glassmorphique

**Aesthetic "Command Center"** :

**Caractéristiques** :
- **Glassmorphism** : `backdrop-blur-xl`, `bg-white/40`, `border-white/60`
- **Typographie** : Poppins (weights 300-800, extrabold pour titres)
- **Palette Monochrome** : Slate 50-900 + accents bleu/orange
- **Icônes** : Lucide React (minimalistes, 16-24px)
- **Animations** : Pulse, transitions 300ms

**Classes CSS Custom** :
```css
/* globals.css */
.tactical-module {
  @apply backdrop-blur-2xl bg-white/40 border border-white/60 
         rounded-3xl shadow-2xl shadow-black/10 p-6;
}

.tactical-header {
  @apply px-6 py-4 border-b border-slate-200/40 
         bg-gradient-to-r from-blue-50/40 to-transparent;
}
```

**Composant Exemple - Cost Simulator** :
- Container glassmorphique
- Header avec icône Sliders + badge animé
- 5 range inputs stylisés
- Bouton dégradé noir avec ombre
- Labels uppercase tracking-widest

### 5.4 Communication Backend

**HTTP Client (`lib/api/client.ts`)** :
```typescript
export async function fetchApi(endpoint: string, options = {}) {
  const res = await fetch(`http://localhost:8080${endpoint}`, {
    headers: {'Content-Type': 'application/json'},
    ...options
  });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}
```

**WebSocket Client** :
```typescript
import { Client } from '@stomp/stompjs';

const stompClient = new Client({
  brokerURL: 'ws://localhost:8080/ws',
  reconnectDelay: 5000,
  onConnect: () => {
    stompClient.subscribe('/topic/deliveries', (msg) => {
      handleDeliveryUpdate(JSON.parse(msg.body));
    });
  }
});
stompClient.activate();
```

---

## 6. Guide d'Utilisation

### 6.1 Installation et Démarrage

**Prérequis** :
- Java 17+ (vérifier : `java -version`)
- Maven 3.8+ (`mvn -v`)
- Node.js 18+ (`node -v`)
- PostgreSQL 15 (`psql --version`)
- Git

**Étapes Installation** :

**1. Cloner Projet**
```bash
git clone <repository>
cd Projet\ Réseau
```

**2. Démarrer PostgreSQL**
```bash
# Option A : Docker
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgis/postgis:15-3.3

# Option B : docker-compose
docker-compose up -d postgres
```

**3. Configurer Base de Données**
```sql
CREATE DATABASE delivery_db;
CREATE DATABASE petri_db;
\c delivery_db
CREATE EXTENSION postgis;
```

**4. Lancer API Petri Net**
```bash
cd API-PETRI-NET
./mvnw clean install
./mvnw spring-boot:run
# ✓ Démarré sur http://localhost:8081
```

**5. Lancer API Delivery Optimization**
```bash
cd delivery-optimization-api
./mvnw clean install
./mvnw spring-boot:run
# ✓ Démarré sur http://localhost:8080
# Liquibase applique migrations automatiquement
```

**6. Lancer Frontend**
```bash
cd delivery-optimization-frontend
npm install
npm run dev
# ✓ Démarré sur http://localhost:3000
```

**7. Accéder Application**
- Frontend : http://localhost:3000
- API Delivery : http://localhost:8080/actuator/health
- API Petri Net : http://localhost:8081/api/nets/health

### 6.2 Workflows Utilisateur

#### **Workflow 1 : Calculer Plus Court Chemin**

1. Accéder page **Network** (`/network`)
2. Cliquer sur nœud → Panel gauche affiche détails
3. Bouton **"Départ"** → Nœud marqué en bleu
4. Cliquer sur autre nœud → Bouton **"Arrivée"** → Marqué en rouge
5. Ajuster poids Cost Simulator (ex: Distance=0.5, Temps=0.3, etc.)
6. Bouton **"Calculer SPP"**
7. **Résultat** : Path affiché sur carte + Panel Mission avec :
   - Distance totale
   - Coût calculé
   - Graphique répartition

#### **Workflow 2 : Simuler Trafic et Observer Reroutage**

1. Page **Network** → Module Scénarios (droite)
2. Bouton **"Trafic"** → POST `/api/v1/simulation/traffic`
3. Backend multiplie `traffic_factor` sur arcs aléatoires (×1.2-1.8)
4. Si livraisons IN_TRANSIT existent, backend recalcule paths
5. **Observation** : Routes mises à jour en temps réel (WebSocket)
6. Bouton **"Reroute Global"** pour forcer recalcul toutes routes

#### **Workflow 3 : Optimiser Tournées VRP**

1. Page **Tours** (`/tours`)
2. Bouton **"Optimiser Tournées VRP"**
3. Backend appelle `VRPSolver.solve()` :
   - Alloue livraisons aux véhicules
   - Insère points relais si activé
   - Minimise coût total
4. **Résultat** : Liste tournées avec :
   - Stops ordonnés
   - Coût / Durée estimée
   - Relais utilisés
5. Visualisation sur carte (polylines par véhicule)

#### **Workflow 4 : Suivre Livraison en Temps Réel**

1. Dashboard → Clic sur livraison IN_TRANSIT
2. Redirect `/delivery/{id}` (page Tracking)
3. **Affichage** :
   - Carte avec polyline route optimale
   - Marker position actuelle (animé)
   - Panel infos : ETA, distance restante, vitesse
4. **Mises à jour** : WebSocket `/topic/deliveries` refresh automatique

### 6.3 Tester APIs avec cURL

**Obtenir Nœuds Réseau** :
```bash
curl http://localhost:8080/api/v1/graph/nodes
```

**Calculer Plus Court Chemin** :
```bash
curl -X POST http://localhost:8080/api/v1/routing/shortest-path \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "NODE_A",
    "destination": "NODE_Z",
    "costWeights": {
      "alpha": 0.2, "beta": 0.5, "gamma": 0.1, 
      "delta": 0.1, "eta": 0.1
    }
  }'
```

**Simuler Trafic** :
```bash
curl -X POST http://localhost:8080/api/v1/simulation/traffic
```

**Créer Réseau Petri** :
```bash
curl -X POST http://localhost:8081/api/nets \
  -H "Content-Type: application/json" \
  -d '{"name": "Workflow Test", "places": ["START", "END"]}'
```

---

## 7. Déploiement

### 7.1 Docker Compose

**Fichier** : `docker-compose.yml`

```yaml
version: '3.8'
services:
  postgres:
    image: postgis/postgis:15-3.3
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: postgres
    volumes:
      - pg_data:/var/lib/postgresql/data
  
  petri-api:
    build: ./API-PETRI-NET
    ports:
      - "8081:8081"
    depends_on:
      - postgres
    environment:
      SPRING_R2DBC_URL: r2dbc:postgresql://postgres:5432/petri_db
  
  delivery-api:
    build: ./delivery-optimization-api
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - petri-api
    environment:
      SPRING_R2DBC_URL: r2dbc:postgresql://postgres:5432/delivery_db
      PETRI_NET_API_URL: http://petri-api:8081
  
  frontend:
    build: ./delivery-optimization-frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://delivery-api:8080

volumes:
  pg_data:
```

**Commandes** :
```bash
docker-compose up -d          # Démarrer tous services
docker-compose logs -f        # Voir logs temps réel
docker-compose down           # Arrêter
```

### 7.2 Variables d'Environnement

**Backend `application.yml`** :
```yaml
spring:
  r2dbc:
    url: ${SPRING_R2DBC_URL:r2dbc:postgresql://localhost:5432/delivery_db}
    username: ${DB_USER:postgres}
    password: ${DB_PASSWORD:postgres}
  
petri-net:
  api-url: ${PETRI_NET_API_URL:http://localhost:8081}
```

**Frontend `.env.local`** :
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## 8. Conclusion

### 8.1 Réalisations Techniques

✅ **Architecture Réactive** : WebFlux + R2DBC pour scalabilité  
✅ **Algorithmes Avancés** : A* optimisé, VRP avec relais, Kalman ETA  
✅ **Gestion États Formelle** : Réseaux de Petri pour workflow robuste  
✅ **UI Premium** : Design glassmorphique inspiré centres de commandement  
✅ **Temps Réel** : WebSocket STOMP pour notifications instantanées  
✅ **Simulation Dynamique** : Trafic, météo, reroutage automatique  
✅ **Visualisation Géospatiale** : Leaflet + PostGIS pour cartographie précise

### 8.2 Points Forts

- **Modularité** : Séparation Petri Net / Delivery en microservices
- **Performance** : Programmation non-bloquante (Project Reactor)
- **Extensibilité** : Ajout facile nouveaux algorithmes/endpoints
- **UX Moderne** : Interface fluide, animations, design tactical

### 8.3 Perspectives d'Amélioration

🔹 **Machine Learning** : Prédiction trafic via modèles LSTM  
🔹 **Mobile App** : Application chauffeurs React Native  
🔹 **Multi-Tenancy** : Support plusieurs organisations  
🔹 **API Gateway** : Centralisation sécurité (OAuth2 + JWT)  
🔹 **Monitoring** : Grafana + Loki pour observabilité complète

### 8.4 Technologies Maîtrisées

- Programmation réactive (Mono/Flux, backpressure)
- R2DBC non-bloquant vs JDBC
- Réseaux de Petri (workflow formel)
- Algorithmes graphes (A*, VRP, Dijkstra)
- Next.js App Router (Server Components)
- WebSocket STOMP temps réel
- PostGIS géospatial (types POINT, calculs Haversine)
- Liquibase migrations versionnées

---

**Fin du Rapport d'Implémentation**
