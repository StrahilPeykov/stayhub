package com.stayhub.booking_service.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevenueAnalyticsDTO {
    private UUID propertyId;
    private String granularity;
    private BigDecimal totalRevenue;
    private BigDecimal averageDailyRevenue;
    private List<RevenueDataPoint> revenueTimeline;
    private Map<String, BigDecimal> revenueBySource;
    private BigDecimal revenueForecast;
    
    @Data
    @AllArgsConstructor
    public static class RevenueDataPoint {
        private LocalDate date;
        private BigDecimal revenue;
        private Integer bookings;
        private BigDecimal averageRate;
    }
}