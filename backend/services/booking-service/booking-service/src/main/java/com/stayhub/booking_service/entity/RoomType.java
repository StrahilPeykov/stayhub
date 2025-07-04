package com.stayhub.booking_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.GenericGenerator;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "room_types")
@Data
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomType {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;
    
    @Column(name = "property_id", nullable = false)
    private UUID propertyId;
    
    @Column(nullable = false)
    private String name;
    
    private String description;
    
    @Column(name = "max_occupancy", nullable = false)
    private Integer maxOccupancy;
    
    @Column(name = "base_price", precision = 10, scale = 2, nullable = false)
    private BigDecimal basePrice;
    
    @Column(name = "total_rooms", nullable = false)
    private Integer totalRooms;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Explicit getter methods to ensure they exist
    public UUID getId() { return id; }
    public UUID getPropertyId() { return propertyId; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public Integer getMaxOccupancy() { return maxOccupancy; }
    public BigDecimal getBasePrice() { return basePrice; }
    public Integer getTotalRooms() { return totalRooms; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}