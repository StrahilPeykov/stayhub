package com.stayhub.search_service.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("service", "search-service");
        response.put("status", "UP");
        response.put("timestamp", System.currentTimeMillis());
        response.put("message", "Search service is operational (basic implementation)");
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/test")
    public ResponseEntity<Map<String, String>> test() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Search service is working!");
        response.put("version", "1.0.0");
        response.put("note", "Basic implementation - ready for Elasticsearch integration");
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/properties")
    public ResponseEntity<Map<String, Object>> searchProperties() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Property search endpoint");
        response.put("status", "available");
        response.put("note", "Ready for search implementation");
        return ResponseEntity.ok(response);
    }
}