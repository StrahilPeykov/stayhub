package com.stayhub.property_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class OccupancyDTO {
    private UUID propertyId;
    private LocalDate month;
    private Double averageOccupancy;
    private Map<UUID, RoomTypeOccupancy> occupancyByRoomType;
    private List<DailyOccupancy> dailyOccupancy;
    
    @Data
    @AllArgsConstructor
    public static class RoomTypeOccupancy {
        private String roomTypeName;
        private Double occupancyRate;
        private Integer totalRooms;
        private Integer occupiedNights;
    }
    
    @Data
    @AllArgsConstructor
    public static class DailyOccupancy {
        private LocalDate date;
        private Integer occupiedRooms;
        private Integer totalRooms;
        private Double occupancyRate;
    }
}