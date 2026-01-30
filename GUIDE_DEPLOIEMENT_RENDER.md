# 🚀 Guide de Déploiement Render - TiibnTick

**Projet**: TiibnTick - Système Pick and Drop avec Optimisation de Tournées
**Date**: 30 janvier 2026
**Plateforme**: Render.com
**Type**: Blueprint (Déploiement automatisé)

---

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Préparation du Repository](#préparation-du-repository)
3. [Configuration Render](#configuration-render)
4. [Déploiement via Blueprint](#déploiement-via-blueprint)
5. [Vérifications Post-Déploiement](#vérifications-post-déploiement)
6. [Configuration des URLs](#configuration-des-urls)
7. [Monitoring et Logs](#monitoring-et-logs)
8. [Troubleshooting](#troubleshooting)
9. [Coûts et Plans](#coûts-et-plans)

---

## 🔧 Prérequis

### 1. Compte Render
- Créer un compte sur https://render.com
- Vérifier votre email
- Lier votre compte GitHub

### 2. Repository GitHub
- Repository public ou privé sur GitHub
- Accès en lecture pour Render
- Branche `master` à jour

### 3. Fichiers Requis dans le Repository
```
f:\Projet Réseau\
├── render.yaml                    # ✅ Blueprint Render
├── db-init/
│   ├── Dockerfile                 # ✅ Image pour initialisation DB
│   ├── init-databases.sh          # ✅ Script création delivery_db + petri_db
│   └── README.md
├── API-PETRI-NET/
│   ├── pom.xml
│   └── src/
├── delivery-optimization-api/
│   ├── pom.xml
│   └── src/
└── delivery-optimization-frontend/
    ├── package.json
    └── src/
```

---

## 📦 Préparation du Repository

### Étape 1: Vérifier que le code est sur GitHub

```bash
cd "f:\Projet Réseau"
git remote -v
# Devrait montrer: origin  https://github.com/Zenbx/Routage-PetriNet-TiibnTick-2.git

git status
# Devrait être clean (rien à commit)

git log -1 --oneline
# Devrait montrer: c312027e feat: Conformité 100% RESULTAT_ATTENDU.md - Production Ready
```

### Étape 2: Vérifier le render.yaml

Le fichier [render.yaml](render.yaml) doit définir:

```yaml
databases:
  - name: tiibntick-postgres  # PostgreSQL 15

services:
  - name: tiibntick-db-init        # Worker (one-time) - Crée les BDs
  - name: tiibntick-petri-api      # Web Service (Java)
  - name: tiibntick-delivery-api   # Web Service (Java)
  - name: tiibntick-frontend       # Web Service (Node.js)
```

**Points clés**:
- ✅ Database créée en premier
- ✅ Worker db-init crée `delivery_db` et `petri_db`
- ✅ Services Web démarrent après le worker
- ✅ Variables d'environnement auto-configurées

---

## 🌐 Configuration Render

### Étape 1: Se connecter à Render

1. Aller sur https://dashboard.render.com
2. Cliquer sur **"New +"** → **"Blueprint"**

### Étape 2: Lier le Repository GitHub

1. Sélectionner **"Connect GitHub"** (si pas déjà fait)
2. Autoriser Render à accéder à votre compte GitHub
3. Sélectionner le repository: `Zenbx/Routage-PetriNet-TiibnTick-2`
4. Donner les permissions de lecture

### Étape 3: Configurer la Région

Dans le render.yaml, la région est définie à `frankfurt`:

```yaml
region: frankfurt  # Europe (RGPD compliant)
```

Vous pouvez changer pour:
- `oregon` (US West)
- `ohio` (US East)
- `singapore` (Asia)

**Recommandation**: Garder `frankfurt` si vos utilisateurs sont en Europe.

---

## 🚀 Déploiement via Blueprint

### Méthode 1: Via le Dashboard Render (Recommandée)

#### 1. Créer le Blueprint

1. Dashboard Render → **"New +"** → **"Blueprint"**
2. Sélectionner le repository GitHub
3. Branch: `master`
4. Blueprint file: `render.yaml` (auto-détecté)
5. Cliquer sur **"Apply"**

#### 2. Review du Blueprint

Render affiche un aperçu:

```
📦 Database: tiibntick-postgres (PostgreSQL 15)
   Plan: Starter ($7/mois) - 256 MB RAM, 1 GB storage

🔧 Worker: tiibntick-db-init (Docker)
   Plan: Starter ($7/mois) - One-time execution

🌐 Web: tiibntick-petri-api (Java)
   Plan: Starter ($7/mois) - 512 MB RAM
   Build: ./mvnw clean package -DskipTests
   Start: java -Dserver.port=$PORT -jar target/*.jar

🌐 Web: tiibntick-delivery-api (Java)
   Plan: Starter ($7/mois) - 1 GB RAM
   Build: ./mvnw clean package -DskipTests
   Start: java -Dserver.port=$PORT -jar target/*.jar

🌐 Web: tiibntick-frontend (Node.js)
   Plan: Starter ($7/mois) - 512 MB RAM
   Build: npm install && npm run build
   Start: npm run start
```

#### 3. Approuver le Déploiement

1. Vérifier les services et plans
2. Cliquer sur **"Create Resources"**
3. Render commence le déploiement

### Méthode 2: Via Render CLI

```bash
# Installer Render CLI
npm install -g render-cli

# Se connecter
render login

# Déployer le blueprint
cd "f:\Projet Réseau"
render blueprint create
```

---

## ⏱️ Ordre de Déploiement

Render respecte cet ordre automatiquement:

### Phase 1: Infrastructure (0-2 minutes)
```
1. Création de tiibntick-postgres (PostgreSQL 15)
   ├─ Provisioning de l'instance
   ├─ Configuration du user: tiibntick_user
   └─ Base par défaut: postgres
```

### Phase 2: Initialisation Database (2-5 minutes)
```
2. Worker: tiibntick-db-init
   ├─ Build Dockerfile (db-init/Dockerfile)
   ├─ Exécution init-databases.sh
   ├─ Création delivery_db
   ├─ Création petri_db
   └─ Vérification avec psql \l

   ⏰ Durée: ~1 minute
```

### Phase 3: Services API Backend (5-15 minutes)
```
3. Web: tiibntick-petri-api
   ├─ Build Maven (./mvnw clean package)
   ├─ Connexion à petri_db
   ├─ Démarrage Spring Boot
   └─ Health check: /api/nets/health

   ⏰ Durée: ~5 minutes (Maven download dependencies)

4. Web: tiibntick-delivery-api
   ├─ Build Maven (./mvnw clean package)
   ├─ Connexion à delivery_db
   ├─ Liquibase migrations (schéma + données)
   ├─ Démarrage Spring Boot
   └─ Health check: /actuator/health

   ⏰ Durée: ~5 minutes
```

### Phase 4: Frontend (15-20 minutes)
```
5. Web: tiibntick-frontend
   ├─ npm install (téléchargement packages)
   ├─ npm run build (Next.js production build)
   ├─ Démarrage npm start
   └─ Health check: /

   ⏰ Durée: ~5 minutes
```

**Temps total estimé**: 15-20 minutes

---

## ✅ Vérifications Post-Déploiement

### 1. Vérifier l'État des Services

Dans le Dashboard Render:

```
✅ Database: tiibntick-postgres - Live
✅ Worker: tiibntick-db-init - Exited (normal)
✅ Web: tiibntick-petri-api - Live
✅ Web: tiibntick-delivery-api - Live
✅ Web: tiibntick-frontend - Live
```

**Note**: Le worker `db-init` doit être en statut "Exited" après exécution (c'est normal).

### 2. Vérifier les URLs Générées

Render génère des URLs publiques:

```
Petri API:
https://tiibntick-petri-api.onrender.com

Delivery API:
https://tiibntick-delivery-api.onrender.com

Frontend:
https://tiibntick-frontend.onrender.com
```

### 3. Tester les Health Checks

```bash
# Petri API
curl https://tiibntick-petri-api.onrender.com/api/nets/health
# Devrait retourner: "UP"

# Delivery API
curl https://tiibntick-delivery-api.onrender.com/actuator/health
# Devrait retourner: {"status":"UP"}

# Frontend
curl https://tiibntick-frontend.onrender.com
# Devrait retourner: HTML de la page d'accueil
```

### 4. Vérifier les Bases de Données

Dans Render Dashboard → Database → tiibntick-postgres → **"Connect"**:

```bash
# Connexion via psql
psql -h <hostname> -U tiibntick_user -d postgres

# Lister les bases
\l

# Devrait montrer:
# - postgres (base par défaut)
# - delivery_db (✅)
# - petri_db (✅)

# Vérifier delivery_db
\c delivery_db
\dt
# Devrait montrer les tables Liquibase: deliveries, arcs, nodes, etc.

# Vérifier petri_db
\c petri_db
\dt
# Devrait montrer les tables Petri Net (si schéma défini)
```

### 5. Tester les Endpoints API

```bash
# Test Delivery API
curl https://tiibntick-delivery-api.onrender.com/api/v1/delivery
# Devrait retourner: [] ou liste de livraisons

# Test Petri API
curl https://tiibntick-petri-api.onrender.com/api/nets/health
# Devrait retourner: "UP"
```

### 6. Accéder au Frontend

Ouvrir dans le navigateur:
```
https://tiibntick-frontend.onrender.com
```

Vérifier que:
- ✅ Page d'accueil charge
- ✅ Sidebar s'affiche
- ✅ Navigation fonctionne
- ✅ Pas d'erreurs dans la console

---

## 🔗 Configuration des URLs

### Variables d'Environnement Automatiques

Render configure automatiquement les URLs entre services via `fromService`:

#### Frontend → APIs

```yaml
# render.yaml (auto-configuré)
envVars:
  - key: NEXT_PUBLIC_API_URL
    fromService:
      name: tiibntick-delivery-api
      type: web
      property: url
    # Résultat: https://tiibntick-delivery-api.onrender.com

  - key: NEXT_PUBLIC_PETRI_NET_API_URL
    fromService:
      name: tiibntick-petri-api
      type: web
      property: url
    # Résultat: https://tiibntick-petri-api.onrender.com
```

#### Delivery API → Petri API

```yaml
envVars:
  - key: PETRI_NET_API_URL
    fromService:
      name: tiibntick-petri-api
      type: web
      property: url
```

**Pas de configuration manuelle requise!**

### Domaines Personnalisés (Optionnel)

Pour utiliser votre propre domaine:

1. Dashboard Render → Service → **"Settings"** → **"Custom Domain"**
2. Ajouter votre domaine: `api.tiibntick.com`
3. Configurer les DNS records:
   ```
   Type: CNAME
   Name: api
   Value: tiibntick-delivery-api.onrender.com
   ```
4. Attendre la propagation DNS (5-30 minutes)
5. Render configure automatiquement le certificat SSL (Let's Encrypt)

---

## 📊 Monitoring et Logs

### 1. Logs en Temps Réel

Dashboard Render → Service → **"Logs"**

#### Filtrer les logs par service:

```bash
# Petri API
# Chercher: "Démarrage de l'optimisation VRP"
# Chercher: "PetriNetEngine initialized"

# Delivery API
# Chercher: "Liquibase: Successfully applied"
# Chercher: "Netty started on port"

# Frontend
# Chercher: "ready - started server"
# Chercher: "compiled successfully"
```

#### Logs Worker db-init:

```bash
# Chercher:
"🚀 Initialisation des bases de données TiibnTick..."
"✅ PostgreSQL est prêt!"
"📦 Création de delivery_db..."
"✅ delivery_db créée ou déjà existante"
"🕸️ Création de petri_db..."
"✅ petri_db créée ou déjà existante"
"🎉 Initialisation terminée avec succès!"
```

### 2. Métriques

Dashboard Render → Service → **"Metrics"**

Surveiller:
- **CPU Usage**: Devrait être < 50% en moyenne
- **Memory Usage**: Devrait être < 80% de la limite
- **Response Time**: API < 200ms, Frontend < 500ms
- **HTTP Errors**: Devrait être < 1%

### 3. Alertes

Configurer des alertes email:

1. Dashboard → Service → **"Settings"** → **"Notifications"**
2. Cocher:
   - ✅ Deploy failed
   - ✅ Deploy succeeded
   - ✅ Service health check failing
   - ✅ High memory usage (> 90%)

---

## 🐛 Troubleshooting

### Problème 1: Worker db-init reste en "Building"

**Cause**: Erreur dans le Dockerfile ou script

**Solution**:
```bash
# Vérifier les logs du worker
Dashboard → tiibntick-db-init → Logs

# Vérifier localement
cd "f:\Projet Réseau\db-init"
docker build -t test-db-init .
docker run --rm \
  -e PGHOST=localhost \
  -e PGPORT=5432 \
  -e PGUSER=postgres \
  -e PGPASSWORD=postgres \
  test-db-init
```

### Problème 2: API Java ne démarre pas

**Cause**: Build Maven échoue ou dépendances manquantes

**Solution**:
```bash
# Vérifier les logs de build
Dashboard → Service → Logs → Filtrer "BUILD"

# Erreur commune: OR-Tools
# Si erreur: "Could not find ortools-java"
# Vérifier pom.xml ligne 95-98

# Tester localement
cd "f:\Projet Réseau\delivery-optimization-api"
./mvnw clean package
# Devrait compiler sans erreur
```

### Problème 3: Frontend ne se connecte pas aux APIs

**Cause**: Variables d'environnement incorrectes

**Solution**:
```bash
# Vérifier les variables
Dashboard → tiibntick-frontend → Environment → Variables

# Devrait avoir:
NEXT_PUBLIC_API_URL=https://tiibntick-delivery-api.onrender.com
NEXT_PUBLIC_PETRI_NET_API_URL=https://tiibntick-petri-api.onrender.com

# Si manquantes, les ajouter manuellement et redéployer
```

### Problème 4: Database connection refused

**Cause**: Variables DB non configurées ou DB pas ready

**Solution**:
```bash
# Vérifier que la DB est "Live"
Dashboard → Databases → tiibntick-postgres → Status: Live

# Vérifier les variables du service
Dashboard → Service → Environment

# Devrait avoir:
DB_HOST=<hostname>.oregon-postgres.render.com
DB_PORT=5432
DB_USER=tiibntick_user
DB_PASSWORD=<auto-generated>
DB_NAME=delivery_db (ou petri_db)

# Redémarrer le service
Dashboard → Service → Manual Deploy → "Deploy latest commit"
```

### Problème 5: Out of Memory (OOM)

**Cause**: Heap Java trop petit pour le plan

**Solution**:
```yaml
# Dans render.yaml, ajuster JAVA_OPTS:
envVars:
  - key: JAVA_OPTS
    value: -Xms256m -Xmx512m  # Petri API
  # ou
  - key: JAVA_OPTS
    value: -Xms512m -Xmx1024m # Delivery API (VRP gourmand)

# Ou upgrader le plan:
plan: standard  # 2 GB RAM au lieu de 512 MB
```

### Problème 6: Deploy Timeout

**Cause**: Build trop long (>10 minutes)

**Solution**:
```bash
# Optimiser le build Maven
# Ajouter dans pom.xml:
<properties>
    <maven.compiler.useIncrementalCompilation>false</maven.compiler.useIncrementalCompilation>
</properties>

# Ou pré-builder le JAR et le commit (déconseillé)
# Ou upgrader vers plan supérieur (build plus rapide)
```

---

## 💰 Coûts et Plans

### Plan Starter (Recommandé pour démarrage)

```
Database: tiibntick-postgres
Plan: Starter
Prix: $7/mois
- 256 MB RAM
- 1 GB Storage
- Shared CPU
- 500 heures/mois

Web Services (x3): petri-api, delivery-api, frontend
Plan: Starter (chacun)
Prix: $7/mois × 3 = $21/mois
- 512 MB RAM (frontend, petri-api)
- 1 GB RAM (delivery-api - configuré dans render.yaml)
- Shared CPU
- Pas de sleep automatique
- Certificat SSL gratuit

Worker: db-init
Plan: Starter
Prix: $0 (one-time job, facturé seulement pendant exécution ~$0.01)

TOTAL: ~$28/mois
```

### Optimisation des Coûts

#### Option 1: Free Tier (Développement seulement)

```yaml
# Changer dans render.yaml:
plan: free  # Au lieu de starter

# Limitations:
- Sleep après 15 minutes d'inactivité
- 750 heures/mois par service
- Moins de RAM
- Pas de support prioritaire
- Database non disponible en free

TOTAL: $7/mois (database seulement)
```

#### Option 2: Plan Standard (Production)

```yaml
plan: standard

# Avantages:
- 2 GB RAM par service
- CPU dédié
- Build plus rapide
- Meilleure performance
- Uptime 99.9%

TOTAL: ~$84/mois (4 services @ $21/mois)
```

### Calculateur de Coûts

https://render.com/pricing

---

## 🔄 Mises à Jour et Redéploiement

### Auto-Deploy (Activé par défaut)

```yaml
# render.yaml
autoDeploy: true  # Push sur master = redéploy auto
```

Workflow:
```
1. git push origin master
   ↓
2. Render détecte le push (webhook GitHub)
   ↓
3. Rebuild automatique des services modifiés
   ↓
4. Health check
   ↓
5. Routing du trafic vers nouvelle version (zero-downtime)
```

### Manual Deploy

Dashboard → Service → **"Manual Deploy"** → **"Deploy latest commit"**

### Rollback

Dashboard → Service → **"Events"** → Sélectionner un déploiement précédent → **"Rollback"**

---

## 📚 Ressources Utiles

### Documentation Officielle
- **Render Docs**: https://render.com/docs
- **Blueprints**: https://render.com/docs/blueprint-spec
- **Environment Groups**: https://render.com/docs/environment-variables

### Support
- **Community**: https://community.render.com
- **Status Page**: https://status.render.com
- **Email Support**: support@render.com (plans payants)

### Repositories
- **GitHub**: https://github.com/Zenbx/Routage-PetriNet-TiibnTick-2
- **Render Blueprint**: render.yaml dans le repo

---

## ✅ Checklist Finale

Avant de déployer:

- [ ] Repository GitHub à jour
- [ ] render.yaml présent et valide
- [ ] db-init/ complet (Dockerfile + script)
- [ ] .gitignore exclut node_modules/ et target/
- [ ] Tests locaux passent (./mvnw test)
- [ ] Build local réussit (./mvnw clean package)
- [ ] Frontend build localement (npm run build)

Après déploiement:

- [ ] Tous les services sont "Live"
- [ ] Worker db-init est "Exited" (normal)
- [ ] Health checks retournent OK
- [ ] Les 2 databases existent (delivery_db, petri_db)
- [ ] Frontend accessible et fonctionnel
- [ ] APIs répondent correctement
- [ ] Swagger UI accessible (optionnel: configurer auth)
- [ ] Logs ne montrent pas d'erreurs critiques

---

## 🎉 Félicitations!

Votre système **TiibnTick** est maintenant déployé sur Render et accessible publiquement!

**URLs de production**:
- Frontend: https://tiibntick-frontend.onrender.com
- Delivery API: https://tiibntick-delivery-api.onrender.com
- Petri Net API: https://tiibntick-petri-api.onrender.com

**Prochaines étapes**:
1. Configurer un domaine personnalisé (optionnel)
2. Activer les alertes de monitoring
3. Configurer des backups réguliers de la base de données
4. Mettre en place un système de logs centralisé (Datadog, Sentry, etc.)
5. Optimiser les performances si nécessaire

---

**Auteur**: Claude Sonnet 4.5
**Date**: 30 janvier 2026
**Version**: 1.0.0
**Support**: Voir [AMELIORATIONS_FINALES.md](AMELIORATIONS_FINALES.md)
