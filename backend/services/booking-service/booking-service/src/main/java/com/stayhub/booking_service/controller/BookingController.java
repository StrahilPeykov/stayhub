package com.stayhub.booking_service.controller;

import com.stayhub.booking_service.dto.*;
import com.stayhub.booking_service.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
@Slf4j
public class BookingController {
    
    private final BookingService bookingService;
    
    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(@Valid @RequestBody BookingRequest request) {
        log.info("Received booking request for property: {}", request.getPropertyId());
        BookingResponse response = bookingService.createBooking(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * Get price preview before booking
     */
    @PostMapping("/preview")
    public ResponseEntity<PricePreviewResponse> getBookingPreview(@Valid @RequestBody BookingRequest request) {
        log.info("Price preview request for property: {}", request.getPropertyId());
        PricePreviewResponse preview = bookingService.getBookingPricePreview(request);
        return ResponseEntity.ok(preview);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> getBooking(@PathVariable UUID id) {
        BookingResponse response = bookingService.getBooking(id);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/confirmation/{code}")
    public ResponseEntity<BookingResponse> getBookingByConfirmationCode(@PathVariable String code) {
        BookingResponse response = bookingService.getBookingByConfirmationCode(code);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<BookingResponse>> getUserBookings(
            @PathVariable UUID userId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<BookingResponse> bookings = bookingService.getUserBookings(userId, pageable);
        return ResponseEntity.ok(bookings);
    }
    
    /**
     * Cancel a booking
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<BookingResponse> cancelBooking(
            @PathVariable UUID id,
            @RequestParam(required = false) String reason) {
        BookingResponse response = bookingService.cancelBooking(id, reason);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Extend booking checkout date
     */
    @PutMapping("/{id}/extend")
    public ResponseEntity<BookingResponse> extendBooking(
            @PathVariable UUID id,
            @RequestParam LocalDate newCheckOut) {
        log.info("Extending booking {} to {}", id, newCheckOut);
        BookingResponse response = bookingService.extendBooking(id, newCheckOut);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Modify guest count
     */
    @PutMapping("/{id}/guests")
    public ResponseEntity<BookingResponse> modifyGuestCount(
            @PathVariable UUID id,
            @RequestParam int newGuestCount) {
        log.info("Modifying guest count for booking {} to {}", id, newGuestCount);
        BookingResponse response = bookingService.modifyGuestCount(id, newGuestCount);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Modify room count
     */
    @PutMapping("/{id}/rooms")
    public ResponseEntity<BookingResponse> modifyRoomCount(
            @PathVariable UUID id,
            @RequestParam int newRoomCount) {
        log.info("Modifying room count for booking {} to {}", id, newRoomCount);
        BookingResponse response = bookingService.modifyRoomCount(id, newRoomCount);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Batch modification endpoint
     */
    @PutMapping("/{id}/modify")
    public ResponseEntity<BookingResponse> modifyBooking(
            @PathVariable UUID id,
            @Valid @RequestBody BookingModificationRequest request) {
        BookingResponse response = null;
        
        // Apply modifications in order
        if (request.getNewCheckOut() != null) {
            response = bookingService.extendBooking(id, request.getNewCheckOut());
        }
        
        if (request.getNewRoomCount() != null) {
            response = bookingService.modifyRoomCount(id, request.getNewRoomCount());
        }
        
        if (request.getNewGuestCount() != null) {
            response = bookingService.modifyGuestCount(id, request.getNewGuestCount());
        }
        
        if (response == null) {
            response = bookingService.getBooking(id);
        }
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/availability")
    public ResponseEntity<AvailabilityResponse> checkAvailability(
            @RequestParam UUID propertyId,
            @RequestParam UUID roomTypeId,
            @RequestParam LocalDate checkIn,
            @RequestParam LocalDate checkOut) {
        AvailabilityResponse response = bookingService.checkAvailability(
                propertyId, roomTypeId, checkIn, checkOut);
        return ResponseEntity.ok(response);
    }
}
