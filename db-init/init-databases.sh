#!/bin/bash
# Script d'initialisation des bases de données delivery_db et petri_db
# Utilisé par le worker Render pour créer les bases avant démarrage des services

set -e

echo "🚀 Initialisation des bases de données TiibnTick..."

# Attendre que PostgreSQL soit prêt
echo "⏳ Attente de la disponibilité de PostgreSQL..."
until PGPASSWORD=$PGPASSWORD psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -c '\q' 2>/dev/null; do
  echo "PostgreSQL n'est pas encore prêt - attente 2s..."
  sleep 2
done

echo "✅ PostgreSQL est prêt!"

# Créer delivery_db si elle n'existe pas
echo "📦 Création de delivery_db..."
PGPASSWORD=$PGPASSWORD psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres <<-EOSQL
  SELECT 'CREATE DATABASE delivery_db'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'delivery_db')\gexec
EOSQL

echo "✅ delivery_db créée ou déjà existante"

# Créer petri_db si elle n'existe pas
echo "🕸️  Création de petri_db..."
PGPASSWORD=$PGPASSWORD psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres <<-EOSQL
  SELECT 'CREATE DATABASE petri_db'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'petri_db')\gexec
EOSQL

echo "✅ petri_db créée ou déjà existante"

# Vérifier les bases créées
echo "🔍 Vérification des bases de données..."
PGPASSWORD=$PGPASSWORD psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -c "\l" | grep -E 'delivery_db|petri_db'

echo "🎉 Initialisation terminée avec succès!"
echo "📊 Bases de données créées:"
echo "   - delivery_db (pour delivery-optimization-api)"
echo "   - petri_db (pour API-PETRI-NET)"
