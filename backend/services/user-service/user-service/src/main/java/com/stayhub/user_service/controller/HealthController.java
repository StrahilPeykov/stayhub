package com.stayhub.user_service.controller;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;

import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

@RestController
public class HealthController {
    
    private final AtomicBoolean applicationReady = new AtomicBoolean(false);
    
    @EventListener(ApplicationReadyEvent.class)
    public void handleApplicationReady() {
        applicationReady.set(true);
        System.out.println("=== APPLICATION READY EVENT RECEIVED ===");
    }
    
    // Ultra-simple health check that responds immediately
    @GetMapping("/actuator/health")
    public ResponseEntity<Map<String, Object>> actuatorHealth() {
        String status = applicationReady.get() ? "UP" : "STARTING";
        
        Map<String, Object> health = Map.of(
            "status", status,
            "service", "user-service",
            "port", System.getProperty("server.port", "unknown"),
            "timestamp", String.valueOf(System.currentTimeMillis()),
            "uptime_ms", java.lang.management.ManagementFactory.getRuntimeMXBean().getUptime(),
            "memory_used_mb", (Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory()) / 1024 / 1024,
            "memory_max_mb", Runtime.getRuntime().maxMemory() / 1024 / 1024
        );
        
        return ResponseEntity.ok(health);
    }
    
    // Even simpler health endpoint
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }
    
    // Ultra simple endpoint - just returns text
    @GetMapping("/ping")
    public String ping() {
        return "pong";
    }
    
    // Root endpoint
    @GetMapping("/")
    public ResponseEntity<Map<String, String>> root() {
        return ResponseEntity.ok(Map.of(
            "service", "user-service",
            "status", applicationReady.get() ? "ready" : "starting",
            "port", System.getProperty("server.port", "unknown"),
            "timestamp", String.valueOf(System.currentTimeMillis())
        ));
    }
    
    // Startup status endpoint
    @GetMapping("/startup")
    public ResponseEntity<Map<String, Object>> startup() {
        long uptime = java.lang.management.ManagementFactory.getRuntimeMXBean().getUptime();
        Runtime runtime = Runtime.getRuntime();
        
        Map<String, Object> info = Map.of(
            "service", "user-service",
            "application_ready", applicationReady.get(),
            "uptime_ms", uptime,
            "uptime_seconds", uptime / 1000,
            "memory_used_mb", (runtime.totalMemory() - runtime.freeMemory()) / 1024 / 1024,
            "memory_total_mb", runtime.totalMemory() / 1024 / 1024,
            "memory_max_mb", runtime.maxMemory() / 1024 / 1024,
            "threads", Thread.activeCount(),
            "start_time", new java.util.Date(java.lang.management.ManagementFactory.getRuntimeMXBean().getStartTime())
        );
        
        return ResponseEntity.ok(info);
    }
}