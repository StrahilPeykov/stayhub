package com.stayhub.property_service.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PropertyEvent {
    private String eventType;
    private UUID propertyId;
    private String propertyName;
    private String city;
    private Integer totalRooms;
}