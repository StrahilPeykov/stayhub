# PowerShell script to test all services
# Usage: .\scripts\test-services.ps1

Write-Host "Testing StayHub Services..." -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan

$services = @(
    @{Name="Property Service"; URL="http://localhost:8081/actuator/health"; Port=8081},
    @{Name="Booking Service"; URL="http://localhost:8082/actuator/health"; Port=8082},
    @{Name="Search Service"; URL="http://localhost:8083/api/search/health"; Port=8083},
    @{Name="User Service"; URL="http://localhost:8084/actuator/health"; Port=8084},
    @{Name="Analytics Engine"; URL="http://localhost:3000/health"; Port=3000}
)

$databases = @(
    @{Name="PostgreSQL"; Port=5432},
    @{Name="Redis"; Port=6379},
    @{Name="Elasticsearch"; Port=9200},
    @{Name="Kafka"; Port=9092},
    @{Name="MySQL"; Port=3306}
)

Write-Host "`nChecking Infrastructure:" -ForegroundColor Yellow
foreach ($db in $databases) {
    $result = Test-NetConnection -ComputerName localhost -Port $db.Port -WarningAction SilentlyContinue
    if ($result.TcpTestSucceeded) {
        Write-Host "✓ $($db.Name) is running on port $($db.Port)" -ForegroundColor Green
    } else {
        Write-Host "✗ $($db.Name) is NOT running on port $($db.Port)" -ForegroundColor Red
    }
}

Write-Host "`nChecking Services:" -ForegroundColor Yellow
foreach ($service in $services) {
    try {
        $response = Invoke-RestMethod -Uri $service.URL -Method Get -TimeoutSec 5 -ErrorAction Stop
        Write-Host "✓ $($service.Name) is healthy" -ForegroundColor Green
        if ($response.status) {
            Write-Host "  Status: $($response.status)" -ForegroundColor Gray
        }
    } catch {
        $portTest = Test-NetConnection -ComputerName localhost -Port $service.Port -WarningAction SilentlyContinue
        if ($portTest.TcpTestSucceeded) {
            Write-Host "⚠ $($service.Name) is running but health check failed" -ForegroundColor Yellow
            Write-Host "  Error: $_" -ForegroundColor Gray
        } else {
            Write-Host "✗ $($service.Name) is NOT running" -ForegroundColor Red
        }
    }
}

Write-Host "`nTesting Property Service API:" -ForegroundColor Yellow
try {
    # Create a test property
    $property = @{
        name = "Test Hotel"
        description = "A test hotel"
        address = @{
            street = "123 Test St"
            city = "Amsterdam"
            state = "NH"
            country = "Netherlands"
            zipCode = "1234AB"
        }
        latitude = 52.3702
        longitude = 4.8952
        amenities = @("WiFi", "Pool")
        totalRooms = 10
        basePrice = 100.00
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:8081/api/properties" `
        -Method Post `
        -Body $property `
        -ContentType "application/json" `
        -ErrorAction Stop

    Write-Host "✓ Created test property with ID: $($response.id)" -ForegroundColor Green
    
    # Get all properties
    $properties = Invoke-RestMethod -Uri "http://localhost:8081/api/properties" -Method Get
    Write-Host "✓ Found $($properties.Count) properties" -ForegroundColor Green
} catch {
    Write-Host "✗ Property API test failed: $_" -ForegroundColor Red
}

Write-Host "`nAll tests completed!" -ForegroundColor Cyan