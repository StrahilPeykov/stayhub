package com.stayhub.property_service.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.config.EnableSpringDataWebSupport;

@Configuration
@EnableSpringDataWebSupport
public class SearchConfiguration {
    
    @Bean
    @ConfigurationProperties(prefix = "stayhub.search")
    public SearchProperties searchProperties() {
        return new SearchProperties();
    }
    
    @Bean
    public SearchSortingConfiguration searchSortingConfiguration() {
        return new SearchSortingConfiguration();
    }
    
    public static class SearchProperties {
        private int defaultPageSize = 20;
        private int maxPageSize = 100;
        private int maxRadius = 100; // km
        private int suggestionLimit = 10;
        private boolean enableFullTextSearch = true;
        private boolean enableGeographicSearch = true;
        private boolean enableFacetedSearch = true;
        private long cacheTimeoutMinutes = 5;
        
        // Getters and setters
        public int getDefaultPageSize() { return defaultPageSize; }
        public void setDefaultPageSize(int defaultPageSize) { this.defaultPageSize = defaultPageSize; }
        
        public int getMaxPageSize() { return maxPageSize; }
        public void setMaxPageSize(int maxPageSize) { this.maxPageSize = maxPageSize; }
        
        public int getMaxRadius() { return maxRadius; }
        public void setMaxRadius(int maxRadius) { this.maxRadius = maxRadius; }
        
        public int getSuggestionLimit() { return suggestionLimit; }
        public void setSuggestionLimit(int suggestionLimit) { this.suggestionLimit = suggestionLimit; }
        
        public boolean isEnableFullTextSearch() { return enableFullTextSearch; }
        public void setEnableFullTextSearch(boolean enableFullTextSearch) { this.enableFullTextSearch = enableFullTextSearch; }
        
        public boolean isEnableGeographicSearch() { return enableGeographicSearch; }
        public void setEnableGeographicSearch(boolean enableGeographicSearch) { this.enableGeographicSearch = enableGeographicSearch; }
        
        public boolean isEnableFacetedSearch() { return enableFacetedSearch; }
        public void setEnableFacetedSearch(boolean enableFacetedSearch) { this.enableFacetedSearch = enableFacetedSearch; }
        
        public long getCacheTimeoutMinutes() { return cacheTimeoutMinutes; }
        public void setCacheTimeoutMinutes(long cacheTimeoutMinutes) { this.cacheTimeoutMinutes = cacheTimeoutMinutes; }
    }
    
    public static class SearchSortingConfiguration {
        
        public Sort buildSort(String sortBy, String sortDirection) {
            Sort.Direction direction = "desc".equalsIgnoreCase(sortDirection) 
                ? Sort.Direction.DESC 
                : Sort.Direction.ASC;
            
            return switch (sortBy != null ? sortBy.toLowerCase() : "name") {
                case "price" -> Sort.by(direction, "basePrice");
                case "rating" -> Sort.by(Sort.Direction.DESC, "rating")
                    .and(Sort.by(Sort.Direction.DESC, "reviewCount"))
                    .and(Sort.by(direction, "name"));
                case "popularity" -> Sort.by(Sort.Direction.DESC, "featured")
                    .and(Sort.by(Sort.Direction.DESC, "rating"))
                    .and(Sort.by(Sort.Direction.DESC, "reviewCount"))
                    .and(Sort.by(direction, "name"));
                case "distance" -> Sort.by(direction, "name"); // Distance sorting would be handled differently
                case "created" -> Sort.by(direction, "createdAt");
                case "updated" -> Sort.by(direction, "updatedAt");
                case "rooms" -> Sort.by(direction, "totalRooms");
                case "guests" -> Sort.by(direction, "maxGuests");
                case "name" -> Sort.by(direction, "name");
                default -> Sort.by(Sort.Direction.ASC, "name");
            };
        }
        
        public Pageable buildPageable(int page, int size, String sortBy, String sortDirection, SearchProperties properties) {
            // Validate and constrain parameters
            int validPage = Math.max(0, page);
            int validSize = Math.min(properties.getMaxPageSize(), Math.max(1, size));
            
            Sort sort = buildSort(sortBy, sortDirection);
            return PageRequest.of(validPage, validSize, sort);
        }
        
        public Sort buildDistanceSort(Double latitude, Double longitude) {
            // For distance sorting, we would need to use native queries or a custom sort
            // This is a placeholder that would be implemented with database-specific functions
            return Sort.by(Sort.Direction.ASC, "name"); // Fallback
        }
        
        public Sort buildRelevanceSort(String searchText) {
            // For relevance sorting with full-text search
            // This would be implemented with database-specific ranking functions
            return Sort.by(Sort.Direction.DESC, "rating")
                .and(Sort.by(Sort.Direction.DESC, "reviewCount"))
                .and(Sort.by(Sort.Direction.ASC, "name"));
        }
    }
}