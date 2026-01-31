# Script PowerShell pour créer delivery_db et petri_db sur Railway
# Usage: Remplacer les valeurs PGHOST, PGPORT, etc. par celles de Railway

param(
    [Parameter(Mandatory=$true)]
    [string]$PGHOST,

    [Parameter(Mandatory=$true)]
    [string]$PGPORT,

    [Parameter(Mandatory=$true)]
    [string]$PGUSER,

    [Parameter(Mandatory=$true)]
    [string]$PGPASSWORD
)

Write-Host "🚀 Création des bases de données TiibnTick sur Railway..." -ForegroundColor Cyan

# Vérifier si psql est installé
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-Host "❌ psql n'est pas installé. Téléchargez PostgreSQL depuis:" -ForegroundColor Red
    Write-Host "   https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

# Configurer la variable d'environnement
$env:PGPASSWORD = $PGPASSWORD

Write-Host "📦 Création de delivery_db..." -ForegroundColor Yellow

# Créer delivery_db
$createDeliveryDb = @"
SELECT 'CREATE DATABASE delivery_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'delivery_db')\gexec
"@

psql -h $PGHOST -p $PGPORT -U $PGUSER -d postgres -c $createDeliveryDb

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ delivery_db créée avec succès" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors de la création de delivery_db" -ForegroundColor Red
    exit 1
}

Write-Host "🕸️  Création de petri_db..." -ForegroundColor Yellow

# Créer petri_db
$createPetriDb = @"
SELECT 'CREATE DATABASE petri_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'petri_db')\gexec
"@

psql -h $PGHOST -p $PGPORT -U $PGUSER -d postgres -c $createPetriDb

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ petri_db créée avec succès" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors de la création de petri_db" -ForegroundColor Red
    exit 1
}

# Vérifier
Write-Host "`n🔍 Vérification des bases créées:" -ForegroundColor Cyan
psql -h $PGHOST -p $PGPORT -U $PGUSER -d postgres -c "\l" | Select-String -Pattern "delivery_db|petri_db"

Write-Host "`n🎉 Initialisation terminée avec succès!" -ForegroundColor Green
Write-Host "📊 Bases de données créées:" -ForegroundColor Cyan
Write-Host "   - delivery_db (pour delivery-optimization-api)" -ForegroundColor White
Write-Host "   - petri_db (pour API-PETRI-NET)" -ForegroundColor White

# Nettoyer
Remove-Item Env:\PGPASSWORD
