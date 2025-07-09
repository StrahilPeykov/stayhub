package com.stayhub.booking_service.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancellationAnalyticsDTO {
    private UUID propertyId;
    private Integer totalCancellations;
    private Double cancellationRate;
    private BigDecimal lostRevenue;
    private Map<String, Integer> cancellationReasons;
    private Map<Integer, Integer> cancellationsByDaysBeforeCheckIn;
    private Double averageRefundAmount;
}