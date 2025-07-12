package com.stayhub.property_service.repository;

import com.stayhub.property_service.entity.Property;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface PropertyRepository extends JpaRepository<Property, UUID> {
    
    // Comprehensive search with multiple filters
    @Query(value = """
        SELECT DISTINCT p.* FROM properties p 
        LEFT JOIN property_amenities pa ON p.id = pa.property_id 
        WHERE (:search IS NULL OR 
               LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR 
               LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(p.city) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(p.country) LIKE LOWER(CONCAT('%', :search, '%')))
        AND (:city IS NULL OR LOWER(p.city) = LOWER(:city))
        AND (:country IS NULL OR LOWER(p.country) = LOWER(:country))
        AND (:minPrice IS NULL OR p.base_price >= :minPrice)
        AND (:maxPrice IS NULL OR p.base_price <= :maxPrice)
        AND (:minRooms IS NULL OR p.total_rooms >= :minRooms)
        AND (:amenities IS NULL OR pa.amenity IN :amenities)
        AND (:propertyTypes IS NULL OR p.property_type IN :propertyTypes)
        AND (:lat IS NULL OR :lon IS NULL OR :radius IS NULL OR 
             (6371 * acos(cos(radians(:lat)) * cos(radians(p.latitude)) * 
              cos(radians(p.longitude) - radians(:lon)) + 
              sin(radians(:lat)) * sin(radians(p.latitude)))) <= :radius)
        """,
        countQuery = """
        SELECT COUNT(DISTINCT p.id) FROM properties p 
        LEFT JOIN property_amenities pa ON p.id = pa.property_id 
        WHERE (:search IS NULL OR 
               LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR 
               LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(p.city) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(p.country) LIKE LOWER(CONCAT('%', :search, '%')))
        AND (:city IS NULL OR LOWER(p.city) = LOWER(:city))
        AND (:country IS NULL OR LOWER(p.country) = LOWER(:country))
        AND (:minPrice IS NULL OR p.base_price >= :minPrice)
        AND (:maxPrice IS NULL OR p.base_price <= :maxPrice)
        AND (:minRooms IS NULL OR p.total_rooms >= :minRooms)
        AND (:amenities IS NULL OR pa.amenity IN :amenities)
        AND (:propertyTypes IS NULL OR p.property_type IN :propertyTypes)
        AND (:lat IS NULL OR :lon IS NULL OR :radius IS NULL OR 
             (6371 * acos(cos(radians(:lat)) * cos(radians(p.latitude)) * 
              cos(radians(p.longitude) - radians(:lon)) + 
              sin(radians(:lat)) * sin(radians(p.latitude)))) <= :radius)
        """,
        nativeQuery = true)
    Page<Property> findPropertiesWithFilters(
            @Param("search") String search,
            @Param("city") String city,
            @Param("country") String country,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("minRooms") Integer minRooms,
            @Param("amenities") List<String> amenities,
            @Param("propertyTypes") List<String> propertyTypes,
            @Param("lat") Double latitude,
            @Param("lon") Double longitude,
            @Param("radius") Double radius,
            Pageable pageable);
    
    // Geographic search with pagination
    @Query(value = """
        SELECT * FROM properties p WHERE 
        (6371 * acos(cos(radians(:lat)) * cos(radians(p.latitude)) * 
         cos(radians(p.longitude) - radians(:lon)) + 
         sin(radians(:lat)) * sin(radians(p.latitude)))) <= :radius
        ORDER BY (6371 * acos(cos(radians(:lat)) * cos(radians(p.latitude)) * 
                  cos(radians(p.longitude) - radians(:lon)) + 
                  sin(radians(:lat)) * sin(radians(p.latitude))))
        """, 
        nativeQuery = true)
    Page<Property> findPropertiesWithinRadius(
            @Param("lat") Double latitude, 
            @Param("lon") Double longitude, 
            @Param("radius") Double radiusInKm,
            Pageable pageable);
    
    // City-based search with pagination
    Page<Property> findByCityIgnoreCaseContaining(String city, Pageable pageable);
    
    // Price range search with pagination
    Page<Property> findByBasePriceBetween(BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable);
    
    // Amenities search
    @Query(value = """
        SELECT DISTINCT p.* FROM properties p 
        JOIN property_amenities pa ON p.id = pa.property_id 
        WHERE pa.amenity IN :amenities
        GROUP BY p.id 
        HAVING COUNT(DISTINCT pa.amenity) = :amenityCount
        """,
        nativeQuery = true)
    Page<Property> findByAllAmenities(@Param("amenities") List<String> amenities, 
                                     @Param("amenityCount") long amenityCount, 
                                     Pageable pageable);
    
    @Query(value = """
        SELECT DISTINCT p.* FROM properties p 
        JOIN property_amenities pa ON p.id = pa.property_id 
        WHERE pa.amenity IN :amenities
        """,
        nativeQuery = true)
    Page<Property> findByAnyAmenities(@Param("amenities") List<String> amenities, Pageable pageable);
    
    // Property type search
    @Query("SELECT p FROM Property p WHERE p.propertyType IN :types")
    Page<Property> findByPropertyTypes(@Param("types") List<String> propertyTypes, Pageable pageable);
    
    // Featured properties
    @Query("SELECT p FROM Property p WHERE p.featured = true")
    Page<Property> findFeaturedProperties(Pageable pageable);
    
    // Rating-based search (this would require a ratings table, for now using mock)
    @Query(value = """
        SELECT p.* FROM properties p 
        WHERE p.id NOT IN (SELECT DISTINCT property_id FROM reviews WHERE avg_rating < :minRating)
        """, 
        nativeQuery = true)
    Page<Property> findByMinimumRating(@Param("minRating") Double minRating, Pageable pageable);
    
    // Popular properties (based on booking count - mock for now)
    @Query(value = """
        SELECT p.* FROM properties p 
        ORDER BY (SELECT COUNT(*) FROM bookings b WHERE b.property_id = p.id) DESC
        """, 
        nativeQuery = true)
    Page<Property> findPopularProperties(Pageable pageable);
    
    // Text search in name and description
    @Query("""
        SELECT p FROM Property p WHERE 
        LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR 
        LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%'))
        """)
    Page<Property> findByNameOrDescriptionContaining(@Param("query") String query, Pageable pageable);
    
    // Complex availability search (would require booking service integration)
    @Query(value = """
        SELECT p.* FROM properties p 
        WHERE p.id NOT IN (
            SELECT DISTINCT b.property_id FROM bookings b 
            WHERE b.status = 'CONFIRMED' 
            AND ((b.check_in <= :checkOut AND b.check_out >= :checkIn))
        ) OR p.total_rooms > (
            SELECT COALESCE(SUM(b.number_of_rooms), 0) FROM bookings b 
            WHERE b.property_id = p.id 
            AND b.status = 'CONFIRMED'
            AND ((b.check_in <= :checkOut AND b.check_out >= :checkIn))
        )
        """, 
        nativeQuery = true)
    Page<Property> findAvailableProperties(
            @Param("checkIn") String checkIn,
            @Param("checkOut") String checkOut,
            Pageable pageable);
}