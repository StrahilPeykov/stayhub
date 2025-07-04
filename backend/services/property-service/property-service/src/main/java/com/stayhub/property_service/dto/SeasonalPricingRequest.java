package com.stayhub.property_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
class SeasonalPricingRequest {
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal priceMultiplier;
    private String seasonName;
}