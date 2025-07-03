package com.stayhub.property_service.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {
    
    @Bean
    public CacheManager cacheManager() {
        // Use simple in-memory cache since Redis is not available
        return new ConcurrentMapCacheManager("properties", "propertyList", "propertiesByCity", "nearbyProperties");
    }
}
