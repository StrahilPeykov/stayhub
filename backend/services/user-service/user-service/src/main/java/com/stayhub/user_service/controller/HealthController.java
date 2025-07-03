package com.stayhub.user_service.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
    
    // Ultra-simple ping that returns plain text
    @GetMapping("/ping")
    public String ping() {
        System.out.println("PING endpoint called at: " + new java.util.Date());
        return "pong";
    }
    
    // Simple health check
    @GetMapping("/health")
    public String health() {
        System.out.println("HEALTH endpoint called at: " + new java.util.Date());
        return "OK";
    }
    
    // Actuator health that returns JSON
    @GetMapping("/actuator/health")
    public String actuatorHealth() {
        System.out.println("ACTUATOR HEALTH endpoint called at: " + new java.util.Date());
        return "{\"status\":\"UP\",\"service\":\"user-service\"}";
    }
    
    // Root endpoint
    @GetMapping("/")
    public String root() {
        System.out.println("ROOT endpoint called at: " + new java.util.Date());
        return "User Service is running!";
    }
}