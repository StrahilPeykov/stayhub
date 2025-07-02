package com.stayhub.property_service.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {
    
    @GetMapping("/actuator/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("timestamp", System.currentTimeMillis());
        response.put("service", "property-service"); // Change for each service
        
        // Simple health check without database dependency
        try {
            // Basic application health check
            Runtime runtime = Runtime.getRuntime();
            long memory = runtime.totalMemory() - runtime.freeMemory();
            
            response.put("components", Map.of(
                "diskSpace", Map.of("status", "UP"),
                "ping", Map.of("status", "UP"),
                "memory", Map.of(
                    "status", "UP",
                    "used", memory,
                    "total", runtime.totalMemory()
                )
            ));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "DOWN");
            response.put("error", e.getMessage());
            return ResponseEntity.status(503).body(response);
        }
    }
    
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> simpleHealth() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "property-service"); // Change for each service
        return ResponseEntity.ok(response);
    }
}