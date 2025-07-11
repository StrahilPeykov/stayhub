package com.stayhub.admin_server.controller;

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
        System.out.println("=== ADMIN SERVER READY ===");
    }
    
    @GetMapping("/ping")
    public String ping() {
        System.out.println("PING endpoint called - Admin Server");
        return "pong";
    }
    
    @GetMapping("/health")
    public String health() {
        return "OK";
    }
    
    @GetMapping("/actuator/health")
    public String actuatorHealth() {
        return "{\"status\":\"UP\",\"service\":\"admin-server\"}";
    }
    
    @GetMapping("/")
    public String root() {
        if (applicationReady.get()) {
            return "Admin Server is running and ready!";
        } else {
            return "Admin Server is starting...";
        }
    }
}