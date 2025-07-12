package com.stayhub.property_service.specification;

import com.stayhub.property_service.dto.PropertySearchRequest;
import com.stayhub.property_service.entity.Property;
import jakarta.persistence.criteria.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Slf4j
public class PropertySearchSpecification {
    
    public static Specification<Property> buildSpecification(PropertySearchRequest request) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // Only active and public properties
            predicates.add(criteriaBuilder.equal(root.get("isActive"), true));
            predicates.add(criteriaBuilder.equal(root.get("status"), Property.PropertyStatus.ACTIVE));
            predicates.add(criteriaBuilder.equal(root.get("visibility"), Property.PropertyVisibility.PUBLIC));
            
            // Text search
            if (StringUtils.hasText(request.getSearch())) {
                addTextSearchPredicate(predicates, root, criteriaBuilder, request.getSearch());
            }
            
            // Location filters
            if (StringUtils.hasText(request.getCity())) {
                predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("city")),
                    "%" + request.getCity().toLowerCase() + "%"
                ));
            }
            
            if (StringUtils.hasText(request.getCountry())) {
                predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("country")),
                    "%" + request.getCountry().toLowerCase() + "%"
                ));
            }
            
            // Geographic radius search
            if (request.getLatitude() != null && request.getLongitude() != null && request.getRadius() != null) {
                addRadiusSearchPredicate(predicates, root, criteriaBuilder, 
                    request.getLatitude(), request.getLongitude(), request.getRadius());
            }
            
            // Price range
            if (request.getMinPrice() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("basePrice"), request.getMinPrice()));
            }
            
            if (request.getMaxPrice() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("basePrice"), request.getMaxPrice()));
            }
            
            // Property characteristics
            if (request.getMinRooms() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("totalRooms"), request.getMinRooms()));
            }
            
            if (request.getPropertyTypes() != null && !request.getPropertyTypes().isEmpty()) {
                List<Property.PropertyType> propertyTypes = request.getPropertyTypes().stream()
                    .map(type -> {
                        try {
                            return Property.PropertyType.valueOf(type.toUpperCase());
                        } catch (IllegalArgumentException e) {
                            log.warn("Invalid property type: {}", type);
                            return null;
                        }
                    })
                    .filter(type -> type != null)
                    .toList();
                
                if (!propertyTypes.isEmpty()) {
                    predicates.add(root.get("propertyType").in(propertyTypes));
                }
            }
            
            // Rating filter
            if (request.getMinRating() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("rating"), request.getMinRating()));
            }
            
            // Boolean features
            if (request.getFeatured() != null && request.getFeatured()) {
                predicates.add(criteriaBuilder.equal(root.get("featured"), true));
            }
            
            if (request.getInstantBooking() != null && request.getInstantBooking()) {
                predicates.add(criteriaBuilder.equal(root.get("instantBooking"), true));
            }
            
            // Amenities filter
            if (request.getAmenities() != null && !request.getAmenities().isEmpty()) {
                addAmenitiesFilter(predicates, root, query, criteriaBuilder, request);
            }
            
            // Guest capacity
            if (request.getGuests() != null && request.getGuests() > 0) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("maxGuests"), request.getGuests()));
            }
            
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
    
    private static void addTextSearchPredicate(List<Predicate> predicates, Root<Property> root, 
                                             CriteriaBuilder cb, String searchText) {
        String searchPattern = "%" + searchText.toLowerCase() + "%";
        
        List<Predicate> textPredicates = new ArrayList<>();
        textPredicates.add(cb.like(cb.lower(root.get("name")), searchPattern));
        textPredicates.add(cb.like(cb.lower(root.get("description")), searchPattern));
        textPredicates.add(cb.like(cb.lower(root.get("city")), searchPattern));
        textPredicates.add(cb.like(cb.lower(root.get("country")), searchPattern));
        textPredicates.add(cb.like(cb.lower(root.get("street")), searchPattern));
        
        predicates.add(cb.or(textPredicates.toArray(new Predicate[0])));
    }
    
    /**
     * Fixed radius search predicate using bounding box approach
     * This avoids the Jakarta Persistence Expression<T> type issues
     */
    private static void addRadiusSearchPredicate(List<Predicate> predicates, Root<Property> root,
                                               CriteriaBuilder cb, Double lat, Double lon, Double radius) {
        
        // Add null checks first
        predicates.add(cb.isNotNull(root.get("latitude")));
        predicates.add(cb.isNotNull(root.get("longitude")));
        
        // Calculate approximate bounding box (fast and avoids complex function expressions)
        // This is an approximation but avoids the Expression<T> type issues
        double latDelta = radius / 111.0; // 1 degree latitude ≈ 111 km
        double lonDelta = radius / (111.0 * Math.cos(Math.toRadians(lat))); // adjust for longitude
        
        double minLat = lat - latDelta;
        double maxLat = lat + latDelta;
        double minLon = lon - lonDelta;
        double maxLon = lon + lonDelta;
        
        // Create simple bounding box predicates
        predicates.add(cb.between(root.get("latitude"), minLat, maxLat));
        predicates.add(cb.between(root.get("longitude"), minLon, maxLon));
        
        // Note: This is an approximation using a bounding box instead of exact circular distance.
        // For exact Haversine distance calculation, we would typically use:
        // 1. A native query with database-specific functions (PostGIS for PostgreSQL)
        // 2. Filter results in memory after retrieval
        // 3. Use a spatial database extension
    }
    
    private static void addAmenitiesFilter(List<Predicate> predicates, Root<Property> root,
                                         CriteriaQuery<?> query, CriteriaBuilder cb,
                                         PropertySearchRequest request) {
        
        // Join with amenities table
        Join<Property, String> amenitiesJoin = root.join("amenities", JoinType.INNER);
        
        if (request.getAmenityMatchType() == PropertySearchRequest.AmenityMatchType.ALL) {
            // Property must have ALL specified amenities
            Subquery<Long> amenitySubquery = query.subquery(Long.class);
            Root<Property> subRoot = amenitySubquery.from(Property.class);
            Join<Property, String> subAmenitiesJoin = subRoot.join("amenities", JoinType.INNER);
            
            amenitySubquery.select(cb.count(subAmenitiesJoin))
                .where(
                    cb.equal(subRoot.get("id"), root.get("id")),
                    subAmenitiesJoin.in(request.getAmenities())
                );
            
            predicates.add(cb.equal(amenitySubquery, (long) request.getAmenities().size()));
        } else {
            // Property must have ANY of the specified amenities (default)
            predicates.add(amenitiesJoin.in(request.getAmenities()));
        }
    }
    
    /**
     * Build specification for availability check
     * This would integrate with booking service to check actual availability
     */
    public static Specification<Property> withAvailability(String checkIn, String checkOut, 
                                                          Integer rooms, Integer guests) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // Basic capacity check
            if (guests != null && guests > 0) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("maxGuests"), guests));
            }
            
            if (rooms != null && rooms > 0) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("totalRooms"), rooms));
            }
            
            // TODO: Add actual availability check by calling booking service
            // This would require a subquery or join with booking data
            
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
    
    /**
     * Build specification for enhanced text search using full-text search capabilities
     */
    public static Specification<Property> withFullTextSearch(String searchText) {
        return (root, query, criteriaBuilder) -> {
            if (!StringUtils.hasText(searchText)) {
                return criteriaBuilder.conjunction();
            }
            
            // For databases that support full-text search, you can implement this
            // For now, we'll use the basic text search approach
            String searchPattern = "%" + searchText.toLowerCase() + "%";
            
            List<Predicate> textPredicates = new ArrayList<>();
            textPredicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), searchPattern));
            textPredicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), searchPattern));
            textPredicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("city")), searchPattern));
            textPredicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("country")), searchPattern));
            
            return criteriaBuilder.or(textPredicates.toArray(new Predicate[0]));
        };
    }
    
    /**
     * Build specification for trending/popular properties
     */
    public static Specification<Property> withPopularityScore() {
        return (root, query, criteriaBuilder) -> {
            // Calculate popularity score based on rating, review count, and featured status
            // This is a simplified version - in reality, you'd have more complex scoring
            
            // For now, just ensure properties have ratings and reviews
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(criteriaBuilder.isNotNull(root.get("rating")));
            predicates.add(criteriaBuilder.greaterThan(root.get("reviewCount"), 0));
            
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
    
    /**
     * Build specification for properties within a specific price range
     */
    public static Specification<Property> withPriceRange(BigDecimal minPrice, BigDecimal maxPrice) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            if (minPrice != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("basePrice"), minPrice));
            }
            
            if (maxPrice != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("basePrice"), maxPrice));
            }
            
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
    
    /**
     * Build specification for properties with specific amenities
     */
    public static Specification<Property> withAmenities(List<String> amenities, boolean requireAll) {
        return (root, query, criteriaBuilder) -> {
            if (amenities == null || amenities.isEmpty()) {
                return criteriaBuilder.conjunction();
            }
            
            Join<Property, String> amenitiesJoin = root.join("amenities", JoinType.INNER);
            
            if (requireAll) {
                // Property must have ALL specified amenities
                Subquery<Long> amenitySubquery = query.subquery(Long.class);
                Root<Property> subRoot = amenitySubquery.from(Property.class);
                Join<Property, String> subAmenitiesJoin = subRoot.join("amenities", JoinType.INNER);
                
                amenitySubquery.select(criteriaBuilder.count(subAmenitiesJoin))
                    .where(
                        criteriaBuilder.equal(subRoot.get("id"), root.get("id")),
                        subAmenitiesJoin.in(amenities)
                    );
                
                return criteriaBuilder.equal(amenitySubquery, (long) amenities.size());
            } else {
                // Property must have ANY of the specified amenities
                return amenitiesJoin.in(amenities);
            }
        };
    }
    
    /**
     * Build specification for properties of specific types
     */
    public static Specification<Property> withPropertyTypes(List<String> propertyTypes) {
        return (root, query, criteriaBuilder) -> {
            if (propertyTypes == null || propertyTypes.isEmpty()) {
                return criteriaBuilder.conjunction();
            }
            
            List<Property.PropertyType> validTypes = propertyTypes.stream()
                .map(type -> {
                    try {
                        return Property.PropertyType.valueOf(type.toUpperCase());
                    } catch (IllegalArgumentException e) {
                        log.warn("Invalid property type: {}", type);
                        return null;
                    }
                })
                .filter(type -> type != null)
                .toList();
            
            if (validTypes.isEmpty()) {
                return criteriaBuilder.conjunction();
            }
            
            return root.get("propertyType").in(validTypes);
        };
    }
}
