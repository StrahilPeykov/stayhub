package com.stayhub.property_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PropertySearchRequest {
    
    // Text search
    private String search;
    
    // Location filters
    private String city;
    private String country;
    private Double latitude;
    private Double longitude;
    private Double radius; // in kilometers
    
    // Price filters
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    
    // Property characteristics
    private Integer minRooms;
    private List<String> amenities;
    private List<String> propertyTypes;
    private Double minRating;
    private Boolean featured;
    private Boolean instantBooking;
    
    // Date availability (for availability check)
    private String checkIn;
    private String checkOut;
    private Integer guests;
    private Integer rooms;
    
    // Pagination and sorting
    private Integer page = 0;
    private Integer size = 20;
    private String sortBy = "name"; // name, price, rating, distance, popularity
    private String sortDirection = "asc"; // asc, desc
    
    // Filters for amenities matching
    private AmenityMatchType amenityMatchType = AmenityMatchType.ANY;
    
    public enum AmenityMatchType {
        ANY, // Property has any of the specified amenities
        ALL  // Property has all of the specified amenities
    }
}