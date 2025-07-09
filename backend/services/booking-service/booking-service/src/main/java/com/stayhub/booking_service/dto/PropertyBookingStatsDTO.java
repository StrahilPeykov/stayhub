package com.stayhub.booking_service.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PropertyBookingStatsDTO {
    private UUID propertyId;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private Integer totalBookings;
    private Integer confirmedBookings;
    private Integer cancelledBookings;
    private BigDecimal totalRevenue;
    private BigDecimal averageBookingValue;
    private Double averageStayLength;
    private Double occupancyRate;
    private Map<String, Integer> bookingsByStatus;
    private Map<String, BigDecimal> revenueByRoomType;
}