package com.stayhub.property_service.service;

import com.stayhub.property_service.dto.*;
import com.stayhub.property_service.entity.Property;
import com.stayhub.property_service.repository.PropertyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import org.springframework.core.ParameterizedTypeReference;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PropertyOwnerService {
    
    private final PropertyRepository propertyRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    
    @Value("${services.booking.url:http://localhost:8082}")
    private String bookingServiceUrl;
    
    @Value("${services.analytics.url:http://localhost:3000}")
    private String analyticsServiceUrl;
    
    /**
     * Get all properties owned by a user
     */
    @Transactional(readOnly = true)
    public List<PropertyOwnerDTO> getOwnerProperties(UUID ownerId) {
        // In a real system, we'd have an owner_id field in properties table
        // For now, we'll return all properties as a demo
        List<Property> properties = propertyRepository.findAll();
        
        return properties.stream()
                .map(this::mapToOwnerDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get detailed analytics for a property
     */
    public PropertyAnalyticsDTO getPropertyAnalytics(UUID ownerId, UUID propertyId, 
                                                   LocalDate startDate, LocalDate endDate) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        
        // Call booking service for analytics data
        String url = bookingServiceUrl + "/api/analytics/properties/" + propertyId + 
                    "?startDate=" + startDate + "&endDate=" + endDate;
        
        try {
            // Mock response for now
            PropertyAnalyticsDTO analytics = PropertyAnalyticsDTO.builder()
                    .propertyId(propertyId)
                    .propertyName(property.getName())
                    .periodStart(startDate)
                    .periodEnd(endDate)
                    .totalRevenue(generateMockRevenue())
                    .totalBookings(generateRandomInt(20, 100))
                    .canceledBookings(generateRandomInt(0, 10))
                    .averageOccupancyRate(generateRandomDouble(0.5, 0.9))
                    .averageBookingValue(generateMockRevenue().divide(BigDecimal.valueOf(30), RoundingMode.HALF_UP))
                    .averageStayLength(generateRandomDouble(2.5, 5.5))
                    .bookingsByRoomType(generateMockRoomTypeData())
                    .revenueByRoomType(generateMockRevenueByRoomType())
                    .dailyMetrics(generateDailyMetrics(startDate, endDate))
                    .build();
            
            return analytics;
            
        } catch (Exception e) {
            log.error("Failed to fetch analytics for property: {}", propertyId, e);
            throw new RuntimeException("Failed to fetch analytics");
        }
    }
    
    /**
     * Get revenue summary for owner
     */
    public RevenueDTO getOwnerRevenue(UUID ownerId, String period, int months) {
        List<Property> properties = propertyRepository.findAll();
        
        BigDecimal totalRevenue = BigDecimal.ZERO;
        Map<UUID, RevenueDTO.PropertyRevenue> propertyRevenues = new HashMap<>();
        List<RevenueDTO.PeriodRevenue> periodRevenues = new ArrayList<>();
        
        // Generate mock revenue data
        for (int i = 0; i < months; i++) {
            LocalDate monthDate = LocalDate.now().minusMonths(i);
            BigDecimal monthRevenue = generateMockRevenue();
            totalRevenue = totalRevenue.add(monthRevenue);
            
            periodRevenues.add(new RevenueDTO.PeriodRevenue(
                    monthDate.getMonth().toString() + " " + monthDate.getYear(),
                    monthRevenue,
                    generateRandomInt(10, 50),
                    i > 0 ? generateRandomDouble(-0.1, 0.2) : 0.0
            ));
        }
        
        // Property revenue breakdown
        for (Property property : properties) {
            BigDecimal propRevenue = generateMockRevenue().multiply(BigDecimal.valueOf(months));
            propertyRevenues.put(property.getId(), new RevenueDTO.PropertyRevenue(
                    property.getName(),
                    propRevenue,
                    propRevenue.divide(totalRevenue, 2, RoundingMode.HALF_UP).doubleValue()
            ));
        }
        
        return RevenueDTO.builder()
                .ownerId(ownerId)
                .period(period)
                .totalRevenue(totalRevenue)
                .averageMonthlyRevenue(totalRevenue.divide(BigDecimal.valueOf(months), RoundingMode.HALF_UP))
                .revenueByPeriod(periodRevenues)
                .revenueByProperty(propertyRevenues)
                .build();
    }
    
    /**
     * Get occupancy data
     */
    public OccupancyDTO getPropertyOccupancy(UUID ownerId, UUID propertyId, LocalDate month) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        
        LocalDate startOfMonth = month.withDayOfMonth(1);
        LocalDate endOfMonth = month.withDayOfMonth(month.lengthOfMonth());
        
        List<OccupancyDTO.DailyOccupancy> dailyOccupancy = new ArrayList<>();
        
        // Generate mock occupancy data
        LocalDate current = startOfMonth;
        while (!current.isAfter(endOfMonth)) {
            int totalRooms = property.getTotalRooms() != null ? property.getTotalRooms() : 20;
            int occupied = generateRandomInt((int)(totalRooms * 0.3), (int)(totalRooms * 0.95));
            
            dailyOccupancy.add(new OccupancyDTO.DailyOccupancy(
                    current,
                    occupied,
                    totalRooms,
                    (double) occupied / totalRooms
            ));
            
            current = current.plusDays(1);
        }
        
        double avgOccupancy = dailyOccupancy.stream()
                .mapToDouble(d -> d.getOccupancyRate())
                .average()
                .orElse(0.0);
        
        return OccupancyDTO.builder()
                .propertyId(propertyId)
                .month(month)
                .averageOccupancy(avgOccupancy)
                .dailyOccupancy(dailyOccupancy)
                .build();
    }
    
    /**
     * Update property availability
     */
    @Transactional
    public void updatePropertyAvailability(UUID ownerId, UUID propertyId, 
                                         AvailabilityUpdateRequest request) {
        // Validate ownership
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        
        // Call booking service to update availability
        String url = bookingServiceUrl + "/api/v1/availability/update";
        
        try {
            restTemplate.postForObject(url, request, String.class);
            log.info("Updated availability for property: {} from {} to {}", 
                    propertyId, request.getStartDate(), request.getEndDate());
        } catch (Exception e) {
            log.error("Failed to update availability", e);
            throw new RuntimeException("Failed to update availability");
        }
    }
    
    /**
     * Update room inventory
     */
    @Transactional
    public void updateRoomInventory(UUID ownerId, UUID propertyId, UUID roomTypeId,
                                  RoomInventoryUpdateRequest request) {
        // Call booking service to update inventory
        String url = bookingServiceUrl + "/api/v1/room-types/" + roomTypeId + "/inventory";
        
        try {
            restTemplate.put(url, request);
            log.info("Updated room inventory for room type: {} on {}", 
                    roomTypeId, request.getDate());
        } catch (Exception e) {
            log.error("Failed to update room inventory", e);
            throw new RuntimeException("Failed to update room inventory");
        }
    }
    
    /**
     * Get upcoming bookings
     */
    public List<BookingDTO> getUpcomingBookings(UUID ownerId, UUID propertyId, int days) {
        // Mock data for demonstration
        List<BookingDTO> bookings = new ArrayList<>();
        
        for (int i = 0; i < generateRandomInt(5, 15); i++) {
            LocalDate checkIn = LocalDate.now().plusDays(generateRandomInt(1, days));
            LocalDate checkOut = checkIn.plusDays(generateRandomInt(1, 7));
            
            bookings.add(BookingDTO.builder()
                    .bookingId(UUID.randomUUID())
                    .guestName("Guest " + (i + 1))
                    .checkIn(checkIn)
                    .checkOut(checkOut)
                    .roomType("Deluxe Room")
                    .numberOfRooms(generateRandomInt(1, 3))
                    .numberOfGuests(generateRandomInt(1, 6))
                    .totalAmount(generateMockRevenue())
                    .status("CONFIRMED")
                    .confirmationCode("BK" + System.currentTimeMillis() + i)
                    .build());
        }
        
        return bookings.stream()
                .sorted(Comparator.comparing(BookingDTO::getCheckIn))
                .collect(Collectors.toList());
    }
    
    /**
     * Get booking calendar
     */
    public Map<LocalDate, List<BookingDTO>> getBookingCalendar(UUID ownerId, UUID propertyId, 
                                                              LocalDate month) {
        List<BookingDTO> bookings = getUpcomingBookings(ownerId, propertyId, 31);
        
        // Group bookings by check-in date
        return bookings.stream()
                .filter(b -> !b.getCheckIn().isBefore(month.withDayOfMonth(1)) && 
                            !b.getCheckIn().isAfter(month.withDayOfMonth(month.lengthOfMonth())))
                .collect(Collectors.groupingBy(BookingDTO::getCheckIn));
    }
    
    /**
     * Set seasonal pricing
     */
    @Transactional
    public void setSeasonalPricing(UUID ownerId, UUID propertyId, 
                                 SeasonalPricingRequest request) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        
        // In a real system, we'd store this in a seasonal_pricing table
        log.info("Setting seasonal pricing for property: {} from {} to {} with multiplier: {}", 
                propertyId, request.getStartDate(), request.getEndDate(), request.getPriceMultiplier());
    }
    
    /**
     * Compare properties performance
     */
    public List<PropertyComparisonDTO> compareProperties(UUID ownerId, String metric, int months) {
        List<Property> properties = propertyRepository.findAll();
        List<PropertyComparisonDTO> comparisons = new ArrayList<>();
        
        for (int i = 0; i < properties.size(); i++) {
            Property property = properties.get(i);
            BigDecimal value = generateMockRevenue().multiply(BigDecimal.valueOf(months));
            
            comparisons.add(PropertyComparisonDTO.builder()
                    .propertyId(property.getId())
                    .propertyName(property.getName())
                    .metric(metric)
                    .value(value)
                    .percentageChange(generateRandomDouble(-0.2, 0.3))
                    .rank(i + 1)
                    .build());
        }
        
        // Sort by value descending
        comparisons.sort((a, b) -> b.getValue().compareTo(a.getValue()));
        
        // Update ranks
        for (int i = 0; i < comparisons.size(); i++) {
            comparisons.get(i).setRank(i + 1);
        }
        
        return comparisons;
    }
    
    /**
     * Export data
     */
    public Map<String, String> exportData(UUID ownerId, String type, 
                                        LocalDate startDate, LocalDate endDate) {
        Map<String, String> exportInfo = new HashMap<>();
        
        // In a real system, this would generate CSV/Excel files and store in S3
        String exportId = UUID.randomUUID().toString();
        exportInfo.put("exportId", exportId);
        exportInfo.put("status", "PROCESSING");
        exportInfo.put("type", type);
        exportInfo.put("format", "CSV");
        exportInfo.put("estimatedTime", "2 minutes");
        exportInfo.put("downloadUrl", "/api/exports/" + exportId + "/download");
        
        log.info("Started data export {} for owner: {} type: {} from {} to {}", 
                exportId, ownerId, type, startDate, endDate);
        
        return exportInfo;
    }
    
    // Helper methods
    private PropertyOwnerDTO mapToOwnerDTO(Property property) {
        return PropertyOwnerDTO.builder()
                .id(property.getId())
                .name(property.getName())
                .location(property.getCity() + ", " + property.getCountry())
                .totalRooms(property.getTotalRooms() != null ? property.getTotalRooms() : 20)
                .averagePrice(property.getBasePrice() != null ? property.getBasePrice() : new BigDecimal("100"))
                .occupancyRate(generateRandomDouble(0.6, 0.9))
                .monthlyRevenue(generateMockRevenue())
                .activeBookings(generateRandomInt(5, 20))
                .rating(generateRandomDouble(4.0, 5.0))
                .isActive(true)
                .build();
    }
    
    private BigDecimal generateMockRevenue() {
        return BigDecimal.valueOf(generateRandomDouble(5000, 25000))
                .setScale(2, RoundingMode.HALF_UP);
    }
    
    private int generateRandomInt(int min, int max) {
        return new Random().nextInt(max - min + 1) + min;
    }
    
    private double generateRandomDouble(double min, double max) {
        return min + (max - min) * new Random().nextDouble();
    }
    
    private Map<String, Integer> generateMockRoomTypeData() {
        Map<String, Integer> data = new HashMap<>();
        data.put("Standard Room", generateRandomInt(20, 40));
        data.put("Deluxe Room", generateRandomInt(15, 35));
        data.put("Suite", generateRandomInt(5, 15));
        return data;
    }
    
    private Map<String, BigDecimal> generateMockRevenueByRoomType() {
        Map<String, BigDecimal> data = new HashMap<>();
        data.put("Standard Room", generateMockRevenue());
        data.put("Deluxe Room", generateMockRevenue().multiply(BigDecimal.valueOf(1.5)));
        data.put("Suite", generateMockRevenue().multiply(BigDecimal.valueOf(2.5)));
        return data;
    }
    
    private List<PropertyAnalyticsDTO.DailyMetric> generateDailyMetrics(LocalDate start, LocalDate end) {
        List<PropertyAnalyticsDTO.DailyMetric> metrics = new ArrayList<>();
        
        LocalDate current = start;
        while (!current.isAfter(end)) {
            metrics.add(new PropertyAnalyticsDTO.DailyMetric(
                    current,
                    generateMockRevenue().divide(BigDecimal.valueOf(30), RoundingMode.HALF_UP),
                    generateRandomInt(0, 5),
                    generateRandomDouble(0.4, 0.95)
            ));
            current = current.plusDays(1);
        }
        
        return metrics;
    }
}