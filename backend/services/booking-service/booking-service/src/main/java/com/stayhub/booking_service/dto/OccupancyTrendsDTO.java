package com.stayhub.booking_service.dto;

import lombok.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OccupancyTrendsDTO {
    private UUID propertyId;
    private LocalDate month;
    private Double averageOccupancy;
    private Double weekdayOccupancy;
    private Double weekendOccupancy;
    private List<DailyOccupancy> dailyOccupancy;
    private Map<String, Double> occupancyByRoomType;
    
    @Data
    @AllArgsConstructor
    public static class DailyOccupancy {
        private LocalDate date;
        private Double occupancyRate;
        private Integer roomsOccupied;
        private Integer totalRooms;
    }
}