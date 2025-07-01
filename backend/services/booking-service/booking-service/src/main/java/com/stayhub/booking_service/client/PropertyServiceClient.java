package com.stayhub.booking_service.client;

import com.stayhub.booking_service.dto.PropertyDTO;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class PropertyServiceClient {
    
    private final RestTemplate restTemplate;
    
    @Value("${services.property.url:http://localhost:8081}")
    private String propertyServiceUrl;
    
    @CircuitBreaker(name = "property-service", fallbackMethod = "getPropertyFallback")
    @Retry(name = "property-service")
    @Cacheable(value = "properties", key = "#propertyId")
    public PropertyDTO getProperty(UUID propertyId) {
        log.debug("Fetching property details for: {}", propertyId);
        
        try {
            String url = propertyServiceUrl + "/api/properties/" + propertyId;
            PropertyDTO property = restTemplate.getForObject(url, PropertyDTO.class);
            log.debug("Successfully fetched property: {}", propertyId);
            return property;
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
                log.error("Property not found: {}", propertyId);
                throw new RuntimeException("Property not found: " + propertyId);
            }
            throw e;
        }
    }
    
    public PropertyDTO getPropertyFallback(UUID propertyId, Exception ex) {
        log.warn("Falling back for property: {} due to: {}", propertyId, ex.getMessage());
        
        // Return a basic property object or fetch from cache
        return PropertyDTO.builder()
                .id(propertyId)
                .name("Property Information Temporarily Unavailable")
                .description("Unable to fetch property details at this moment")
                .build();
    }
}