package com.stayhub.property_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class RevenueDTO {
    private UUID ownerId;
    private String period;
    private BigDecimal totalRevenue;
    private BigDecimal averageMonthlyRevenue;
    private List<PeriodRevenue> revenueByPeriod;
    private Map<UUID, PropertyRevenue> revenueByProperty;
    
    @Data
    @AllArgsConstructor
    public static class PeriodRevenue {
        private String period;
        private BigDecimal revenue;
        private Integer bookings;
        private Double growthRate;
    }
    
    @Data
    @AllArgsConstructor
    public static class PropertyRevenue {
        private String propertyName;
        private BigDecimal revenue;
        private Double contribution;
    }
}