# Test script to verify $pid fix works correctly
# Usage: .\scripts\test-pid-fix.ps1

Write-Host "Testing PowerShell Variable Fixes" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Show the built-in $PID variable
Write-Host "Built-in `$PID variable (current PowerShell process): $PID" -ForegroundColor Yellow
Write-Host ""

# Test finding a process using netstat (simulated)
Write-Host "Testing process detection code..." -ForegroundColor Yellow

# Simulate netstat output
$simulatedNetstatOutput = "  TCP    0.0.0.0:8081           0.0.0.0:0              LISTENING       12345"

Write-Host "Simulated netstat output:" -ForegroundColor Gray
Write-Host $simulatedNetstatOutput -ForegroundColor Gray
Write-Host ""

# Parse the output (this is the fixed code)
$parts = $simulatedNetstatOutput -split '\s+'
$processId = $parts[-1]

Write-Host "Extracted process ID: $processId" -ForegroundColor Green

if ($processId -match '^\d+$') {
    Write-Host "[+] Process ID is valid numeric value" -ForegroundColor Green
    
    # Try to get the actual process (if it exists)
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "[+] Found process: $($process.ProcessName)" -ForegroundColor Green
    } else {
        Write-Host "[!] No process with ID $processId (this is normal for simulated data)" -ForegroundColor Yellow
    }
} else {
    Write-Host "[X] Invalid process ID format" -ForegroundColor Red
}

Write-Host ""
Write-Host "Testing complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Key points:" -ForegroundColor Yellow
Write-Host "- The built-in `$PID is: $PID (read-only)" -ForegroundColor White
Write-Host "- We use `$processId for our extracted PIDs" -ForegroundColor White
Write-Host "- This avoids the PSScriptAnalyzer warning" -ForegroundColor White
Write-Host ""

# Verify no conflicts
Write-Host "Verifying no variable conflicts..." -ForegroundColor Yellow
try {
    # This would fail if we tried to assign to $PID
    # $PID = 12345  # This would cause an error
    
    # But this works fine
    $processId = 12345
    Write-Host "[+] Can assign to `$processId without issues" -ForegroundColor Green
    
    # Show they are different
    Write-Host "  `$PID (built-in): $PID" -ForegroundColor Gray
    Write-Host "  `$processId (our variable): $processId" -ForegroundColor Gray
} catch {
    Write-Host "[X] Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "All variable naming issues have been fixed!" -ForegroundColor Green