package com.stayhub.booking_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
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
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class AddressDTO {
    private String street;
    private String city;
    private String state;
    private String country;
    private String zipCode;
}
