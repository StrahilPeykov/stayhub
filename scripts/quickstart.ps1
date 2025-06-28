# Quick start script for StayHub
# This script runs diagnostics and attempts to fix common issues automatically

Write-Host "StayHub Quick Start" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host ""

# First, run diagnostics
Write-Host "Step 1: Running diagnostics..." -ForegroundColor Yellow
& "$PSScriptRoot\diagnose.ps1"

Write-Host ""
Write-Host "Step 2: Checking for port conflicts..." -ForegroundColor Yellow

# Check if any service ports are in use
$ports = @(8081, 8082, 8083, 8084, 3000, 3316, 5432, 6379, 9200, 9092)
$hasConflicts = $false

foreach ($port in $ports) {
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $connect = $tcpClient.BeginConnect("localhost", $port, $null, $null)
        $wait = $connect.AsyncWaitHandle.WaitOne(500, $false)
        
        if ($wait) {
            try {
                $tcpClient.EndConnect($connect)
                $tcpClient.Close()
                $hasConflicts = $true
                break
            }
            catch {
                $tcpClient.Close()
            }
        }
        else {
            $tcpClient.Close()
        }
    }
    catch {
        # Port is free
    }
}

if ($hasConflicts) {
    Write-Host "[!] Found port conflicts. Attempting to fix..." -ForegroundColor Yellow
    & "$PSScriptRoot\fix-port-conflicts.ps1" -Force
    Write-Host ""
}

# Check if Docker is running
Write-Host "Step 3: Checking Docker..." -ForegroundColor Yellow
$dockerRunning = $false
try {
    docker info 2>&1 | Out-Null
    $dockerRunning = $LASTEXITCODE -eq 0
} catch {}

if (-not $dockerRunning) {
    Write-Host "[!] Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    Write-Host "    Waiting for Docker to start..." -ForegroundColor Yellow
    
    # Try to start Docker Desktop
    $dockerDesktopPath = "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerDesktopPath) {
        Start-Process $dockerDesktopPath
        Write-Host "    Docker Desktop starting..." -ForegroundColor Yellow
        
        # Wait up to 60 seconds for Docker to start
        $timeout = 60
        $waited = 0
        while ($waited -lt $timeout -and -not $dockerRunning) {
            Start-Sleep -Seconds 5
            $waited += 5
            Write-Host "    Waiting... ($waited/$timeout seconds)" -ForegroundColor Gray
            
            try {
                docker info 2>&1 | Out-Null
                $dockerRunning = $LASTEXITCODE -eq 0
            } catch {}
        }
    }
    
    if (-not $dockerRunning) {
        Write-Host "[X] Docker failed to start. Please start Docker Desktop manually and try again." -ForegroundColor Red
        exit 1
    }
}

Write-Host "[+] Docker is running!" -ForegroundColor Green
Write-Host ""

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "Step 4: Creating .env file..." -ForegroundColor Yellow
    
    $envContent = @"
# Database Configuration
DB_PASSWORD=1234
POSTGRES_PASSWORD=1234
POSTGRES_USER=postgres
POSTGRES_DB=postgres
MYSQL_ROOT_PASSWORD=1234
MYSQL_PASSWORD=1234
REDIS_PASSWORD=

# Service URLs
PROPERTY_SERVICE_URL=http://localhost:8081
BOOKING_SERVICE_URL=http://localhost:8082
SEARCH_SERVICE_URL=http://localhost:8083
USER_SERVICE_URL=http://localhost:8084

# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# Elasticsearch Configuration
ELASTICSEARCH_HOSTS=http://localhost:9200

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Application Environment
SPRING_PROFILES_ACTIVE=dev
"@
    
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "[+] Created .env file" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 5: Ready to start!" -ForegroundColor Yellow
Write-Host ""

Write-Host "Everything looks good! You can now start StayHub:" -ForegroundColor Green
Write-Host ""
Write-Host "    .\scripts\start-all-windows.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "Or start without building (if already built):" -ForegroundColor White
Write-Host ""
Write-Host "    .\scripts\start-all-windows.ps1 -SkipBuild" -ForegroundColor Cyan
Write-Host ""

# Ask if user wants to start now
$response = Read-Host "Would you like to start StayHub now? (Y/N)"
if ($response -eq "Y" -or $response -eq "y") {
    Write-Host ""
    & "$PSScriptRoot\start-all-windows.ps1"
}