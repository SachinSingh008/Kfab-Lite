@echo off
echo ========================================================
echo   Starting KFAB360 ERP + Invoicing Suite with Docker
echo ========================================================
echo   Services will be available at:
echo   1. ERP Web App:         http://localhost:3000
echo   2. Invoicing Frontend:   http://localhost:5173
echo   3. Invoicing API:        http://localhost:8000
echo   4. PostgreSQL Database:  localhost:5432
echo ========================================================
docker compose up --build

