package com.stayhub.booking_service.controller;

import com.stayhub.booking_service.dto.AvailabilityResponse;
import com.stayhub.booking_service.service.AvailabilityService;
import com.stayhub.booking_service.service.BookingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/availability")
@RequiredArgsConstructor
@Slf4j
public class AvailabilityController {
    
    private final AvailabilityService availabilityService;
    private final BookingService bookingService;
    
    @PostMapping("/initialize")
    public ResponseEntity<String> initializeAvailability(
            @RequestParam @NotNull UUID propertyId,
            @RequestParam @NotNull UUID roomTypeId,
            @RequestParam @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        log.info("Initializing availability for property: {}, roomType: {}, from: {} to: {}", 
                propertyId, roomTypeId, startDate, endDate);
        
        availabilityService.initializeAvailability(propertyId, roomTypeId, startDate, endDate);
        
        return ResponseEntity.ok("Availability initialized successfully");
    }
    
    @GetMapping("/check")
    public ResponseEntity<AvailabilityResponse> checkAvailability(
            @RequestParam @NotNull UUID propertyId,
            @RequestParam @NotNull UUID roomTypeId,
            @RequestParam @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
            @RequestParam @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut) {
        
        AvailabilityResponse response = bookingService.checkAvailability(
                propertyId, roomTypeId, checkIn, checkOut);
        
        return ResponseEntity.ok(response);
    }
}