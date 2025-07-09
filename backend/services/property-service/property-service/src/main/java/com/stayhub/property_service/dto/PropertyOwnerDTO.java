package com.stayhub.property_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PropertyOwnerDTO {
    private UUID id;
    private String name;
    private String location;
    private Integer totalRooms;
    private BigDecimal averagePrice;
    private Double occupancyRate;
    private BigDecimal monthlyRevenue;
    private Integer activeBookings;
    private Double rating;
    private Boolean isActive;
}