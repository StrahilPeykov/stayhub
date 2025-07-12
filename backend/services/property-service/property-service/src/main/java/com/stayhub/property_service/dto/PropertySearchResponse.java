package com.stayhub.property_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PropertySearchResponse {
    
    private List<PropertyDTO> properties;
    private PaginationInfo pagination;
    private SearchMetadata metadata;
    private Map<String, Object> facets; // For aggregations like price ranges, amenity counts, etc.
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaginationInfo {
        private int currentPage;
        private int pageSize;
        private long totalElements;
        private int totalPages;
        private boolean hasNext;
        private boolean hasPrevious;
        private boolean isFirst;
        private boolean isLast;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SearchMetadata {
        private String query;
        private long searchTimeMs;
        private int resultsCount;
        private String sortBy;
        private String sortDirection;
        private Map<String, Object> appliedFilters;
        private List<String> suggestions; // Search suggestions for empty results
    }
}