# PowerShell script to start Analytics Engine (Perl) separately
# Usage: .\scripts\start-analytics-windows.ps1

Write-Host "Starting Analytics Engine (Perl)..." -ForegroundColor Cyan

# Check if Perl is installed
try {
    $perlVersion = perl -v 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Perl not found"
    }
    Write-Host "Found Perl: " -NoNewline
    Write-Host ($perlVersion | Select-String -Pattern "This is perl" | Select-Object -First 1) -ForegroundColor Green
}
catch {
    Write-Host "ERROR: Perl is not installed!" -ForegroundColor Red
    Write-Host "Please install Strawberry Perl from: https://strawberryperl.com/" -ForegroundColor Yellow
    Write-Host "After installation, restart this script." -ForegroundColor Yellow
    exit 1
}

# Check if cpanm is installed
try {
    $cpanmVersion = cpanm --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "cpanm not found, installing..." -ForegroundColor Yellow
        cpan App::cpanminus
    }
}
catch {
    Write-Host "Installing cpanm..." -ForegroundColor Yellow
    cpan App::cpanminus
}

# Navigate to analytics engine directory
Set-Location services/analytics-engine

# Install dependencies
Write-Host "Installing Perl dependencies..." -ForegroundColor Cyan
Write-Host "This may take a while on first run..." -ForegroundColor Gray

# Install basic dependencies first
cpanm --notest Mojolicious DBI DBD::Pg Redis JSON::XS

# Install additional dependencies
cpanm --notest --installdeps .

# Start the application
Write-Host "Starting Analytics Engine on port 3000..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray

# Run the Perl application
perl app.pl daemon -m production -l http://*:3000

# Return to original directory when done
Set-Location ../..