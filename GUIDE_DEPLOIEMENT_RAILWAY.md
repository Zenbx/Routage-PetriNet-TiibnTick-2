# Guide de Déploiement Railway - TiibnTick Delivery System

## Table des Matières
1. [Prérequis](#prérequis)
2. [Architecture Railway](#architecture-railway)
3. [Étape 1: Création du Projet](#étape-1-création-du-projet)
4. [Étape 2: Base de Données PostgreSQL](#étape-2-base-de-données-postgresql)
5. [Étape 3: API Petri Net](#étape-3-api-petri-net)
6. [Étape 4: Delivery API](#étape-4-delivery-api)
7. [Étape 5: Frontend Next.js](#étape-5-frontend-nextjs)
8. [Vérification et Tests](#vérification-et-tests)
9. [Monitoring](#monitoring)
10. [Troubleshooting](#troubleshooting)
11. [Coûts](#coûts)

---

## Prérequis

### Compte Railway
- Créer un compte sur https://railway.app
- Lier votre compte GitHub
- **Plan Gratuit**: $5 de crédit/mois + 500 heures d'exécution

### Repository GitHub
- Code pushé sur: `https://github.com/Zenbx/Routage-PetriNet-TiibnTick-2`
- Branch: `master`

---

## Architecture Railway

Railway va créer **4 services**:

```
┌─────────────────────────────────────────────┐
│           Railway Project                   │
│                                             │
│  ┌──────────────┐      ┌─────────────────┐│
│  │  PostgreSQL  │──────│  API Petri Net  ││
│  │  (petri_db + │      │   Port: 8081    ││
│  │  delivery_db)│      └─────────────────┘│
│  └──────────────┘                          │
│         │                                   │
│         │              ┌─────────────────┐ │
│         └──────────────│  Delivery API   │ │
│                        │   Port: 8080    │ │
│                        └─────────────────┘ │
│                               │             │
│                        ┌─────────────────┐ │
│                        │    Frontend     │ │
│                        │   Port: 3000    │ │
│                        └─────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## Étape 1: Création du Projet

### 1.1 Nouveau Projet Railway

1. Aller sur https://railway.app/dashboard
2. Cliquer sur **"New Project"**
3. Sélectionner **"Deploy from GitHub repo"**
4. Choisir `Routage-PetriNet-TiibnTick-2`
5. Railway va détecter automatiquement les Dockerfiles

**Important**: Ne pas laisser Railway déployer automatiquement tous les services. Annuler et configurer manuellement.

### 1.2 Configuration Manuelle

1. Cliquer sur **"Empty Project"**
2. Nommer le projet: `TiibnTick-Delivery-System`
3. Région: **Europe (Frankfurt)** pour minimiser la latence

---

## Étape 2: Base de Données PostgreSQL

### 2.1 Ajouter PostgreSQL

1. Dans votre projet Railway, cliquer **"+ New Service"**
2. Sélectionner **"Database"** → **"PostgreSQL"**
3. Railway crée automatiquement la base avec ces variables:
   ```
   DATABASE_URL
   PGHOST
   PGPORT
   PGUSER
   PGPASSWORD
   PGDATABASE
   ```

### 2.2 Créer les Bases `delivery_db` et `petri_db`

Railway crée une seule base par défaut. Pour créer les deux bases nécessaires:

**Option A - Via Railway CLI** (Recommandé)

```bash
# Installer Railway CLI
npm i -g @railway/cli

# Se connecter
railway login

# Lier le projet
railway link

# Se connecter à PostgreSQL
railway run psql $DATABASE_URL

# Dans psql, créer les bases
CREATE DATABASE delivery_db;
CREATE DATABASE petri_db;

# Vérifier
\l

# Quitter
\q
```

**Option B - Via Interface Web**

1. Aller dans le service PostgreSQL
2. Onglet **"Data"**
3. Ouvrir **"Query"**
4. Exécuter:
   ```sql
   CREATE DATABASE delivery_db;
   CREATE DATABASE petri_db;
   ```

### 2.3 Noter les Credentials

Railway génère automatiquement:
- **Host**: `containers-us-west-xxx.railway.app`
- **Port**: `5432`
- **User**: `postgres`
- **Password**: Généré automatiquement
- **Database**: `railway` (base par défaut)

---

## Étape 3: API Petri Net

### 3.1 Déployer le Service

1. Cliquer **"+ New Service"**
2. Sélectionner **"GitHub Repo"**
3. Choisir `Routage-PetriNet-TiibnTick-2`
4. Railway détecte `API-PETRI-NET/Dockerfile`

### 3.2 Configuration du Build

Railway détecte automatiquement le Dockerfile. Si besoin de forcer:

1. Aller dans **Settings** du service
2. **Build Configuration**:
   - Root Directory: `API-PETRI-NET`
   - Dockerfile Path: `Dockerfile`

### 3.3 Variables d'Environnement

Ajouter dans l'onglet **"Variables"**:

```bash
# Database Connection
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=petri_db
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}

# Spring Configuration
SPRING_R2DBC_URL=r2dbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/petri_db
SPRING_PROFILES_ACTIVE=prod

# JVM Options
JAVA_OPTS=-Xms256m -Xmx512m

# Port (Railway sets this automatically)
PORT=8081
```

**Astuce**: Railway remplace automatiquement `${{Postgres.VARIABLE}}` par les valeurs du service PostgreSQL.

### 3.4 Health Check

Dans **Settings**:
- **Health Check Path**: `/api/nets/health`
- **Health Check Timeout**: 300 secondes (première compilation Maven)

### 3.5 Déployer

1. Cliquer **"Deploy"**
2. Attendre ~5-8 minutes (build Maven + Docker)
3. Vérifier les logs pour les erreurs

---

## Étape 4: Delivery API

### 4.1 Déployer le Service

1. **"+ New Service"** → **"GitHub Repo"**
2. Choisir `Routage-PetriNet-TiibnTick-2` (encore)
3. Railway détecte `delivery-optimization-api/Dockerfile`

### 4.2 Configuration du Build

**Settings** → **Build Configuration**:
- Root Directory: `delivery-optimization-api`
- Dockerfile Path: `Dockerfile`

### 4.3 Variables d'Environnement

```bash
# Database Connection
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=delivery_db
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}

# R2DBC (Reactive)
SPRING_R2DBC_URL=r2dbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/delivery_db

# Liquibase (Migrations)
SPRING_LIQUIBASE_URL=jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/delivery_db
SPRING_DATASOURCE_USERNAME=${{Postgres.PGUSER}}
SPRING_DATASOURCE_PASSWORD=${{Postgres.PGPASSWORD}}
SPRING_LIQUIBASE_ENABLED=true

# Petri Net API URL
PETRI_NET_API_URL=https://${{PetriAPI.RAILWAY_PUBLIC_DOMAIN}}

# Spring Profile
SPRING_PROFILES_ACTIVE=prod

# JVM Options
JAVA_OPTS=-Xms512m -Xmx1024m

# Server Port
PORT=8080
SERVER_PORT=${{PORT}}
```

### 4.4 Health Check

- **Health Check Path**: `/actuator/health`
- **Health Check Timeout**: 300 secondes

### 4.5 Déployer

Cliquer **"Deploy"** et attendre ~8-10 minutes.

---

## Étape 5: Frontend Next.js

### 5.1 Déployer le Service

1. **"+ New Service"** → **"GitHub Repo"**
2. Choisir `Routage-PetriNet-TiibnTick-2`

### 5.2 Configuration du Build

**Settings**:
- Root Directory: `delivery-optimization-frontend`
- Build Command: `npm install && npm run build`
- Start Command: `npm run start`

Railway détecte automatiquement Next.js (pas besoin de Dockerfile).

### 5.3 Variables d'Environnement

```bash
# API URLs
NEXT_PUBLIC_API_URL=https://${{DeliveryAPI.RAILWAY_PUBLIC_DOMAIN}}
NEXT_PUBLIC_WS_URL=wss://${{DeliveryAPI.RAILWAY_PUBLIC_DOMAIN}}/ws
NEXT_PUBLIC_PETRI_NET_API_URL=https://${{PetriAPI.RAILWAY_PUBLIC_DOMAIN}}

# Node Environment
NODE_ENV=production

# Port
PORT=3000
```

### 5.4 Déployer

Cliquer **"Deploy"**. Build: ~3-5 minutes.

---

## Vérification et Tests

### 6.1 URLs Publiques

Railway génère automatiquement des URLs publiques:

```bash
# Petri Net API
https://api-petri-net-production-xxxx.up.railway.app

# Delivery API
https://delivery-api-production-xxxx.up.railway.app

# Frontend
https://frontend-production-xxxx.up.railway.app
```

### 6.2 Tests de Santé

**Petri Net API**:
```bash
curl https://api-petri-net-production-xxxx.up.railway.app/api/nets/health
# Réponse attendue: {"status":"UP"}
```

**Delivery API**:
```bash
curl https://delivery-api-production-xxxx.up.railway.app/actuator/health
# Réponse attendue: {"status":"UP"}
```

**Frontend**:
Ouvrir dans le navigateur: `https://frontend-production-xxxx.up.railway.app`

### 6.3 Swagger UI

- **Delivery API**: https://delivery-api-production-xxxx.up.railway.app/swagger-ui.html
- **Petri Net API**: https://api-petri-net-production-xxxx.up.railway.app/swagger-ui.html

### 6.4 Tests Fonctionnels

**Test 1: Créer un Graphe**
```bash
curl -X POST https://delivery-api-production-xxxx.up.railway.app/api/v1/graph/init \
  -H "Content-Type: application/json" \
  -d '{
    "nodeCount": 10,
    "averageDegree": 3,
    "relayPointRatio": 0.2
  }'
```

**Test 2: Plus Court Chemin**
```bash
curl -X POST https://delivery-api-production-xxxx.up.railway.app/api/v1/routing/shortest-path \
  -H "Content-Type: application/json" \
  -d '{
    "originId": "NODE-001",
    "destinationId": "NODE-005",
    "weights": {"distance": 1.0, "time": 0.5}
  }'
```

**Test 3: Optimisation VRP**
```bash
curl -X POST https://delivery-api-production-xxxx.up.railway.app/api/v1/routing/optimize-tour \
  -H "Content-Type: application/json" \
  -d '{
    "deliveries": [
      {
        "pickupLocation": "NODE-001",
        "dropoffLocation": "NODE-005",
        "weight": 10
      }
    ],
    "vehicleCapacity": 100,
    "useRelayPoints": true
  }'
```

---

## Monitoring

### 7.1 Railway Dashboard

Chaque service affiche:
- **CPU Usage**: Graphique en temps réel
- **Memory Usage**: Utilisation RAM
- **Network**: Bande passante entrée/sortie
- **Logs**: Stream en direct

### 7.2 Logs

Cliquer sur un service → Onglet **"Logs"**:

```bash
# Filtrer les erreurs
railway logs --filter "ERROR"

# Suivre en temps réel
railway logs --follow
```

### 7.3 Metrics

Railway fournit automatiquement:
- Temps de réponse HTTP
- Nombre de requêtes/minute
- Taux d'erreur 4xx/5xx
- Uptime

### 7.4 Alertes

Configurer dans **Settings** → **Notifications**:
- Email si service down
- Slack webhook pour les déploiements
- Discord pour les erreurs critiques

---

## Troubleshooting

### Problème 1: Service ne démarre pas

**Symptômes**: État "Crashed" ou "Failed"

**Solutions**:
1. Vérifier les logs:
   ```bash
   railway logs
   ```
2. Vérifier les variables d'environnement
3. Vérifier que les bases `delivery_db` et `petri_db` existent
4. Augmenter le Health Check Timeout à 600 secondes

### Problème 2: Erreur de connexion PostgreSQL

**Symptômes**: `Connection refused` ou `Unknown database`

**Solutions**:
1. Vérifier que PostgreSQL est démarré
2. Créer manuellement les bases:
   ```bash
   railway run psql $DATABASE_URL -c "CREATE DATABASE delivery_db;"
   railway run psql $DATABASE_URL -c "CREATE DATABASE petri_db;"
   ```
3. Vérifier les variables `${{Postgres.PGHOST}}` etc.

### Problème 3: Build Maven échoue

**Symptômes**: `BUILD FAILURE` dans les logs

**Solutions**:
1. Vérifier la mémoire disponible (minimum 2GB pour Maven)
2. Dans **Settings** → **Resources**, augmenter la RAM à 2GB
3. Ajouter `-DskipTests` au build Maven (déjà dans Dockerfile)

### Problème 4: 502 Bad Gateway

**Symptômes**: Frontend ne peut pas joindre les APIs

**Solutions**:
1. Vérifier que les APIs sont démarrées (logs)
2. Vérifier les variables `NEXT_PUBLIC_API_URL`
3. Vérifier les CORS dans les APIs Spring Boot
4. Utiliser `https://` et non `http://` pour les URLs

### Problème 5: Dépassement de crédit gratuit

**Symptômes**: Services stoppés, message "Usage limit exceeded"

**Solutions**:
1. Vérifier l'utilisation: **Settings** → **Usage**
2. Optimiser les ressources:
   - Réduire le nombre de replicas à 1
   - Utiliser des images Docker Alpine (déjà fait)
   - Réduire la mémoire JVM
3. Passer au plan Hobby ($5/mois) si nécessaire

### Problème 6: Liquibase migration échoue

**Symptômes**: `Failed to execute migration` dans les logs

**Solutions**:
1. Vérifier que `delivery_db` existe
2. Se connecter à la base et vérifier les tables:
   ```bash
   railway run psql postgresql://user:pass@host:port/delivery_db -c "\dt"
   ```
3. Réinitialiser Liquibase:
   ```sql
   DROP TABLE databasechangelog;
   DROP TABLE databasechangeloglock;
   ```
4. Redéployer le service

---

## Coûts

### Plan Gratuit ($0/mois)

**Inclus**:
- $5 de crédit/mois (~500 heures d'exécution)
- 100 GB bande passante sortante
- PostgreSQL inclus
- Builds illimités
- 1 projet

**Estimation pour TiibnTick**:
- 4 services × 730h/mois = 2920h théoriques
- Avec $5 crédit ≈ **~120h d'exécution/mois** (4h/jour)
- **Parfait pour démo et tests**

### Plan Hobby ($5/mois)

**Inclus**:
- $5 crédit de base + $5 payé = **$10 crédit/mois**
- ≈ **240h d'exécution** (8h/jour)
- Tout du plan gratuit

### Plan Pro ($20/mois)

**Inclus**:
- $20 crédit/mois
- ≈ **1000h d'exécution** (24/7 possible)
- Support prioritaire
- Métriques avancées

### Optimisations pour Rester Gratuit

1. **Sleep Services**: Arrêter les services inutilisés
   ```bash
   railway service:stop petri-api
   ```

2. **Scheduled Deployments**: Utiliser cron pour démarrer/arrêter
   ```bash
   # Démarrer à 8h, arrêter à 18h
   0 8 * * * railway service:start delivery-api
   0 18 * * * railway service:stop delivery-api
   ```

3. **Mono-Database**: Utiliser une seule base PostgreSQL avec 2 schémas au lieu de 2 bases

4. **Frontend sur Vercel**: Déployer le frontend sur Vercel (gratuit) et seulement les APIs sur Railway

---

## Domaine Personnalisé (Optionnel)

### Ajouter un Domaine

1. Acheter un domaine (ex: `tiibntick.com`)
2. Dans Railway, aller sur un service → **Settings** → **Domains**
3. Cliquer **"Add Custom Domain"**
4. Ajouter `api.tiibntick.com`
5. Configurer les DNS:
   ```
   CNAME api.tiibntick.com → xxx.up.railway.app
   CNAME www.tiibntick.com → frontend-xxx.up.railway.app
   ```

Railway génère automatiquement les certificats SSL (Let's Encrypt).

---

## Commandes Railway CLI Utiles

```bash
# Installer CLI
npm i -g @railway/cli

# Se connecter
railway login

# Lier un projet
railway link

# Voir les services
railway status

# Logs en temps réel
railway logs --follow

# Variables d'environnement
railway variables

# Se connecter à PostgreSQL
railway run psql $DATABASE_URL

# Exécuter une commande dans le contexte
railway run node script.js

# Redéployer un service
railway up

# Ouvrir dans le navigateur
railway open
```

---

## Migration depuis Render

Si vous aviez déjà configuré Render:

1. **Exporter les données PostgreSQL Render**:
   ```bash
   pg_dump -h render-host -U user -d delivery_db > delivery_db.sql
   pg_dump -h render-host -U user -d petri_db > petri_db.sql
   ```

2. **Importer dans Railway**:
   ```bash
   railway run psql $DATABASE_URL/delivery_db < delivery_db.sql
   railway run psql $DATABASE_URL/petri_db < petri_db.sql
   ```

3. Redéployer les services sur Railway

---

## Checklist de Déploiement

- [ ] Compte Railway créé et GitHub lié
- [ ] Projet Railway créé: `TiibnTick-Delivery-System`
- [ ] Service PostgreSQL ajouté
- [ ] Bases `delivery_db` et `petri_db` créées
- [ ] API Petri Net déployée avec variables configurées
- [ ] Delivery API déployée avec variables configurées
- [ ] Frontend déployé avec variables configurées
- [ ] Health checks configurés pour chaque service
- [ ] Tests de santé passent (curl /health)
- [ ] Swagger UI accessible
- [ ] Tests fonctionnels passent
- [ ] Logs vérifiés (pas d'erreurs critiques)
- [ ] Monitoring configuré
- [ ] URLs publiques notées

---

## Support

**Railway Documentation**: https://docs.railway.app
**Railway Discord**: https://discord.gg/railway
**Railway Status**: https://status.railway.app

**Communauté TiibnTick**:
- GitHub Issues: https://github.com/Zenbx/Routage-PetriNet-TiibnTick-2/issues

---

## Conclusion

Railway est une excellente alternative gratuite à Render pour déployer TiibnTick. Avec le plan gratuit ($5 crédit/mois), vous pouvez:
- ✅ Tester et démontrer le système
- ✅ Développer et déboguer en production
- ✅ Héberger pour ~4h/jour d'utilisation

Pour une utilisation 24/7, le plan Hobby ($5/mois) ou Pro ($20/mois) est recommandé.

**Temps total de déploiement**: 30-40 minutes

Bon déploiement! 🚀
