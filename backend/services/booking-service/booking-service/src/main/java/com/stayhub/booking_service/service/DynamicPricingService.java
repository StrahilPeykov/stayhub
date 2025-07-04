package com.stayhub.booking_service.service;

import com.stayhub.booking_service.entity.RoomType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class DynamicPricingService {
    
    private final AvailabilityService availabilityService;
    
    // Pricing factors
    private static final BigDecimal WEEKEND_MULTIPLIER = new BigDecimal("1.25");
    private static final BigDecimal HOLIDAY_MULTIPLIER = new BigDecimal("1.50");
    private static final BigDecimal LAST_MINUTE_DISCOUNT = new BigDecimal("0.85");
    private static final BigDecimal EARLY_BIRD_DISCOUNT = new BigDecimal("0.90");
    private static final BigDecimal HIGH_DEMAND_MULTIPLIER = new BigDecimal("1.40");
    private static final BigDecimal LOW_DEMAND_MULTIPLIER = new BigDecimal("0.80");
    
    // Seasonal multipliers
    private static final Map<Integer, BigDecimal> SEASONAL_MULTIPLIERS = Map.of(
        1, new BigDecimal("0.85"),  // January - Low season
        2, new BigDecimal("0.90"),  // February
        3, new BigDecimal("1.00"),  // March
        4, new BigDecimal("1.10"),  // April
        5, new BigDecimal("1.15"),  // May
        6, new BigDecimal("1.30"),  // June - High season
        7, new BigDecimal("1.35"),  // July - Peak season
        8, new BigDecimal("1.35"),  // August - Peak season
        9, new BigDecimal("1.20"),  // September
        10, new BigDecimal("1.10"), // October
        11, new BigDecimal("0.95"), // November
        12, new BigDecimal("1.25")  // December - Holiday season
    );
    
    /**
     * Calculate dynamic price for a booking based on multiple factors
     */
    public BigDecimal calculateDynamicPrice(RoomType roomType, LocalDate checkIn, LocalDate checkOut, 
                                           UUID propertyId, int numberOfRooms) {
        BigDecimal basePrice = roomType.getBasePrice();
        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
        
        // Calculate base total
        BigDecimal totalPrice = basePrice
            .multiply(BigDecimal.valueOf(nights))
            .multiply(BigDecimal.valueOf(numberOfRooms));
        
        // Apply dynamic pricing factors
        BigDecimal multiplier = BigDecimal.ONE;
        
        // 1. Weekend pricing
        multiplier = applyWeekendPricing(multiplier, checkIn, checkOut);
        
        // 2. Seasonal pricing
        multiplier = applySeasonalPricing(multiplier, checkIn);
        
        // 3. Demand-based pricing (occupancy rate)
        multiplier = applyDemandPricing(multiplier, propertyId, roomType.getId(), checkIn, checkOut);
        
        // 4. Advance booking discounts/last-minute pricing
        multiplier = applyBookingTimingPricing(multiplier, checkIn);
        
        // 5. Length of stay discounts
        multiplier = applyLengthOfStayDiscount(multiplier, nights);
        
        // 6. Holiday pricing
        multiplier = applyHolidayPricing(multiplier, checkIn, checkOut);
        
        // Apply final multiplier
        BigDecimal finalPrice = totalPrice.multiply(multiplier).setScale(2, RoundingMode.HALF_UP);
        
        log.info("Dynamic pricing calculation: base={}, nights={}, rooms={}, multiplier={}, final={}", 
                basePrice, nights, numberOfRooms, multiplier, finalPrice);
        
        return finalPrice;
    }
    
    /**
     * Apply weekend pricing (Friday/Saturday nights cost more)
     */
    private BigDecimal applyWeekendPricing(BigDecimal currentMultiplier, LocalDate checkIn, LocalDate checkOut) {
        long weekendNights = 0;
        long totalNights = ChronoUnit.DAYS.between(checkIn, checkOut);
        
        LocalDate date = checkIn;
        while (date.isBefore(checkOut)) {
            DayOfWeek dayOfWeek = date.getDayOfWeek();
            if (dayOfWeek == DayOfWeek.FRIDAY || dayOfWeek == DayOfWeek.SATURDAY) {
                weekendNights++;
            }
            date = date.plusDays(1);
        }
        
        if (weekendNights > 0) {
            // Calculate weighted average multiplier
            BigDecimal weekendWeight = BigDecimal.valueOf(weekendNights).divide(BigDecimal.valueOf(totalNights), 4, RoundingMode.HALF_UP);
            BigDecimal weekdayWeight = BigDecimal.ONE.subtract(weekendWeight);
            
            BigDecimal weightedMultiplier = WEEKEND_MULTIPLIER.multiply(weekendWeight)
                .add(BigDecimal.ONE.multiply(weekdayWeight));
            
            return currentMultiplier.multiply(weightedMultiplier);
        }
        
        return currentMultiplier;
    }
    
    /**
     * Apply seasonal pricing based on month
     */
    private BigDecimal applySeasonalPricing(BigDecimal currentMultiplier, LocalDate checkIn) {
        BigDecimal seasonalMultiplier = SEASONAL_MULTIPLIERS.getOrDefault(checkIn.getMonthValue(), BigDecimal.ONE);
        return currentMultiplier.multiply(seasonalMultiplier);
    }
    
    /**
     * Apply demand-based pricing based on current occupancy
     */
    private BigDecimal applyDemandPricing(BigDecimal currentMultiplier, UUID propertyId, 
                                         UUID roomTypeId, LocalDate checkIn, LocalDate checkOut) {
        try {
            // Get availability for the period
            Integer minAvailable = availabilityService.getMinimumAvailability(propertyId, roomTypeId, checkIn, checkOut);
            Integer totalRooms = availabilityService.getTotalRooms(propertyId, roomTypeId);
            
            if (minAvailable != null && totalRooms != null && totalRooms > 0) {
                BigDecimal occupancyRate = BigDecimal.ONE.subtract(
                    BigDecimal.valueOf(minAvailable).divide(BigDecimal.valueOf(totalRooms), 4, RoundingMode.HALF_UP)
                );
                
                // High demand (>80% occupancy)
                if (occupancyRate.compareTo(new BigDecimal("0.80")) > 0) {
                    return currentMultiplier.multiply(HIGH_DEMAND_MULTIPLIER);
                }
                // Low demand (<30% occupancy)
                else if (occupancyRate.compareTo(new BigDecimal("0.30")) < 0) {
                    return currentMultiplier.multiply(LOW_DEMAND_MULTIPLIER);
                }
            }
        } catch (Exception e) {
            log.warn("Could not calculate demand pricing: {}", e.getMessage());
        }
        
        return currentMultiplier;
    }
    
    /**
     * Apply booking timing discounts/surcharges
     */
    private BigDecimal applyBookingTimingPricing(BigDecimal currentMultiplier, LocalDate checkIn) {
        long daysUntilCheckIn = ChronoUnit.DAYS.between(LocalDate.now(), checkIn);
        
        // Last minute booking (within 3 days)
        if (daysUntilCheckIn <= 3) {
            return currentMultiplier.multiply(LAST_MINUTE_DISCOUNT);
        }
        // Early bird discount (more than 60 days in advance)
        else if (daysUntilCheckIn > 60) {
            return currentMultiplier.multiply(EARLY_BIRD_DISCOUNT);
        }
        
        return currentMultiplier;
    }
    
    /**
     * Apply length of stay discounts
     */
    private BigDecimal applyLengthOfStayDiscount(BigDecimal currentMultiplier, long nights) {
        if (nights >= 28) {
            // Monthly stay - 20% discount
            return currentMultiplier.multiply(new BigDecimal("0.80"));
        } else if (nights >= 7) {
            // Weekly stay - 10% discount
            return currentMultiplier.multiply(new BigDecimal("0.90"));
        } else if (nights >= 3) {
            // 3+ nights - 5% discount
            return currentMultiplier.multiply(new BigDecimal("0.95"));
        }
        
        return currentMultiplier;
    }
    
    /**
     * Apply holiday pricing
     */
    private BigDecimal applyHolidayPricing(BigDecimal currentMultiplier, LocalDate checkIn, LocalDate checkOut) {
        Set<LocalDate> holidays = getHolidaysForYear(checkIn.getYear());
        if (checkOut.getYear() != checkIn.getYear()) {
            holidays.addAll(getHolidaysForYear(checkOut.getYear()));
        }
        
        LocalDate date = checkIn;
        while (date.isBefore(checkOut)) {
            if (holidays.contains(date)) {
                return currentMultiplier.multiply(HOLIDAY_MULTIPLIER);
            }
            date = date.plusDays(1);
        }
        
        return currentMultiplier;
    }
    
    /**
     * Get major holidays for a given year (simplified)
     */
    private Set<LocalDate> getHolidaysForYear(int year) {
        return Set.of(
            LocalDate.of(year, 1, 1),   // New Year's Day
            LocalDate.of(year, 7, 4),   // Independence Day (US)
            LocalDate.of(year, 12, 25), // Christmas
            LocalDate.of(year, 12, 31)  // New Year's Eve
        );
    }
    
    /**
     * Get price breakdown for transparency
     */
    public Map<String, Object> getPriceBreakdown(RoomType roomType, LocalDate checkIn, 
                                                 LocalDate checkOut, UUID propertyId, int numberOfRooms) {
        Map<String, Object> breakdown = new HashMap<>();
        
        BigDecimal basePrice = roomType.getBasePrice();
        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
        BigDecimal baseTotal = basePrice.multiply(BigDecimal.valueOf(nights)).multiply(BigDecimal.valueOf(numberOfRooms));
        
        breakdown.put("basePrice", basePrice);
        breakdown.put("nights", nights);
        breakdown.put("numberOfRooms", numberOfRooms);
        breakdown.put("baseTotal", baseTotal);
        
        // Calculate individual factors
        BigDecimal weekendFactor = applyWeekendPricing(BigDecimal.ONE, checkIn, checkOut);
        BigDecimal seasonalFactor = applySeasonalPricing(BigDecimal.ONE, checkIn);
        BigDecimal demandFactor = applyDemandPricing(BigDecimal.ONE, propertyId, roomType.getId(), checkIn, checkOut);
        BigDecimal timingFactor = applyBookingTimingPricing(BigDecimal.ONE, checkIn);
        BigDecimal lengthFactor = applyLengthOfStayDiscount(BigDecimal.ONE, nights);
        BigDecimal holidayFactor = applyHolidayPricing(BigDecimal.ONE, checkIn, checkOut);
        
        breakdown.put("weekendMultiplier", weekendFactor);
        breakdown.put("seasonalMultiplier", seasonalFactor);
        breakdown.put("demandMultiplier", demandFactor);
        breakdown.put("timingMultiplier", timingFactor);
        breakdown.put("lengthOfStayMultiplier", lengthFactor);
        breakdown.put("holidayMultiplier", holidayFactor);
        
        BigDecimal finalPrice = calculateDynamicPrice(roomType, checkIn, checkOut, propertyId, numberOfRooms);
        breakdown.put("finalPrice", finalPrice);
        breakdown.put("savings", baseTotal.subtract(finalPrice).max(BigDecimal.ZERO));
        
        return breakdown;
    }
}