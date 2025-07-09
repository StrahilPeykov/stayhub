package com.stayhub.booking_service.dto;

import lombok.*;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuestDemographicsDTO {
    private UUID propertyId;
    private Map<String, Integer> guestsByCountry;
    private Map<String, Integer> bookingsByGuestCount;
    private Double averageGuestsPerBooking;
    private Map<String, Integer> roomTypePreferences;
    private Integer repeatGuestCount;
    private Double repeatGuestPercentage;
}