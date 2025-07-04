package com.stayhub.property_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
class RoomInventoryUpdateRequest {
    private LocalDate date;
    private Integer newTotalRooms;
}