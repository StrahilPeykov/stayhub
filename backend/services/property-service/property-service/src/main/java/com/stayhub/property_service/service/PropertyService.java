package com.stayhub.property_service.service;

import com.stayhub.property_service.entity.Property;
import com.stayhub.property_service.event.PropertyEventPublisher;
import com.stayhub.property_service.repository.PropertyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
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
    private final PropertyEventPublisher eventPublisher;
    
    @Transactional
    @CacheEvict(value = {"properties", "propertyList"}, allEntries = true)
    public Property createProperty(Property property) {
        log.info("Creating new property: {}", property.getName());
        Property saved = propertyRepository.save(property);
        eventPublisher.publishPropertyCreated(saved);
        return saved;
    }
    
    @Cacheable(value = "properties", key = "#id")
    public Optional<Property> getProperty(UUID id) {
        log.debug("Fetching property: {}", id);
        return propertyRepository.findById(id);
    }
    
    @Cacheable(value = "propertyList")
    public List<Property> getAllProperties() {
        log.debug("Fetching all properties");
        return propertyRepository.findAll();
    }
    
    @Cacheable(value = "propertiesByCity", key = "#city")
    public List<Property> findPropertiesByCity(String city) {
        log.debug("Fetching properties for city: {}", city);
        return propertyRepository.findByAddressCity(city);
    }
    
    @Cacheable(value = "nearbyProperties", key = "#latitude + '_' + #longitude + '_' + #radius")
    public List<Property> findPropertiesNearby(Double latitude, Double longitude, Double radius) {
        log.debug("Fetching properties near: {}, {} within {} km", latitude, longitude, radius);
        return propertyRepository.findPropertiesWithinRadius(latitude, longitude, radius);
    }
    
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "properties", key = "#id"),
        @CacheEvict(value = {"propertyList", "propertiesByCity", "nearbyProperties"}, allEntries = true)
    })
    public Optional<Property> updateProperty(UUID id, Property propertyUpdate) {
        log.info("Updating property: {}", id);
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
                    Property updated = propertyRepository.save(existing);
                    eventPublisher.publishPropertyUpdated(updated);
                    return updated;
                });
    }
    
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "properties", key = "#id"),
        @CacheEvict(value = {"propertyList", "propertiesByCity", "nearbyProperties"}, allEntries = true)
    })
    public void deleteProperty(UUID id) {
        log.info("Deleting property: {}", id);
        propertyRepository.findById(id).ifPresent(property -> {
            propertyRepository.deleteById(id);
            eventPublisher.publishPropertyDeleted(property);
        });
    }
}
