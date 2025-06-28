# PowerShell script to create test data for StayHub
# Usage: .\scripts\create-test-data.ps1

Write-Host "Creating Test Data for StayHub..." -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Check if services are running
$propertyHealthCheck = try {
    Invoke-RestMethod -Uri "http://localhost:8081/actuator/health" -TimeoutSec 2
} catch { $null }

if (-not $propertyHealthCheck) {
    Write-Host "ERROR: Property Service is not running!" -ForegroundColor Red
    Write-Host "Please run .\scripts\start-all-windows.ps1 first" -ForegroundColor Yellow
    exit 1
}

# 1. Create Properties
Write-Host "`nCreating properties..." -ForegroundColor Yellow

$properties = @()

# Property 1: Grand Hotel Amsterdam
$property1 = @{
    name = "Grand Hotel Amsterdam"
    description = "Luxury 5-star hotel in the heart of Amsterdam"
    address = @{
        street = "Dam Square 1"
        city = "Amsterdam"
        state = "North Holland"
        country = "Netherlands"
        zipCode = "1012JS"
    }
    latitude = 52.3702
    longitude = 4.8952
    amenities = @("WiFi", "Pool", "Gym", "Restaurant", "Bar", "Spa", "Parking")
    totalRooms = 150
    basePrice = 250.00
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri "http://localhost:8081/api/properties" `
        -Method Post `
        -Body $property1 `
        -ContentType "application/json"
    
    $properties += $response1
    Write-Host "✓ Created: $($response1.name) (ID: $($response1.id))" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to create Grand Hotel Amsterdam: $_" -ForegroundColor Red
}

# Property 2: Budget Inn Rotterdam
$property2 = @{
    name = "Budget Inn Rotterdam"
    description = "Affordable accommodation near Rotterdam Central"
    address = @{
        street = "Station Street 42"
        city = "Rotterdam"
        state = "South Holland"
        country = "Netherlands"
        zipCode = "3011EA"
    }
    latitude = 51.9225
    longitude = 4.4792
    amenities = @("WiFi", "Breakfast", "24/7 Reception")
    totalRooms = 80
    basePrice = 75.00
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri "http://localhost:8081/api/properties" `
        -Method Post `
        -Body $property2 `
        -ContentType "application/json"
    
    $properties += $response2
    Write-Host "✓ Created: $($response2.name) (ID: $($response2.id))" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to create Budget Inn Rotterdam: $_" -ForegroundColor Red
}

# Property 3: Beach Resort Zandvoort
$property3 = @{
    name = "Beach Resort Zandvoort"
    description = "Beachfront resort with stunning sea views"
    address = @{
        street = "Boulevard 100"
        city = "Zandvoort"
        state = "North Holland"
        country = "Netherlands"
        zipCode = "2041JE"
    }
    latitude = 52.3733
    longitude = 4.5338
    amenities = @("WiFi", "Beach Access", "Pool", "Restaurant", "Bike Rental")
    totalRooms = 120
    basePrice = 180.00
} | ConvertTo-Json

try {
    $response3 = Invoke-RestMethod -Uri "http://localhost:8081/api/properties" `
        -Method Post `
        -Body $property3 `
        -ContentType "application/json"
    
    $properties += $response3
    Write-Host "✓ Created: $($response3.name) (ID: $($response3.id))" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to create Beach Resort Zandvoort: $_" -ForegroundColor Red
}

# 2. Create Room Types (if booking service is running)
$bookingHealthCheck = try {
    Invoke-RestMethod -Uri "http://localhost:8082/actuator/health" -TimeoutSec 2
} catch { $null }

if ($bookingHealthCheck -and $properties.Count -gt 0) {
    Write-Host "`nCreating room types..." -ForegroundColor Yellow
    
    # Room types for first property
    if ($properties[0]) {
        $roomTypes = @(
            @{
                propertyId = $properties[0].id
                name = "Deluxe King Room"
                description = "Spacious room with king bed and city view"
                maxOccupancy = 2
                basePrice = 300.00
                totalRooms = 40
            },
            @{
                propertyId = $properties[0].id
                name = "Executive Suite"
                description = "Luxury suite with separate living area"
                maxOccupancy = 4
                basePrice = 500.00
                totalRooms = 20
            }
        )
        
        foreach ($roomType in $roomTypes) {
            try {
                $response = Invoke-RestMethod -Uri "http://localhost:8082/api/v1/room-types" `
                    -Method Post `
                    -Body ($roomType | ConvertTo-Json) `
                    -ContentType "application/json"
                
                Write-Host "✓ Created room type: $($response.name) (ID: $($response.id))" -ForegroundColor Green
                
                # Initialize availability for the next 30 days
                $startDate = Get-Date -Format "yyyy-MM-dd"
                $endDate = (Get-Date).AddDays(30).ToString("yyyy-MM-dd")
                
                $availabilityUrl = "http://localhost:8082/api/v1/availability/initialize?" +
                    "propertyId=$($roomType.propertyId)&" +
                    "roomTypeId=$($response.id)&" +
                    "startDate=$startDate&" +
                    "endDate=$endDate"
                
                try {
                    Invoke-RestMethod -Uri $availabilityUrl -Method Post
                    Write-Host "  ✓ Initialized availability for next 30 days" -ForegroundColor Gray
                } catch {
                    Write-Host "  ✗ Failed to initialize availability: $_" -ForegroundColor Red
                }
            } catch {
                Write-Host "✗ Failed to create room type: $_" -ForegroundColor Red
            }
        }
    }
} else {
    Write-Host "`nSkipping room type creation (Booking Service not available)" -ForegroundColor Yellow
}

# 3. Create test users (if user service is running)
$userHealthCheck = try {
    Invoke-RestMethod -Uri "http://localhost:8084/api/users/health" -TimeoutSec 2
} catch { $null }

if ($userHealthCheck) {
    Write-Host "`nCreating test users..." -ForegroundColor Yellow
    
    $users = @(
        @{
            email = "john.doe@example.com"
            name = "John Doe"
            password = "test123"
        },
        @{
            email = "jane.smith@example.com"
            name = "Jane Smith"
            password = "test123"
        }
    )
    
    foreach ($user in $users) {
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:8084/api/users/register" `
                -Method Post `
                -Body ($user | ConvertTo-Json) `
                -ContentType "application/json"
            
            Write-Host "✓ Created user: $($response.email) (ID: $($response.id))" -ForegroundColor Green
        } catch {
            Write-Host "✗ Failed to create user: $_" -ForegroundColor Red
        }
    }
} else {
    Write-Host "`nSkipping user creation (User Service not available)" -ForegroundColor Yellow
}

# Summary
Write-Host "`n=================================" -ForegroundColor Cyan
Write-Host "Test Data Creation Complete!" -ForegroundColor Green
Write-Host "`nCreated $($properties.Count) properties" -ForegroundColor White

if ($properties.Count -gt 0) {
    Write-Host "`nProperty IDs for testing:" -ForegroundColor Yellow
    foreach ($prop in $properties) {
        Write-Host "  $($prop.name): $($prop.id)" -ForegroundColor White
    }
}

Write-Host "`nYou can now:" -ForegroundColor Yellow
Write-Host "1. View properties: http://localhost:8081/api/properties" -ForegroundColor White
Write-Host "2. Search by city: http://localhost:8081/api/properties?city=Amsterdam" -ForegroundColor White
Write-Host "3. View API docs: http://localhost:8081/swagger-ui.html" -ForegroundColor White

if ($bookingHealthCheck) {
    Write-Host "4. Check availability and make bookings using the property IDs above" -ForegroundColor White
}