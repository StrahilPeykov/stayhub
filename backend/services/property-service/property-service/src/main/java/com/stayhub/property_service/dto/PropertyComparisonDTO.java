package com.stayhub.property_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PropertyComparisonDTO {
    private UUID propertyId;
    private String propertyName;
    private String metric;
    private BigDecimal value;
    private Double percentageChange;
    private Integer rank;
}