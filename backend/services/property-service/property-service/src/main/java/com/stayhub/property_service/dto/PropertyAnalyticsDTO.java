package com.stayhub.property_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PropertyAnalyticsDTO {
    private UUID propertyId;
    private String propertyName;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private BigDecimal totalRevenue;
    private Integer totalBookings;
    private Integer canceledBookings;
    private Double averageOccupancyRate;
    private BigDecimal averageBookingValue;
    private Double averageStayLength;
    private Map<String, Integer> bookingsByRoomType;
    private Map<String, BigDecimal> revenueByRoomType;
    private List<DailyMetric> dailyMetrics;
    
    @Data
    @AllArgsConstructor
    public static class DailyMetric {
        private LocalDate date;
        private BigDecimal revenue;
        private Integer bookings;
        private Double occupancyRate;
    }
}