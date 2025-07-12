package com.stayhub.property_service.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor  
@AllArgsConstructor
public class PropertyDTO {
    private UUID id;
    private String name;
    private String description;
    private AddressDTO address;
    private Double latitude;
    private Double longitude;
    
    // Property characteristics
    private String propertyType;
    private Integer totalRooms;
    private Integer maxGuests;
    private BigDecimal basePrice;
    private String currency;
    
    // Features and amenities
    private List<String> amenities;
    private List<String> tags;
    private List<String> languagesSpoken;
    
    // Property features
    private Boolean featured;
    private Boolean verified;
    private Boolean instantBooking;
    private Boolean petFriendly;
    private Boolean freeCancellation;
    private Boolean wheelchairAccessible;
    private Boolean elevatorAccess;
    
    // Rating and reviews
    private Double rating;
    private Integer reviewCount;
    
    // Policies
    private String cancellationPolicy;
    private String checkInTime;
    private String checkOutTime;
    private Integer minimumStay;
    private Integer maximumStay;
    
    // Business information
    private UUID ownerId;
    private String phone;
    private String email;
    private String website;
    
    // Property details
    private Integer propertySize;
    private Integer yearBuilt;
    private Integer lastRenovated;
    private Integer numberOfFloors;
    
    // Images and media
    private List<PropertyImageDTO> images;
    private String virtualTourUrl;
    
    // Status
    private String status;
    private Boolean isActive;
    private String visibility;
    
    // Computed fields
    private Double distanceFromSearch; // Distance from search location in km
    private BigDecimal discountedPrice; // Price after any applicable discounts
    private String priceDisplayText; // Formatted price text
    private Boolean availableForDates; // Availability for searched dates
    private String popularityScore; // Popularity ranking
    
    // Audit information
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddressDTO {
        private String street;
        private String city;
        private String state;
        private String country;
        private String zipCode;
        private String fullAddress; // Computed full address string
        private String displayAddress; // Short display version
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PropertyImageDTO {
        private String id;
        private String url;
        private String thumbnailUrl;
        private String alt;
        private Boolean isPrimary;
        private String caption;
        private Integer sortOrder;
        private String category; // e.g., "exterior", "lobby", "room", "amenity"
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PropertyPolicyDTO {
        private String cancellationPolicy;
        private String checkInTime;
        private String checkOutTime;
        private Integer minimumStay;
        private Integer maximumStay;
        private Boolean smokingAllowed;
        private Boolean eventsAllowed;
        private Boolean childrenAllowed;
        private Boolean petsAllowed;
        private String houseRules;
        private String importantInfo;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PropertyLocationDTO {
        private Double latitude;
        private Double longitude;
        private String neighborhood;
        private String district;
        private List<NearbyAttractionDTO> nearbyAttractions;
        private List<TransportationDTO> publicTransport;
        private String whatIsNearby;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NearbyAttractionDTO {
        private String name;
        private String type; // restaurant, attraction, shopping, etc.
        private Double distanceKm;
        private String walkingTime;
        private String description;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransportationDTO {
        private String type; // metro, bus, train, airport
        private String name;
        private Double distanceKm;
        private String walkingTime;
        private List<String> lines;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PropertyStatsDTO {
        private Double averageRating;
        private Integer totalReviews;
        private Integer bookingsThisMonth;
        private Integer totalBookings;
        private Double occupancyRate;
        private String popularityRank;
        private Boolean isSuperhost; // For hosts with excellent ratings
        private LocalDateTime lastBooking;
        private Integer repeatGuests;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PricingInfoDTO {
        private BigDecimal basePrice;
        private BigDecimal weekendPrice;
        private BigDecimal weeklyDiscount;
        private BigDecimal monthlyDiscount;
        private BigDecimal cleaningFee;
        private BigDecimal serviceFee;
        private BigDecimal taxesAndFees;
        private String currency;
        private String pricePerNight;
        private String totalPrice;
        private List<SeasonalPriceDTO> seasonalPrices;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SeasonalPriceDTO {
        private String season;
        private String startDate;
        private String endDate;
        private BigDecimal price;
        private BigDecimal multiplier;
    }
    
    // Helper methods for computed fields
    public String getFormattedPrice() {
        if (basePrice == null) return "Price on request";
        return String.format("$%.0f", basePrice);
    }
    
    public String getFormattedRating() {
        if (rating == null || rating == 0) return "New";
        return String.format("%.1f", rating);
    }
    
    public String getPropertyTypeDisplayName() {
        if (propertyType == null) return "Property";
        return propertyType.substring(0, 1).toUpperCase() + 
               propertyType.substring(1).toLowerCase().replace("_", " ");
    }
    
    public String getGuestCapacityText() {
        if (maxGuests == null) return "";
        return maxGuests == 1 ? "1 guest" : maxGuests + " guests";
    }
    
    public String getRoomCountText() {
        if (totalRooms == null) return "";
        return totalRooms == 1 ? "1 room" : totalRooms + " rooms";
    }
    
    public Boolean hasAmenity(String amenity) {
        return amenities != null && amenities.contains(amenity);
    }
    
    public Boolean hasTag(String tag) {
        return tags != null && tags.contains(tag);
    }
    
    public String getFullAddressString() {
        if (address == null) return "";
        
        StringBuilder sb = new StringBuilder();
        if (address.getStreet() != null) sb.append(address.getStreet()).append(", ");
        if (address.getCity() != null) sb.append(address.getCity()).append(", ");
        if (address.getState() != null) sb.append(address.getState()).append(", ");
        if (address.getCountry() != null) sb.append(address.getCountry());
        
        return sb.toString().replaceAll(", $", "");
    }
    
    public String getShortAddressString() {
        if (address == null) return "";
        
        StringBuilder sb = new StringBuilder();
        if (address.getCity() != null) sb.append(address.getCity());
        if (address.getCountry() != null) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(address.getCountry());
        }
        
        return sb.toString();
    }
    
    public Boolean isLuxury() {
        return (rating != null && rating >= 4.5) || 
               (basePrice != null && basePrice.compareTo(BigDecimal.valueOf(300)) > 0) ||
               (tags != null && tags.contains("luxury"));
    }
    
    public Boolean isBudget() {
        return (basePrice != null && basePrice.compareTo(BigDecimal.valueOf(100)) < 0) ||
               (tags != null && tags.contains("budget"));
    }
    
    public Boolean isFamilyFriendly() {
        return (tags != null && tags.contains("family-friendly")) ||
               (amenities != null && (amenities.contains("Pool") || amenities.contains("Kids Club"))) ||
               (maxGuests != null && maxGuests >= 4);
    }
    
    public Boolean isBusinessFriendly() {
        return (tags != null && tags.contains("business")) ||
               (amenities != null && (amenities.contains("Business Center") || 
                                    amenities.contains("WiFi") || 
                                    amenities.contains("Meeting Rooms")));
    }
    
    public String getPrimaryImageUrl() {
        if (images == null || images.isEmpty()) {
            return "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop&crop=center&auto=format&q=80";
        }
        
        // Find primary image
        PropertyImageDTO primaryImage = images.stream()
                .filter(img -> img.getIsPrimary() != null && img.getIsPrimary())
                .findFirst()
                .orElse(images.get(0));
                
        return primaryImage.getUrl();
    }
    
    public List<PropertyImageDTO> getNonPrimaryImages() {
        if (images == null || images.isEmpty()) return List.of();
        
        return images.stream()
                .filter(img -> img.getIsPrimary() == null || !img.getIsPrimary())
                .toList();
    }
    
    public Integer getImageCount() {
        return images != null ? images.size() : 0;
    }
}
