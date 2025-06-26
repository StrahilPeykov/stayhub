# PowerShell script to start StayHub Platform on Windows
# Usage: .\start-all-windows.ps1

param(
    [switch]$SkipBuild,
    [switch]$SkipInfrastructure,
    [switch]$Verbose
)

# Colors for output
$Green = "Green"
$Yellow = "Yellow" 
$Red = "Red"
$Cyan = "Cyan"

# Configuration
$Services = @(
    @{ Name = "property-service"; Port = 8081; Path = "services/property-service" },
    @{ Name = "booking-service"; Port = 8082; Path = "services/booking-service" },
    @{ Name = "search-service"; Port = 8083; Path = "services/search-service" },
    @{ Name = "user-service"; Port = 8084; Path = "services/user-service" }
)

$InfraPorts = @(5432, 6379, 9200, 9092, 2181)
$ServicePorts = @(8081, 8082, 8083, 8084)
$AllPorts = $InfraPorts + $ServicePorts

# Global variables for process tracking
$ServiceProcesses = @{}

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Write-Status {
    param([string]$Message)
    Write-ColorOutput "🔄 $Message" $Cyan
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✅ $Message" $Green
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠️  $Message" $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "❌ $Message" $Red
}

function Test-Port {
    param([int]$Port)
    try {
        $connection = Test-NetConnection -ComputerName "localhost" -Port $Port -WarningAction SilentlyContinue
        return $connection.TcpTestSucceeded
    }
    catch {
        return $false
    }
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
    
    return $allGood
}

function Test-PortsAvailable {
    Write-Status "Checking if required ports are available..."
    
    $busyPorts = @()
    foreach ($port in $AllPorts) {
        if (Test-Port -Port $port) {
            $busyPorts += $port
        }
    }
    
    if ($busyPorts.Count -gt 0) {
        Write-Error "The following ports are already in use: $($busyPorts -join ', ')"
        Write-Warning "Please stop any services using these ports or use different ports"
        return $false
    }
    
    Write-Success "All required ports are available"
    return $true
}

function Start-Infrastructure {
    if ($SkipInfrastructure) {
        Write-Warning "Skipping infrastructure startup (--SkipInfrastructure flag)"
        return $true
    }
    
    Write-Status "Starting infrastructure services..."
    
    # Check if docker-compose file exists
    $dockerComposeFile = "infrastructure/docker/docker-compose.dev.yml"
    if (-not (Test-Path $dockerComposeFile)) {
        Write-Error "Docker compose file not found: $dockerComposeFile"
        return $false
    }
    
    try {
        # Start infrastructure
        $result = docker-compose -f $dockerComposeFile up -d 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to start infrastructure services"
            Write-Host $result
            return $false
        }
        
        Write-Success "Infrastructure services started"
        
        # Wait for each infrastructure service
        $infraServices = @(
            @{ Port = 5432; Name = "PostgreSQL" },
            @{ Port = 6379; Name = "Redis" },
            @{ Port = 9200; Name = "Elasticsearch" },
            @{ Port = 9092; Name = "Kafka" }
        )
        
        foreach ($service in $infraServices) {
            if (-not (Wait-ForPort -Port $service.Port -ServiceName $service.Name -TimeoutSeconds 90)) {
                return $false
            }
        }
        
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
    
    Write-Status "Building all services..."
    
    try {
        $buildArgs = if ($Verbose) { "clean", "install" } else { "clean", "install", "-q" }
        $result = & mvn $buildArgs 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Maven build failed"
            Write-Host $result
            return $false
        }
        
        Write-Success "All services built successfully"
        return $true
    }
    catch {
        Write-Error "Error during build: $_"
        return $false
    }
}

function Start-Service {
    param([hashtable]$Service)
    
    Write-Status "Starting $($Service.Name)..."
    
    # Change to service directory
    $originalLocation = Get-Location
    try {
        Set-Location $Service.Path
        
        # Start the service in a new process
        $processArgs = @{
            FilePath = "mvn"
            ArgumentList = "spring-boot:run"
            WindowStyle = "Hidden"
            PassThru = $true
        }
        
        $process = Start-Process @processArgs
        $ServiceProcesses[$Service.Name] = $process
        
        # Wait a moment for the process to start
        Start-Sleep -Seconds 3
        
        # Check if process is still running
        if ($process.HasExited) {
            Write-Error "$($Service.Name) failed to start (process exited immediately)"
            return $false
        }
        
        # Wait for the service to be ready
        if (Wait-ForPort -Port $Service.Port -ServiceName $Service.Name -TimeoutSeconds 120) {
            Write-Success "$($Service.Name) started successfully on port $($Service.Port)"
            return $true
        } else {
            # Kill the process if it's not responding
            if (-not $process.HasExited) {
                $process.Kill()
            }
            return $false
        }
    }
    finally {
        Set-Location $originalLocation
    }
}

function Start-AllServices {
    Write-Status "Starting all microservices..."
    
    foreach ($service in $Services) {
        if (-not (Start-Service -Service $service)) {
            Write-Error "Failed to start $($service.Name)"
            return $false
        }
        
        # Brief pause between service starts
        Start-Sleep -Seconds 5
    }
    
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
            $process.Id | Out-File -FilePath ".pids/$serviceName.pid" -Encoding UTF8
        }
    }
}

function Show-Summary {
    Write-Host ""
    Write-Success "🎉 StayHub Platform is running!"
    Write-Host "=" * 50 -ForegroundColor $Cyan
    
    Write-Host ""
    Write-ColorOutput "📋 Services:" $Yellow
    foreach ($service in $Services) {
        Write-Host "  • $($service.Name.PadRight(20)) http://localhost:$($service.Port)" -ForegroundColor White
    }
    
    Write-Host ""
    Write-ColorOutput "🔧 Infrastructure:" $Yellow
    Write-Host "  • PostgreSQL:        localhost:5432" -ForegroundColor White
    Write-Host "  • Redis:             localhost:6379" -ForegroundColor White  
    Write-Host "  • Elasticsearch:     http://localhost:9200" -ForegroundColor White
    Write-Host "  • Kafka:             localhost:9092" -ForegroundColor White
    
    Write-Host ""
    Write-ColorOutput "📖 API Documentation:" $Yellow
    Write-Host "  • Property Service:  http://localhost:8081/swagger-ui.html" -ForegroundColor White
    Write-Host "  • Booking Service:   http://localhost:8082/swagger-ui.html" -ForegroundColor White
    
    Write-Host ""
    Write-ColorOutput "🔍 Health Checks:" $Yellow
    foreach ($service in $Services) {
        Write-Host "  • $($service.Name.PadRight(20)) http://localhost:$($service.Port)/actuator/health" -ForegroundColor White
    }
    
    Write-Host ""
    Write-ColorOutput "⚠️  To stop all services:" $Yellow
    Write-Host "    .\stop-all-windows.ps1" -ForegroundColor White
    Write-Host ""
}

function Cleanup {
    Write-Warning "Cleaning up processes due to error..."
    
    foreach ($process in $ServiceProcesses.Values) {
        if ($process -and -not $process.HasExited) {
            try {
                $process.Kill()
                $process.WaitForExit(5000)
            }
            catch {
                Write-Warning "Could not kill process $($process.Id)"
            }
        }
    }
}

# Main execution
try {
    Write-ColorOutput "🚀 Starting StayHub Platform..." $Cyan
    Write-Host "=" * 50 -ForegroundColor $Cyan
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
    
    Write-ColorOutput "✨ All services are running successfully!" $Green
    Write-Host "Press Ctrl+C to stop or run .\stop-all-windows.ps1" -ForegroundColor Gray
    
    # Keep script running
    try {
        while ($true) {
            Start-Sleep -Seconds 30
            
            # Check if any services have died
            $deadServices = @()
            foreach ($serviceName in $ServiceProcesses.Keys) {
                $process = $ServiceProcesses[$serviceName]
                if ($process.HasExited) {
                    $deadServices += $serviceName
                }
            }
            
            if ($deadServices.Count -gt 0) {
                Write-Warning "The following services have stopped: $($deadServices -join ', ')"
                break
            }
        }
    }
    catch {
        Write-Host ""
        Write-Warning "Received interrupt signal. Stopping services..."
    }
}
catch {
    Write-Error "Unexpected error: $_"
    Cleanup
    exit 1
}
finally {
    # This will run when Ctrl+C is pressed or script exits
    Write-Host ""
    Write-Status "Stopping all services..."
    Cleanup
    Write-Success "All services stopped."
}