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
    
    @Query(value = "SELECT * FROM properties p WHERE " +
           "earth_distance(ll_to_earth(p.latitude, p.longitude), " +
           "ll_to_earth(:lat, :lon)) < :radius * 1000", nativeQuery = true)
    List<Property> findPropertiesWithinRadius(@Param("lat") Double latitude, 
                                            @Param("lon") Double longitude, 
                                            @Param("radius") Double radiusInKm);
    
    List<Property> findByAddressCity(String city);
    
    @Query("SELECT p FROM Property p WHERE :amenity MEMBER OF p.amenities")
    List<Property> findByAmenity(@Param("amenity") String amenity);
}