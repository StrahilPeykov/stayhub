# PowerShell script to stop StayHub Platform on Windows
# Usage: .\scripts\stop-all-windows.ps1

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

function Stop-ServicesByPort {
    Write-Status "Stopping services by port..."
    
    $ports = @(8081, 8082, 8083, 8084)
    $servicesStopped = 0
    
    foreach ($port in $ports) {
        try {
            $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
            foreach ($connection in $connections) {
                $processId = $connection.OwningProcess
                if ($processId -and $processId -ne 0) {
                    try {
                        $process = Get-Process -Id $processId -ErrorAction Stop
                        Write-Status "Stopping process on port $port (PID: $processId, Name: $($process.ProcessName))"
                        
                        if ($Force) {
                            $process.Kill()
                        } else {
                            $process.CloseMainWindow()
                            if (-not $process.WaitForExit(5000)) {
                                $process.Kill()
                            }
                        }
                        
                        $servicesStopped++
                        Write-Success "Stopped process on port $port"
                    }
                    catch {
                        Write-Warning "Could not stop process $processId on port $port : $_"
                    }
                }
            }
        }
        catch {
            # Port not in use, which is fine
        }
    }
    
    if ($servicesStopped -eq 0) {
        Write-Warning "No processes found using service ports"
    } else {
        Write-Success "Stopped $servicesStopped processes by port"
    }
    
    return $servicesStopped
}

function Stop-ServicesByName {
    Write-Status "Stopping services by process name..."
    
    $servicesStopped = 0
    
    try {
        # Find Java processes that might be Spring Boot apps
        $javaProcesses = Get-Process -Name "java" -ErrorAction SilentlyContinue
        
        foreach ($process in $javaProcesses) {
            try {
                # Try to get command line to identify Spring Boot processes
                $commandLine = (Get-WmiObject Win32_Process -Filter "ProcessId = $($process.Id)").CommandLine
                
                if ($commandLine -and ($commandLine -like "*spring-boot:run*" -or $commandLine -like "*stayhub*")) {
                    Write-Status "Stopping Java process (PID: $($process.Id))"
                    
                    if ($Force) {
                        $process.Kill()
                    } else {
                        $process.CloseMainWindow()
                        if (-not $process.WaitForExit(5000)) {
                            $process.Kill()
                        }
                    }
                    
                    $servicesStopped++
                    Write-Success "Stopped Java process (PID: $($process.Id))"
                }
            }
            catch {
                Write-Warning "Could not stop Java process $($process.Id): $_"
            }
        }
    }
    catch {
        Write-Warning "Error searching for Java processes: $_"
    }
    
    if ($servicesStopped -eq 0) {
        Write-Warning "No Spring Boot services found running"
    } else {
        Write-Success "Stopped $servicesStopped Java processes"
    }
    
    return $servicesStopped
}

function Stop-AllJavaProcesses {
    Write-Status "Force stopping ALL Java processes..."
    
    try {
        $javaProcesses = Get-Process -Name "java" -ErrorAction SilentlyContinue
        
        $stopped = 0
        foreach ($process in $javaProcesses) {
            try {
                Write-Status "Force stopping Java process (PID: $($process.Id))"
                $process.Kill()
                $stopped++
                Write-Success "Stopped Java process (PID: $($process.Id))"
            }
            catch {
                Write-Warning "Could not stop Java process $($process.Id): $_"
            }
        }
        
        if ($stopped -gt 0) {
            Write-Success "Force stopped $stopped Java processes"
        } else {
            Write-Warning "No Java processes found"
        }
        
        return $stopped
    }
    catch {
        Write-Warning "Error force stopping Java processes: $_"
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
        
        if ($Force) {
            Write-Status "Force mode: attempting to kill processes on busy ports..."
            Stop-ServicesByPort | Out-Null
            
            # Check again
            Start-Sleep -Seconds 2
            $stillBusy = @()
            foreach ($port in $busyPorts) {
                $connection = Test-NetConnection -ComputerName "localhost" -Port $port -WarningAction SilentlyContinue
                if ($connection.TcpTestSucceeded) {
                    $stillBusy += $port
                }
            }
            
            if ($stillBusy.Count -gt 0) {
                Write-Warning "Ports still busy after force stop: $($stillBusy -join ', ')"
                Write-Warning "You may need to restart your computer"
            } else {
                Write-Success "All ports are now free"
            }
        } else {
            Write-Warning "Run with -Force flag to attempt forceful cleanup"
            Write-Warning "Or run: Get-Process -Name 'java' | Stop-Process -Force"
        }
        
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
    
    # Method 2: Stop by port (more effective)
    $totalStopped += Stop-ServicesByPort
    
    # Method 3: Stop by process names
    $totalStopped += Stop-ServicesByName
    
    # Method 4: Nuclear option - stop all Java processes
    if ($Force) {
        Write-Warning "Force mode: stopping ALL Java processes..."
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
    $allPortsFree = Test-PortsStillBusy
    
    Write-Host ""
    if ($totalStopped -gt 0) {
        Write-Success "✅ Successfully stopped $totalStopped services"
    } else {
        Write-Warning "⚠️  No services were found running"
    }
    
    if (-not $KeepInfrastructure) {
        Write-Success "✅ Infrastructure services stopped"
    }
    
    if ($allPortsFree) {
        Write-ColorOutput "🏁 StayHub Platform shutdown complete!" $Green
    } else {
        Write-ColorOutput "⚠️  Platform shutdown completed with warnings" $Yellow
        Write-Host "Some ports may still be in use. Consider running with -Force flag." -ForegroundColor Yellow
    }
}
catch {
    Write-Error "Unexpected error during shutdown: $_"
    exit 1
}