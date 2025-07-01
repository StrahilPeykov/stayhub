# PowerShell script to diagnose StayHub setup issues
# Usage: .\scripts\diagnose.ps1

Write-Host "StayHub Diagnostics" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host ""

# Check PowerShell version
Write-Host "PowerShell Information:" -ForegroundColor Yellow
Write-Host "  Version: $($PSVersionTable.PSVersion)" -ForegroundColor White
Write-Host "  Edition: $($PSVersionTable.PSEdition)" -ForegroundColor White
Write-Host ""

# Check prerequisites
Write-Host "Checking Prerequisites:" -ForegroundColor Yellow

# Java
try {
    $javaVersion = java -version 2>&1 | Select-String "version"
    Write-Host "[+] Java: $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "[X] Java: Not found or not in PATH" -ForegroundColor Red
}

# Maven
try {
    $mvnVersion = mvn --version | Select-String "Apache Maven"
    Write-Host "[+] Maven: $mvnVersion" -ForegroundColor Green
} catch {
    Write-Host "[X] Maven: Not found or not in PATH" -ForegroundColor Red
}

# Docker
try {
    $dockerVersion = docker --version
    Write-Host "[+] Docker: $dockerVersion" -ForegroundColor Green
    
    # Check if Docker is running
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[+] Docker daemon is running" -ForegroundColor Green
    } else {
        Write-Host "[X] Docker daemon is not running" -ForegroundColor Red
        Write-Host "    Please start Docker Desktop" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[X] Docker: Not found or not in PATH" -ForegroundColor Red
}

# Docker Compose
try {
    $composeVersion = docker-compose --version
    Write-Host "[+] Docker Compose: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "[X] Docker Compose: Not found" -ForegroundColor Red
}

# Perl (optional)
try {
    $perlVersion = perl -v 2>&1 | Select-String "This is perl"
    Write-Host "[+] Perl: $perlVersion" -ForegroundColor Green
} catch {
    Write-Host "[!] Perl: Not found (optional, needed for analytics engine)" -ForegroundColor Yellow
}

Write-Host ""

# Check file structure
Write-Host "Checking Project Structure:" -ForegroundColor Yellow

$requiredPaths = @(
    "pom.xml",
    "services/property-service/pom.xml",
    "services/booking-service/pom.xml",
    "services/search-service/pom.xml",
    "services/user-service/pom.xml",
    "infrastructure/docker/docker-compose.dev.yml",
    ".env"
)

$missingPaths = @()
foreach ($path in $requiredPaths) {
    if (Test-Path $path) {
        Write-Host "[+] Found: $path" -ForegroundColor Green
    } else {
        Write-Host "[X] Missing: $path" -ForegroundColor Red
        $missingPaths += $path
    }
}

if ($missingPaths.Count -gt 0) {
    Write-Host "`n[!] Some required files are missing. Please ensure you're in the StayHub root directory." -ForegroundColor Yellow
}

Write-Host ""

# Check ports
Write-Host "Checking Port Availability:" -ForegroundColor Yellow

$ports = @{
    5432 = "PostgreSQL"
    6379 = "Redis"
    9200 = "Elasticsearch"
    9092 = "Kafka"
    2181 = "Zookeeper"
    3316 = "MySQL (changed from 3306)"
    8081 = "Property Service"
    8082 = "Booking Service"
    8083 = "Search Service"
    8084 = "User Service"
    3000 = "Analytics Engine"
}

$busyPorts = @()
foreach ($port in $ports.Keys) {
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $connect = $tcpClient.BeginConnect("localhost", $port, $null, $null)
        $wait = $connect.AsyncWaitHandle.WaitOne(500, $false)
        
        if ($wait) {
            try {
                $tcpClient.EndConnect($connect)
                $tcpClient.Close()
                Write-Host "[!] Port $port ($($ports[$port])): IN USE" -ForegroundColor Yellow
                $busyPorts += $port
                
                # Try to find what's using it
                $netstat = netstat -ano | Select-String ":$port\s" | Select-String "LISTENING" | Select-Object -First 1
                if ($netstat) {
                    $parts = $netstat -split '\s+'
                    $processId = $parts[-1]
                    if ($processId -match '^\d+$') {
                        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                        if ($process) {
                            Write-Host "    Used by: $($process.ProcessName) (PID: $processId)" -ForegroundColor Gray
                        }
                    }
                }
            }
            catch {
                $tcpClient.Close()
                Write-Host "[+] Port $port ($($ports[$port])): Available" -ForegroundColor Green
            }
        }
        else {
            $tcpClient.Close()
            Write-Host "[+] Port $port ($($ports[$port])): Available" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "[+] Port $port ($($ports[$port])): Available" -ForegroundColor Green
    }
}

if ($busyPorts.Count -gt 0) {
    Write-Host "`n[!] Some ports are in use. Run '.\scripts\fix-port-conflicts.ps1' to resolve." -ForegroundColor Yellow
}

Write-Host ""

# Check Docker containers
Write-Host "Checking Docker Containers:" -ForegroundColor Yellow
try {
    $containers = docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>&1
    if ($LASTEXITCODE -eq 0) {
        if ($containers -match "CONTAINER") {
            Write-Host $containers -ForegroundColor White
        } else {
            Write-Host "[!] No running containers" -ForegroundColor Yellow
        }
    } else {
        Write-Host "[X] Cannot list containers - Docker may not be running" -ForegroundColor Red
    }
} catch {
    Write-Host "[X] Error checking containers" -ForegroundColor Red
}

Write-Host ""

# Check environment variables
Write-Host "Checking Environment:" -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "[+] .env file exists" -ForegroundColor Green
    $envContent = Get-Content ".env" | Where-Object { $_ -match "^[^#].*=" }
    Write-Host "    Found $($envContent.Count) environment variables" -ForegroundColor Gray
} else {
    Write-Host "[X] .env file not found" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "========" -ForegroundColor Cyan

$issues = 0

if ($missingPaths.Count -gt 0) {
    Write-Host "[!] Missing files: Please check project structure" -ForegroundColor Yellow
    $issues++
}

if ($busyPorts.Count -gt 0) {
    Write-Host "[!] Ports in use: Run '.\scripts\fix-port-conflicts.ps1'" -ForegroundColor Yellow
    $issues++
}

$dockerRunning = $false
try {
    docker info 2>&1 | Out-Null
    $dockerRunning = $LASTEXITCODE -eq 0
} catch {}

if (-not $dockerRunning) {
    Write-Host "[!] Docker not running: Please start Docker Desktop" -ForegroundColor Yellow
    $issues++
}

if ($issues -eq 0) {
    Write-Host "[+] Everything looks good! You can run '.\scripts\start-all-windows.ps1'" -ForegroundColor Green
} else {
    Write-Host "[!] Found $issues issue(s) that need to be resolved" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
if ($busyPorts.Count -gt 0) {
    Write-Host "1. Run: .\scripts\fix-port-conflicts.ps1" -ForegroundColor White
}
if (-not $dockerRunning) {
    Write-Host "2. Start Docker Desktop" -ForegroundColor White
}
Write-Host "3. Run: .\scripts\start-all-windows.ps1" -ForegroundColor White