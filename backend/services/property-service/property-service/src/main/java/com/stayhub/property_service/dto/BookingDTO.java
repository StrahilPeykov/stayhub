package com.stayhub.property_service.dto;

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
class BookingDTO {
    private UUID bookingId;
    private String guestName;
    private LocalDate checkIn;
    private LocalDate checkOut;
    private String roomType;
    private Integer numberOfRooms;
    private Integer numberOfGuests;
    private BigDecimal totalAmount;
    private String status;
    private String confirmationCode;
}