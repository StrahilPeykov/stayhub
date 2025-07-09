package com.stayhub.booking_service.dto;

import lombok.*;
import java.time.DayOfWeek;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingPatternsDTO {
    private UUID propertyId;
    private Map<DayOfWeek, Integer> bookingsByDayOfWeek;
    private Map<Integer, Integer> bookingsByHourOfDay;
    private Double averageLeadTime;
    private Map<String, Integer> leadTimeDistribution;
    private Map<Integer, Integer> stayLengthDistribution;
    private List<String> popularCheckInDays;
    private List<String> popularCheckOutDays;
}