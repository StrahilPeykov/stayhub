package com.stayhub.search_service.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@RestController
@RequestMapping("/api/search")
@CrossOrigin(origins = "*", maxAge = 3600)
public class SearchController {

    @Value("${services.property.url:http://localhost:8081}")
    private String propertyServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("service", "search-service");
        response.put("status", "UP");
        response.put("timestamp", System.currentTimeMillis());
        response.put("message", "Search service is operational");
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/test")
    public ResponseEntity<Map<String, String>> test() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Search service is working!");
        response.put("version", "1.0.0");
        response.put("propertyServiceUrl", propertyServiceUrl);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/properties")
    public ResponseEntity<Map<String, Object>> searchProperties(
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String checkIn,
            @RequestParam(required = false) String checkOut,
            @RequestParam(required = false) Integer guests,
            @RequestParam(required = false) Double priceMin,
            @RequestParam(required = false) Double priceMax) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // For now, delegate to property service
            String propertyUrl = propertyServiceUrl + "/api/properties";
            if (location != null && !location.isEmpty()) {
                propertyUrl += "?city=" + location;
            }
            
            // Call property service
            Object properties = restTemplate.getForObject(propertyUrl, Object.class);
            
            response.put("data", properties);
            response.put("total", properties instanceof List ? ((List<?>) properties).size() : 0);
            response.put("query", Map.of(
                "location", location,
                "checkIn", checkIn,
                "checkOut", checkOut,
                "guests", guests
            ));
            response.put("status", "success");
            
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "Error searching properties: " + e.getMessage());
            response.put("data", Collections.emptyList());
        }
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/suggestions")
    public ResponseEntity<Map<String, Object>> getSearchSuggestions(
            @RequestParam String query) {
        
        Map<String, Object> response = new HashMap<>();
        
        // Mock suggestions for now
        List<Map<String, String>> suggestions = new ArrayList<>();
        
        String[] cities = {"Amsterdam", "Paris", "London", "New York", "Tokyo", "Barcelona", "Dubai", "Singapore"};
        
        for (String city : cities) {
            if (city.toLowerCase().contains(query.toLowerCase())) {
                Map<String, String> suggestion = new HashMap<>();
                suggestion.put("id", UUID.randomUUID().toString());
                suggestion.put("name", city);
                suggestion.put("type", "city");
                suggestion.put("country", getCountryForCity(city));
                suggestions.add(suggestion);
            }
        }
        
        response.put("suggestions", suggestions);
        response.put("query", query);
        
        return ResponseEntity.ok(response);
    }
    
    private String getCountryForCity(String city) {
        Map<String, String> cityCountry = Map.of(
            "Amsterdam", "Netherlands",
            "Paris", "France",
            "London", "United Kingdom",
            "New York", "United States",
            "Tokyo", "Japan",
            "Barcelona", "Spain",
            "Dubai", "UAE",
            "Singapore", "Singapore"
        );
        return cityCountry.getOrDefault(city, "Unknown");
    }
}