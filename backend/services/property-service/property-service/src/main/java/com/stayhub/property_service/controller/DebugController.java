package com.stayhub.property_service.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/debug")
public class DebugController {
    
    @Autowired(required = false)
    private DataSource dataSource;
    
    @Autowired
    private Environment env;
    
    @GetMapping("/env")
    public ResponseEntity<Map<String, String>> environment() {
        Map<String, String> envVars = new HashMap<>();
        envVars.put("service", "property-service");
        envVars.put("DATABASE_URL", env.getProperty("DATABASE_URL", "NOT_SET"));
        envVars.put("PORT", env.getProperty("PORT", "NOT_SET"));
        envVars.put("JAVA_OPTS", env.getProperty("JAVA_OPTS", "NOT_SET"));
        envVars.put("SPRING_PROFILES_ACTIVE", env.getProperty("SPRING_PROFILES_ACTIVE", "NOT_SET"));
        envVars.put("server.port", env.getProperty("server.port", "NOT_SET"));
        return ResponseEntity.ok(envVars);
    }
    
    @GetMapping("/db")
    public ResponseEntity<Map<String, Object>> database() {
        Map<String, Object> dbInfo = new HashMap<>();
        dbInfo.put("service", "property-service");
        
        if (dataSource == null) {
            dbInfo.put("error", "DataSource is null");
            return ResponseEntity.ok(dbInfo);
        }
        
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            dbInfo.put("connected", true);
            dbInfo.put("url", metaData.getURL());
            dbInfo.put("username", metaData.getUserName());
            dbInfo.put("driver_name", metaData.getDriverName());
            dbInfo.put("driver_version", metaData.getDriverVersion());
            dbInfo.put("database_product", metaData.getDatabaseProductName());
            dbInfo.put("database_version", metaData.getDatabaseProductVersion());
        } catch (Exception e) {
            dbInfo.put("connected", false);
            dbInfo.put("error", e.getMessage());
            dbInfo.put("error_class", e.getClass().getSimpleName());
        }
        
        return ResponseEntity.ok(dbInfo);
    }
    
    @GetMapping("/memory")
    public ResponseEntity<Map<String, Object>> memory() {
        Runtime runtime = Runtime.getRuntime();
        Map<String, Object> memInfo = new HashMap<>();
        memInfo.put("service", "property-service");
        memInfo.put("max_memory_mb", runtime.maxMemory() / 1024 / 1024);
        memInfo.put("total_memory_mb", runtime.totalMemory() / 1024 / 1024);
        memInfo.put("free_memory_mb", runtime.freeMemory() / 1024 / 1024);
        memInfo.put("used_memory_mb", (runtime.totalMemory() - runtime.freeMemory()) / 1024 / 1024);
        memInfo.put("available_processors", runtime.availableProcessors());
        return ResponseEntity.ok(memInfo);
    }
    
    @GetMapping("/startup")
    public ResponseEntity<Map<String, Object>> startup() {
        Map<String, Object> startupInfo = new HashMap<>();
        startupInfo.put("service", "property-service");
        startupInfo.put("uptime_ms", java.lang.management.ManagementFactory.getRuntimeMXBean().getUptime());
        startupInfo.put("start_time", new java.util.Date(java.lang.management.ManagementFactory.getRuntimeMXBean().getStartTime()));
        startupInfo.put("current_time", new java.util.Date());
        startupInfo.put("pid", java.lang.management.ManagementFactory.getRuntimeMXBean().getName());
        return ResponseEntity.ok(startupInfo);
    }
}