package com.stayhub.property_service.repository;

import com.stayhub.property_service.entity.Property;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PropertyRepository extends JpaRepository<Property, UUID> {
    
    // Using Haversine formula - works with any PostgreSQL, no extensions needed
    @Query(value = "SELECT * FROM properties p WHERE " +
           "(6371 * acos(" +
           "cos(radians(:lat)) * cos(radians(p.latitude)) * " +
           "cos(radians(p.longitude) - radians(:lon)) + " +
           "sin(radians(:lat)) * sin(radians(p.latitude))" +
           ")) <= :radius", 
           nativeQuery = true)
    List<Property> findPropertiesWithinRadius(@Param("lat") Double latitude, 
                                            @Param("lon") Double longitude, 
                                            @Param("radius") Double radiusInKm);
    
    // Updated to match the new entity structure
    List<Property> findByCity(String city);
    
    // Find by country
    List<Property> findByCountry(String country);
    
    // Find by city and country
    List<Property> findByCityAndCountry(String city, String country);
    
    // Find by amenity using native query since it's in a separate table
    @Query(value = "SELECT DISTINCT p.* FROM properties p " +
           "JOIN property_amenities pa ON p.id = pa.property_id " +
           "WHERE pa.amenity = :amenity",
           nativeQuery = true)
    List<Property> findByAmenity(@Param("amenity") String amenity);
    
    // Find properties by price range
    @Query("SELECT p FROM Property p WHERE p.basePrice BETWEEN :minPrice AND :maxPrice")
    List<Property> findByPriceRange(@Param("minPrice") Double minPrice, @Param("maxPrice") Double maxPrice);
    
    // Find properties with specific number of rooms or more
    @Query("SELECT p FROM Property p WHERE p.totalRooms >= :minRooms")
    List<Property> findByMinimumRooms(@Param("minRooms") Integer minRooms);
}