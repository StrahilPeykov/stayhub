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
