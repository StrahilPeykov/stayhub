package com.stayhub.booking_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.*;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingModificationRequest {
    
    @Future(message = "New checkout date must be in the future")
    private LocalDate newCheckOut;
    
    @Min(value = 1, message = "At least one guest is required")
    @Max(value = 40, message = "Cannot exceed 40 guests")
    private Integer newGuestCount;
    
    @Min(value = 1, message = "At least one room is required")
    @Max(value = 10, message = "Cannot book more than 10 rooms")
    private Integer newRoomCount;
}