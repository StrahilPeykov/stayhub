# PowerShell script to start StayHub Platform on Windows
# Usage: .\scripts\start-all-windows.ps1

param(
    [switch]$SkipBuild,
    [switch]$SkipInfrastructure,
    [switch]$Verbose
)

# Set console encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Configuration - Updated to handle Java services only
$JavaServices = @(
    @{ Name = "property-service"; Port = 8081; Path = "services/property-service" },
    @{ Name = "booking-service"; Port = 8082; Path = "services/booking-service" },
    @{ Name = "search-service"; Port = 8083; Path = "services/search-service" },
    @{ Name = "user-service"; Port = 8084; Path = "services/user-service" }
)

# Analytics Engine (Perl) will be handled separately
$AnalyticsEngine = @{ Name = "analytics-engine"; Port = 3000; Path = "services/analytics-engine" }

$InfraPorts = @(5432, 6379, 9200, 9092, 2181, 3316, 3307)  # Changed MySQL from 3306 to 3316
$ServicePorts = @(8081, 8082, 8083, 8084, 3000)
$AllPorts = $InfraPorts + $ServicePorts

# Global variables for process tracking
$ServiceProcesses = @{}

function Write-ColorOutput {
    param(
        [Parameter(Mandatory = $true)][string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Status  { param([string]$Message) Write-ColorOutput "[*] $Message" "Cyan"   }
function Write-Success { param([string]$Message) Write-ColorOutput "[+] $Message" "Green"  }
function Write-Warning { param([string]$Message) Write-ColorOutput "[!] $Message" "Yellow" }
function Write-Error   { param([string]$Message) Write-ColorOutput "[X] $Message" "Red"    }

function Test-Port {
    param([int]$Port)
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $connect = $tcpClient.BeginConnect("localhost", $Port, $null, $null)
        $wait = $connect.AsyncWaitHandle.WaitOne(1000, $false)
        
        if ($wait) {
            try {
                $tcpClient.EndConnect($connect)
                $tcpClient.Close()
                return $true
            }
            catch {
                return $false
            }
        }
        else {
            $tcpClient.Close()
            return $false
        }
    }
    catch {
        return $false
    }
}

function Find-ProcessUsingPort {
    param([int]$Port)
    try {
        $netstat = netstat -ano | Select-String ":$Port\s" | Select-String "LISTENING"
        if ($netstat) {
            $parts = $netstat -split '\s+'
            $processId = $parts[-1]
            if ($processId -match '^\d+$') {
                $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                if ($process) {
                    return @{
                        ProcessName = $process.ProcessName
                        PID = $processId
                    }
                }
            }
        }
    }
    catch {
        # Ignore errors
    }
    return $null
}

function Wait-ForPort {
    param([int]$Port, [string]$ServiceName, [int]$TimeoutSeconds = 60)
    
    Write-Status "Waiting for $ServiceName on port $Port..."
    $timeout = (Get-Date).AddSeconds($TimeoutSeconds)
    
    do {
        if (Test-Port -Port $Port) {
            Write-Success "$ServiceName is ready on port $Port"
            return $true
        }
        Start-Sleep -Seconds 2
        Write-Host "." -NoNewline
    } while ((Get-Date) -lt $timeout)
    
    Write-Host ""
    Write-Error "$ServiceName failed to start on port $Port within $TimeoutSeconds seconds"
    return $false
}

function Test-Prerequisites {
    Write-Status "Checking prerequisites..."
    
    $prerequisites = @(
        @{ Command = "java"; Args = "-version"; Name = "Java 17+" },
        @{ Command = "mvn"; Args = "--version"; Name = "Maven" },
        @{ Command = "docker"; Args = "--version"; Name = "Docker" },
        @{ Command = "docker-compose"; Args = "--version"; Name = "Docker Compose" }
    )
    
    $allGood = $true
    foreach ($prereq in $prerequisites) {
        try {
            $result = & $prereq.Command $prereq.Args 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Success "$($prereq.Name) is available"
                if ($Verbose) {
                    Write-Host "  $($result | Select-Object -First 1)" -ForegroundColor Gray
                }
            } else {
                throw "Command failed"
            }
        }
        catch {
            Write-Error "$($prereq.Name) is not available or not working"
            $allGood = $false
        }
    }
    
    # Check Perl separately (optional for analytics)
    try {
        $result = & perl -v 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Perl is available (for analytics engine)"
        }
    }
    catch {
        Write-Warning "Perl is not available - Analytics Engine will not be started"
        Write-Warning "Install Strawberry Perl from https://strawberryperl.com/ to enable analytics"
    }
    
    return $allGood
}

function Test-PortsAvailable {
    Write-Status "Checking if required ports are available..."
    
    $busyPorts = @()
    $portDetails = @{}
    
    foreach ($port in $AllPorts) {
        if (Test-Port -Port $port) {
            $busyPorts += $port
            $processInfo = Find-ProcessUsingPort -Port $port
            if ($processInfo) {
                $portDetails[$port] = "$($processInfo.ProcessName) (PID: $($processInfo.PID))"
            }
        }
    }
    
    if ($busyPorts.Count -gt 0) {
        Write-Error "The following ports are already in use:"
        foreach ($port in $busyPorts) {
            $detail = if ($portDetails[$port]) { " - Used by: $($portDetails[$port])" } else { "" }
            Write-Host "  Port $port$detail" -ForegroundColor Red
        }
        Write-Warning "Please stop any services using these ports or use different ports"
        return $false
    }
    
    Write-Success "All required ports are available"
    return $true
}

function Initialize-Databases {
    Write-Status "Initializing databases..."
    
    try {
        # Wait a bit for PostgreSQL to be fully ready
        Start-Sleep -Seconds 5
        
        # Find the correct container name
        $postgresContainer = docker ps --filter "name=postgres" --format "{{.Names}}" | Select-Object -First 1
        if (-not $postgresContainer) {
            Write-Error "PostgreSQL container not found"
            return $false
        }
        
        Write-Status "Using PostgreSQL container: $postgresContainer"
        
        # Create databases using docker exec
        $databases = @("stayhub_properties", "stayhub_bookings", "stayhub_users", "stayhub_search")
        
        foreach ($db in $databases) {
            Write-Status "Creating database: $db"
            $result = docker exec $postgresContainer psql -U postgres -c "CREATE DATABASE $db;" 2>&1
            if ($LASTEXITCODE -ne 0 -and $result -notlike "*already exists*") {
                Write-Warning "Could not create database $db : $result"
            } else {
                Write-Success "Database $db ready"
            }
        }
        
        # Enable UUID extension on each database
        foreach ($db in $databases) {
            docker exec $postgresContainer psql -U postgres -d $db -c "CREATE EXTENSION IF NOT EXISTS ""uuid-ossp"";" 2>&1 | Out-Null
        }
        
        Write-Success "PostgreSQL databases initialized"
        
        # Create MySQL databases
        Write-Status "Creating MySQL databases..."
        Start-Sleep -Seconds 5
        
        # Find MySQL container
        $mysqlContainer = docker ps --filter "name=mysql" --format "{{.Names}}" | Where-Object { $_ -notlike "*analytics*" } | Select-Object -First 1
        if ($mysqlContainer) {
            docker exec $mysqlContainer mysql -u root -p1234 -e "CREATE DATABASE IF NOT EXISTS stayhub_reporting;" 2>&1 | Out-Null
            Write-Success "MySQL reporting database initialized"
        }
        
        # For analytics MySQL (if it exists)
        $analyticsContainer = docker ps --filter "name=mysql-analytics" --format "{{.Names}}" | Select-Object -First 1
        if ($analyticsContainer) {
            docker exec $analyticsContainer mysql -u root -p1234 -e "CREATE DATABASE IF NOT EXISTS stayhub_analytics;" 2>&1 | Out-Null
            Write-Success "MySQL analytics database initialized"
        }
        
        return $true
    }
    catch {
        Write-Error "Error initializing databases: $_"
        return $false
    }
}

function Start-Infrastructure {
    if ($SkipInfrastructure) {
        Write-Warning "Skipping infrastructure startup (--SkipInfrastructure flag)"
        return $true
    }
    
    Write-Status "Starting infrastructure services..."
    
    # Look for docker-compose file in the correct location
    $dockerComposeFile = Join-Path $PSScriptRoot "..\infrastructure\docker\docker-compose.dev.yml"
    $dockerComposeFile = [System.IO.Path]::GetFullPath($dockerComposeFile)
    
    if (-not (Test-Path $dockerComposeFile)) {
        Write-Error "Docker compose file not found: $dockerComposeFile"
        return $false
    }
    
    Write-Status "Using docker-compose file: $dockerComposeFile"
    
    try {
        # Change to the directory containing docker-compose file
        $dockerDir = Split-Path $dockerComposeFile -Parent
        Push-Location $dockerDir
        
        # Start infrastructure
        $result = docker-compose -f "docker-compose.dev.yml" up -d 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to start infrastructure services"
            Write-Host $result
            Pop-Location
            return $false
        }
        
        Pop-Location
        
        Write-Success "Infrastructure services started"
        
        # Wait for each infrastructure service
        $infraServices = @(
            @{ Port = 5432; Name = "PostgreSQL" },
            @{ Port = 6379; Name = "Redis" },
            @{ Port = 9200; Name = "Elasticsearch" },
            @{ Port = 9092; Name = "Kafka" },
            @{ Port = 3316; Name = "MySQL Reporting" }  # Changed from 3306 to 3316
        )
        
        # MySQL Analytics is optional
        if ((docker ps --filter "name=mysql-analytics" --format "{{.Names}}").Count -gt 0) {
            $infraServices += @{ Port = 3307; Name = "MySQL Analytics" }
        }
        
        foreach ($service in $infraServices) {
            if (-not (Wait-ForPort -Port $service.Port -ServiceName $service.Name -TimeoutSeconds 120)) {
                if ($service.Name -eq "MySQL Analytics") {
                    Write-Warning "MySQL Analytics failed to start - continuing without it"
                    continue
                } else {
                    return $false
                }
            }
        }
        
        # Initialize databases
        Initialize-Databases
        
        return $true
    }
    catch {
        Write-Error "Error starting infrastructure: $_"
        return $false
    }
}

function Build-Services {
    if ($SkipBuild) {
        Write-Warning "Skipping build (--SkipBuild flag)"
        return $true
    }
    
    Write-Status "Building all Java services..."
    
    try {
        $buildArgs = if ($Verbose) { "clean", "install", "-DskipTests" } else { "clean", "install", "-DskipTests", "-q" }
        $result = & mvn $buildArgs 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Maven build failed"
            Write-Host $result
            return $false
        }
        
        Write-Success "All Java services built successfully"
        return $true
    }
    catch {
        Write-Error "Error during build: $_"
        return $false
    }
}

function Start-JavaService {
    param([hashtable]$Service)
    
    Write-Status "Starting $($Service.Name)..."
    
    $originalLocation = Get-Location
    try {
        Set-Location $Service.Path
        
        # Set environment variables
        $env:SERVER_PORT = $Service.Port
        $env:DB_PASSWORD = "1234"
        
        # Start the service in a new process
        $processArgs = @{
            FilePath = "mvn"
            ArgumentList = "spring-boot:run", "-Dspring-boot.run.jvmArguments=`"-Xms256m -Xmx512m`""
            WindowStyle = "Hidden"
            PassThru = $true
        }
        
        $process = Start-Process @processArgs
        $ServiceProcesses[$Service.Name] = $process
        
        # Wait a moment for the process to start
        Start-Sleep -Seconds 3
        
        # Check if process is still running
        try {
            $process.Refresh()
            if ($process.HasExited) {
                Write-Error "$($Service.Name) failed to start (process exited immediately)"
                return $false
            }
        }
        catch {
            Write-Warning "Could not verify process status for $($Service.Name)"
        }
        
        # Wait for the service to be ready
        if (Wait-ForPort -Port $Service.Port -ServiceName $Service.Name -TimeoutSeconds 180) {
            Write-Success "$($Service.Name) started successfully on port $($Service.Port)"
            return $true
        } else {
            # Kill the process if it's not responding
            try {
                if (-not $process.HasExited) {
                    $process.Kill()
                }
            }
            catch {
                Write-Warning "Could not kill process for $($Service.Name)"
            }
            return $false
        }
    }
    finally {
        Set-Location $originalLocation
    }
}

function Start-AnalyticsEngine {
    # Check if Perl is available
    try {
        $perlVersion = perl -v 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Perl not available"
        }
    }
    catch {
        Write-Warning "Perl is not installed - skipping Analytics Engine"
        Write-Warning "Install Strawberry Perl to enable analytics: https://strawberryperl.com/"
        return $true # Return true to not fail the entire startup
    }
    
    Write-Status "Starting Analytics Engine (Perl)..."
    
    $originalLocation = Get-Location
    try {
        Set-Location $AnalyticsEngine.Path
        
        # Check if app.pl exists
        if (-not (Test-Path "app.pl")) {
            Write-Error "app.pl not found in analytics-engine directory"
            return $false
        }
        
        # Install CPAN dependencies if needed
        if (Test-Path "cpanfile") {
            Write-Status "Installing Perl dependencies..."
            $cpanmResult = cpanm --installdeps . 2>&1
            if ($LASTEXITCODE -ne 0) {
                Write-Warning "Failed to install some Perl dependencies - analytics may not work fully"
            }
        }
        
        # Start the Perl application
        $processArgs = @{
            FilePath = "perl"
            ArgumentList = "app.pl", "daemon", "-m", "production", "-l", "http://*:3000"
            WindowStyle = "Hidden"
            PassThru = $true
        }
        
        $process = Start-Process @processArgs
        $ServiceProcesses["analytics-engine"] = $process
        
        # Wait for the service to be ready
        if (Wait-ForPort -Port 3000 -ServiceName "Analytics Engine" -TimeoutSeconds 60) {
            Write-Success "Analytics Engine started successfully on port 3000"
            return $true
        } else {
            Write-Error "Analytics Engine failed to start"
            return $false
        }
    }
    catch {
        Write-Error "Error starting Analytics Engine: $_"
        return $false
    }
    finally {
        Set-Location $originalLocation
    }
}

function Start-AllServices {
    Write-Status "Starting all microservices..."
    
    # Create logs directory if it doesn't exist
    $logsDir = "logs"
    if (-not (Test-Path $logsDir)) {
        New-Item -ItemType Directory -Path $logsDir | Out-Null
    }
    
    # Start Java services
    foreach ($service in $JavaServices) {
        if (-not (Start-JavaService -Service $service)) {
            Write-Error "Failed to start $($service.Name)"
            return $false
        }
        
        # Brief pause between service starts
        Start-Sleep -Seconds 5
    }
    
    # Try to start Analytics Engine (optional)
    Start-AnalyticsEngine | Out-Null
    
    return $true
}

function Save-ProcessIds {
    Write-Status "Saving process IDs for cleanup..."
    
    # Create .pids directory if it doesn't exist
    if (-not (Test-Path ".pids")) {
        New-Item -ItemType Directory -Path ".pids" | Out-Null
    }
    
    foreach ($serviceName in $ServiceProcesses.Keys) {
        $process = $ServiceProcesses[$serviceName]
        if ($process -and -not $process.HasExited) {
            try {
                $process.Id | Out-File -FilePath ".pids/$serviceName.pid" -Encoding UTF8
            }
            catch {
                Write-Warning "Could not save PID for $serviceName"
            }
        }
    }
}

function Show-Summary {
    Write-Host ""
    Write-Success "StayHub Platform is running!"
    Write-Host ("=" * 50) -ForegroundColor Cyan
    
    Write-Host ""
    Write-ColorOutput "Microservices:" "Yellow"
    foreach ($service in $JavaServices) {
        $serviceName = $service.Name.ToString().PadRight(20)
        Write-Host "  - $serviceName http://localhost:$($service.Port)" -ForegroundColor White
    }
    
    # Check if analytics is running
    if (Test-Port -Port 3000) {
        Write-Host "  - analytics-engine      http://localhost:3000" -ForegroundColor White
    }
    
    Write-Host ""
    Write-ColorOutput "Databases:" "Yellow"
    Write-Host "  - PostgreSQL (Primary):   localhost:5432" -ForegroundColor White
    Write-Host "  - MySQL Reporting:        localhost:3316" -ForegroundColor White  # Changed from 3306
    if (Test-Port -Port 3307) {
        Write-Host "  - MySQL Analytics:        localhost:3307" -ForegroundColor White
    }
    Write-Host "  - Redis (Cache):          localhost:6379" -ForegroundColor White
    
    Write-Host ""
    Write-ColorOutput "Infrastructure:" "Yellow"
    Write-Host "  - Elasticsearch:          http://localhost:9200" -ForegroundColor White
    Write-Host "  - Kafka:                  localhost:9092" -ForegroundColor White
    Write-Host "  - Zookeeper:              localhost:2181" -ForegroundColor White
    
    Write-Host ""
    Write-ColorOutput "API Documentation:" "Yellow"
    Write-Host "  - Property Service:       http://localhost:8081/swagger-ui.html" -ForegroundColor White
    Write-Host "  - Booking Service:        http://localhost:8082/swagger-ui.html" -ForegroundColor White
    Write-Host "  - Search Service:         http://localhost:8083/api/search/health" -ForegroundColor White
    Write-Host "  - User Service:           http://localhost:8084/actuator/health" -ForegroundColor White
    
    Write-Host ""
    Write-ColorOutput "Health Checks:" "Yellow"
    foreach ($service in $JavaServices) {
        $serviceName = $service.Name.ToString().PadRight(20)
        Write-Host "  - $serviceName http://localhost:$($service.Port)/actuator/health" -ForegroundColor White
    }
    
    Write-Host ""
    Write-ColorOutput "To stop all services:" "Yellow"
    Write-Host "    .\scripts\stop-all-windows.ps1" -ForegroundColor White
    Write-Host ""
}

function Cleanup {
    Write-Warning "Cleaning up processes due to error..."
    
    foreach ($serviceName in $ServiceProcesses.Keys) {
        $process = $ServiceProcesses[$serviceName]
        if ($process) {
            try {
                $process.Refresh()
                if (-not $process.HasExited) {
                    $process.Kill()
                    $process.WaitForExit(5000)
                    Write-Host "Stopped $serviceName (PID: $($process.Id))"
                }
            }
            catch {
                Write-Warning "Could not kill process for $serviceName : $_"
            }
        }
    }
}

# Main execution
try {
    Write-ColorOutput "Starting StayHub Platform..." "Cyan"
    Write-Host ("=" * 50) -ForegroundColor Cyan
    Write-Host ""
    
    # Check prerequisites
    if (-not (Test-Prerequisites)) {
        Write-Error "Prerequisites check failed. Please install missing components."
        exit 1
    }
    
    # Check ports
    if (-not (Test-PortsAvailable)) {
        Write-Error "Port availability check failed."
        exit 1
    }
    
    # Start infrastructure
    if (-not (Start-Infrastructure)) {
        Write-Error "Infrastructure startup failed."
        exit 1
    }
    
    # Build services
    if (-not (Build-Services)) {
        Write-Error "Service build failed."
        Cleanup
        exit 1
    }
    
    # Start services
    if (-not (Start-AllServices)) {
        Write-Error "Service startup failed."
        Cleanup
        exit 1
    }
    
    # Save process IDs
    Save-ProcessIds
    
    # Show summary
    Show-Summary
    
    Write-ColorOutput "All services are running successfully!" "Green"
    Write-Host "Press Ctrl+C to stop or run .\scripts\stop-all-windows.ps1" -ForegroundColor Gray
    
    # Keep script running
    try {
        while ($true) {
            Start-Sleep -Seconds 30
        }
    }
    catch [System.Management.Automation.PipelineStoppedException] {
        Write-Host ""
        Write-Warning "Received interrupt signal. Stopping services..."
    }
}
catch {
    Write-Error "Unexpected error: $_"
    Write-Host "Error details: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Gray
    Cleanup
    exit 1
}
finally {
    Write-Host ""
    Write-Status "Stopping all services..."
    Cleanup
    Write-Success "All services stopped."
}