package com.stayhub.user_service.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Map;

@RestController
public class HealthController {
    
    @Autowired(required = false)
    private DataSource dataSource;
    
    // Simple health check for Railway that doesn't require database
    @GetMapping("/actuator/health")
    public ResponseEntity<Map<String, Object>> actuatorHealth() {
        Map<String, Object> health = Map.of(
            "status", "UP",
            "service", "user-service",
            "port", System.getProperty("server.port", "unknown"),
            "timestamp", String.valueOf(System.currentTimeMillis()),
            "java_version", System.getProperty("java.version"),
            "max_memory", Runtime.getRuntime().maxMemory() / 1024 / 1024 + "MB",
            "total_memory", Runtime.getRuntime().totalMemory() / 1024 / 1024 + "MB",
            "free_memory", Runtime.getRuntime().freeMemory() / 1024 / 1024 + "MB"
        );
        
        return ResponseEntity.ok(health);
    }
    
    // Simple health endpoint
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }
    
    // Detailed health check that includes database
    @GetMapping("/health/detailed")
    public ResponseEntity<Map<String, Object>> detailedHealth() {
        Map<String, Object> health = new java.util.HashMap<>();
        health.put("status", "UP");
        health.put("service", "user-service");
        health.put("timestamp", System.currentTimeMillis());
        
        // Check database connectivity
        if (dataSource != null) {
            try (Connection connection = dataSource.getConnection()) {
                if (connection.isValid(5)) {
                    health.put("database", "UP");
                } else {
                    health.put("database", "DOWN");
                    health.put("status", "DOWN");
                }
            } catch (SQLException e) {
                health.put("database", "DOWN - " + e.getMessage());
                health.put("status", "DOWN");
            }
        } else {
            health.put("database", "NOT_CONFIGURED");
        }
        
        return ResponseEntity.ok(health);
    }
    
    // Root endpoint to test basic connectivity
    @GetMapping("/")
    public ResponseEntity<Map<String, String>> root() {
        return ResponseEntity.ok(Map.of(
            "service", "user-service",
            "status", "running",
            "port", System.getProperty("server.port", "unknown"),
            "message", "Service is operational"
        ));
    }
}