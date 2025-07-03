package com.stayhub.booking_service.controller;

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
        System.out.println("=== BOOKING SERVICE READY ===");
    }
    
    @GetMapping("/ping")
    public String ping() {
        System.out.println("PING endpoint called - Booking Service");
        return "pong";
    }
    
    @GetMapping("/health")
    public String health() {
        return "OK";
    }
    
    @GetMapping("/actuator/health")
    public String actuatorHealth() {
        return "{\"status\":\"UP\",\"service\":\"booking-service\"}";
    }
    
    @GetMapping("/")
    public String root() {
        return "Booking Service is running!";
    }
}