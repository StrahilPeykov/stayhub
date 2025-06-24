# PowerShell script to set up remaining services

$services = @("booking-service", "search-service", "user-service")
$ports = @{
    "booking-service" = 8082
    "search-service" = 8083
    "user-service" = 8084
}

foreach ($service in $services) {
    Write-Host "Creating $service..." -ForegroundColor Green
    
    Set-Location services
    
    # Create service using Spring Initializr
    $dependencies = "web,data-jpa,postgresql,validation,lombok,actuator"
    if ($service -eq "search-service") {
        $dependencies += ",data-elasticsearch"
    }
    if ($service -eq "user-service") {
        $dependencies += ",security,data-redis"
    }
    
    $url = "https://start.spring.io/starter.zip"
    $params = @{
        dependencies = $dependencies
        type = "maven-project"
        language = "java"
        platformVersion = "3.2.0"
        packaging = "jar"
        javaVersion = "17"
        groupId = "com.stayhub"
        artifactId = $service
        name = $service
        baseDir = $service
    }
    
    # Download and extract
    Invoke-WebRequest -Uri $url -Method GET -Body $params -OutFile "$service.zip"
    Expand-Archive -Path "$service.zip" -DestinationPath "."
    Remove-Item "$service.zip"
    
    # Create application.yml
    $port = $ports[$service]
    $yamlContent = @"
spring:
  application:
    name: $service
  datasource:
    url: jdbc:postgresql://localhost:5432/stayhub_${service.Replace('-service', 's')}
    username: postgres
    password: postgres
    driver-class-name: org.postgresql.driver.Driver
  jpa:
    hibernate:
      ddl-auto: update
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect

server:
  port: $port

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
"@
    
    $yamlContent | Out-File -FilePath "$service/src/main/resources/application.yml" -Encoding UTF8
    
    Set-Location ..
}

Write-Host "All services created successfully!" -ForegroundColor Green