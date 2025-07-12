package com.stayhub.property_service.service;

import com.stayhub.property_service.dto.*;
import com.stayhub.property_service.entity.Property;
import com.stayhub.property_service.event.PropertyEventPublisher;
import com.stayhub.property_service.repository.PropertyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

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
    
    /**
     * Comprehensive property search with filtering, pagination, and sorting
     */
    public PropertySearchResponse searchProperties(PropertySearchRequest request) {
        long startTime = System.currentTimeMillis();
        
        log.info("Searching properties with request: {}", request);
        
        // Build pageable with sorting
        Pageable pageable = buildPageable(request);
        
        // Use JPA Specification for complex queries
        Specification<Property> spec = PropertySearchSpecification.buildSpecification(request);
        
        // Add availability check if dates provided
        if (StringUtils.hasText(request.getCheckIn()) && StringUtils.hasText(request.getCheckOut())) {
            spec = spec.and(PropertySearchSpecification.withAvailability(
                request.getCheckIn(), request.getCheckOut(), 
                request.getRooms(), request.getGuests()));
        }
        
        // Execute search with specification
        Page<Property> propertyPage = propertyRepository.findAll(spec, pageable);
        
        long searchTime = System.currentTimeMillis() - startTime;
        
        // Convert to DTOs
        List<PropertyDTO> propertyDTOs = propertyPage.getContent().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
        
        // Build response
        return PropertySearchResponse.builder()
                .properties(propertyDTOs)
                .pagination(buildPaginationInfo(propertyPage))
                .metadata(buildSearchMetadata(request, propertyPage, searchTime))
                .facets(buildFacets(request, propertyPage))
                .build();
    }
    
    /**
     * Simple property listing with basic filters (for backward compatibility)
     */
    @Cacheable(value = "propertyList", key = "#city + '_' + #lat + '_' + #lon + '_' + #radius")
    public List<Property> getAllProperties(String city, Double lat, Double lon, Double radius) {
        log.debug("Fetching properties with basic filters - city: {}, coordinates: {},{}, radius: {}", 
                city, lat, lon, radius);
        
        try {
            if (lat != null && lon != null && radius != null) {
                Page<Property> page = propertyRepository.findPropertiesWithinRadius(lat, lon, radius, PageRequest.of(0, 100));
                return page.getContent();
            } else if (StringUtils.hasText(city)) {
                Page<Property> page = propertyRepository.findByCityIgnoreCaseContaining(city, PageRequest.of(0, 100));
                return page.getContent();
            } else {
                List<Property> properties = propertyRepository.findAll();
                log.info("Found {} properties in database", properties.size());
                return properties;
            }
        } catch (Exception e) {
            log.error("Error fetching properties", e);
            throw e;
        }
    }
    
    /**
     * Get featured properties with pagination
     */
    public PropertySearchResponse getFeaturedProperties(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Property> propertyPage = propertyRepository.findFeaturedProperties(pageable);
        
        List<PropertyDTO> propertyDTOs = propertyPage.getContent().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
        
        return PropertySearchResponse.builder()
                .properties(propertyDTOs)
                .pagination(buildPaginationInfo(propertyPage))
                .build();
    }
    
    /**
     * Get popular properties
     */
    public PropertySearchResponse getPopularProperties(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Property> propertyPage = propertyRepository.findPopularProperties(pageable);
        
        List<PropertyDTO> propertyDTOs = propertyPage.getContent().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
        
        return PropertySearchResponse.builder()
                .properties(propertyDTOs)
                .pagination(buildPaginationInfo(propertyPage))
                .build();
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
                    updatePropertyFields(existing, propertyUpdate);
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
    
    public long getPropertyCount() {
        try {
            long count = propertyRepository.count();
            log.info("Total properties in database: {}", count);
            return count;
        } catch (Exception e) {
            log.error("Error getting property count", e);
            throw e;
        }
    }
    
    // Helper methods
    
    private boolean isComprehensiveSearch(PropertySearchRequest request) {
        return (StringUtils.hasText(request.getSearch()) ||
                StringUtils.hasText(request.getCity()) ||
                StringUtils.hasText(request.getCountry()) ||
                request.getMinPrice() != null ||
                request.getMaxPrice() != null ||
                request.getMinRooms() != null ||
                (request.getAmenities() != null && !request.getAmenities().isEmpty()) ||
                (request.getPropertyTypes() != null && !request.getPropertyTypes().isEmpty()) ||
                (request.getLatitude() != null && request.getLongitude() != null));
    }
    
    private Page<Property> performOptimizedSearch(PropertySearchRequest request, Pageable pageable) {
        // Use specific optimized queries for simpler cases
        
        if (request.getFeatured() != null && request.getFeatured()) {
            return propertyRepository.findFeaturedProperties(pageable);
        }
        
        if (request.getLatitude() != null && request.getLongitude() != null) {
            double radius = request.getRadius() != null ? request.getRadius() : 10.0;
            return propertyRepository.findPropertiesWithinRadius(
                request.getLatitude(), request.getLongitude(), radius, pageable);
        }
        
        if (StringUtils.hasText(request.getCity())) {
            return propertyRepository.findByCityIgnoreCaseContaining(request.getCity(), pageable);
        }
        
        if (request.getMinPrice() != null || request.getMaxPrice() != null) {
            return propertyRepository.findByBasePriceBetween(
                request.getMinPrice(), request.getMaxPrice(), pageable);
        }
        
        if (request.getAmenities() != null && !request.getAmenities().isEmpty()) {
            if (request.getAmenityMatchType() == PropertySearchRequest.AmenityMatchType.ALL) {
                return propertyRepository.findByAllAmenities(
                    request.getAmenities(), request.getAmenities().size(), pageable);
            } else {
                return propertyRepository.findByAnyAmenities(request.getAmenities(), pageable);
            }
        }
        
        if (StringUtils.hasText(request.getSearch())) {
            return propertyRepository.findByNameOrDescriptionContaining(request.getSearch(), pageable);
        }
        
        // Default: return all properties
        return propertyRepository.findAll(pageable);
    }
    
    private Pageable buildPageable(PropertySearchRequest request) {
        int page = Math.max(0, request.getPage());
        int size = Math.min(100, Math.max(1, request.getSize())); // Limit page size
        
        Sort sort = buildSort(request.getSortBy(), request.getSortDirection());
        return PageRequest.of(page, size, sort);
    }
    
    private Sort buildSort(String sortBy, String sortDirection) {
        Sort.Direction direction = "desc".equalsIgnoreCase(sortDirection) 
            ? Sort.Direction.DESC 
            : Sort.Direction.ASC;
        
        return switch (sortBy != null ? sortBy.toLowerCase() : "name") {
            case "price" -> Sort.by(direction, "basePrice");
            case "rating" -> Sort.by(Sort.Direction.DESC, "rating").and(Sort.by(direction, "name"));
            case "popularity" -> Sort.by(Sort.Direction.DESC, "featured").and(Sort.by(direction, "name"));
            case "distance" -> Sort.by(direction, "name"); // Would need geo sorting for real distance
            case "created" -> Sort.by(direction, "createdAt");
            case "rooms" -> Sort.by(direction, "totalRooms");
            default -> Sort.by(direction, "name");
        };
    }
    
    private PropertySearchResponse.PaginationInfo buildPaginationInfo(Page<Property> page) {
        return PropertySearchResponse.PaginationInfo.builder()
                .currentPage(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .hasNext(page.hasNext())
                .hasPrevious(page.hasPrevious())
                .isFirst(page.isFirst())
                .isLast(page.isLast())
                .build();
    }
    
    private PropertySearchResponse.SearchMetadata buildSearchMetadata(
            PropertySearchRequest request, Page<Property> page, long searchTime) {
        
        Map<String, Object> appliedFilters = new HashMap<>();
        if (StringUtils.hasText(request.getSearch())) appliedFilters.put("search", request.getSearch());
        if (StringUtils.hasText(request.getCity())) appliedFilters.put("city", request.getCity());
        if (request.getMinPrice() != null) appliedFilters.put("minPrice", request.getMinPrice());
        if (request.getMaxPrice() != null) appliedFilters.put("maxPrice", request.getMaxPrice());
        if (request.getAmenities() != null) appliedFilters.put("amenities", request.getAmenities());
        if (request.getPropertyTypes() != null) appliedFilters.put("propertyTypes", request.getPropertyTypes());
        
        return PropertySearchResponse.SearchMetadata.builder()
                .query(request.getSearch())
                .searchTimeMs(searchTime)
                .resultsCount((int) page.getTotalElements())
                .sortBy(request.getSortBy())
                .sortDirection(request.getSortDirection())
                .appliedFilters(appliedFilters)
                .suggestions(page.isEmpty() ? generateSearchSuggestions(request) : Collections.emptyList())
                .build();
    }
    
    private Map<String, Object> buildFacets(PropertySearchRequest request, Page<Property> page) {
        // This would typically involve separate aggregation queries
        // For now, return basic facets
        Map<String, Object> facets = new HashMap<>();
        
        // Price range facets (would need aggregation query)
        Map<String, Integer> priceRanges = new HashMap<>();
        priceRanges.put("0-100", 0);
        priceRanges.put("100-200", 0);
        priceRanges.put("200-500", 0);
        priceRanges.put("500+", 0);
        facets.put("priceRanges", priceRanges);
        
        // Amenity facets (would need aggregation query)
        Map<String, Integer> amenities = new HashMap<>();
        amenities.put("WiFi", 0);
        amenities.put("Parking", 0);
        amenities.put("Pool", 0);
        amenities.put("Gym", 0);
        facets.put("amenities", amenities);
        
        return facets;
    }
    
    private List<String> generateSearchSuggestions(PropertySearchRequest request) {
        // Generate search suggestions for empty results
        return Arrays.asList(
            "Try searching for a different city",
            "Adjust your price range",
            "Remove some filters",
            "Try 'hotel', 'apartment', or 'villa'"
        );
    }
    
    private void updatePropertyFields(Property existing, Property update) {
        if (update.getName() != null) existing.setName(update.getName());
        if (update.getDescription() != null) existing.setDescription(update.getDescription());
        if (update.getStreet() != null) existing.setStreet(update.getStreet());
        if (update.getCity() != null) existing.setCity(update.getCity());
        if (update.getState() != null) existing.setState(update.getState());
        if (update.getCountry() != null) existing.setCountry(update.getCountry());
        if (update.getZipCode() != null) existing.setZipCode(update.getZipCode());
        if (update.getAmenities() != null) existing.setAmenities(update.getAmenities());
        if (update.getTotalRooms() != null) existing.setTotalRooms(update.getTotalRooms());
        if (update.getBasePrice() != null) existing.setBasePrice(update.getBasePrice());
        if (update.getLatitude() != null) existing.setLatitude(update.getLatitude());
        if (update.getLongitude() != null) existing.setLongitude(update.getLongitude());
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
