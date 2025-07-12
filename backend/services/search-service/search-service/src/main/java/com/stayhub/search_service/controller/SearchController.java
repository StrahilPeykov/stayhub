package com.stayhub.search_service.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
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
    
    /**
     * Comprehensive property search endpoint
     */
    @PostMapping("/properties")
    public ResponseEntity<Map<String, Object>> searchPropertiesAdvanced(@RequestBody Map<String, Object> searchRequest) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Forward the comprehensive search request to property service
            String propertyUrl = propertyServiceUrl + "/api/properties/search";
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(searchRequest, headers);
            ResponseEntity<Map> propertyResponse = restTemplate.exchange(
                propertyUrl, HttpMethod.POST, entity, Map.class);
            
            if (propertyResponse.getStatusCode().is2xxSuccessful()) {
                response.put("status", "success");
                response.put("data", propertyResponse.getBody());
                response.put("searchMetadata", Map.of(
                    "searchEngine", "StayHub Search v2.0",
                    "enhancedFiltering", true,
                    "realTimeResults", true
                ));
            } else {
                response.put("status", "error");
                response.put("message", "Property service returned non-success status");
                response.put("data", Map.of("properties", Collections.emptyList()));
            }
            
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "Error searching properties: " + e.getMessage());
            response.put("data", Map.of("properties", Collections.emptyList()));
        }
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Legacy property search endpoint for backward compatibility
     */
    @GetMapping("/properties")
    public ResponseEntity<Map<String, Object>> searchProperties(
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String checkIn,
            @RequestParam(required = false) String checkOut,
            @RequestParam(required = false) Integer guests,
            @RequestParam(required = false) Integer rooms,
            @RequestParam(required = false) Double priceMin,
            @RequestParam(required = false) Double priceMax,
            @RequestParam(required = false) Integer minRooms,
            @RequestParam(required = false) List<String> amenities,
            @RequestParam(required = false) List<String> propertyTypes,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lon,
            @RequestParam(required = false) Double radius,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) Boolean featured,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Build URL with all parameters
            StringBuilder urlBuilder = new StringBuilder(propertyServiceUrl + "/api/properties/search?");
            
            Map<String, Object> params = new HashMap<>();
            if (search != null) params.put("search", search);
            if (location != null && city == null) params.put("city", location); // Map location to city for compatibility
            if (city != null) params.put("city", city);
            if (country != null) params.put("country", country);
            if (checkIn != null) params.put("checkIn", checkIn);
            if (checkOut != null) params.put("checkOut", checkOut);
            if (guests != null) params.put("guests", guests);
            if (rooms != null) params.put("rooms", rooms);
            if (priceMin != null) params.put("minPrice", priceMin);
            if (priceMax != null) params.put("maxPrice", priceMax);
            if (minRooms != null) params.put("minRooms", minRooms);
            if (amenities != null && !amenities.isEmpty()) {
                for (String amenity : amenities) {
                    urlBuilder.append("amenities=").append(amenity).append("&");
                }
            }
            if (propertyTypes != null && !propertyTypes.isEmpty()) {
                for (String type : propertyTypes) {
                    urlBuilder.append("propertyTypes=").append(type).append("&");
                }
            }
            if (lat != null) params.put("lat", lat);
            if (lon != null) params.put("lon", lon);
            if (radius != null) params.put("radius", radius);
            if (minRating != null) params.put("minRating", minRating);
            if (featured != null) params.put("featured", featured);
            
            params.put("page", page);
            params.put("size", size);
            params.put("sortBy", sortBy);
            params.put("sortDirection", sortDirection);
            
            // Build URL
            String propertyUrl = propertyServiceUrl + "/api/properties/search";
            
            // Call property service with GET parameters
            ResponseEntity<Map> propertyResponse = restTemplate.getForEntity(
                propertyUrl + buildQueryString(params), Map.class);
            
            if (propertyResponse.getStatusCode().is2xxSuccessful()) {
                Map<String, Object> propertyData = propertyResponse.getBody();
                
                response.put("status", "success");
                response.put("data", propertyData);
                response.put("query", Map.of(
                    "location", location,
                    "checkIn", checkIn,
                    "checkOut", checkOut,
                    "guests", guests,
                    "rooms", rooms,
                    "filters", params
                ));
                response.put("searchEngine", "StayHub Search Service");
                
            } else {
                response.put("status", "error");
                response.put("message", "Property service returned error");
                response.put("data", Map.of("properties", Collections.emptyList()));
            }
            
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "Error searching properties: " + e.getMessage());
            response.put("data", Map.of("properties", Collections.emptyList()));
            response.put("error_details", e.getClass().getSimpleName());
        }
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get search suggestions for autocomplete
     */
    @GetMapping("/suggestions")
    public ResponseEntity<Map<String, Object>> getSearchSuggestions(
            @RequestParam String query,
            @RequestParam(defaultValue = "10") Integer limit) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Get property suggestions from property service
            String propertyUrl = propertyServiceUrl + "/api/properties/suggestions?query=" + query;
            ResponseEntity<List> propertyResponse = restTemplate.getForEntity(propertyUrl, List.class);
            
            List<Map<String, String>> suggestions = new ArrayList<>();
            
            if (propertyResponse.getStatusCode().is2xxSuccessful() && propertyResponse.getBody() != null) {
                List<String> propertyNames = propertyResponse.getBody();
                for (String name : propertyNames) {
                    suggestions.add(Map.of(
                        "id", UUID.randomUUID().toString(),
                        "name", name,
                        "type", "property"
                    ));
                }
            }
            
            // Add location suggestions
            String[] cities = {"Amsterdam", "Paris", "London", "New York", "Tokyo", "Barcelona", "Dubai", "Singapore"};
            for (String city : cities) {
                if (city.toLowerCase().contains(query.toLowerCase())) {
                    suggestions.add(Map.of(
                        "id", UUID.randomUUID().toString(),
                        "name", city,
                        "type", "city",
                        "country", getCountryForCity(city)
                    ));
                }
            }
            
            // Limit results
            suggestions = suggestions.stream()
                    .limit(limit)
                    .collect(ArrayList::new, (list, item) -> list.add(item), ArrayList::addAll);
            
            response.put("suggestions", suggestions);
            response.put("query", query);
            response.put("count", suggestions.size());
            
        } catch (Exception e) {
            response.put("suggestions", Collections.emptyList());
            response.put("query", query);
            response.put("error", "Failed to fetch suggestions: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get popular search terms
     */
    @GetMapping("/popular")
    public ResponseEntity<Map<String, Object>> getPopularSearches() {
        Map<String, Object> response = new HashMap<>();
        
        // Mock popular searches - in a real system this would come from analytics
        List<Map<String, Object>> popularSearches = Arrays.asList(
            Map.of("term", "Amsterdam hotels", "count", 1245, "trend", "up"),
            Map.of("term", "Paris apartments", "count", 987, "trend", "stable"),
            Map.of("term", "London luxury", "count", 756, "trend", "up"),
            Map.of("term", "Tokyo business hotels", "count", 654, "trend", "down"),
            Map.of("term", "Barcelona beachfront", "count", 543, "trend", "up"),
            Map.of("term", "New York Manhattan", "count", 432, "trend", "stable"),
            Map.of("term", "Dubai resorts", "count", 321, "trend", "up"),
            Map.of("term", "Singapore central", "count", 298, "trend", "stable")
        );
        
        response.put("popularSearches", popularSearches);
        response.put("generatedAt", System.currentTimeMillis());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get search filters and facets
     */
    @GetMapping("/filters")
    public ResponseEntity<Map<String, Object>> getSearchFilters() {
        try {
            // Get facets from property service
            String propertyUrl = propertyServiceUrl + "/api/properties/facets";
            ResponseEntity<Map> propertyResponse = restTemplate.getForEntity(propertyUrl, Map.class);
            
            Map<String, Object> response = new HashMap<>();
            
            if (propertyResponse.getStatusCode().is2xxSuccessful() && propertyResponse.getBody() != null) {
                response.putAll(propertyResponse.getBody());
            }
            
            // Add search-specific filters
            response.put("searchFilters", Map.of(
                "sortOptions", Arrays.asList(
                    Map.of("value", "relevance", "label", "Most Relevant"),
                    Map.of("value", "price", "label", "Price: Low to High"),
                    Map.of("value", "price_desc", "label", "Price: High to Low"),
                    Map.of("value", "rating", "label", "Guest Rating"),
                    Map.of("value", "distance", "label", "Distance"),
                    Map.of("value", "popularity", "label", "Popularity")
                ),
                "radiusOptions", Arrays.asList(1, 5, 10, 25, 50),
                "guestOptions", Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8)
            ));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("error", "Failed to fetch filters"));
        }
    }
    
    // Helper methods
    
    private String buildQueryString(Map<String, Object> params) {
        StringBuilder queryString = new StringBuilder("?");
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            if (entry.getValue() != null) {
                queryString.append(entry.getKey()).append("=").append(entry.getValue()).append("&");
            }
        }
        return queryString.length() > 1 ? queryString.substring(0, queryString.length() - 1) : "";
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