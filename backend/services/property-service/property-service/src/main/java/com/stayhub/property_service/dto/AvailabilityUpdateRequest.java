package com.stayhub.property_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AvailabilityUpdateRequest {
    private UUID roomTypeId;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean isAvailable;
    private Integer roomsAvailable;
}