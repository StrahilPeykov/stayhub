package com.stayhub.property_service.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.GenericGenerator;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "properties", indexes = {
    @Index(name = "idx_property_city", columnList = "city"),
    @Index(name = "idx_property_country", columnList = "country"),
    @Index(name = "idx_property_price", columnList = "base_price"),
    @Index(name = "idx_property_location", columnList = "latitude, longitude"),
    @Index(name = "idx_property_featured", columnList = "featured"),
    @Index(name = "idx_property_type", columnList = "property_type"),
    @Index(name = "idx_property_rooms", columnList = "total_rooms"),
    @Index(name = "idx_property_rating", columnList = "rating"),
    @Index(name = "idx_property_created", columnList = "created_at")
})
@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Property {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;
    
    @Column(nullable = false, length = 500)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    // Address fields - mapped directly for better query performance
    @Column(name = "street", length = 255)
    private String street;
    
    @Column(name = "city", length = 100, nullable = false)
    private String city;
    
    @Column(name = "state", length = 100)
    private String state;
    
    @Column(name = "country", length = 100, nullable = false)
    private String country;
    
    @Column(name = "zip_code", length = 20)
    private String zipCode;
    
    // Geographic coordinates for location-based search
    @Column(precision = 10, scale = 7)
    private Double latitude;
    
    @Column(precision = 10, scale = 7)
    private Double longitude;
    
    // Property characteristics
    @Column(name = "property_type", length = 50)
    @Enumerated(EnumType.STRING)
    private PropertyType propertyType = PropertyType.HOTEL;
    
    @Column(name = "total_rooms")
    private Integer totalRooms;
    
    @Column(name = "max_guests")
    private Integer maxGuests;
    
    @Column(name = "base_price", precision = 10, scale = 2, nullable = false)
    private BigDecimal basePrice;
    
    @Column(length = 3)
    private String currency = "USD";
    
    // Amenities as a separate table for better querying
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "property_amenities", 
                     joinColumns = @JoinColumn(name = "property_id"),
                     indexes = @Index(name = "idx_amenity", columnList = "amenity"))
    @Column(name = "amenity", length = 100)
    private List<String> amenities;
    
    // Property features
    @Column(name = "featured")
    private Boolean featured = false;
    
    @Column(name = "verified")
    private Boolean verified = false;
    
    @Column(name = "instant_booking")
    private Boolean instantBooking = false;
    
    @Column(name = "pet_friendly")
    private Boolean petFriendly = false;
    
    @Column(name = "free_cancellation")
    private Boolean freeCancellation = false;
    
    // Rating and reviews (these would typically come from a separate service)
    @Column(name = "rating", precision = 3, scale = 2)
    private Double rating;
    
    @Column(name = "review_count")
    private Integer reviewCount = 0;
    
    // Policies
    @Column(name = "cancellation_policy", length = 20)
    @Enumerated(EnumType.STRING)
    private CancellationPolicy cancellationPolicy = CancellationPolicy.MODERATE;
    
    @Column(name = "check_in_time", length = 5)
    private String checkInTime = "15:00";
    
    @Column(name = "check_out_time", length = 5)
    private String checkOutTime = "11:00";
    
    @Column(name = "minimum_stay")
    private Integer minimumStay = 1;
    
    @Column(name = "maximum_stay")
    private Integer maximumStay;
    
    // Business information
    @Column(name = "owner_id")
    private UUID ownerId;
    
    @Column(name = "phone", length = 20)
    private String phone;
    
    @Column(name = "email", length = 255)
    private String email;
    
    @Column(name = "website", length = 500)
    private String website;
    
    // Property size and details
    @Column(name = "property_size")
    private Integer propertySize; // in square meters
    
    @Column(name = "year_built")
    private Integer yearBuilt;
    
    @Column(name = "last_renovated")
    private Integer lastRenovated;
    
    @Column(name = "number_of_floors")
    private Integer numberOfFloors;
    
    // Accessibility features
    @Column(name = "wheelchair_accessible")
    private Boolean wheelchairAccessible = false;
    
    @Column(name = "elevator_access")
    private Boolean elevatorAccess = false;
    
    // Languages spoken
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "property_languages", 
                     joinColumns = @JoinColumn(name = "property_id"))
    @Column(name = "language", length = 50)
    private List<String> languagesSpoken;
    
    // Property tags for better categorization
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "property_tags", 
                     joinColumns = @JoinColumn(name = "property_id"),
                     indexes = @Index(name = "idx_tag", columnList = "tag"))
    @Column(name = "tag", length = 50)
    private List<String> tags;
    
    // Status and visibility
    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private PropertyStatus status = PropertyStatus.ACTIVE;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @Column(name = "visibility")
    @Enumerated(EnumType.STRING)
    private PropertyVisibility visibility = PropertyVisibility.PUBLIC;
    
    // Audit fields
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "created_by")
    private String createdBy;
    
    @Column(name = "updated_by")
    private String updatedBy;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (rating == null) rating = 0.0;
        if (reviewCount == null) reviewCount = 0;
        if (featured == null) featured = false;
        if (verified == null) verified = false;
        if (instantBooking == null) instantBooking = false;
        if (isActive == null) isActive = true;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Helper method to create Address DTO for frontend
    public Address getAddress() {
        Address address = new Address();
        address.setStreet(this.street);
        address.setCity(this.city);
        address.setState(this.state);
        address.setCountry(this.country);
        address.setZipCode(this.zipCode);
        return address;
    }
    
    // Calculate distance from a point (for sorting)
    public Double getDistanceFrom(Double lat, Double lon) {
        if (this.latitude == null || this.longitude == null || lat == null || lon == null) {
            return null;
        }
        
        // Haversine formula
        double R = 6371; // Earth's radius in kilometers
        double dLat = Math.toRadians(lat - this.latitude);
        double dLon = Math.toRadians(lon - this.longitude);
        double a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(Math.toRadians(this.latitude)) * Math.cos(Math.toRadians(lat)) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    // Enums
    public enum PropertyType {
        HOTEL, APARTMENT, VILLA, RESORT, HOSTEL, GUESTHOUSE, 
        BED_AND_BREAKFAST, VACATION_RENTAL, BOUTIQUE_HOTEL, 
        MOTEL, INN, LODGE, CABIN, COTTAGE, PENTHOUSE
    }
    
    public enum CancellationPolicy {
        FLEXIBLE, MODERATE, STRICT, SUPER_STRICT, NON_REFUNDABLE
    }
    
    public enum PropertyStatus {
        ACTIVE, INACTIVE, PENDING_APPROVAL, REJECTED, SUSPENDED, ARCHIVED
    }
    
    public enum PropertyVisibility {
        PUBLIC, PRIVATE, UNLISTED, MEMBERS_ONLY
    }
}
