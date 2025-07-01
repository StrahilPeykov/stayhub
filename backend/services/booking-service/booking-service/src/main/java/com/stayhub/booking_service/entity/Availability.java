package com.stayhub.booking_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "availabilities", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"property_id", "room_type_id", "date"}),
       indexes = {
           @Index(name = "idx_property_date", columnList = "property_id, date"),
           @Index(name = "idx_available_rooms", columnList = "available_rooms")
       })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Availability {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;
    
    @Column(name = "property_id", nullable = false)
    private UUID propertyId;
    
    @Column(name = "room_type_id", nullable = false)
    private UUID roomTypeId;
    
    @Column(nullable = false)
    private LocalDate date;
    
    @Column(name = "total_rooms", nullable = false)
    private Integer totalRooms;
    
    @Column(name = "available_rooms", nullable = false)
    private Integer availableRooms;
    
    @Column(name = "booked_rooms", nullable = false)
    private Integer bookedRooms = 0;
    
    @Version
    private Long version;
}