package com.stayhub.property_service.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

import java.util.concurrent.atomic.AtomicBoolean;

@RestController
public class HealthController {
    
    private final AtomicBoolean applicationReady = new AtomicBoolean(false);
    
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        applicationReady.set(true);
        System.out.println("=== PROPERTY SERVICE READY ===");
    }
    
    @GetMapping("/ping")
    public String ping() {
        System.out.println("PING endpoint called - Property Service");
        return "pong";
    }
    
    @GetMapping("/health")
    public String health() {
        return "OK";
    }
    
    @GetMapping("/actuator/health")
    public String actuatorHealth() {
        return "{\"status\":\"UP\",\"service\":\"property-service\"}";
    }
    
    @GetMapping("/")
    public String root() {
        return "Property Service is running!";
    }
}