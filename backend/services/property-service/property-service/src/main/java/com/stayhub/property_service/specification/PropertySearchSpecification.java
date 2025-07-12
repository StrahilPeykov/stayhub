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
    
    private static void addRadiusSearchPredicate(List<Predicate> predicates, Root<Property> root,
                                               CriteriaBuilder cb, Double lat, Double lon, Double radius) {
        // Haversine formula using database functions
        // Note: This is PostgreSQL specific. For other databases, you might need to adjust
        
        Expression<Double> latRadians = cb.function("RADIANS", Double.class, cb.literal(lat));
        Expression<Double> lonRadians = cb.function("RADIANS", Double.class, cb.literal(lon));
        Expression<Double> propLatRadians = cb.function("RADIANS", Double.class, root.get("latitude"));
        Expression<Double> propLonRadians = cb.function("RADIANS", Double.class, root.get("longitude"));
        
        // cos(lat1) * cos(lat2) * cos(lon2 - lon1) + sin(lat1) * sin(lat2)
        Expression<Double> cosLat1 = cb.function("COS", Double.class, latRadians);
        Expression<Double> cosLat2 = cb.function("COS", Double.class, propLatRadians);
        Expression<Double> sinLat1 = cb.function("SIN", Double.class, latRadians);
        Expression<Double> sinLat2 = cb.function("SIN", Double.class, propLatRadians);
        Expression<Double> cosLonDiff = cb.function("COS", Double.class, 
            cb.diff(propLonRadians, lonRadians));
        
        Expression<Double> cosProduct = cb.prod(cb.prod(cosLat1, cosLat2), cosLonDiff);
        Expression<Double> sinProduct = cb.prod(sinLat1, sinLat2);
        Expression<Double> sum = cb.sum(cosProduct, sinProduct);
        
        Expression<Double> acos = cb.function("ACOS", Double.class, sum);
        Expression<Double> distance = cb.prod(cb.literal(6371.0), acos); // Earth radius in km
        
        predicates.add(cb.lessThanOrEqualTo(distance, radius));
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
            
            // PostgreSQL full-text search using to_tsvector and plainto_tsquery
            // This requires proper text search configuration in PostgreSQL
            String searchQuery = searchText.trim().replaceAll("\\s+", " & ");
            
            Expression<Boolean> fullTextSearch = criteriaBuilder.function(
                "to_tsvector",
                Boolean.class,
                criteriaBuilder.literal("english"),
                criteriaBuilder.concat(
                    criteriaBuilder.concat(
                        criteriaBuilder.concat(root.get("name"), " "),
                        root.get("description")
                    ),
                    criteriaBuilder.concat(" ", root.get("city"))
                )
            );
            
            Expression<Boolean> searchVector = criteriaBuilder.function(
                "plainto_tsquery",
                Boolean.class,
                criteriaBuilder.literal("english"),
                criteriaBuilder.literal(searchQuery)
            );
            
            return criteriaBuilder.function("@@", Boolean.class, fullTextSearch, searchVector);
        };
    }
    
    /**
     * Build specification for trending/popular properties
     */
    public static Specification<Property> withPopularityScore() {
        return (root, query, criteriaBuilder) -> {
            // Calculate popularity score based on rating, review count, and recent bookings
            // This is a simplified version - in reality, you'd have more complex scoring
            
            Expression<Double> ratingScore = criteriaBuilder.coalesce(root.get("rating"), 0.0);
            Expression<Double> reviewScore = criteriaBuilder.sqrt(
                criteriaBuilder.coalesce(root.get("reviewCount"), 0)
            );
            
            // Add ordering by popularity score in the calling method
            return criteriaBuilder.conjunction();
        };
    }
}