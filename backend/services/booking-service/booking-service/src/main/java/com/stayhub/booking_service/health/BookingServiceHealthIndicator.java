package com.stayhub.booking_service.health;

import com.stayhub.booking_service.repository.BookingRepository;
import com.stayhub.booking_service.repository.AvailabilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class BookingServiceHealthIndicator implements HealthIndicator {
    
    private final BookingRepository bookingRepository;
    private final AvailabilityRepository availabilityRepository;
    
    @Override
    public Health health() {
        try {
            Map<String, Object> details = new HashMap<>();
            
            // Check database connectivity
            long bookingCount = bookingRepository.count();
            details.put("totalBookings", bookingCount);
            
            // Check today's bookings
            LocalDate today = LocalDate.now();
            long todayCheckIns = bookingRepository.findAll().stream()
                .filter(b -> b.getCheckInDate().equals(today))
                .count();
            details.put("todayCheckIns", todayCheckIns);
            
            // Check availability records
            long availabilityCount = availabilityRepository.count();
            details.put("availabilityRecords", availabilityCount);
            
            // Add timestamp
            details.put("timestamp", LocalDateTime.now());
            details.put("status", "Booking service is operational");
            
            return Health.up().withDetails(details).build();
            
        } catch (Exception e) {
            return Health.down()
                .withDetail("error", e.getMessage())
                .withException(e)
                .build();
        }
    }
}