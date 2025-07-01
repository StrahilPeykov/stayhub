package com.stayhub.search_service.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
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
        response.put("message", "Search service is operational");
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/properties")
    public ResponseEntity<Map<String, Object>> searchProperties(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Map<String, Object> response = new HashMap<>();
        List<Map<String, Object>> results = new ArrayList<>();
        
        // Mock search results
        Map<String, Object> property1 = new HashMap<>();
        property1.put("id", "123e4567-e89b-12d3-a456-426614174000");
        property1.put("name", "Grand Hotel Amsterdam");
        property1.put("city", city != null ? city : "Amsterdam");
        property1.put("rating", 4.5);
        property1.put("price", 150.00);
        results.add(property1);
        
        response.put("results", results);
        response.put("total", results.size());
        response.put("page", page);
        response.put("size", size);
        response.put("query", query);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/test")
    public ResponseEntity<Map<String, String>> test() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Search service is working!");
        response.put("version", "1.0.0");
        return ResponseEntity.ok(response);
    }
}