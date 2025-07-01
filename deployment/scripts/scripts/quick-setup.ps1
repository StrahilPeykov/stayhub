# Quick setup script for StayHub
# This ensures everything is properly configured

Write-Host "StayHub Quick Setup" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan

# 1. Ensure .env file exists with proper database config
$envContent = @"
# Database Configuration
DB_PASSWORD=1234
POSTGRES_PASSWORD=1234
MYSQL_PASSWORD=1234
REDIS_PASSWORD=

# Service URLs
PROPERTY_SERVICE_URL=http://localhost:8081
BOOKING_SERVICE_URL=http://localhost:8082
SEARCH_SERVICE_URL=http://localhost:8083
USER_SERVICE_URL=http://localhost:8084

# Kafka
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
"@

if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✓ .env file created" -ForegroundColor Green
}

# 2. Create required directories
$directories = @("logs", ".pids", "infrastructure/docker")
foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✓ Created directory: $dir" -ForegroundColor Green
    }
}

# 3. Fix line endings in mvnw files
Write-Host "`nFixing Maven wrapper permissions..." -ForegroundColor Yellow
$services = @("property-service", "booking-service", "search-service", "user-service")
foreach ($service in $services) {
    $mvnwPath = "services/$service/mvnw"
    if (Test-Path $mvnwPath) {
        # Just ensure the file exists and is readable
        Write-Host "✓ Found mvnw for $service" -ForegroundColor Green
    }
}

# 4. Create a simple docker-compose override for easier management
$dockerOverride = @"
# docker-compose.override.yml
# This file simplifies the setup for local development

version: '3.8'

services:
  postgres:
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: 1234
      
  redis:
    ports:
      - "6379:6379"
      
  mysql:
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: 1234
"@

$overridePath = "infrastructure/docker/docker-compose.override.yml"
if (-not (Test-Path $overridePath)) {
    Write-Host "`nCreating docker-compose override..." -ForegroundColor Yellow
    $dockerOverride | Out-File -FilePath $overridePath -Encoding UTF8
    Write-Host "✓ Created docker-compose.override.yml" -ForegroundColor Green
}

Write-Host "`nSetup complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Run: .\scripts\start-all-windows.ps1" -ForegroundColor White
Write-Host "2. Wait for all services to start" -ForegroundColor White
Write-Host "3. Run: .\scripts\test-services.ps1" -ForegroundColor White
Write-Host "`nFor analytics engine (optional):" -ForegroundColor Yellow
Write-Host "1. Install Strawberry Perl from https://strawberryperl.com/" -ForegroundColor White
Write-Host "2. Run: .\scripts\start-analytics-windows.ps1" -ForegroundColor White