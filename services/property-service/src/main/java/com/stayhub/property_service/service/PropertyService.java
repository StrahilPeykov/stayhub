package com.stayhub.property_service.service;

import com.stayhub.property_service.entity.Property;
import com.stayhub.property_service.repository.PropertyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PropertyService {
    
    private final PropertyRepository propertyRepository;
    
    @Transactional
    public Property createProperty(Property property) {
        log.info("Creating new property: {}", property.getName());
        return propertyRepository.save(property);
    }
    
    public Optional<Property> getProperty(UUID id) {
        return propertyRepository.findById(id);
    }
    
    public List<Property> getAllProperties() {
        return propertyRepository.findAll();
    }
    
    public List<Property> findPropertiesByCity(String city) {
        return propertyRepository.findByAddressCity(city);
    }
    
    public List<Property> findPropertiesNearby(Double latitude, Double longitude, Double radius) {
        return propertyRepository.findPropertiesWithinRadius(latitude, longitude, radius);
    }
    
    @Transactional
    public Optional<Property> updateProperty(UUID id, Property propertyUpdate) {
        return propertyRepository.findById(id)
                .map(existing -> {
                    existing.setName(propertyUpdate.getName());
                    existing.setDescription(propertyUpdate.getDescription());
                    existing.setAddress(propertyUpdate.getAddress());
                    existing.setAmenities(propertyUpdate.getAmenities());
                    existing.setTotalRooms(propertyUpdate.getTotalRooms());
                    existing.setBasePrice(propertyUpdate.getBasePrice());
                    existing.setLatitude(propertyUpdate.getLatitude());
                    existing.setLongitude(propertyUpdate.getLongitude());
                    return propertyRepository.save(existing);
                });
    }
    
    @Transactional
    public void deleteProperty(UUID id) {
        propertyRepository.deleteById(id);
    }
}