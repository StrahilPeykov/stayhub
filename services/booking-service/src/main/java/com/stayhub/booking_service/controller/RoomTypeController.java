package com.stayhub.booking_service.controller;

import com.stayhub.booking_service.entity.RoomType;
import com.stayhub.booking_service.repository.RoomTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/room-types")
@RequiredArgsConstructor
@Slf4j
public class RoomTypeController {
    
    private final RoomTypeRepository roomTypeRepository;
    
    @PostMapping
    public ResponseEntity<RoomType> createRoomType(@Valid @RequestBody RoomType roomType) {
        log.info("Creating room type: {} for property: {}", roomType.getName(), roomType.getPropertyId());
        RoomType saved = roomTypeRepository.save(roomType);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<RoomType> getRoomType(@PathVariable UUID id) {
        return roomTypeRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping
    public List<RoomType> getAllRoomTypes(@RequestParam(required = false) UUID propertyId) {
        if (propertyId != null) {
            return roomTypeRepository.findByPropertyId(propertyId);
        }
        return roomTypeRepository.findAll();
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<RoomType> updateRoomType(@PathVariable UUID id, 
                                                 @Valid @RequestBody RoomType roomType) {
        return roomTypeRepository.findById(id)
                .map(existing -> {
                    existing.setName(roomType.getName());
                    existing.setDescription(roomType.getDescription());
                    existing.setMaxOccupancy(roomType.getMaxOccupancy());
                    existing.setBasePrice(roomType.getBasePrice());
                    existing.setTotalRooms(roomType.getTotalRooms());
                    return ResponseEntity.ok(roomTypeRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoomType(@PathVariable UUID id) {
        if (roomTypeRepository.existsById(id)) {
            roomTypeRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}