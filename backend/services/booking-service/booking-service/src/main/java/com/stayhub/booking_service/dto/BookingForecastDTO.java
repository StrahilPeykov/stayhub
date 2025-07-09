package com.stayhub.booking_service.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingForecastDTO {
    private UUID propertyId;
    private Integer forecastDays;
    private Integer expectedBookings;
    private BigDecimal expectedRevenue;
    private Double expectedOccupancy;
    private List<DailyForecast> dailyForecasts;
    private Double confidenceLevel;
    
    @Data
    @AllArgsConstructor
    public static class DailyForecast {
        private LocalDate date;
        private Integer expectedBookings;
        private BigDecimal expectedRevenue;
        private Double expectedOccupancy;
    }
}