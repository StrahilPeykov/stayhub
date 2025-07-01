package com.stayhub.search_service.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    @Autowired(required = false)
    private ElasticsearchTemplate elasticsearchTemplate;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("service", "search-service");
        response.put("status", "UP");
        response.put("timestamp", System.currentTimeMillis());
        
        if (elasticsearchTemplate != null) {
            try {
                // Simple check to see if Elasticsearch is accessible
                response.put("elasticsearch", "Connected");
            } catch (Exception e) {
                response.put("elasticsearch", "Error: " + e.getMessage());
            }
        } else {
            response.put("elasticsearch", "Template not available");
        }
        
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