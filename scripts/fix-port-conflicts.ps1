# PowerShell script to fix port conflicts for StayHub
# Usage: .\scripts\fix-port-conflicts.ps1

param(
    [switch]$Force
)

Write-Host "Checking for port conflicts..." -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

$conflictPorts = @{
    3316 = "MySQL (StayHub)"
    5432 = "PostgreSQL"
    6379 = "Redis"
    9200 = "Elasticsearch"
    9092 = "Kafka"
    8081 = "Property Service"
    8082 = "Booking Service"
    8083 = "Search Service"
    8084 = "User Service"
    3000 = "Analytics Engine"
}

$conflicts = @()

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
                        Process = $process
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

# Check each port
foreach ($port in $conflictPorts.Keys) {
    $processInfo = Find-ProcessUsingPort -Port $port
    if ($processInfo) {
        $conflicts += @{
            Port = $port
            ServiceName = $conflictPorts[$port]
            ProcessInfo = $processInfo
        }
        Write-Host "[!] Port $port ($($conflictPorts[$port])) is in use by: $($processInfo.ProcessName) (PID: $($processInfo.PID))" -ForegroundColor Yellow
    } else {
        Write-Host "[+] Port $port ($($conflictPorts[$port])) is available" -ForegroundColor Green
    }
}

if ($conflicts.Count -eq 0) {
    Write-Host "`nAll ports are available!" -ForegroundColor Green
    exit 0
}

Write-Host "`nFound $($conflicts.Count) port conflicts" -ForegroundColor Red

# Ask user what to do
if (-not $Force) {
    Write-Host "`nOptions:" -ForegroundColor Cyan
    Write-Host "1. Kill conflicting processes (recommended)" -ForegroundColor White
    Write-Host "2. Show more details" -ForegroundColor White
    Write-Host "3. Exit without changes" -ForegroundColor White
    
    $choice = Read-Host "`nEnter your choice (1-3)"
    
    switch ($choice) {
        "1" {
            $Force = $true
        }
        "2" {
            Write-Host "`nDetailed information:" -ForegroundColor Cyan
            foreach ($conflict in $conflicts) {
                Write-Host "`nPort $($conflict.Port) ($($conflict.ServiceName)):" -ForegroundColor Yellow
                $proc = $conflict.ProcessInfo.Process
                Write-Host "  Process Name: $($proc.ProcessName)" -ForegroundColor White
                Write-Host "  PID: $($proc.Id)" -ForegroundColor White
                Write-Host "  Start Time: $($proc.StartTime)" -ForegroundColor White
                try {
                    $commandLine = (Get-WmiObject Win32_Process -Filter "ProcessId = $($proc.Id)").CommandLine
                    if ($commandLine) {
                        Write-Host "  Command Line: $($commandLine.Substring(0, [Math]::Min($commandLine.Length, 100)))..." -ForegroundColor Gray
                    }
                } catch {
                    # Ignore
                }
            }
            
            Write-Host "`nWould you like to kill these processes? (Y/N)" -ForegroundColor Yellow
            $kill = Read-Host
            if ($kill -eq "Y" -or $kill -eq "y") {
                $Force = $true
            } else {
                Write-Host "Exiting without changes." -ForegroundColor Yellow
                exit 0
            }
        }
        "3" {
            Write-Host "Exiting without changes." -ForegroundColor Yellow
            exit 0
        }
        default {
            Write-Host "Invalid choice. Exiting." -ForegroundColor Red
            exit 1
        }
    }
}

if ($Force) {
    Write-Host "`nKilling conflicting processes..." -ForegroundColor Yellow
    
    $killed = 0
    $failed = 0
    
    foreach ($conflict in $conflicts) {
        try {
            $proc = $conflict.ProcessInfo.Process
            Write-Host "Killing $($proc.ProcessName) (PID: $($proc.Id)) on port $($conflict.Port)..." -NoNewline
            
            $proc.Kill()
            $proc.WaitForExit(5000)
            
            Write-Host " [OK]" -ForegroundColor Green
            $killed++
        }
        catch {
            Write-Host " [FAILED]" -ForegroundColor Red
            Write-Host "  Error: $_" -ForegroundColor Red
            $failed++
        }
    }
    
    Write-Host "`nResults:" -ForegroundColor Cyan
    Write-Host "  Killed: $killed processes" -ForegroundColor Green
    if ($failed -gt 0) {
        Write-Host "  Failed: $failed processes" -ForegroundColor Red
        Write-Host "`nSome processes could not be killed. You may need to:" -ForegroundColor Yellow
        Write-Host "  1. Run this script as Administrator" -ForegroundColor White
        Write-Host "  2. Manually stop the services in Task Manager" -ForegroundColor White
        Write-Host "  3. Restart your computer" -ForegroundColor White
    } else {
        Write-Host "`nAll conflicting processes have been stopped!" -ForegroundColor Green
        Write-Host "You can now start StayHub services." -ForegroundColor Green
    }
}

# Note about port 3306
Write-Host "`nNote about MySQL:" -ForegroundColor Yellow
Write-Host "StayHub now uses port 3316 for MySQL instead of the default 3306" -ForegroundColor White
Write-Host "This avoids conflicts with local MySQL installations." -ForegroundColor White
Write-Host "If you still have issues, check the docker-compose.dev.yml file." -ForegroundColor White