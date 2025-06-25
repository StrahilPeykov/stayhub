package com.stayhub.property_service.event;

import com.stayhub.property_service.entity.Property;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PropertyEventPublisher {
    
    private final KafkaTemplate<String, Object> kafkaTemplate;
    
    private static final String PROPERTY_EVENTS_TOPIC = "property-events";
    
    public void publishPropertyCreated(Property property) {
        PropertyEvent event = PropertyEvent.builder()
                .eventType("PROPERTY_CREATED")
                .propertyId(property.getId())
                .propertyName(property.getName())
                .city(property.getAddress() != null ? property.getAddress().getCity() : null)
                .totalRooms(property.getTotalRooms())
                .build();
        
        kafkaTemplate.send(PROPERTY_EVENTS_TOPIC, property.getId().toString(), event);
        log.info("Published property created event for: {}", property.getId());
    }
    
    public void publishPropertyUpdated(Property property) {
        PropertyEvent event = PropertyEvent.builder()
                .eventType("PROPERTY_UPDATED")
                .propertyId(property.getId())
                .propertyName(property.getName())
                .city(property.getAddress() != null ? property.getAddress().getCity() : null)
                .totalRooms(property.getTotalRooms())
                .build();
        
        kafkaTemplate.send(PROPERTY_EVENTS_TOPIC, property.getId().toString(), event);
        log.info("Published property updated event for: {}", property.getId());
    }
    
    public void publishPropertyDeleted(Property property) {
        PropertyEvent event = PropertyEvent.builder()
                .eventType("PROPERTY_DELETED")
                .propertyId(property.getId())
                .propertyName(property.getName())
                .build();
        
        kafkaTemplate.send(PROPERTY_EVENTS_TOPIC, property.getId().toString(), event);
        log.info("Published property deleted event for: {}", property.getId());
    }
}
