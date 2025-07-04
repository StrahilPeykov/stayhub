package com.stayhub.booking_service.service;

import com.stayhub.booking_service.dto.*;
import com.stayhub.booking_service.entity.*;
import com.stayhub.booking_service.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class BookingAnalyticsService {
    
    private final BookingRepository bookingRepository;
    private final AvailabilityRepository availabilityRepository;
    private final RoomTypeRepository roomTypeRepository;
    
    /**
     * Get comprehensive booking statistics for a property
     */
    @Transactional(readOnly = true)
    public PropertyBookingStatsDTO getPropertyStats(UUID propertyId, LocalDate startDate, LocalDate endDate) {
        List<Booking> bookings = bookingRepository.findAll().stream()
                .filter(b -> b.getPropertyId().equals(propertyId))
                .filter(b -> !b.getCreatedAt().toLocalDate().isBefore(startDate))
                .filter(b -> !b.getCreatedAt().toLocalDate().isAfter(endDate))
                .collect(Collectors.toList());
        
        Map<String, Integer> statusCount = bookings.stream()
                .collect(Collectors.groupingBy(
                        b -> b.getStatus().toString(),
                        Collectors.collectingAndThen(Collectors.counting(), Long::intValue)
                ));
        
        BigDecimal totalRevenue = bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.COMPLETED)
                .map(Booking::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        double avgStayLength = bookings.stream()
                .mapToLong(b -> ChronoUnit.DAYS.between(b.getCheckInDate(), b.getCheckOutDate()))
                .average()
                .orElse(0.0);
        
        BigDecimal avgBookingValue = bookings.isEmpty() ? BigDecimal.ZERO :
                totalRevenue.divide(BigDecimal.valueOf(bookings.size()), 2, RoundingMode.HALF_UP);
        
        // Calculate occupancy rate
        double occupancyRate = calculateOccupancyRate(propertyId, startDate, endDate);
        
        // Revenue by room type
        Map<String, BigDecimal> revenueByRoomType = calculateRevenueByRoomType(bookings);
        
        return PropertyBookingStatsDTO.builder()
                .propertyId(propertyId)
                .periodStart(startDate)
                .periodEnd(endDate)
                .totalBookings(bookings.size())
                .confirmedBookings(statusCount.getOrDefault("CONFIRMED", 0))
                .cancelledBookings(statusCount.getOrDefault("CANCELLED", 0))
                .totalRevenue(totalRevenue)
                .averageBookingValue(avgBookingValue)
                .averageStayLength(avgStayLength)
                .occupancyRate(occupancyRate)
                .bookingsByStatus(statusCount)
                .revenueByRoomType(revenueByRoomType)
                .build();
    }
    
    /**
     * Get detailed revenue analytics
     */
    public RevenueAnalyticsDTO getRevenueAnalytics(UUID propertyId, String granularity, 
                                                  LocalDate startDate, LocalDate endDate) {
        List<Booking> bookings = getConfirmedBookingsForPeriod(propertyId, startDate, endDate);
        
        BigDecimal totalRevenue = bookings.stream()
                .map(Booking::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        long days = ChronoUnit.DAYS.between(startDate, endDate) + 1;
        BigDecimal avgDailyRevenue = totalRevenue.divide(BigDecimal.valueOf(days), 2, RoundingMode.HALF_UP);
        
        // Build revenue timeline
        List<RevenueAnalyticsDTO.RevenueDataPoint> timeline = buildRevenueTimeline(
                bookings, startDate, endDate, granularity);
        
        // Revenue by source (mock data for now)
        Map<String, BigDecimal> revenueBySource = new HashMap<>();
        revenueBySource.put("Direct", totalRevenue.multiply(new BigDecimal("0.4")));
        revenueBySource.put("Online Travel Agency", totalRevenue.multiply(new BigDecimal("0.35")));
        revenueBySource.put("Corporate", totalRevenue.multiply(new BigDecimal("0.15")));
        revenueBySource.put("Walk-in", totalRevenue.multiply(new BigDecimal("0.1")));
        
        // Simple forecast (last 30 days average projected forward)
        BigDecimal revenueForecast = avgDailyRevenue.multiply(BigDecimal.valueOf(30));
        
        return RevenueAnalyticsDTO.builder()
                .propertyId(propertyId)
                .granularity(granularity)
                .totalRevenue(totalRevenue)
                .averageDailyRevenue(avgDailyRevenue)
                .revenueTimeline(timeline)
                .revenueBySource(revenueBySource)
                .revenueForecast(revenueForecast)
                .build();
    }
    
    /**
     * Get occupancy trends
     */
    public OccupancyTrendsDTO getOccupancyTrends(UUID propertyId, LocalDate month) {
        LocalDate startDate = month.withDayOfMonth(1);
        LocalDate endDate = month.withDayOfMonth(month.lengthOfMonth());
        
        List<Availability> availabilities = availabilityRepository
                .findByPropertyIdAndDateBetween(propertyId, startDate, endDate);
        
        // Group by date
        Map<LocalDate, List<Availability>> byDate = availabilities.stream()
                .collect(Collectors.groupingBy(Availability::getDate));
        
        List<OccupancyTrendsDTO.DailyOccupancy> dailyOccupancy = new ArrayList<>();
        double totalOccupancy = 0;
        double weekdayOccupancy = 0;
        double weekendOccupancy = 0;
        int weekdayCount = 0;
        int weekendCount = 0;
        
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            List<Availability> dayAvail = byDate.getOrDefault(date, Collections.emptyList());
            
            int totalRooms = dayAvail.stream().mapToInt(Availability::getTotalRooms).sum();
            int availableRooms = dayAvail.stream().mapToInt(Availability::getAvailableRooms).sum();
            int occupiedRooms = totalRooms - availableRooms;
            
            double occupancyRate = totalRooms > 0 ? (double) occupiedRooms / totalRooms : 0.0;
            
            dailyOccupancy.add(new OccupancyTrendsDTO.DailyOccupancy(
                    date, occupancyRate, occupiedRooms, totalRooms));
            
            totalOccupancy += occupancyRate;
            
            if (isWeekend(date)) {
                weekendOccupancy += occupancyRate;
                weekendCount++;
            } else {
                weekdayOccupancy += occupancyRate;
                weekdayCount++;
            }
        }
        
        double avgOccupancy = totalOccupancy / dailyOccupancy.size();
        double avgWeekdayOccupancy = weekdayCount > 0 ? weekdayOccupancy / weekdayCount : 0.0;
        double avgWeekendOccupancy = weekendCount > 0 ? weekendOccupancy / weekendCount : 0.0;
        
        // Occupancy by room type
        Map<String, Double> occupancyByRoomType = calculateOccupancyByRoomType(availabilities);
        
        return OccupancyTrendsDTO.builder()
                .propertyId(propertyId)
                .month(month)
                .averageOccupancy(avgOccupancy)
                .weekdayOccupancy(avgWeekdayOccupancy)
                .weekendOccupancy(avgWeekendOccupancy)
                .dailyOccupancy(dailyOccupancy)
                .occupancyByRoomType(occupancyByRoomType)
                .build();
    }
    
    /**
     * Analyze booking patterns
     */
    public BookingPatternsDTO getBookingPatterns(UUID propertyId, int days) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days);
        
        List<Booking> bookings = getBookingsForPeriod(propertyId, startDate, endDate);
        
        // Bookings by day of week
        Map<DayOfWeek, Integer> byDayOfWeek = bookings.stream()
                .collect(Collectors.groupingBy(
                        b -> b.getCreatedAt().getDayOfWeek(),
                        Collectors.collectingAndThen(Collectors.counting(), Long::intValue)
                ));
        
        // Bookings by hour of day
        Map<Integer, Integer> byHourOfDay = bookings.stream()
                .collect(Collectors.groupingBy(
                        b -> b.getCreatedAt().getHour(),
                        Collectors.collectingAndThen(Collectors.counting(), Long::intValue)
                ));
        
        // Lead time analysis
        List<Long> leadTimes = bookings.stream()
                .map(b -> ChronoUnit.DAYS.between(b.getCreatedAt().toLocalDate(), b.getCheckInDate()))
                .collect(Collectors.toList());
        
        double avgLeadTime = leadTimes.stream().mapToLong(Long::longValue).average().orElse(0.0);
        
        Map<String, Integer> leadTimeDistribution = new HashMap<>();
        leadTimeDistribution.put("Same day", (int) leadTimes.stream().filter(lt -> lt == 0).count());
        leadTimeDistribution.put("1-3 days", (int) leadTimes.stream().filter(lt -> lt >= 1 && lt <= 3).count());
        leadTimeDistribution.put("4-7 days", (int) leadTimes.stream().filter(lt -> lt >= 4 && lt <= 7).count());
        leadTimeDistribution.put("8-14 days", (int) leadTimes.stream().filter(lt -> lt >= 8 && lt <= 14).count());
        leadTimeDistribution.put("15-30 days", (int) leadTimes.stream().filter(lt -> lt >= 15 && lt <= 30).count());
        leadTimeDistribution.put("30+ days", (int) leadTimes.stream().filter(lt -> lt > 30).count());
        
        // Stay length distribution
        Map<Integer, Integer> stayLengthDistribution = bookings.stream()
                .collect(Collectors.groupingBy(
                        b -> (int) ChronoUnit.DAYS.between(b.getCheckInDate(), b.getCheckOutDate()),
                        Collectors.collectingAndThen(Collectors.counting(), Long::intValue)
                ));
        
        // Popular check-in/out days
        List<String> popularCheckInDays = bookings.stream()
                .map(b -> b.getCheckInDate().getDayOfWeek().toString())
                .collect(Collectors.groupingBy(day -> day, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(3)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
        
        List<String> popularCheckOutDays = bookings.stream()
                .map(b -> b.getCheckOutDate().getDayOfWeek().toString())
                .collect(Collectors.groupingBy(day -> day, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(3)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
        
        return BookingPatternsDTO.builder()
                .propertyId(propertyId)
                .bookingsByDayOfWeek(byDayOfWeek)
                .bookingsByHourOfDay(byHourOfDay)
                .averageLeadTime(avgLeadTime)
                .leadTimeDistribution(leadTimeDistribution)
                .stayLengthDistribution(stayLengthDistribution)
                .popularCheckInDays(popularCheckInDays)
                .popularCheckOutDays(popularCheckOutDays)
                .build();
    }
    
    /**
     * Analyze cancellations
     */
    public CancellationAnalyticsDTO getCancellationAnalytics(UUID propertyId, 
                                                           LocalDate startDate, LocalDate endDate) {
        List<Booking> allBookings = getBookingsForPeriod(propertyId, startDate, endDate);
        List<Booking> cancelledBookings = allBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CANCELLED)
                .collect(Collectors.toList());
        
        int totalCancellations = cancelledBookings.size();
        double cancellationRate = allBookings.isEmpty() ? 0.0 : 
                (double) totalCancellations / allBookings.size();
        
        BigDecimal lostRevenue = cancelledBookings.stream()
                .map(Booking::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Cancellation reasons (mock data)
        Map<String, Integer> cancellationReasons = new HashMap<>();
        cancellationReasons.put("Change of plans", totalCancellations * 40 / 100);
        cancellationReasons.put("Found better price", totalCancellations * 25 / 100);
        cancellationReasons.put("Personal emergency", totalCancellations * 20 / 100);
        cancellationReasons.put("Other", totalCancellations * 15 / 100);
        
        // Cancellations by days before check-in
        Map<Integer, Integer> cancellationsByDays = new HashMap<>();
        for (Booking booking : cancelledBookings) {
            if (booking.getCancelledAt() != null) {
                long daysBeforeCheckIn = ChronoUnit.DAYS.between(
                        booking.getCancelledAt().toLocalDate(), booking.getCheckInDate());
                
                if (daysBeforeCheckIn >= 30) {
                    cancellationsByDays.merge(30, 1, Integer::sum);
                } else if (daysBeforeCheckIn >= 14) {
                    cancellationsByDays.merge(14, 1, Integer::sum);
                } else if (daysBeforeCheckIn >= 7) {
                    cancellationsByDays.merge(7, 1, Integer::sum);
                } else if (daysBeforeCheckIn >= 3) {
                    cancellationsByDays.merge(3, 1, Integer::sum);
                } else {
                    cancellationsByDays.merge(0, 1, Integer::sum);
                }
            }
        }
        
        double avgRefundAmount = cancelledBookings.stream()
                .map(b -> b.getRefundAmount() != null ? b.getRefundAmount() : BigDecimal.ZERO)
                .mapToDouble(BigDecimal::doubleValue)
                .average()
                .orElse(0.0);
        
        return CancellationAnalyticsDTO.builder()
                .propertyId(propertyId)
                .totalCancellations(totalCancellations)
                .cancellationRate(cancellationRate)
                .lostRevenue(lostRevenue)
                .cancellationReasons(cancellationReasons)
                .cancellationsByDaysBeforeCheckIn(cancellationsByDays)
                .averageRefundAmount(avgRefundAmount)
                .build();
    }
    
    /**
     * Analyze guest demographics
     */
    public GuestDemographicsDTO getGuestDemographics(UUID propertyId, int days) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days);
        
        List<Booking> bookings = getBookingsForPeriod(propertyId, startDate, endDate);
        
        // Mock guest countries (in real system, would come from user data)
        Map<String, Integer> guestsByCountry = new HashMap<>();
        guestsByCountry.put("United States", bookings.size() * 30 / 100);
        guestsByCountry.put("United Kingdom", bookings.size() * 20 / 100);
        guestsByCountry.put("Germany", bookings.size() * 15 / 100);
        guestsByCountry.put("France", bookings.size() * 10 / 100);
        guestsByCountry.put("Netherlands", bookings.size() * 10 / 100);
        guestsByCountry.put("Other", bookings.size() * 15 / 100);
        
        // Bookings by guest count
        Map<String, Integer> bookingsByGuestCount = bookings.stream()
                .collect(Collectors.groupingBy(
                        b -> {
                            int guests = b.getNumberOfGuests();
                            if (guests == 1) return "Solo";
                            else if (guests == 2) return "Couple";
                            else if (guests <= 4) return "Small Group";
                            else return "Large Group";
                        },
                        Collectors.collectingAndThen(Collectors.counting(), Long::intValue)
                ));
        
        double avgGuestsPerBooking = bookings.stream()
                .mapToInt(Booking::getNumberOfGuests)
                .average()
                .orElse(0.0);
        
        // Room type preferences
        Map<String, Integer> roomTypePreferences = bookings.stream()
                .filter(b -> b.getRoomTypeId() != null)
                .collect(Collectors.groupingBy(
                        b -> getRoomTypeName(b.getRoomTypeId()),
                        Collectors.collectingAndThen(Collectors.counting(), Long::intValue)
                ));
        
        // Repeat guests (mock data)
        int repeatGuestCount = bookings.size() * 25 / 100;
        double repeatGuestPercentage = bookings.isEmpty() ? 0.0 : 
                (double) repeatGuestCount / bookings.size() * 100;
        
        return GuestDemographicsDTO.builder()
                .propertyId(propertyId)
                .guestsByCountry(guestsByCountry)
                .bookingsByGuestCount(bookingsByGuestCount)
                .averageGuestsPerBooking(avgGuestsPerBooking)
                .roomTypePreferences(roomTypePreferences)
                .repeatGuestCount(repeatGuestCount)
                .repeatGuestPercentage(repeatGuestPercentage)
                .build();
    }
    
    /**
     * Get price optimization suggestions
     */
    public PriceOptimizationDTO getPriceOptimization(UUID propertyId, UUID roomTypeId) {
        RoomType roomType = roomTypeRepository.findById(roomTypeId)
                .orElseThrow(() -> new RuntimeException("Room type not found"));
        
        BigDecimal currentPrice = roomType.getBasePrice();
        
        // Analyze recent occupancy and pricing
        double recentOccupancy = calculateRecentOccupancy(propertyId, roomTypeId, 30);
        
        // Simple optimization logic
        BigDecimal suggestedPrice;
        String reason;
        BigDecimal potentialIncrease;
        
        if (recentOccupancy > 0.85) {
            // High occupancy - increase price
            suggestedPrice = currentPrice.multiply(new BigDecimal("1.15"));
            reason = "High occupancy rate suggests opportunity for price increase";
            potentialIncrease = suggestedPrice.subtract(currentPrice)
                    .multiply(BigDecimal.valueOf(30)); // Monthly increase
        } else if (recentOccupancy < 0.50) {
            // Low occupancy - decrease price
            suggestedPrice = currentPrice.multiply(new BigDecimal("0.90"));
            reason = "Low occupancy rate suggests price reduction may increase bookings";
            potentialIncrease = BigDecimal.ZERO; // Focus on occupancy increase
        } else {
            // Optimal occupancy
            suggestedPrice = currentPrice;
            reason = "Current pricing is well-optimized for current demand";
            potentialIncrease = BigDecimal.ZERO;
        }
        
        // Date-specific suggestions
        Map<LocalDate, BigDecimal> dateSpecificSuggestions = new HashMap<>();
        LocalDate today = LocalDate.now();
        for (int i = 0; i < 14; i++) {
            LocalDate date = today.plusDays(i);
            if (isWeekend(date)) {
                dateSpecificSuggestions.put(date, suggestedPrice.multiply(new BigDecimal("1.25")));
            } else {
                dateSpecificSuggestions.put(date, suggestedPrice);
            }
        }
        
        // Pricing insights
        List<PriceOptimizationDTO.PricingInsight> insights = new ArrayList<>();
        insights.add(new PriceOptimizationDTO.PricingInsight(
                "Occupancy Analysis",
                String.format("Recent occupancy rate: %.1f%%", recentOccupancy * 100),
                BigDecimal.ZERO
        ));
        insights.add(new PriceOptimizationDTO.PricingInsight(
                "Weekend Premium",
                "Consider 25% premium for Friday and Saturday nights",
                currentPrice.multiply(new BigDecimal("0.25"))
        ));
        insights.add(new PriceOptimizationDTO.PricingInsight(
                "Seasonal Adjustment",
                "Summer season approaching - gradual price increase recommended",
                currentPrice.multiply(new BigDecimal("0.10"))
        ));
        
        return PriceOptimizationDTO.builder()
                .propertyId(propertyId)
                .roomTypeId(roomTypeId)
                .currentBasePrice(currentPrice)
                .suggestedPrice(suggestedPrice)
                .optimizationReason(reason)
                .potentialRevenueIncrease(potentialIncrease)
                .dateSpecificSuggestions(dateSpecificSuggestions)
                .insights(insights)
                .build();
    }
    
    /**
     * Compare with market
     */
    public MarketComparisonDTO getMarketComparison(UUID propertyId, String city) {
        // Mock market data
        double marketAvgOccupancy = 0.72;
        BigDecimal marketAvgRate = new BigDecimal("125.00");
        
        // Get property data
        double propertyOccupancy = calculateOccupancyRate(propertyId, 
                LocalDate.now().minusDays(30), LocalDate.now());
        BigDecimal propertyAvgRate = calculateAverageRate(propertyId);
        
        // Determine market position (1-10, 1 being best)
        int marketPosition = propertyOccupancy > marketAvgOccupancy ? 3 : 6;
        
        // Competitor metrics
        List<MarketComparisonDTO.CompetitorMetric> competitors = new ArrayList<>();
        competitors.add(new MarketComparisonDTO.CompetitorMetric(
                "Luxury Hotels", new BigDecimal("180.00"), 0.75, 0.25
        ));
        competitors.add(new MarketComparisonDTO.CompetitorMetric(
                "Mid-range Hotels", new BigDecimal("120.00"), 0.70, 0.45
        ));
        competitors.add(new MarketComparisonDTO.CompetitorMetric(
                "Budget Hotels", new BigDecimal("80.00"), 0.80, 0.30
        ));
        
        return MarketComparisonDTO.builder()
                .propertyId(propertyId)
                .market(city)
                .marketAverageOccupancy(marketAvgOccupancy)
                .propertyOccupancy(propertyOccupancy)
                .marketAverageRate(marketAvgRate)
                .propertyAverageRate(propertyAvgRate)
                .marketPosition(marketPosition)
                .competitorMetrics(competitors)
                .build();
    }
    
    /**
     * Generate booking forecast
     */
    public BookingForecastDTO generateForecast(UUID propertyId, int days) {
        // Simple forecast based on historical data
        double avgDailyBookings = calculateAverageDailyBookings(propertyId, 90);
        double avgOccupancy = calculateOccupancyRate(propertyId, 
                LocalDate.now().minusDays(90), LocalDate.now());
        BigDecimal avgRevenue = calculateAverageDailyRevenue(propertyId, 90);
        
        List<BookingForecastDTO.DailyForecast> dailyForecasts = new ArrayList<>();
        int totalExpectedBookings = 0;
        BigDecimal totalExpectedRevenue = BigDecimal.ZERO;
        
        LocalDate today = LocalDate.now();
        for (int i = 0; i < days; i++) {
            LocalDate date = today.plusDays(i);
            
            // Adjust for day of week
            double dayMultiplier = isWeekend(date) ? 1.3 : 1.0;
            
            int expectedBookings = (int) Math.round(avgDailyBookings * dayMultiplier);
            BigDecimal expectedRevenue = avgRevenue.multiply(BigDecimal.valueOf(dayMultiplier));
            double expectedOccupancy = Math.min(avgOccupancy * dayMultiplier, 0.95);
            
            dailyForecasts.add(new BookingForecastDTO.DailyForecast(
                    date, expectedBookings, expectedRevenue, expectedOccupancy
            ));
            
            totalExpectedBookings += expectedBookings;
            totalExpectedRevenue = totalExpectedRevenue.add(expectedRevenue);
        }
        
        double avgExpectedOccupancy = dailyForecasts.stream()
                .mapToDouble(BookingForecastDTO.DailyForecast::getExpectedOccupancy)
                .average()
                .orElse(0.0);
        
        return BookingForecastDTO.builder()
                .propertyId(propertyId)
                .forecastDays(days)
                .expectedBookings(totalExpectedBookings)
                .expectedRevenue(totalExpectedRevenue)
                .expectedOccupancy(avgExpectedOccupancy)
                .dailyForecasts(dailyForecasts)
                .confidenceLevel(0.75) // 75% confidence in forecast
                .build();
    }
    
    // Helper methods
    private List<Booking> getBookingsForPeriod(UUID propertyId, LocalDate startDate, LocalDate endDate) {
        return bookingRepository.findAll().stream()
                .filter(b -> b.getPropertyId().equals(propertyId))
                .filter(b -> !b.getCreatedAt().toLocalDate().isBefore(startDate))
                .filter(b -> !b.getCreatedAt().toLocalDate().isAfter(endDate))
                .collect(Collectors.toList());
    }
    
    private List<Booking> getConfirmedBookingsForPeriod(UUID propertyId, LocalDate startDate, LocalDate endDate) {
        return getBookingsForPeriod(propertyId, startDate, endDate).stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.COMPLETED)
                .collect(Collectors.toList());
    }
    
    private double calculateOccupancyRate(UUID propertyId, LocalDate startDate, LocalDate endDate) {
        List<Availability> availabilities = availabilityRepository
                .findByPropertyIdAndDateBetween(propertyId, startDate, endDate);
        
        if (availabilities.isEmpty()) return 0.0;
        
        int totalRoomNights = availabilities.stream()
                .mapToInt(Availability::getTotalRooms)
                .sum();
        
        int bookedRoomNights = availabilities.stream()
                .mapToInt(Availability::getBookedRooms)
                .sum();
        
        return totalRoomNights > 0 ? (double) bookedRoomNights / totalRoomNights : 0.0;
    }
    
    private double calculateRecentOccupancy(UUID propertyId, UUID roomTypeId, int days) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days);
        
        List<Availability> availabilities = availabilityRepository.findAll().stream()
                .filter(a -> a.getPropertyId().equals(propertyId))
                .filter(a -> a.getRoomTypeId().equals(roomTypeId))
                .filter(a -> !a.getDate().isBefore(startDate))
                .filter(a -> !a.getDate().isAfter(endDate))
                .collect(Collectors.toList());
        
        if (availabilities.isEmpty()) return 0.0;
        
        int totalRooms = availabilities.stream().mapToInt(Availability::getTotalRooms).sum();
        int bookedRooms = availabilities.stream().mapToInt(Availability::getBookedRooms).sum();
        
        return totalRooms > 0 ? (double) bookedRooms / totalRooms : 0.0;
    }
    
    private Map<String, BigDecimal> calculateRevenueByRoomType(List<Booking> bookings) {
        return bookings.stream()
                .filter(b -> b.getRoomTypeId() != null)
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.COMPLETED)
                .collect(Collectors.groupingBy(
                        b -> getRoomTypeName(b.getRoomTypeId()),
                        Collectors.mapping(Booking::getTotalAmount,
                                Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))
                ));
    }
    
    private Map<String, Double> calculateOccupancyByRoomType(List<Availability> availabilities) {
        return availabilities.stream()
                .collect(Collectors.groupingBy(
                        a -> getRoomTypeName(a.getRoomTypeId()),
                        Collectors.collectingAndThen(
                                Collectors.toList(),
                                list -> {
                                    int total = list.stream().mapToInt(Availability::getTotalRooms).sum();
                                    int booked = list.stream().mapToInt(Availability::getBookedRooms).sum();
                                    return total > 0 ? (double) booked / total : 0.0;
                                }
                        )
                ));
    }
    
    private String getRoomTypeName(UUID roomTypeId) {
        return roomTypeRepository.findById(roomTypeId)
                .map(RoomType::getName)
                .orElse("Unknown");
    }
    
    private List<RevenueAnalyticsDTO.RevenueDataPoint> buildRevenueTimeline(
            List<Booking> bookings, LocalDate startDate, LocalDate endDate, String granularity) {
        
        Map<LocalDate, List<Booking>> bookingsByDate = bookings.stream()
                .collect(Collectors.groupingBy(b -> b.getCreatedAt().toLocalDate()));
        
        List<RevenueAnalyticsDTO.RevenueDataPoint> timeline = new ArrayList<>();
        
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            List<Booking> dayBookings = bookingsByDate.getOrDefault(current, Collections.emptyList());
            
            BigDecimal dayRevenue = dayBookings.stream()
                    .map(Booking::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            BigDecimal avgRate = dayBookings.isEmpty() ? BigDecimal.ZERO :
                    dayRevenue.divide(BigDecimal.valueOf(dayBookings.size()), 2, RoundingMode.HALF_UP);
            
            timeline.add(new RevenueAnalyticsDTO.RevenueDataPoint(
                    current, dayRevenue, dayBookings.size(), avgRate
            ));
            
            current = current.plusDays(1);
        }
        
        return timeline;
    }
    
    private double calculateAverageDailyBookings(UUID propertyId, int days) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days);
        
        long bookingCount = bookingRepository.findAll().stream()
                .filter(b -> b.getPropertyId().equals(propertyId))
                .filter(b -> !b.getCreatedAt().toLocalDate().isBefore(startDate))
                .filter(b -> !b.getCreatedAt().toLocalDate().isAfter(endDate))
                .count();
        
        return (double) bookingCount / days;
    }
    
    private BigDecimal calculateAverageDailyRevenue(UUID propertyId, int days) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days);
        
        BigDecimal totalRevenue = getConfirmedBookingsForPeriod(propertyId, startDate, endDate).stream()
                .map(Booking::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        return totalRevenue.divide(BigDecimal.valueOf(days), 2, RoundingMode.HALF_UP);
    }
    
    private BigDecimal calculateAverageRate(UUID propertyId) {
        List<RoomType> roomTypes = roomTypeRepository.findByPropertyId(propertyId);
        
        if (roomTypes.isEmpty()) return BigDecimal.ZERO;
        
        BigDecimal totalPrice = roomTypes.stream()
                .map(RoomType::getBasePrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        return totalPrice.divide(BigDecimal.valueOf(roomTypes.size()), 2, RoundingMode.HALF_UP);
    }
    
    private boolean isWeekend(LocalDate date) {
        DayOfWeek day = date.getDayOfWeek();
        return day == DayOfWeek.FRIDAY || day == DayOfWeek.SATURDAY;
    }
}