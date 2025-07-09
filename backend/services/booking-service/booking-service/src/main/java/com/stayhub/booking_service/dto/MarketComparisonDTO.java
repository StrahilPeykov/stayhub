package com.stayhub.booking_service.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MarketComparisonDTO {
    private UUID propertyId;
    private String market;
    private Double marketAverageOccupancy;
    private Double propertyOccupancy;
    private BigDecimal marketAverageRate;
    private BigDecimal propertyAverageRate;
    private Integer marketPosition;
    private List<CompetitorMetric> competitorMetrics;
    
    @Data
    @AllArgsConstructor
    public static class CompetitorMetric {
        private String competitorType;
        private BigDecimal averageRate;
        private Double occupancyRate;
        private Double marketShare;
    }
}