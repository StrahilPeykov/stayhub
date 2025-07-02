package com.stayhub.booking_service.service;

import com.stayhub.booking_service.dto.*;
import com.stayhub.booking_service.entity.*;
import com.stayhub.booking_service.exception.*;
import com.stayhub.booking_service.repository.*;
import com.stayhub.booking_service.event.BookingEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
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
            
            // Check and update availability
            boolean available = checkAndReserveRooms(request);
            if (!available) {
                throw new RoomNotAvailableException("Rooms not available for selected dates");
            }
            
            // Calculate price
            BigDecimal totalAmount = calculateTotalPrice(roomType, request);
            
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
            
            // Publish event (will be logged if Kafka is not available)
            eventPublisher.publishBookingCreated(booking);
            
            log.info("Booking created successfully with id: {}", booking.getId());
            return mapToResponse(booking);
            
        } catch (Exception e) {
            log.error("Failed to create booking", e);
            throw e;
        }
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
        
        // Restore availability
        restoreAvailability(booking);
        
        booking = bookingRepository.save(booking);
        
        // Publish event
        eventPublisher.publishBookingCancelled(booking);
        
        return mapToResponse(booking);
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
        Integer minAvailable = availabilityRepository.getMinimumAvailability(
                propertyId, roomTypeId, checkIn, checkOut.minusDays(1));
        
        RoomType roomType = roomTypeRepository.findById(roomTypeId)
                .orElseThrow(() -> new ResourceNotFoundException("Room type not found"));
        
        return AvailabilityResponse.builder()
                .propertyId(propertyId)
                .roomTypeId(roomTypeId)
                .checkIn(checkIn)
                .checkOut(checkOut)
                .availableRooms(minAvailable != null ? minAvailable : 0)
                .totalRooms(roomType.getTotalRooms())
                .pricePerNight(roomType.getBasePrice())
                .build();
    }
    
    private boolean checkAndReserveRooms(BookingRequest request) {
        List<Availability> availabilities = availabilityRepository
                .findByPropertyIdAndRoomTypeIdAndDateBetweenWithLock(
                        request.getPropertyId(),
                        request.getRoomTypeId(),
                        request.getCheckIn(),
                        request.getCheckOut().minusDays(1)
                );
        
        // Check if all dates have enough rooms
        boolean allAvailable = availabilities.stream()
                .allMatch(a -> a.getAvailableRooms() >= request.getNumberOfRooms());
        
        if (!allAvailable) {
            return false;
        }
        
        // Update availability
        int updated = availabilityRepository.decrementAvailability(
                request.getPropertyId(),
                request.getRoomTypeId(),
                request.getCheckIn(),
                request.getCheckOut().minusDays(1),
                request.getNumberOfRooms()
        );
        
        return updated > 0;
    }
    
    private void restoreAvailability(Booking booking) {
        availabilityRepository.incrementAvailability(
                booking.getPropertyId(),
                booking.getRoomTypeId(),
                booking.getCheckInDate(),
                booking.getCheckOutDate().minusDays(1),
                booking.getNumberOfRooms()
        );
    }
    
    private BigDecimal calculateTotalPrice(RoomType roomType, BookingRequest request) {
        long nights = ChronoUnit.DAYS.between(request.getCheckIn(), request.getCheckOut());
        BigDecimal basePrice = roomType.getBasePrice()
                .multiply(BigDecimal.valueOf(nights))
                .multiply(BigDecimal.valueOf(request.getNumberOfRooms()));
        
        // Apply dynamic pricing (weekend surcharge, seasonal rates, etc.)
        BigDecimal adjustedPrice = applyDynamicPricing(basePrice, request);
        
        return adjustedPrice;
    }
    
    private BigDecimal applyDynamicPricing(BigDecimal basePrice, BookingRequest request) {
        // Simple example: 20% surcharge for weekend stays
        boolean hasWeekend = false;
        LocalDate date = request.getCheckIn();
        while (!date.isAfter(request.getCheckOut())) {
            if (date.getDayOfWeek().getValue() >= 6) {
                hasWeekend = true;
                break;
            }
            date = date.plusDays(1);
        }
        
        if (hasWeekend) {
            return basePrice.multiply(BigDecimal.valueOf(1.2));
        }
        
        return basePrice;
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