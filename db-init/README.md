# Database Initialization Worker

Ce dossier contient le worker d'initialisation automatique des bases de données pour le déploiement Render.

## Fonctionnement

Lors du déploiement sur Render.com, ce worker s'exécute **une seule fois** pour créer automatiquement :
- `delivery_db` - Base de données pour delivery-optimization-api
- `petri_db` - Base de données pour API-PETRI-NET

## Fichiers

### `Dockerfile`
Image Docker basée sur PostgreSQL 15 Alpine avec :
- Client PostgreSQL (psql)
- Bash pour exécuter le script
- Script d'initialisation copié

### `init-databases.sh`
Script bash qui :
1. Attend que PostgreSQL soit disponible
2. Crée `delivery_db` si elle n'existe pas
3. Crée `petri_db` si elle n'existe pas
4. Vérifie la création avec `\l`

## Variables d'Environnement

Fournies automatiquement par Render depuis la ressource `tiibntick-postgres` :
- `PGHOST` - Hôte PostgreSQL
- `PGPORT` - Port PostgreSQL (5432)
- `PGUSER` - Utilisateur (tiibntick_user)
- `PGPASSWORD` - Mot de passe

## Ordre de Déploiement Render

1. **Database** : `tiibntick-postgres` créée en premier
2. **Worker** : `tiibntick-db-init` s'exécute et crée les bases
3. **Services Web** : Démarrent après (petri-api, delivery-api, frontend)

## Vérification Locale

Pour tester le script localement :

```bash
# Définir les variables d'environnement
export PGHOST=localhost
export PGPORT=5432
export PGUSER=postgres
export PGPASSWORD=postgres

# Exécuter le script
bash init-databases.sh
```

## Build Docker Local

```bash
cd db-init
docker build -t tiibntick-db-init .
docker run --rm \
  -e PGHOST=host.docker.internal \
  -e PGPORT=5432 \
  -e PGUSER=postgres \
  -e PGPASSWORD=postgres \
  tiibntick-db-init
```

## Notes

- Le worker utilise `set -e` pour arrêter en cas d'erreur
- Les bases sont créées seulement si elles n'existent pas (idempotent)
- Après création, le worker se termine (one-time job)
- Les migrations Liquibase s'exécutent ensuite au démarrage de delivery-api
