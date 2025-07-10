package com.stayhub.booking_service.controller;

import com.stayhub.booking_service.entity.BookingStatus;
import com.stayhub.booking_service.repository.BookingRepository;
import com.stayhub.booking_service.repository.AvailabilityRepository;
import com.stayhub.booking_service.repository.RoomTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.actuate.endpoint.annotation.Endpoint;
import org.springframework.boot.actuate.endpoint.annotation.ReadOperation;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/monitoring")
@RequiredArgsConstructor
public class MonitoringController {
    
    private final BookingRepository bookingRepository;
    private final AvailabilityRepository availabilityRepository;
    private final RoomTypeRepository roomTypeRepository;
    
    @GetMapping("/stats")
    public Map<String, Object> getServiceStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // Booking statistics
        Map<String, Object> bookingStats = new HashMap<>();
        bookingStats.put("total", bookingRepository.count());
        
        // Count by status
        Map<BookingStatus, Long> statusCounts = bookingRepository.findAll().stream()
            .collect(Collectors.groupingBy(
                booking -> booking.getStatus(),
                Collectors.counting()
            ));
        bookingStats.put("byStatus", statusCounts);
        
        // Today's metrics
        LocalDate today = LocalDate.now();
        long todayBookings = bookingRepository.findAll().stream()
            .filter(b -> b.getCreatedAt().toLocalDate().equals(today))
            .count();
        bookingStats.put("todayCreated", todayBookings);
        
        stats.put("bookings", bookingStats);
        
        // Availability statistics
        Map<String, Object> availabilityStats = new HashMap<>();
        availabilityStats.put("totalRecords", availabilityRepository.count());
        
        // Calculate overall occupancy
        List<com.stayhub.booking_service.entity.Availability> todayAvailability = 
            availabilityRepository.findAll().stream()
                .filter(a -> a.getDate().equals(today))
                .collect(Collectors.toList());
        
        if (!todayAvailability.isEmpty()) {
            int totalRooms = todayAvailability.stream()
                .mapToInt(a -> a.getTotalRooms())
                .sum();
            int bookedRooms = todayAvailability.stream()
                .mapToInt(a -> a.getBookedRooms())
                .sum();
            
            double occupancyRate = totalRooms > 0 ? 
                (double) bookedRooms / totalRooms * 100 : 0.0;
            
            availabilityStats.put("todayOccupancy", String.format("%.2f%%", occupancyRate));
            availabilityStats.put("totalRoomsToday", totalRooms);
            availabilityStats.put("bookedRoomsToday", bookedRooms);
        }
        
        stats.put("availability", availabilityStats);
        
        // Room type statistics
        Map<String, Object> roomTypeStats = new HashMap<>();
        roomTypeStats.put("totalTypes", roomTypeRepository.count());
        stats.put("roomTypes", roomTypeStats);
        
        // System info
        Map<String, Object> systemInfo = new HashMap<>();
        systemInfo.put("timestamp", LocalDateTime.now());
        systemInfo.put("uptime", getUptime());
        stats.put("system", systemInfo);
        
        return stats;
    }
    
    @GetMapping("/performance")
    public Map<String, Object> getPerformanceMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        
        Runtime runtime = Runtime.getRuntime();
        long maxMemory = runtime.maxMemory() / 1024 / 1024;
        long totalMemory = runtime.totalMemory() / 1024 / 1024;
        long freeMemory = runtime.freeMemory() / 1024 / 1024;
        long usedMemory = totalMemory - freeMemory;
        
        Map<String, Object> memory = new HashMap<>();
        memory.put("max", maxMemory + " MB");
        memory.put("total", totalMemory + " MB");
        memory.put("used", usedMemory + " MB");
        memory.put("free", freeMemory + " MB");
        memory.put("usage", String.format("%.2f%%", (double) usedMemory / maxMemory * 100));
        
        metrics.put("memory", memory);
        metrics.put("processors", runtime.availableProcessors());
        metrics.put("threads", Thread.activeCount());
        
        return metrics;
    }
    
    private String getUptime() {
        long uptimeMillis = System.currentTimeMillis() - 
            java.lang.management.ManagementFactory.getRuntimeMXBean().getStartTime();
        
        long days = uptimeMillis / (24 * 60 * 60 * 1000);
        long hours = (uptimeMillis % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000);
        long minutes = (uptimeMillis % (60 * 60 * 1000)) / (60 * 1000);
        
        return String.format("%d days, %d hours, %d minutes", days, hours, minutes);
    }
}

@Endpoint(id = "booking-metrics")
@Component
@RequiredArgsConstructor
class BookingMetricsEndpoint {
    
    private final BookingRepository bookingRepository;
    
    @ReadOperation
    public Map<String, Object> bookingMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        
        // Revenue metrics
        double totalRevenue = bookingRepository.findAll().stream()
            .filter(b -> b.getStatus() == BookingStatus.CONFIRMED || 
                        b.getStatus() == BookingStatus.COMPLETED)
            .mapToDouble(b -> b.getTotalAmount().doubleValue())
            .sum();
        
        metrics.put("totalRevenue", totalRevenue);
        metrics.put("averageBookingValue", bookingRepository.count() > 0 ? 
            totalRevenue / bookingRepository.count() : 0);
        
        // Booking trends
        Map<LocalDate, Long> dailyBookings = bookingRepository.findAll().stream()
            .collect(Collectors.groupingBy(
                b -> b.getCreatedAt().toLocalDate(),
                Collectors.counting()
            ));
        
        metrics.put("dailyTrends", dailyBookings);
        
        return metrics;
    }
}