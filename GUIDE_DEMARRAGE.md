# 🚀 GUIDE DE DÉMARRAGE - TiibnTick

## ✅ CORRECTIONS APPLIQUÉES

### 1. Uniformisation des Ports
- **API-PETRI-NET**: Port **8081**
- **delivery-optimization-api**: Port **8080**
- **Frontend**: Port **3000**

### 2. Configurations Base de Données
- **delivery_db**: Base pour delivery-optimization-api
- **petri_db**: Base pour API-PETRI-NET
- **Utilisateur**: `postgres`
- **Mot de passe**: `postgres`

### 3. Liquibase Activé
- Migrations automatiques au démarrage de delivery-api
- Schéma créé automatiquement

### 4. WebSocket et CORS
- CORS configuré pour WebFlux
- WebSocket utilise les variables d'environnement
- Support SockJS pour compatibilité

### 5. Gestion d'Erreurs Frontend
- **Toast notifications** pour erreurs API
- **ApiError** custom avec codes d'erreur
- **useApi hook** pour simplifier les appels
- Logs détaillés dans la console

### 6. Intégration Petri Net
- **PetriNetClient** pour communication entre APIs
- **StateTransitionService** modifié pour validation formelle
- Fallback graceful si Petri Net indisponible

---

## 📋 PRÉREQUIS

1. **Java 17+** : `java -version`
2. **Node.js 18+** : `node -v`
3. **PostgreSQL 15** : `psql --version`
4. **Maven 3.8+** : `mvn -v`

---

## 🎯 DÉMARRAGE RAPIDE

### Option 1: Démarrage Manuel (Recommandé pour développement)

#### Étape 1: Démarrer PostgreSQL

**Avec Docker:**
```bash
docker run -d \
  --name tiibntick-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=delivery_db \
  -p 5432:5432 \
  postgres:15
```

**Ou avec PostgreSQL installé localement:**
```bash
# Créer les bases de données
psql -U postgres -c "CREATE DATABASE delivery_db;"
psql -U postgres -c "CREATE DATABASE petri_db;"
```

#### Étape 2: Démarrer API-PETRI-NET

```bash
cd "f:\Projet Réseau\API-PETRI-NET"
./mvnw spring-boot:run
```

✅ Vérifier: http://localhost:8081/api/nets/health
Devrait retourner: `"UP"`

#### Étape 3: Démarrer delivery-optimization-api

```bash
cd "f:\Projet Réseau\delivery-optimization-api"
./mvnw spring-boot:run
```

✅ Vérifier: http://localhost:8080/actuator/health
Devrait retourner: `{"status":"UP"}`

**Note**: Liquibase va créer automatiquement le schéma et insérer les données de test.

#### Étape 4: Démarrer le Frontend

```bash
cd "f:\Projet Réseau\delivery-optimization-frontend"
npm install  # Première fois seulement
npm run dev
```

✅ Vérifier: http://localhost:3000
Vous devriez voir le dashboard TiibnTick.

---

### Option 2: Docker Compose (Production-like)

```bash
cd "f:\Projet Réseau"
docker-compose up --build
```

Services disponibles:
- **Frontend**: http://localhost:3000
- **delivery-api**: http://localhost:8080
- **petri-api**: http://localhost:8081
- **PostgreSQL**: localhost:5432

---

## 🧪 TESTS DE VÉRIFICATION

### Test 1: Vérifier les APIs

```bash
# Tester API Petri Net
curl http://localhost:8081/api/nets/health

# Tester delivery API
curl http://localhost:8080/actuator/health

# Obtenir les nœuds du graphe
curl http://localhost:8080/api/v1/graph/nodes

# Obtenir les livraisons
curl http://localhost:8080/api/v1/delivery
```

### Test 2: Tester le Plus Court Chemin (A*)

```bash
curl -X POST http://localhost:8080/api/v1/routing/shortest-path \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "CLIENT_1",
    "destination": "CLIENT_5",
    "costWeights": {
      "alpha": 0.3,
      "beta": 0.4,
      "gamma": 0.1,
      "delta": 0.1,
      "eta": 0.1
    }
  }'
```

**Résultat attendu**: Un objet avec `path`, `distance`, `totalCost`, et `costBreakdown`.

### Test 3: Tester l'Intégration Petri Net

```bash
# 1. Créer un réseau Petri
curl -X POST http://localhost:8081/api/nets \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-delivery-123",
    "name": "Test Workflow",
    "places": ["PENDING", "IN_TRANSIT", "DELIVERED"],
    "transitions": [
      {"id": "START", "from": "PENDING", "to": "IN_TRANSIT"},
      {"id": "COMPLETE", "from": "IN_TRANSIT", "to": "DELIVERED"}
    ]
  }'

# 2. Vérifier l'état
curl http://localhost:8081/api/nets/test-delivery-123

# 3. Déclencher une transition
curl -X POST http://localhost:8081/api/nets/test-delivery-123/fire/START \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Test 4: Interface Frontend

1. **Ouvrir** http://localhost:3000
2. **Aller sur** `/network`
3. **Cliquer** sur deux nœuds pour définir départ/arrivée
4. **Ajuster** les poids dans le Cost Simulator
5. **Cliquer** "Calculer SPP"
6. **Vérifier** que le chemin s'affiche sur la carte avec breakdown des coûts

### Test 5: WebSocket Temps Réel

1. **Ouvrir** la console développeur du navigateur (F12)
2. **Aller sur** http://localhost:3000/dashboard
3. **Vérifier** les logs: `Connected to WebSocket: /topic/fleet`
4. **Simuler du trafic** via l'interface ou:

```bash
curl -X POST http://localhost:8080/api/v1/simulation/traffic
```

5. **Vérifier** que les notifications apparaissent en temps réel

### Test 6: Visualisation Petri Net ⭐ NOUVEAU

1. **Ouvrir** http://localhost:3000/petri-net
2. **Vérifier** badge "Connecté" (vert) en haut à droite
3. **Sélectionner** une livraison dans le grid
4. **Observer** le réseau de Petri:
   - Places (cercles) représentant les états
   - Transitions (rectangles) entre les états
   - Token orange dans la place correspondant au statut actuel
5. **Cliquer** sur une transition activable (bleue)
6. **Observer** l'animation:
   - Transition devient orange et pulse
   - Arcs s'animent
   - Token se déplace vers la nouvelle place
7. **Vérifier** que le statut de la livraison est mis à jour

**Guide complet**: Voir [GUIDE_PETRI_NET.md](f:\Projet Réseau\GUIDE_PETRI_NET.md)

---

## 🔍 VÉRIFICATION DES PROBLÈMES

### Problème: API ne démarre pas

**Erreur PostgreSQL:**
```
Connection refused: localhost:5432
```

**Solution:**
1. Vérifier que PostgreSQL est démarré: `docker ps` ou `service postgresql status`
2. Vérifier les credentials dans `.env` et `application.yml`
3. Créer manuellement les bases: `psql -U postgres -c "CREATE DATABASE delivery_db;"`

**Erreur Liquibase:**
```
liquibase.exception.LiquibaseException
```

**Solution:**
1. Vérifier que `spring.liquibase.enabled: true` dans `application.yml`
2. Vérifier que le fichier `db/changelog/db.changelog-master.xml` existe
3. Supprimer la table `databasechangelog` si corruption: `DROP TABLE databasechangelog;`

### Problème: Frontend ne se connecte pas au backend

**Erreur Console:**
```
Failed to fetch: Cannot reach server
```

**Solution:**
1. Vérifier que l'API tourne: `curl http://localhost:8080/actuator/health`
2. Vérifier `.env.local`:
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8080
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:8080/ws
```
3. Redémarrer le frontend: `npm run dev`

### Problème: WebSocket ne se connecte pas

**Erreur Console:**
```
WebSocket connection failed
```

**Solution:**
1. Vérifier le port correct: **8080** (pas 9090)
2. Vérifier CORS dans `WebFluxConfig.java`
3. Tester manuellement: ouvrir http://localhost:8080/ws dans le navigateur

### Problème: Intégration Petri Net échoue

**Logs:**
```
Petri Net API not available
```

**Solution:**
1. Vérifier que API-PETRI-NET tourne sur port **8081**
2. Vérifier `application.yml`:
```yaml
petri-net:
  api:
    url: http://localhost:8081
```
3. Le système continue de fonctionner sans Petri Net (fallback graceful)

---

## 📊 UTILISATION DU SYSTÈME

### Workflow Typique

1. **Dashboard** (`/dashboard`)
   - Vue d'ensemble des livraisons actives
   - Statistiques en temps réel
   - Carte avec positions

2. **Network** (`/network`)
   - Visualisation du graphe routier
   - Calcul du plus court chemin (A*)
   - Simulation trafic/météo
   - Cost Simulator avec poids personnalisables

3. **Tours** (`/tours/plan`)
   - Sélection de livraisons à optimiser
   - Lancer VRP optimization
   - Voir les tournées générées
   - Points de relais utilisés

4. **Deliveries** (`/delivery`)
   - Liste de toutes les livraisons
   - Filtres par statut
   - Suivi individuel

5. **Analytics** (`/analytics`)
   - Métriques de performance
   - Statistiques ETA
   - Distribution des coûts

---

## 🎓 FONCTIONNALITÉS CLÉS

### 1. Algorithme A* Multi-Critères
- **Distance**: Longueur du trajet
- **Temps**: Durée avec trafic
- **Pénibilité**: Difficulté de la route
- **Météo**: Impact conditions météo
- **Fuel**: Coût carburant

### 2. Filtre de Kalman pour ETA
- Prédiction temps d'arrivée
- Intervalle de confiance
- Mise à jour temps réel

### 3. Résolution VRP
- Allocation véhicules optimale
- Intégration points de relais
- Minimisation des coûts

### 4. Réseaux de Petri
- Validation formelle des transitions d'état
- Workflow: PENDING → ASSIGNED → IN_TRANSIT → DELIVERED
- Garantie cohérence des états

---

## 📞 SUPPORT

### Logs Utiles

**Backend delivery-api:**
```bash
tail -f logs/spring.log
# Ou voir console Maven
```

**Backend petri-api:**
```bash
tail -f logs/spring.log
```

**Frontend:**
- Console navigateur (F12)
- Terminal npm

### Commandes Utiles

```bash
# Rebuild Maven sans tests
./mvnw clean install -DskipTests

# Nettoyer cache npm
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Reset base de données
docker stop tiibntick-postgres
docker rm tiibntick-postgres
# Puis redémarrer

# Voir logs Docker Compose
docker-compose logs -f backend
```

---

## ✅ CHECKLIST DE DÉPLOIEMENT

- [ ] PostgreSQL démarré et accessible
- [ ] Bases `delivery_db` et `petri_db` créées
- [ ] API-PETRI-NET accessible sur http://localhost:8081
- [ ] delivery-optimization-api accessible sur http://localhost:8080
- [ ] Liquibase a créé le schéma (vérifier logs)
- [ ] Frontend accessible sur http://localhost:3000
- [ ] WebSocket connecté (voir console navigateur)
- [ ] Test A* fonctionne
- [ ] Intégration Petri Net validée
- [ ] Toasts d'erreurs s'affichent correctement

---

## 🎉 FÉLICITATIONS!

Votre système TiibnTick est maintenant opérationnel avec:
- ✅ Configurations cohérentes
- ✅ Intégration Petri Net fonctionnelle
- ✅ Gestion d'erreurs robuste
- ✅ WebSocket temps réel
- ✅ Migrations automatiques

**Prochaines étapes recommandées:**
1. Tester tous les scénarios dans l'interface
2. Vérifier les logs pour détecter des warnings
3. Créer des livraisons de test via l'API
4. Explorer les métriques Prometheus: http://localhost:8080/actuator/prometheus
