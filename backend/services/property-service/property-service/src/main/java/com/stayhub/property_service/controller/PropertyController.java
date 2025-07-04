package com.stayhub.property_service.controller;

import com.stayhub.property_service.entity.Property;
import com.stayhub.property_service.service.PropertyService;
import com.stayhub.property_service.dto.PropertyDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/properties")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class PropertyController {
    
    private final PropertyService propertyService;
    
    @PostMapping
    public ResponseEntity<PropertyDTO> createProperty(@RequestBody Property property) {
        Property created = propertyService.createProperty(property);
        return ResponseEntity.status(HttpStatus.CREATED).body(mapToDTO(created));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<PropertyDTO> getProperty(@PathVariable UUID id) {
        return propertyService.getProperty(id)
                .map(property -> ResponseEntity.ok(mapToDTO(property)))
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping
    public List<PropertyDTO> getAllProperties(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lon,
            @RequestParam(required = false, defaultValue = "10") Double radius) {
        
        List<Property> properties;
        if (lat != null && lon != null) {
            properties = propertyService.findPropertiesNearby(lat, lon, radius);
        } else if (city != null) {
            properties = propertyService.findPropertiesByCity(city);
        } else {
            properties = propertyService.getAllProperties();
        }
        
        return properties.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }
    
    @GetMapping("/featured")
    public List<PropertyDTO> getFeaturedProperties() {
        List<Property> properties = propertyService.getAllProperties();
        return properties.stream()
                .limit(6) // Return first 6 as featured for now
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<PropertyDTO> updateProperty(@PathVariable UUID id, 
                                                 @RequestBody Property property) {
        return propertyService.updateProperty(id, property)
                .map(updated -> ResponseEntity.ok(mapToDTO(updated)))
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProperty(@PathVariable UUID id) {
        propertyService.deleteProperty(id);
        return ResponseEntity.noContent().build();
    }
    
    private PropertyDTO mapToDTO(Property property) {
        PropertyDTO dto = new PropertyDTO();
        dto.setId(property.getId());
        dto.setName(property.getName());
        dto.setDescription(property.getDescription());
        
        // Map address
        PropertyDTO.AddressDTO address = new PropertyDTO.AddressDTO();
        address.setStreet(property.getAddress().getStreet());
        address.setCity(property.getAddress().getCity());
        address.setState(property.getAddress().getState());
        address.setCountry(property.getAddress().getCountry());
        address.setZipCode(property.getAddress().getZipCode());
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
        dto.setRating(4.0 + Math.random()); // Random rating between 4.0 and 5.0
        dto.setReviewCount((int)(Math.random() * 500) + 50); // Random review count
        
        return dto;
    }
}