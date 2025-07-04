package com.stayhub.booking_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailabilityCalendarResponse {
    private Map<LocalDate, DayAvailability> calendar;
    private int totalAvailableDays;
    private double averageOccupancyRate;
    
    @Data
    @AllArgsConstructor
    public static class DayAvailability {
        private int availableRooms;
        private int totalRooms;
        private double occupancyRate;
        private boolean isAvailable;
    }
}