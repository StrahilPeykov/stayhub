# PowerShell script to stop StayHub Platform on Windows
# Usage: .\stop-all-windows.ps1

param(
    [switch]$KeepInfrastructure,
    [switch]$Force
)

# Colors for output
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"

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

function Stop-ServicesByPid {
    Write-Status "Stopping services using saved process IDs..."
    
    $servicesFound = 0
    $servicesStopped = 0
    
    if (Test-Path ".pids") {
        $pidFiles = Get-ChildItem ".pids" -Filter "*.pid"
        
        foreach ($pidFile in $pidFiles) {
            $serviceName = $pidFile.BaseName
            try {
                $pid = Get-Content $pidFile.FullName -ErrorAction Stop
                $process = Get-Process -Id $pid -ErrorAction Stop
                
                $servicesFound++
                Write-Status "Stopping $serviceName (PID: $pid)..."
                
                if ($Force) {
                    $process.Kill()
                } else {
                    $process.CloseMainWindow()
                    if (-not $process.WaitForExit(10000)) {
                        Write-Warning "Force killing $serviceName..."
                        $process.Kill()
                    }
                }
                
                $servicesStopped++
                Write-Success "Stopped $serviceName"
            }
            catch {
                Write-Warning "Could not stop $serviceName (process may have already exited)"
            }
            finally {
                Remove-Item $pidFile.FullName -ErrorAction SilentlyContinue
            }
        }
        
        # Remove .pids directory if empty
        if ((Get-ChildItem ".pids" | Measure-Object).Count -eq 0) {
            Remove-Item ".pids" -ErrorAction SilentlyContinue
        }
    } else {
        Write-Warning "No .pids directory found"
    }
    
    if ($servicesFound -eq 0) {
        Write-Warning "No running services found via PID files"
    } else {
        Write-Success "Stopped $servicesStopped of $servicesFound services"
    }
    
    return $servicesStopped
}

function Stop-ServicesByName {
    Write-Status "Stopping services by process name..."
    
    $servicePatterns = @(
        "java*spring-boot*property-service*",
        "java*spring-boot*booking-service*", 
        "java*spring-boot*search-service*",
        "java*spring-boot*user-service*"
    )
    
    $servicesStopped = 0
    
    foreach ($pattern in $servicePatterns) {
        try {
            $processes = Get-WmiObject Win32_Process | Where-Object { 
                $_.CommandLine -like "*spring-boot:run*" -and 
                $_.CommandLine -like "*stayhub*"
            }
            
            foreach ($process in $processes) {
                $serviceName = "Unknown Service"
                if ($process.CommandLine -like "*property-service*") { $serviceName = "property-service" }
                elseif ($process.CommandLine -like "*booking-service*") { $serviceName = "booking-service" }
                elseif ($process.CommandLine -like "*search-service*") { $serviceName = "search-service" }
                elseif ($process.CommandLine -like "*user-service*") { $serviceName = "user-service" }
                
                Write-Status "Stopping $serviceName (PID: $($process.ProcessId))..."
                
                try {
                    if ($Force) {
                        Stop-Process -Id $process.ProcessId -Force
                    } else {
                        Stop-Process -Id $process.ProcessId
                    }
                    $servicesStopped++
                    Write-Success "Stopped $serviceName"
                }
                catch {
                    Write-Warning "Could not stop $serviceName : $_"
                }
            }
        }
        catch {
            Write-Warning "Error searching for processes: $_"
        }
    }
    
    if ($servicesStopped -eq 0) {
        Write-Warning "No Spring Boot services found running"
    } else {
        Write-Success "Stopped $servicesStopped additional services"
    }
    
    return $servicesStopped
}

function Stop-AllJavaProcesses {
    Write-Status "Stopping all Maven Spring Boot processes..."
    
    try {
        $javaProcesses = Get-Process | Where-Object { 
            $_.ProcessName -eq "java" -and 
            $_.MainWindowTitle -like "*maven*" 
        }
        
        $stopped = 0
        foreach ($process in $javaProcesses) {
            try {
                Write-Status "Stopping Java process (PID: $($process.Id))..."
                if ($Force) {
                    $process.Kill()
                } else {
                    $process.CloseMainWindow()
                    if (-not $process.WaitForExit(5000)) {
                        $process.Kill()
                    }
                }
                $stopped++
            }
            catch {
                Write-Warning "Could not stop Java process $($process.Id): $_"
            }
        }
        
        if ($stopped -gt 0) {
            Write-Success "Stopped $stopped Java processes"
        }
        
        return $stopped
    }
    catch {
        Write-Warning "Error stopping Java processes: $_"
        return 0
    }
}

function Stop-Infrastructure {
    if ($KeepInfrastructure) {
        Write-Warning "Keeping infrastructure running (--KeepInfrastructure flag)"
        return
    }
    
    Write-Status "Stopping infrastructure services..."
    
    $dockerComposeFile = "infrastructure/docker/docker-compose.dev.yml"
    if (-not (Test-Path $dockerComposeFile)) {
        Write-Warning "Docker compose file not found: $dockerComposeFile"
        return
    }
    
    try {
        $result = docker-compose -f $dockerComposeFile down 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Infrastructure services stopped"
        } else {
            Write-Warning "Some issues stopping infrastructure services:"
            Write-Host $result
        }
    }
    catch {
        Write-Error "Error stopping infrastructure: $_"
    }
}

function Test-PortsStillBusy {
    Write-Status "Checking if service ports are now free..."
    
    $ports = @(8081, 8082, 8083, 8084)
    $busyPorts = @()
    
    foreach ($port in $ports) {
        try {
            $connection = Test-NetConnection -ComputerName "localhost" -Port $port -WarningAction SilentlyContinue
            if ($connection.TcpTestSucceeded) {
                $busyPorts += $port
            }
        }
        catch {
            # Port is free
        }
    }
    
    if ($busyPorts.Count -gt 0) {
        Write-Warning "The following service ports are still busy: $($busyPorts -join ', ')"
        Write-Warning "You may need to manually kill processes or restart your computer"
        return $false
    } else {
        Write-Success "All service ports are now free"
        return $true
    }
}

# Main execution
try {
    Write-ColorOutput "🛑 Stopping StayHub Platform..." $Yellow
    Write-Host "=" * 50 -ForegroundColor $Cyan
    Write-Host ""
    
    $totalStopped = 0
    
    # Method 1: Stop by saved PIDs
    $totalStopped += Stop-ServicesByPid
    
    # Method 2: Stop by process names
    $totalStopped += Stop-ServicesByName
    
    # Method 3: Nuclear option - stop all suspicious Java processes
    if ($Force) {
        Write-Warning "Force mode: stopping all Maven Java processes..."
        $totalStopped += Stop-AllJavaProcesses
    }
    
    # Give processes time to shut down
    if ($totalStopped -gt 0) {
        Write-Status "Waiting for processes to shut down..."
        Start-Sleep -Seconds 5
    }
    
    # Stop infrastructure
    Stop-Infrastructure
    
    # Final check
    Test-PortsStillBusy | Out-Null
    
    Write-Host ""
    if ($totalStopped -gt 0) {
        Write-Success "✅ Successfully stopped $totalStopped services"
    } else {
        Write-Warning "⚠️  No services were found running"
    }
    
    if (-not $KeepInfrastructure) {
        Write-Success "✅ Infrastructure services stopped"
    }
    
    Write-ColorOutput "🏁 StayHub Platform shutdown complete!" $Green
}
catch {
    Write-Error "Unexpected error during shutdown: $_"
    exit 1
}