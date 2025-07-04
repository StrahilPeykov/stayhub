package com.stayhub.property_service.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
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
    private List<String> amenities;
    private Integer totalRooms;
    private BigDecimal basePrice;
    private String currency;
    private List<PropertyImageDTO> images;
    private Double rating;
    private Integer reviewCount;
    private Boolean featured;
    private Boolean verified;
    private Boolean instantBooking;
    private String cancellationPolicy;
    private String propertyType;
    private List<String> tags;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddressDTO {
        private String street;
        private String city;
        private String state;
        private String country;
        private String zipCode;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PropertyImageDTO {
        private String id;
        private String url;
        private String alt;
        private Boolean isPrimary;
    }
}