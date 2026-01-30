@echo off
echo ========================================
echo     TiibnTick - Systeme de Demarrage
echo ========================================
echo.

REM Couleurs pour Windows Terminal
set GREEN=[92m
set RED=[91m
set YELLOW=[93m
set RESET=[0m

echo %YELLOW%[1/4] Verification PostgreSQL...%RESET%
pg_isready -U postgres -h localhost -p 5432 >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%PostgreSQL n'est pas demarre!%RESET%
    echo.
    echo Options:
    echo 1. Demarrer PostgreSQL service: net start postgresql-x64-15
    echo 2. Ou avec Docker: docker run -d --name tiibntick-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:15
    echo.
    pause
    exit /b 1
)
echo %GREEN%PostgreSQL: OK%RESET%

echo.
echo %YELLOW%[2/4] Demarrage API-PETRI-NET (port 8081)...%RESET%
cd /d "%~dp0API-PETRI-NET"
start "API-PETRI-NET" cmd /k "mvnw.cmd spring-boot:run"
timeout /t 10 >nul

echo.
echo %YELLOW%[3/4] Demarrage delivery-optimization-api (port 8080)...%RESET%
cd /d "%~dp0delivery-optimization-api"
start "delivery-optimization-api" cmd /k "mvnw.cmd spring-boot:run"
timeout /t 15 >nul

echo.
echo %YELLOW%[4/4] Demarrage Frontend (port 3000)...%RESET%
cd /d "%~dp0delivery-optimization-frontend"
start "Frontend" cmd /k "npm run dev"

echo.
echo %GREEN%========================================%RESET%
echo %GREEN%   TiibnTick demarre avec succes!%RESET%
echo %GREEN%========================================%RESET%
echo.
echo URLs:
echo - Frontend:    http://localhost:3000
echo - API Delivery: http://localhost:8080
echo - API Petri:   http://localhost:8081
echo.
echo Ouvrez votre navigateur a: http://localhost:3000
echo.
echo Pour arreter: Fermez les fenetres de commande ou Ctrl+C
echo.
pause
