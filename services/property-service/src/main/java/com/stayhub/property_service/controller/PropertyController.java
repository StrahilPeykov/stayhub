package com.stayhub.property_service.controller;

import com.stayhub.property_service.entity.Property;
import com.stayhub.property_service.service.PropertyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/properties")
@RequiredArgsConstructor
public class PropertyController {
    
    private final PropertyService propertyService;
    
    @PostMapping
    public ResponseEntity<Property> createProperty(@RequestBody Property property) {
        Property created = propertyService.createProperty(property);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Property> getProperty(@PathVariable UUID id) {
        return propertyService.getProperty(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping
    public List<Property> getAllProperties(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lon,
            @RequestParam(required = false, defaultValue = "10") Double radius) {
        
        if (lat != null && lon != null) {
            return propertyService.findPropertiesNearby(lat, lon, radius);
        } else if (city != null) {
            return propertyService.findPropertiesByCity(city);
        }
        return propertyService.getAllProperties();
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Property> updateProperty(@PathVariable UUID id, 
                                                 @RequestBody Property property) {
        return propertyService.updateProperty(id, property)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProperty(@PathVariable UUID id) {
        propertyService.deleteProperty(id);
        return ResponseEntity.noContent().build();
    }
}