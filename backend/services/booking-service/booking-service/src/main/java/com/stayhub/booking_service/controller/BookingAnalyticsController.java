package com.stayhub.booking_service.controller;

import com.stayhub.booking_service.service.BookingAnalyticsService;
import com.stayhub.booking_service.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Slf4j
public class BookingAnalyticsController {
    
    private final BookingAnalyticsService analyticsService;
    
    /**
     * Get booking statistics for a property
     */
    @GetMapping("/properties/{propertyId}")
    public ResponseEntity<PropertyBookingStatsDTO> getPropertyStats(
            @PathVariable UUID propertyId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        log.info("Fetching booking stats for property: {} from {} to {}", propertyId, startDate, endDate);
        PropertyBookingStatsDTO stats = analyticsService.getPropertyStats(propertyId, startDate, endDate);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Get revenue analytics
     */
    @GetMapping("/properties/{propertyId}/revenue")
    public ResponseEntity<RevenueAnalyticsDTO> getRevenueAnalytics(
            @PathVariable UUID propertyId,
            @RequestParam(defaultValue = "DAILY") String granularity,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        log.info("Fetching revenue analytics for property: {}", propertyId);
        RevenueAnalyticsDTO revenue = analyticsService.getRevenueAnalytics(
                propertyId, granularity, startDate, endDate);
        return ResponseEntity.ok(revenue);
    }
    
    /**
     * Get occupancy trends
     */
    @GetMapping("/properties/{propertyId}/occupancy")
    public ResponseEntity<OccupancyTrendsDTO> getOccupancyTrends(
            @PathVariable UUID propertyId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month) {
        
        log.info("Fetching occupancy trends for property: {} for month: {}", propertyId, month);
        OccupancyTrendsDTO trends = analyticsService.getOccupancyTrends(propertyId, month);
        return ResponseEntity.ok(trends);
    }
    
    /**
     * Get booking patterns (day of week, lead time, etc.)
     */
    @GetMapping("/properties/{propertyId}/patterns")
    public ResponseEntity<BookingPatternsDTO> getBookingPatterns(
            @PathVariable UUID propertyId,
            @RequestParam(defaultValue = "90") int days) {
        
        log.info("Fetching booking patterns for property: {} for last {} days", propertyId, days);
        BookingPatternsDTO patterns = analyticsService.getBookingPatterns(propertyId, days);
        return ResponseEntity.ok(patterns);
    }
    
    /**
     * Get cancellation analytics
     */
    @GetMapping("/properties/{propertyId}/cancellations")
    public ResponseEntity<CancellationAnalyticsDTO> getCancellationAnalytics(
            @PathVariable UUID propertyId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        log.info("Fetching cancellation analytics for property: {}", propertyId);
        CancellationAnalyticsDTO cancellations = analyticsService.getCancellationAnalytics(
                propertyId, startDate, endDate);
        return ResponseEntity.ok(cancellations);
    }
    
    /**
     * Get guest demographics
     */
    @GetMapping("/properties/{propertyId}/demographics")
    public ResponseEntity<GuestDemographicsDTO> getGuestDemographics(
            @PathVariable UUID propertyId,
            @RequestParam(defaultValue = "180") int days) {
        
        log.info("Fetching guest demographics for property: {}", propertyId);
        GuestDemographicsDTO demographics = analyticsService.getGuestDemographics(propertyId, days);
        return ResponseEntity.ok(demographics);
    }
    
    /**
     * Get price optimization suggestions
     */
    @GetMapping("/properties/{propertyId}/price-optimization")
    public ResponseEntity<PriceOptimizationDTO> getPriceOptimization(
            @PathVariable UUID propertyId,
            @RequestParam UUID roomTypeId) {
        
        log.info("Fetching price optimization for property: {} room type: {}", propertyId, roomTypeId);
        PriceOptimizationDTO optimization = analyticsService.getPriceOptimization(propertyId, roomTypeId);
        return ResponseEntity.ok(optimization);
    }
    
    /**
     * Compare with market/competitors
     */
    @GetMapping("/properties/{propertyId}/market-comparison")
    public ResponseEntity<MarketComparisonDTO> getMarketComparison(
            @PathVariable UUID propertyId,
            @RequestParam String city) {
        
        log.info("Fetching market comparison for property: {} in {}", propertyId, city);
        MarketComparisonDTO comparison = analyticsService.getMarketComparison(propertyId, city);
        return ResponseEntity.ok(comparison);
    }
    
    /**
     * Get forecast
     */
    @GetMapping("/properties/{propertyId}/forecast")
    public ResponseEntity<BookingForecastDTO> getBookingForecast(
            @PathVariable UUID propertyId,
            @RequestParam(defaultValue = "30") int days) {
        
        log.info("Generating booking forecast for property: {} for next {} days", propertyId, days);
        BookingForecastDTO forecast = analyticsService.generateForecast(propertyId, days);
        return ResponseEntity.ok(forecast);
    }
}

// Analytics DTOs
package com.stayhub.booking_service.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.DayOfWeek;
import java.util.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class PropertyBookingStatsDTO {
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

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class RevenueAnalyticsDTO {
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

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class OccupancyTrendsDTO {
    private UUID propertyId;
    private LocalDate month;
    private Double averageOccupancy;
    private Double weekdayOccupancy;
    private Double weekendOccupancy;
    private List<DailyOccupancy> dailyOccupancy;
    private Map<String, Double> occupancyByRoomType;
    
    @Data
    @AllArgsConstructor
    public static class DailyOccupancy {
        private LocalDate date;
        private Double occupancyRate;
        private Integer roomsOccupied;
        private Integer totalRooms;
    }
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class BookingPatternsDTO {
    private UUID propertyId;
    private Map<DayOfWeek, Integer> bookingsByDayOfWeek;
    private Map<Integer, Integer> bookingsByHourOfDay;
    private Double averageLeadTime;
    private Map<String, Integer> leadTimeDistribution;
    private Map<Integer, Integer> stayLengthDistribution;
    private List<String> popularCheckInDays;
    private List<String> popularCheckOutDays;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class CancellationAnalyticsDTO {
    private UUID propertyId;
    private Integer totalCancellations;
    private Double cancellationRate;
    private BigDecimal lostRevenue;
    private Map<String, Integer> cancellationReasons;
    private Map<Integer, Integer> cancellationsByDaysBeforeCheckIn;
    private Double averageRefundAmount;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class GuestDemographicsDTO {
    private UUID propertyId;
    private Map<String, Integer> guestsByCountry;
    private Map<String, Integer> bookingsByGuestCount;
    private Double averageGuestsPerBooking;
    private Map<String, Integer> roomTypePreferences;
    private Integer repeatGuestCount;
    private Double repeatGuestPercentage;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class PriceOptimizationDTO {
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

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class MarketComparisonDTO {
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

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class BookingForecastDTO {
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