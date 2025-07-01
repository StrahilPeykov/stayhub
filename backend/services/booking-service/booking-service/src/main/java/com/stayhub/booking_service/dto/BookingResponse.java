package com.stayhub.booking_service.dto;

import com.stayhub.booking_service.entity.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {
    private UUID id;
    private UUID propertyId;
    private UUID userId;
    private LocalDate checkIn;
    private LocalDate checkOut;
    private Integer numberOfRooms;
    private Integer numberOfGuests;
    private BigDecimal totalAmount;
    private String currency;
    private BookingStatus status;
    private String confirmationCode;
    private LocalDateTime createdAt;
    private String errorMessage;
}