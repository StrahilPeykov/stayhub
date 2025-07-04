package com.stayhub.booking_service.service;

import com.stayhub.booking_service.dto.*;
import com.stayhub.booking_service.entity.*;
import com.stayhub.booking_service.exception.*;
import com.stayhub.booking_service.repository.*;
import com.stayhub.booking_service.event.BookingEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class BookingService {
    
    private final BookingRepository bookingRepository;
    private final AvailabilityRepository availabilityRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final BookingEventPublisher eventPublisher;
    private final DynamicPricingService dynamicPricingService;
    private final AvailabilityService availabilityService;
    
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public BookingResponse createBooking(BookingRequest request) {
        try {
            log.info("Creating booking for property: {} from {} to {}", 
                    request.getPropertyId(), request.getCheckIn(), request.getCheckOut());
            
            // Check for idempotency
            if (request.getIdempotencyKey() != null) {
                Optional<Booking> existingByKey = bookingRepository.findByIdempotencyKey(request.getIdempotencyKey());
                if (existingByKey.isPresent()) {
                    log.info("Idempotent request detected, returning existing booking");
                    return mapToResponse(existingByKey.get());
                }
            }
            
            // Validate dates
            validateBookingDates(request.getCheckIn(), request.getCheckOut());
            
            // Get room type
            RoomType roomType = roomTypeRepository.findById(request.getRoomTypeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Room type not found"));
            
            // Validate guest count
            if (request.getNumberOfGuests() > roomType.getMaxOccupancy() * request.getNumberOfRooms()) {
                throw new ValidationException("Guest count exceeds room capacity");
            }
            
            // Reserve rooms using enhanced availability service
            boolean reserved = availabilityService.reserveRooms(
                    request.getPropertyId(), 
                    request.getRoomTypeId(),
                    request.getCheckIn(), 
                    request.getCheckOut(), 
                    request.getNumberOfRooms()
            );
            
            if (!reserved) {
                throw new RoomNotAvailableException("Rooms not available for selected dates");
            }
            
            // Calculate price using dynamic pricing
            BigDecimal totalAmount = dynamicPricingService.calculateDynamicPrice(
                    roomType, 
                    request.getCheckIn(), 
                    request.getCheckOut(),
                    request.getPropertyId(), 
                    request.getNumberOfRooms()
            );
            
            // Create booking
            Booking booking = Booking.builder()
                    .propertyId(request.getPropertyId())
                    .userId(request.getUserId())
                    .roomTypeId(request.getRoomTypeId())
                    .checkInDate(request.getCheckIn())
                    .checkOutDate(request.getCheckOut())
                    .numberOfRooms(request.getNumberOfRooms())
                    .numberOfGuests(request.getNumberOfGuests())
                    .totalAmount(totalAmount)
                    .currency("USD")
                    .status(BookingStatus.CONFIRMED)
                    .specialRequests(request.getSpecialRequests())
                    .idempotencyKey(request.getIdempotencyKey())
                    .build();
            
            booking = bookingRepository.save(booking);
            
            // Publish event
            eventPublisher.publishBookingCreated(booking);
            
            log.info("Booking created successfully with id: {} for ${}", booking.getId(), totalAmount);
            return mapToResponse(booking);
            
        } catch (Exception e) {
            log.error("Failed to create booking", e);
            throw e;
        }
    }
    
    /**
     * Extend a booking period
     */
    @Transactional
    public BookingResponse extendBooking(UUID bookingId, LocalDate newCheckOut) {
        log.info("Extending booking {} to new checkout date: {}", bookingId, newCheckOut);
        
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        
        // Validate booking can be extended
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new InvalidBookingStateException("Only confirmed bookings can be extended");
        }
        
        if (!newCheckOut.isAfter(booking.getCheckOutDate())) {
            throw new ValidationException("New checkout date must be after current checkout date");
        }
        
        if (newCheckOut.isAfter(booking.getCheckInDate().plusDays(30))) {
            throw new ValidationException("Total booking duration cannot exceed 30 days");
        }
        
        // Check availability for extension period
        boolean available = availabilityService.reserveRooms(
                booking.getPropertyId(),
                booking.getRoomTypeId(),
                booking.getCheckOutDate(), // Start from current checkout
                newCheckOut,
                booking.getNumberOfRooms()
        );
        
        if (!available) {
            throw new RoomNotAvailableException("Rooms not available for extension period");
        }
        
        // Get room type for pricing
        RoomType roomType = roomTypeRepository.findById(booking.getRoomTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Room type not found"));
        
        // Calculate additional cost
        long additionalNights = ChronoUnit.DAYS.between(booking.getCheckOutDate(), newCheckOut);
        BigDecimal extensionPrice = dynamicPricingService.calculateDynamicPrice(
                roomType,
                booking.getCheckOutDate(),
                newCheckOut,
                booking.getPropertyId(),
                booking.getNumberOfRooms()
        );
        
        // Update booking
        booking.setCheckOutDate(newCheckOut);
        booking.setTotalAmount(booking.getTotalAmount().add(extensionPrice));
        booking = bookingRepository.save(booking);
        
        log.info("Booking {} extended by {} nights for additional ${}", 
                bookingId, additionalNights, extensionPrice);
        
        return mapToResponse(booking);
    }
    
    /**
     * Modify guest count
     */
    @Transactional
    public BookingResponse modifyGuestCount(UUID bookingId, int newGuestCount) {
        log.info("Modifying guest count for booking {} to {}", bookingId, newGuestCount);
        
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new InvalidBookingStateException("Only confirmed bookings can be modified");
        }
        
        // Get room type to validate capacity
        RoomType roomType = roomTypeRepository.findById(booking.getRoomTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Room type not found"));
        
        int maxCapacity = roomType.getMaxOccupancy() * booking.getNumberOfRooms();
        if (newGuestCount > maxCapacity) {
            throw new ValidationException(
                    String.format("Guest count %d exceeds maximum capacity %d", newGuestCount, maxCapacity)
            );
        }
        
        if (newGuestCount < 1) {
            throw new ValidationException("At least one guest is required");
        }
        
        // Update booking
        booking.setNumberOfGuests(newGuestCount);
        booking = bookingRepository.save(booking);
        
        log.info("Guest count updated from {} to {} for booking {}", 
                booking.getNumberOfGuests(), newGuestCount, bookingId);
        
        return mapToResponse(booking);
    }
    
    /**
     * Add or modify rooms (if available)
     */
    @Transactional
    public BookingResponse modifyRoomCount(UUID bookingId, int newRoomCount) {
        log.info("Modifying room count for booking {} to {}", bookingId, newRoomCount);
        
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new InvalidBookingStateException("Only confirmed bookings can be modified");
        }
        
        if (newRoomCount < 1 || newRoomCount > 10) {
            throw new ValidationException("Room count must be between 1 and 10");
        }
        
        int roomDifference = newRoomCount - booking.getNumberOfRooms();
        
        if (roomDifference > 0) {
            // Adding rooms - check availability
            boolean available = availabilityService.reserveRooms(
                    booking.getPropertyId(),
                    booking.getRoomTypeId(),
                    booking.getCheckInDate(),
                    booking.getCheckOutDate(),
                    roomDifference
            );
            
            if (!available) {
                throw new RoomNotAvailableException("Additional rooms not available");
            }
        } else if (roomDifference < 0) {
            // Removing rooms - release them
            availabilityService.releaseRooms(
                    booking.getPropertyId(),
                    booking.getRoomTypeId(),
                    booking.getCheckInDate(),
                    booking.getCheckOutDate(),
                    Math.abs(roomDifference)
            );
        }
        
        // Recalculate price
        RoomType roomType = roomTypeRepository.findById(booking.getRoomTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Room type not found"));
        
        BigDecimal newTotalPrice = dynamicPricingService.calculateDynamicPrice(
                roomType,
                booking.getCheckInDate(),
                booking.getCheckOutDate(),
                booking.getPropertyId(),
                newRoomCount
        );
        
        // Update booking
        booking.setNumberOfRooms(newRoomCount);
        booking.setTotalAmount(newTotalPrice);
        booking = bookingRepository.save(booking);
        
        log.info("Room count updated from {} to {} for booking {}, new price: ${}", 
                booking.getNumberOfRooms(), newRoomCount, bookingId, newTotalPrice);
        
        return mapToResponse(booking);
    }
    
    @Transactional
    public BookingResponse cancelBooking(UUID bookingId, String cancellationReason) {
        log.info("Cancelling booking: {}", bookingId);
        
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        
        if (!booking.getStatus().canTransitionTo(BookingStatus.CANCELLED)) {
            throw new InvalidBookingStateException(
                    "Booking cannot be cancelled in current state: " + booking.getStatus());
        }
        
        // Calculate refund based on cancellation policy
        BigDecimal refundAmount = calculateRefund(booking);
        
        // Update booking
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancellationReason(cancellationReason);
        booking.setCancelledAt(LocalDateTime.now());
        booking.setRefundAmount(refundAmount);
        
        // Release rooms back to availability
        availabilityService.releaseRooms(
                booking.getPropertyId(),
                booking.getRoomTypeId(),
                booking.getCheckInDate(),
                booking.getCheckOutDate(),
                booking.getNumberOfRooms()
        );
        
        booking = bookingRepository.save(booking);
        
        // Publish event
        eventPublisher.publishBookingCancelled(booking);
        
        return mapToResponse(booking);
    }
    
    /**
     * Get price preview without creating booking
     */
    public PricePreviewResponse getBookingPricePreview(BookingRequest request) {
        RoomType roomType = roomTypeRepository.findById(request.getRoomTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Room type not found"));
        
        BigDecimal totalPrice = dynamicPricingService.calculateDynamicPrice(
                roomType,
                request.getCheckIn(),
                request.getCheckOut(),
                request.getPropertyId(),
                request.getNumberOfRooms()
        );
        
        Map<String, Object> breakdown = dynamicPricingService.getPriceBreakdown(
                roomType,
                request.getCheckIn(),
                request.getCheckOut(),
                request.getPropertyId(),
                request.getNumberOfRooms()
        );
        
        return PricePreviewResponse.builder()
                .totalPrice(totalPrice)
                .currency("USD")
                .priceBreakdown(breakdown)
                .cancellationPolicy(getCancellationPolicyDescription())
                .build();
    }
    
    @Cacheable(value = "bookings", key = "#bookingId", condition = "@environment.getProperty('spring.cache.type') != 'none'")
    public BookingResponse getBooking(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        
        return mapToResponse(booking);
    }
    
    public Page<BookingResponse> getUserBookings(UUID userId, Pageable pageable) {
        Page<Booking> bookings = bookingRepository.findByUserId(userId, pageable);
        return bookings.map(this::mapToResponse);
    }
    
    public BookingResponse getBookingByConfirmationCode(String confirmationCode) {
        Booking booking = bookingRepository.findByConfirmationCode(confirmationCode)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        
        return mapToResponse(booking);
    }
    
    @Transactional(readOnly = true)
    public AvailabilityResponse checkAvailability(UUID propertyId, UUID roomTypeId, 
                                                  LocalDate checkIn, LocalDate checkOut) {
        Integer minAvailable = availabilityService.getMinimumAvailability(
                propertyId, roomTypeId, checkIn, checkOut);
        
        RoomType roomType = roomTypeRepository.findById(roomTypeId)
                .orElseThrow(() -> new ResourceNotFoundException("Room type not found"));
        
        // Get dynamic price for the period
        BigDecimal dynamicPrice = dynamicPricingService.calculateDynamicPrice(
                roomType, checkIn, checkOut, propertyId, 1);
        
        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
        BigDecimal pricePerNight = dynamicPrice.divide(BigDecimal.valueOf(nights), 2, BigDecimal.ROUND_HALF_UP);
        
        return AvailabilityResponse.builder()
                .propertyId(propertyId)
                .roomTypeId(roomTypeId)
                .checkIn(checkIn)
                .checkOut(checkOut)
                .availableRooms(minAvailable != null ? minAvailable : 0)
                .totalRooms(roomType.getTotalRooms())
                .pricePerNight(pricePerNight)
                .build();
    }
    
    private BigDecimal calculateRefund(Booking booking) {
        long daysUntilCheckIn = ChronoUnit.DAYS.between(LocalDateTime.now(), 
                booking.getCheckInDate().atStartOfDay());
        
        if (daysUntilCheckIn >= 7) {
            return booking.getTotalAmount(); // Full refund
        } else if (daysUntilCheckIn >= 3) {
            return booking.getTotalAmount().multiply(BigDecimal.valueOf(0.5)); // 50% refund
        } else {
            return BigDecimal.ZERO; // No refund
        }
    }
    
    private String getCancellationPolicyDescription() {
        return "Free cancellation up to 7 days before check-in. " +
               "50% refund for cancellations 3-7 days before check-in. " +
               "No refund for cancellations less than 3 days before check-in.";
    }
    
    private void validateBookingDates(LocalDate checkIn, LocalDate checkOut) {
        if (checkIn == null || checkOut == null) {
            throw new ValidationException("Check-in and check-out dates are required");
        }
        if (checkIn.isBefore(LocalDate.now())) {
            throw new ValidationException("Check-in date cannot be in the past");
        }
        if (!checkOut.isAfter(checkIn)) {
            throw new ValidationException("Check-out date must be after check-in date");
        }
        if (ChronoUnit.DAYS.between(checkIn, checkOut) > 30) {
            throw new ValidationException("Booking duration cannot exceed 30 days");
        }
    }
    
    private BookingResponse mapToResponse(Booking booking) {
        return BookingResponse.builder()
                .id(booking.getId())
                .propertyId(booking.getPropertyId())
                .userId(booking.getUserId())
                .checkIn(booking.getCheckInDate())
                .checkOut(booking.getCheckOutDate())
                .numberOfRooms(booking.getNumberOfRooms())
                .numberOfGuests(booking.getNumberOfGuests())
                .totalAmount(booking.getTotalAmount())
                .currency(booking.getCurrency())
                .status(booking.getStatus())
                .confirmationCode(booking.getConfirmationCode())
                .createdAt(booking.getCreatedAt())
                .build();
    }
}