package com.stayhub.booking_service.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingRequest {
    
    @NotNull(message = "Property ID is required")
    private UUID propertyId;
    
    @NotNull(message = "User ID is required")
    private UUID userId;
    
    @NotNull(message = "Room type ID is required")
    private UUID roomTypeId;
    
    @NotNull(message = "Check-in date is required")
    @Future(message = "Check-in date must be in the future")
    private LocalDate checkIn;
    
    @NotNull(message = "Check-out date is required")
    @Future(message = "Check-out date must be in the future")
    private LocalDate checkOut;
    
    @Min(value = 1, message = "At least one room is required")
    @Max(value = 10, message = "Cannot book more than 10 rooms")
    private Integer numberOfRooms = 1;
    
    @Min(value = 1, message = "At least one guest is required")
    @Max(value = 40, message = "Cannot exceed 40 guests")
    private Integer numberOfGuests = 1;
    
    @Size(max = 500, message = "Special requests cannot exceed 500 characters")
    private String specialRequests;
    
    private String idempotencyKey;
}
