package com.stayhub.property_service.event;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "spring.kafka.enabled", havingValue = "true", matchIfMissing = false)
public class BookingEventListener {
    
    private final ObjectMapper objectMapper;
    
    @KafkaListener(topics = "booking-events", groupId = "property-service")
    public void handleBookingEvent(String eventData) {
        try {
            Map<String, Object> event = objectMapper.readValue(eventData, Map.class);
            String eventType = (String) event.get("eventType");
            UUID propertyId = UUID.fromString((String) event.get("propertyId"));
            
            log.info("Received booking event: {} for property: {}", eventType, propertyId);
            
            // Here you could update property statistics, availability summary, etc.
            switch (eventType) {
                case "BOOKING_CREATED":
                    // Update property booking count, occupancy rate, etc.
                    break;
                case "BOOKING_CANCELLED":
                    // Update cancellation statistics
                    break;
            }
        } catch (Exception e) {
            log.error("Error processing booking event", e);
        }
    }
}