package com.stayhub.property_service.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;
import java.util.Map;

@RestController
public class HealthController {
    
    // Simple health check for Railway
    @GetMapping("/actuator/health")
    public ResponseEntity<Map<String, String>> actuatorHealth() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "property-service",
            "port", System.getProperty("server.port", "unknown"),
            "timestamp", String.valueOf(System.currentTimeMillis())
        ));
    }
    
    // endpoint
    @GetMapping("/health")
    public String health() {
        return "OK";
    }
    
    // Root endpoint to test basic connectivity
    @GetMapping("/")
    public ResponseEntity<Map<String, String>> root() {
        return ResponseEntity.ok(Map.of(
            "service", "property-service",
            "status", "running",
            "port", System.getProperty("server.port", "unknown")
        ));
    }
}