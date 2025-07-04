package com.stayhub.booking_service.service;

import com.stayhub.booking_service.entity.Availability;
import com.stayhub.booking_service.entity.RoomType;
import com.stayhub.booking_service.exception.ConcurrentBookingException;
import com.stayhub.booking_service.exception.RoomNotAvailableException;
import com.stayhub.booking_service.repository.AvailabilityRepository;
import com.stayhub.booking_service.repository.RoomTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class AvailabilityService {
    
    private final AvailabilityRepository availabilityRepository;
    private final RoomTypeRepository roomTypeRepository;
    
    // In-memory locks for property-room combinations to prevent race conditions
    private final ConcurrentHashMap<String, Lock> bookingLocks = new ConcurrentHashMap<>();
    private static final int LOCK_TIMEOUT_SECONDS = 10;
    
    @Transactional
    public void initializeAvailability(UUID propertyId, UUID roomTypeId, 
                                     LocalDate startDate, LocalDate endDate) {
        RoomType roomType = roomTypeRepository.findById(roomTypeId)
                .orElseThrow(() -> new IllegalArgumentException("Room type not found"));
        
        List<Availability> availabilities = new ArrayList<>();
        LocalDate date = startDate;
        
        while (!date.isAfter(endDate)) {
            // Check if availability already exists
            if (!availabilityRepository.findByPropertyIdAndRoomTypeIdAndDate(propertyId, roomTypeId, date).isPresent()) {
                Availability availability = Availability.builder()
                        .propertyId(propertyId)
                        .roomTypeId(roomTypeId)
                        .date(date)
                        .totalRooms(roomType.getTotalRooms())
                        .availableRooms(roomType.getTotalRooms())
                        .bookedRooms(0)
                        .build();
                
                availabilities.add(availability);
            }
            date = date.plusDays(1);
        }
        
        if (!availabilities.isEmpty()) {
            availabilityRepository.saveAll(availabilities);
            log.info("Initialized {} days of availability for property {} room type {}", 
                    availabilities.size(), propertyId, roomTypeId);
        }
    }
    
    /**
     * Reserve rooms with distributed lock and optimistic locking
     */
    @Retryable(value = {OptimisticLockingFailureException.class, ConcurrentBookingException.class}, 
               maxAttempts = 3, 
               backoff = @Backoff(delay = 100, multiplier = 2))
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public boolean reserveRooms(UUID propertyId, UUID roomTypeId, LocalDate checkIn, 
                               LocalDate checkOut, int numberOfRooms) {
        String lockKey = propertyId + "_" + roomTypeId;
        Lock lock = bookingLocks.computeIfAbsent(lockKey, k -> new ReentrantLock());
        
        boolean acquired = false;
        try {
            // Try to acquire lock with timeout
            acquired = lock.tryLock(LOCK_TIMEOUT_SECONDS, TimeUnit.SECONDS);
            if (!acquired) {
                throw new ConcurrentBookingException("Could not acquire booking lock");
            }
            
            // Fetch availabilities with pessimistic lock
            List<Availability> availabilities = availabilityRepository
                    .findByPropertyIdAndRoomTypeIdAndDateBetweenWithLock(
                            propertyId, roomTypeId, checkIn, checkOut.minusDays(1));
            
            // Check if we have availability records for all dates
            long expectedDays = ChronoUnit.DAYS.between(checkIn, checkOut);
            if (availabilities.size() != expectedDays) {
                log.warn("Missing availability records. Expected: {}, Found: {}", expectedDays, availabilities.size());
                // Initialize missing dates
                initializeAvailability(propertyId, roomTypeId, checkIn, checkOut);
                // Re-fetch after initialization
                availabilities = availabilityRepository
                        .findByPropertyIdAndRoomTypeIdAndDateBetweenWithLock(
                                propertyId, roomTypeId, checkIn, checkOut.minusDays(1));
            }
            
            // Check availability for all dates
            boolean allAvailable = availabilities.stream()
                    .allMatch(a -> a.getAvailableRooms() >= numberOfRooms);
            
            if (!allAvailable) {
                // Find which dates are not available
                List<LocalDate> unavailableDates = availabilities.stream()
                        .filter(a -> a.getAvailableRooms() < numberOfRooms)
                        .map(Availability::getDate)
                        .collect(Collectors.toList());
                
                log.info("Rooms not available for dates: {}", unavailableDates);
                return false;
            }
            
            // Update availability for each date
            for (Availability availability : availabilities) {
                availability.setAvailableRooms(availability.getAvailableRooms() - numberOfRooms);
                availability.setBookedRooms(availability.getBookedRooms() + numberOfRooms);
            }
            
            // Save all with version increment (handled by @Version)
            availabilityRepository.saveAll(availabilities);
            
            log.info("Successfully reserved {} rooms for property {} from {} to {}", 
                    numberOfRooms, propertyId, checkIn, checkOut.minusDays(1));
            
            return true;
            
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ConcurrentBookingException("Booking interrupted");
        } catch (OptimisticLockingFailureException e) {
            log.warn("Optimistic lock failure, will retry: {}", e.getMessage());
            throw e;
        } finally {
            if (acquired) {
                lock.unlock();
            }
        }
    }
    
    /**
     * Release rooms (for cancellations)
     */
    @Transactional
    public void releaseRooms(UUID propertyId, UUID roomTypeId, LocalDate checkIn, 
                           LocalDate checkOut, int numberOfRooms) {
        int updated = availabilityRepository.incrementAvailability(
                propertyId, roomTypeId, checkIn, checkOut.minusDays(1), numberOfRooms);
        
        log.info("Released {} rooms for {} dates", numberOfRooms, updated);
    }
    
    /**
     * Get minimum availability for a date range (for pricing and availability checks)
     */
    @Transactional(readOnly = true)
    public Integer getMinimumAvailability(UUID propertyId, UUID roomTypeId, 
                                        LocalDate checkIn, LocalDate checkOut) {
        return availabilityRepository.getMinimumAvailability(
                propertyId, roomTypeId, checkIn, checkOut.minusDays(1));
    }
    
    /**
     * Get total rooms for a room type
     */
    @Transactional(readOnly = true)
    public Integer getTotalRooms(UUID propertyId, UUID roomTypeId) {
        return roomTypeRepository.findById(roomTypeId)
                .map(RoomType::getTotalRooms)
                .orElse(0);
    }
    
    /**
     * Get availability calendar for a property
     */
    @Transactional(readOnly = true)
    public Map<LocalDate, AvailabilityInfo> getAvailabilityCalendar(UUID propertyId, 
                                                                   LocalDate startDate, 
                                                                   LocalDate endDate) {
        List<Availability> availabilities = availabilityRepository
                .findByPropertyIdAndDateBetween(propertyId, startDate, endDate);
        
        Map<LocalDate, AvailabilityInfo> calendar = new TreeMap<>();
        
        // Group by date
        Map<LocalDate, List<Availability>> byDate = availabilities.stream()
                .collect(Collectors.groupingBy(Availability::getDate));
        
        for (Map.Entry<LocalDate, List<Availability>> entry : byDate.entrySet()) {
            LocalDate date = entry.getKey();
            List<Availability> dayAvailability = entry.getValue();
            
            int totalAvailable = dayAvailability.stream()
                    .mapToInt(Availability::getAvailableRooms)
                    .sum();
            
            int totalRooms = dayAvailability.stream()
                    .mapToInt(Availability::getTotalRooms)
                    .sum();
            
            double occupancyRate = totalRooms > 0 ? 
                    (double)(totalRooms - totalAvailable) / totalRooms : 0.0;
            
            calendar.put(date, new AvailabilityInfo(totalAvailable, totalRooms, occupancyRate));
        }
        
        return calendar;
    }
    
    /**
     * Check for overbooking risks
     */
    @Transactional(readOnly = true)
    public List<OverbookingAlert> checkOverbookingRisks(UUID propertyId, LocalDate startDate, LocalDate endDate) {
        List<OverbookingAlert> alerts = new ArrayList<>();
        
        List<Availability> availabilities = availabilityRepository
                .findByPropertyIdAndDateBetween(propertyId, startDate, endDate);
        
        // Group by room type
        Map<UUID, List<Availability>> byRoomType = availabilities.stream()
                .collect(Collectors.groupingBy(Availability::getRoomTypeId));
        
        for (Map.Entry<UUID, List<Availability>> entry : byRoomType.entrySet()) {
            UUID roomTypeId = entry.getKey();
            List<Availability> roomAvailabilities = entry.getValue();
            
            // Check for dates with low availability (< 10%)
            for (Availability availability : roomAvailabilities) {
                double availabilityRate = availability.getTotalRooms() > 0 ?
                        (double) availability.getAvailableRooms() / availability.getTotalRooms() : 0.0;
                
                if (availabilityRate < 0.1 && availability.getAvailableRooms() > 0) {
                    alerts.add(new OverbookingAlert(
                            roomTypeId,
                            availability.getDate(),
                            availability.getAvailableRooms(),
                            availability.getTotalRooms(),
                            "Low availability - consider overbooking protection"
                    ));
                }
            }
        }
        
        return alerts;
    }
    
    /**
     * Update room inventory (for property managers)
     */
    @Transactional
    public void updateRoomInventory(UUID propertyId, UUID roomTypeId, 
                                  LocalDate date, int newTotalRooms) {
        Availability availability = availabilityRepository
                .findByPropertyIdAndRoomTypeIdAndDate(propertyId, roomTypeId, date)
                .orElseThrow(() -> new IllegalArgumentException("Availability record not found"));
        
        int currentBooked = availability.getBookedRooms();
        if (newTotalRooms < currentBooked) {
            throw new IllegalArgumentException(
                    String.format("Cannot reduce inventory below booked rooms. Booked: %d, New total: %d", 
                            currentBooked, newTotalRooms));
        }
        
        availability.setTotalRooms(newTotalRooms);
        availability.setAvailableRooms(newTotalRooms - currentBooked);
        
        availabilityRepository.save(availability);
        
        log.info("Updated room inventory for {} on {} to {} total rooms", 
                roomTypeId, date, newTotalRooms);
    }
    
    // Helper classes
    public static class AvailabilityInfo {
        public final int availableRooms;
        public final int totalRooms;
        public final double occupancyRate;
        
        public AvailabilityInfo(int availableRooms, int totalRooms, double occupancyRate) {
            this.availableRooms = availableRooms;
            this.totalRooms = totalRooms;
            this.occupancyRate = occupancyRate;
        }
    }
    
    public static class OverbookingAlert {
        public final UUID roomTypeId;
        public final LocalDate date;
        public final int availableRooms;
        public final int totalRooms;
        public final String message;
        
        public OverbookingAlert(UUID roomTypeId, LocalDate date, int availableRooms, 
                              int totalRooms, String message) {
            this.roomTypeId = roomTypeId;
            this.date = date;
            this.availableRooms = availableRooms;
            this.totalRooms = totalRooms;
            this.message = message;
        }
    }
}