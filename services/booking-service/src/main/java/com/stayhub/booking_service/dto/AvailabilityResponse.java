package com.stayhub.booking_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailabilityResponse {
    private UUID propertyId;
    private UUID roomTypeId;
    private LocalDate checkIn;
    private LocalDate checkOut;
    private Integer availableRooms;
    private Integer totalRooms;
    private BigDecimal pricePerNight;
}