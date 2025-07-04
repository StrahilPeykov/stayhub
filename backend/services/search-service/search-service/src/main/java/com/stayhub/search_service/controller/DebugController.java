package com.stayhub.search_service.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.http.ResponseEntity;

import jakarta.servlet.http.HttpServletRequest;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.Statement;
import java.sql.ResultSet;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/debug")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DebugController {
    
    @Autowired(required = false)
    private DataSource dataSource;
    
    @Autowired
    private Environment env;
    
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", env.getProperty("spring.application.name", "unknown"));
        health.put("timestamp", System.currentTimeMillis());
        health.put("version", "1.0.0");
        health.put("railway_deployment", true);
        return ResponseEntity.ok(health);
    }
    
    @GetMapping("/cors-test")
    public ResponseEntity<Map<String, Object>> corsTest(HttpServletRequest request) {
        Map<String, Object> corsInfo = new HashMap<>();
        corsInfo.put("origin", request.getHeader("Origin"));
        corsInfo.put("referer", request.getHeader("Referer"));
        corsInfo.put("user_agent", request.getHeader("User-Agent"));
        corsInfo.put("method", request.getMethod());
        corsInfo.put("url", request.getRequestURL().toString());
        corsInfo.put("headers", Collections.list(request.getHeaderNames()));
        return ResponseEntity.ok(corsInfo);
    }
    
    @GetMapping("/env")
    public ResponseEntity<Map<String, String>> environment() {
        Map<String, String> envVars = new HashMap<>();
        envVars.put("service", env.getProperty("spring.application.name", "unknown"));
        envVars.put("PORT", env.getProperty("PORT", "NOT_SET"));
        envVars.put("PGHOST", env.getProperty("PGHOST", "NOT_SET"));
        envVars.put("PGPORT", env.getProperty("PGPORT", "NOT_SET"));
        envVars.put("PGDATABASE", env.getProperty("PGDATABASE", "NOT_SET"));
        envVars.put("PGUSER", env.getProperty("PGUSER", "NOT_SET"));
        envVars.put("JAVA_OPTS", env.getProperty("JAVA_OPTS", "NOT_SET"));
        envVars.put("SPRING_PROFILES_ACTIVE", env.getProperty("SPRING_PROFILES_ACTIVE", "NOT_SET"));
        envVars.put("server.port", env.getProperty("server.port", "NOT_SET"));
        return ResponseEntity.ok(envVars);
    }
    
    @GetMapping("/db")
    public ResponseEntity<Map<String, Object>> database() {
        Map<String, Object> dbInfo = new HashMap<>();
        dbInfo.put("service", env.getProperty("spring.application.name", "unknown"));
        
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
            
            // Test a simple query
            try (Statement stmt = connection.createStatement()) {
                ResultSet rs = stmt.executeQuery("SELECT 1 as test");
                if (rs.next()) {
                    dbInfo.put("query_test", "SUCCESS");
                }
            }
        } catch (Exception e) {
            dbInfo.put("connected", false);
            dbInfo.put("error", e.getMessage());
            dbInfo.put("error_class", e.getClass().getSimpleName());
            e.printStackTrace(); // Log full stack trace
        }
        
        return ResponseEntity.ok(dbInfo);
    }
    
    @GetMapping("/network")
    public ResponseEntity<Map<String, Object>> network(HttpServletRequest request) {
        Map<String, Object> networkInfo = new HashMap<>();
        networkInfo.put("service", env.getProperty("spring.application.name", "unknown"));
        networkInfo.put("remote_addr", request.getRemoteAddr());
        networkInfo.put("remote_host", request.getRemoteHost());
        networkInfo.put("server_name", request.getServerName());
        networkInfo.put("server_port", request.getServerPort());
        networkInfo.put("local_addr", request.getLocalAddr());
        networkInfo.put("local_port", request.getLocalPort());
        networkInfo.put("scheme", request.getScheme());
        networkInfo.put("protocol", request.getProtocol());
        return ResponseEntity.ok(networkInfo);
    }
    
    @GetMapping("/memory")
    public ResponseEntity<Map<String, Object>> memory() {
        Runtime runtime = Runtime.getRuntime();
        Map<String, Object> memInfo = new HashMap<>();
        memInfo.put("service", env.getProperty("spring.application.name", "unknown"));
        memInfo.put("max_memory_mb", runtime.maxMemory() / 1024 / 1024);
        memInfo.put("total_memory_mb", runtime.totalMemory() / 1024 / 1024);
        memInfo.put("free_memory_mb", runtime.freeMemory() / 1024 / 1024);
        memInfo.put("used_memory_mb", (runtime.totalMemory() - runtime.freeMemory()) / 1024 / 1024);
        memInfo.put("available_processors", runtime.availableProcessors());
        return ResponseEntity.ok(memInfo);
    }
    
    // OPTIONS handler for CORS preflight
    @RequestMapping(method = RequestMethod.OPTIONS)
    public ResponseEntity<Void> handleOptions() {
        return ResponseEntity.ok()
                .header("Access-Control-Allow-Origin", "*")
                .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
                .header("Access-Control-Allow-Headers", "*")
                .header("Access-Control-Max-Age", "3600")
                .build();
    }
}