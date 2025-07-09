package com.stayhub.property_service.controller;

import com.stayhub.property_service.dto.*;
import com.stayhub.property_service.service.PropertyOwnerService;
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
@RequestMapping("/api/owners")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
@Slf4j
public class PropertyOwnerController {
    
    private final PropertyOwnerService propertyOwnerService;
    
    /**
     * Get all properties owned by a user
     */
    @GetMapping("/{ownerId}/properties")
    public ResponseEntity<List<PropertyOwnerDTO>> getOwnerProperties(@PathVariable UUID ownerId) {
        log.info("Fetching properties for owner: {}", ownerId);
        List<PropertyOwnerDTO> properties = propertyOwnerService.getOwnerProperties(ownerId);
        return ResponseEntity.ok(properties);
    }
    
    /**
     * Get property performance analytics
     */
    @GetMapping("/{ownerId}/properties/{propertyId}/analytics")
    public ResponseEntity<PropertyAnalyticsDTO> getPropertyAnalytics(
            @PathVariable UUID ownerId,
            @PathVariable UUID propertyId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        log.info("Fetching analytics for property: {} from {} to {}", propertyId, startDate, endDate);
        PropertyAnalyticsDTO analytics = propertyOwnerService.getPropertyAnalytics(
                ownerId, propertyId, startDate, endDate);
        return ResponseEntity.ok(analytics);
    }
    
    /**
     * Get revenue summary for all properties
     */
    @GetMapping("/{ownerId}/revenue")
    public ResponseEntity<RevenueDTO> getOwnerRevenue(
            @PathVariable UUID ownerId,
            @RequestParam(defaultValue = "MONTHLY") String period,
            @RequestParam(defaultValue = "6") int months) {
        
        log.info("Fetching revenue for owner: {} for {} months", ownerId, months);
        RevenueDTO revenue = propertyOwnerService.getOwnerRevenue(ownerId, period, months);
        return ResponseEntity.ok(revenue);
    }
    
    /**
     * Get occupancy rates
     */
    @GetMapping("/{ownerId}/properties/{propertyId}/occupancy")
    public ResponseEntity<OccupancyDTO> getPropertyOccupancy(
            @PathVariable UUID ownerId,
            @PathVariable UUID propertyId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month) {
        
        log.info("Fetching occupancy for property: {} for month: {}", propertyId, month);
        OccupancyDTO occupancy = propertyOwnerService.getPropertyOccupancy(ownerId, propertyId, month);
        return ResponseEntity.ok(occupancy);
    }
    
    /**
     * Update property availability calendar
     */
    @PutMapping("/{ownerId}/properties/{propertyId}/availability")
    public ResponseEntity<String> updateAvailability(
            @PathVariable UUID ownerId,
            @PathVariable UUID propertyId,
            @RequestBody AvailabilityUpdateRequest request) {
        
        log.info("Updating availability for property: {}", propertyId);
        propertyOwnerService.updatePropertyAvailability(ownerId, propertyId, request);
        return ResponseEntity.ok("Availability updated successfully");
    }
    
    /**
     * Update room inventory
     */
    @PutMapping("/{ownerId}/properties/{propertyId}/rooms/{roomTypeId}/inventory")
    public ResponseEntity<String> updateRoomInventory(
            @PathVariable UUID ownerId,
            @PathVariable UUID propertyId,
            @PathVariable UUID roomTypeId,
            @RequestBody RoomInventoryUpdateRequest request) {
        
        log.info("Updating room inventory for room type: {}", roomTypeId);
        propertyOwnerService.updateRoomInventory(ownerId, propertyId, roomTypeId, request);
        return ResponseEntity.ok("Room inventory updated successfully");
    }
    
    /**
     * Get upcoming bookings
     */
    @GetMapping("/{ownerId}/properties/{propertyId}/bookings/upcoming")
    public ResponseEntity<List<BookingDTO>> getUpcomingBookings(
            @PathVariable UUID ownerId,
            @PathVariable UUID propertyId,
            @RequestParam(defaultValue = "30") int days) {
        
        log.info("Fetching upcoming bookings for property: {} for next {} days", propertyId, days);
        List<BookingDTO> bookings = propertyOwnerService.getUpcomingBookings(ownerId, propertyId, days);
        return ResponseEntity.ok(bookings);
    }
    
    /**
     * Get booking calendar view
     */
    @GetMapping("/{ownerId}/properties/{propertyId}/calendar")
    public ResponseEntity<Map<LocalDate, List<BookingDTO>>> getBookingCalendar(
            @PathVariable UUID ownerId,
            @PathVariable UUID propertyId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month) {
        
        log.info("Fetching booking calendar for property: {} for month: {}", propertyId, month);
        Map<LocalDate, List<BookingDTO>> calendar = propertyOwnerService.getBookingCalendar(
                ownerId, propertyId, month);
        return ResponseEntity.ok(calendar);
    }
    
    /**
     * Set seasonal pricing rules
     */
    @PostMapping("/{ownerId}/properties/{propertyId}/pricing/seasonal")
    public ResponseEntity<String> setSeasonalPricing(
            @PathVariable UUID ownerId,
            @PathVariable UUID propertyId,
            @RequestBody SeasonalPricingRequest request) {
        
        log.info("Setting seasonal pricing for property: {}", propertyId);
        propertyOwnerService.setSeasonalPricing(ownerId, propertyId, request);
        return ResponseEntity.ok("Seasonal pricing updated successfully");
    }
    
    /**
     * Get performance comparison
     */
    @GetMapping("/{ownerId}/properties/comparison")
    public ResponseEntity<List<PropertyComparisonDTO>> compareProperties(
            @PathVariable UUID ownerId,
            @RequestParam(defaultValue = "REVENUE") String metric,
            @RequestParam(defaultValue = "3") int months) {
        
        log.info("Comparing properties for owner: {} by {}", ownerId, metric);
        List<PropertyComparisonDTO> comparison = propertyOwnerService.compareProperties(
                ownerId, metric, months);
        return ResponseEntity.ok(comparison);
    }
    
    /**
     * Export data
     */
    @GetMapping("/{ownerId}/export")
    public ResponseEntity<Map<String, String>> exportOwnerData(
            @PathVariable UUID ownerId,
            @RequestParam String type,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        log.info("Exporting {} data for owner: {} from {} to {}", type, ownerId, startDate, endDate);
        Map<String, String> exportInfo = propertyOwnerService.exportData(ownerId, type, startDate, endDate);
        return ResponseEntity.ok(exportInfo);
    }
}
