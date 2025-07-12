package com.stayhub.property_service.controller;

import com.stayhub.property_service.dto.PropertyDTO;
import com.stayhub.property_service.dto.PropertySearchRequest;
import com.stayhub.property_service.dto.PropertySearchResponse;
import com.stayhub.property_service.entity.Property;
import com.stayhub.property_service.service.PropertyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/properties")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
@Slf4j
public class PropertyController {
    
    private final PropertyService propertyService;
    
    @PostMapping
    public ResponseEntity<PropertyDTO> createProperty(@RequestBody Property property) {
        try {
            log.info("Creating property: {}", property.getName());
            Property created = propertyService.createProperty(property);
            return ResponseEntity.status(HttpStatus.CREATED).body(mapToDTO(created));
        } catch (Exception e) {
            log.error("Error creating property", e);
            throw e;
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<PropertyDTO> getProperty(@PathVariable UUID id) {
        try {
            log.info("Fetching property: {}", id);
            return propertyService.getProperty(id)
                    .map(property -> ResponseEntity.ok(mapToDTO(property)))
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error fetching property: {}", id, e);
            throw e;
        }
    }
    
    /**
     * Comprehensive property search endpoint with advanced filtering
     */
    @PostMapping("/search")
    public ResponseEntity<PropertySearchResponse> searchProperties(@RequestBody PropertySearchRequest request) {
        try {
            log.info("Searching properties with advanced filters: {}", request);
            PropertySearchResponse response = propertyService.searchProperties(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error searching properties", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(PropertySearchResponse.builder().build());
        }
    }
    
    /**
     * Simple GET endpoint for basic searches (backward compatibility)
     */
    @GetMapping("/search")
    public ResponseEntity<PropertySearchResponse> searchPropertiesGet(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Integer minRooms,
            @RequestParam(required = false) List<String> amenities,
            @RequestParam(required = false) List<String> propertyTypes,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lon,
            @RequestParam(required = false) Double radius,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) Boolean featured,
            @RequestParam(required = false) String checkIn,
            @RequestParam(required = false) String checkOut,
            @RequestParam(required = false) Integer guests,
            @RequestParam(required = false) Integer rooms,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection) {
        
        try {
            log.info("Searching properties with GET params - search: {}, city: {}, lat: {}, lon: {}", 
                    search, city, lat, lon);
            
            PropertySearchRequest request = PropertySearchRequest.builder()
                    .search(search)
                    .city(city)
                    .country(country)
                    .minPrice(minPrice)
                    .maxPrice(maxPrice)
                    .minRooms(minRooms)
                    .amenities(amenities)
                    .propertyTypes(propertyTypes)
                    .latitude(lat)
                    .longitude(lon)
                    .radius(radius)
                    .minRating(minRating)
                    .featured(featured)
                    .checkIn(checkIn)
                    .checkOut(checkOut)
                    .guests(guests)
                    .rooms(rooms)
                    .page(page)
                    .size(size)
                    .sortBy(sortBy)
                    .sortDirection(sortDirection)
                    .build();
            
            PropertySearchResponse response = propertyService.searchProperties(request);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error searching properties with GET", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(PropertySearchResponse.builder().build());
        }
    }
    
    /**
     * Legacy endpoint for backward compatibility
     */
    @GetMapping
    public ResponseEntity<List<PropertyDTO>> getAllProperties(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lon,
            @RequestParam(required = false, defaultValue = "10") Double radius) {
        
        try {
            log.info("Fetching properties with legacy params - city: {}, lat: {}, lon: {}, radius: {}", 
                    city, lat, lon, radius);
            
            List<Property> properties = propertyService.getAllProperties(city, lat, lon, radius);
            
            log.info("Found {} properties", properties.size());
            
            List<PropertyDTO> propertyDTOs = properties.stream()
                    .map(this::mapToDTO)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(propertyDTOs);
            
        } catch (Exception e) {
            log.error("Error fetching properties", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(List.of());
        }
    }
    
    @GetMapping("/featured")
    public ResponseEntity<PropertySearchResponse> getFeaturedProperties(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "6") Integer size) {
        try {
            log.info("Fetching featured properties - page: {}, size: {}", page, size);
            PropertySearchResponse response = propertyService.getFeaturedProperties(page, size);
            log.info("Returning {} featured properties", response.getProperties().size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching featured properties", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(PropertySearchResponse.builder().build());
        }
    }
    
    @GetMapping("/popular")
    public ResponseEntity<PropertySearchResponse> getPopularProperties(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        try {
            log.info("Fetching popular properties - page: {}, size: {}", page, size);
            PropertySearchResponse response = propertyService.getPopularProperties(page, size);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching popular properties", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(PropertySearchResponse.builder().build());
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<PropertyDTO> updateProperty(@PathVariable UUID id, 
                                                 @RequestBody Property property) {
        try {
            log.info("Updating property: {}", id);
            return propertyService.updateProperty(id, property)
                    .map(updated -> ResponseEntity.ok(mapToDTO(updated)))
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error updating property: {}", id, e);
            throw e;
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProperty(@PathVariable UUID id) {
        try {
            log.info("Deleting property: {}", id);
            propertyService.deleteProperty(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Error deleting property: {}", id, e);
            throw e;
        }
    }
    
    @GetMapping("/debug/count")
    public ResponseEntity<String> getPropertyCount() {
        try {
            long count = propertyService.getPropertyCount();
            return ResponseEntity.ok("Total properties in database: " + count);
        } catch (Exception e) {
            log.error("Error getting property count", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }
    
    /**
     * Get property suggestions for autocomplete
     */
    @GetMapping("/suggestions")
    public ResponseEntity<List<String>> getPropertySuggestions(@RequestParam String query) {
        try {
            log.info("Getting property suggestions for query: {}", query);
            
            PropertySearchRequest request = PropertySearchRequest.builder()
                    .search(query)
                    .page(0)
                    .size(10)
                    .build();
            
            PropertySearchResponse response = propertyService.searchProperties(request);
            
            List<String> suggestions = response.getProperties().stream()
                    .map(PropertyDTO::getName)
                    .distinct()
                    .limit(10)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(suggestions);
        } catch (Exception e) {
            log.error("Error getting property suggestions", e);
            return ResponseEntity.ok(List.of());
        }
    }
    
    /**
     * Get property facets for filtering UI
     */
    @GetMapping("/facets")
    public ResponseEntity<Map<String, Object>> getPropertyFacets() {
        try {
            log.info("Getting property facets");
            
            // This would typically involve aggregation queries
            Map<String, Object> facets = new HashMap<>();
            
            // Mock facets for now
            facets.put("cities", List.of("Amsterdam", "Paris", "London", "New York", "Tokyo"));
            facets.put("countries", List.of("Netherlands", "France", "UK", "USA", "Japan"));
            facets.put("amenities", List.of("WiFi", "Parking", "Pool", "Gym", "Restaurant", "Spa"));
            facets.put("propertyTypes", List.of("hotel", "apartment", "villa", "resort", "hostel"));
            facets.put("priceRanges", Map.of(
                "0-100", 120,
                "100-200", 95,
                "200-500", 67,
                "500+", 23
            ));
            
            return ResponseEntity.ok(facets);
        } catch (Exception e) {
            log.error("Error getting property facets", e);
            return ResponseEntity.ok(Map.of());
        }
    }
    
    private PropertyDTO mapToDTO(Property property) {
        PropertyDTO dto = new PropertyDTO();
        dto.setId(property.getId());
        dto.setName(property.getName());
        dto.setDescription(property.getDescription());
        
        // Map address
        PropertyDTO.AddressDTO address = new PropertyDTO.AddressDTO();
        address.setStreet(property.getStreet());
        address.setCity(property.getCity());
        address.setState(property.getState());
        address.setCountry(property.getCountry());
        address.setZipCode(property.getZipCode());
        dto.setAddress(address);
        
        dto.setLatitude(property.getLatitude());
        dto.setLongitude(property.getLongitude());
        dto.setAmenities(property.getAmenities());
        dto.setTotalRooms(property.getTotalRooms());
        dto.setBasePrice(property.getBasePrice());
        dto.setCurrency(property.getCurrency());
        
        // Add default images if none exist
        if (dto.getImages() == null || dto.getImages().isEmpty()) {
            PropertyDTO.PropertyImageDTO defaultImage = new PropertyDTO.PropertyImageDTO();
            defaultImage.setId("1");
            defaultImage.setUrl("https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop&crop=center&auto=format&q=80");
            defaultImage.setAlt(property.getName());
            defaultImage.setIsPrimary(true);
            dto.setImages(List.of(defaultImage));
        }
        
        // Add mock rating for now
        dto.setRating(4.0 + Math.random());
        dto.setReviewCount((int)(Math.random() * 500) + 50);
        
        return dto;
    }
}
