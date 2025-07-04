package com.stayhub.booking_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PricePreviewResponse {
    private BigDecimal totalPrice;
    private String currency;
    private Map<String, Object> priceBreakdown;
    private String cancellationPolicy;
}

