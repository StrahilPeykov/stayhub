package com.stayhub.booking_service.service;

import com.stayhub.booking_service.entity.Availability;
import com.stayhub.booking_service.entity.RoomType;
import com.stayhub.booking_service.repository.AvailabilityRepository;
import com.stayhub.booking_service.repository.RoomTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class AvailabilityService {
    
    private final AvailabilityRepository availabilityRepository;
    private final RoomTypeRepository roomTypeRepository;
    
    @Transactional
    public void initializeAvailability(UUID propertyId, UUID roomTypeId, 
                                     LocalDate startDate, LocalDate endDate) {
        RoomType roomType = roomTypeRepository.findById(roomTypeId)
                .orElseThrow(() -> new IllegalArgumentException("Room type not found"));
        
        List<Availability> availabilities = new ArrayList<>();
        LocalDate date = startDate;
        
        while (!date.isAfter(endDate)) {
            Availability availability = Availability.builder()
                    .propertyId(propertyId)
                    .roomTypeId(roomTypeId)
                    .date(date)
                    .totalRooms(roomType.getTotalRooms())
                    .availableRooms(roomType.getTotalRooms())
                    .bookedRooms(0)
                    .build();
            
            availabilities.add(availability);
            date = date.plusDays(1);
        }
        
        availabilityRepository.saveAll(availabilities);
        log.info("Initialized availability for {} days", availabilities.size());
    }
    
    public List<Availability> getAvailability(UUID propertyId, LocalDate startDate, LocalDate endDate) {
        return availabilityRepository.findByPropertyIdAndDateBetween(propertyId, startDate, endDate);
    }
}