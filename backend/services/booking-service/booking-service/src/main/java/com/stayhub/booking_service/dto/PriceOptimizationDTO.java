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
public class PriceOptimizationDTO {
    private UUID propertyId;
    private UUID roomTypeId;
    private BigDecimal currentBasePrice;
    private BigDecimal suggestedPrice;
    private String optimizationReason;
    private BigDecimal potentialRevenueIncrease;
    private Map<LocalDate, BigDecimal> dateSpecificSuggestions;
    private List<PricingInsight> insights;
    
    @Data
    @AllArgsConstructor
    public static class PricingInsight {
        private String type;
        private String message;
        private BigDecimal impact;
    }
}