package com.stayhub.booking_service.repository;

import com.stayhub.booking_service.entity.Booking;
import com.stayhub.booking_service.entity.BookingStatus;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.UUID;

public class BookingSpecifications {
    
    public static Specification<Booking> hasUserId(UUID userId) {
        return (root, query, criteriaBuilder) -> 
            criteriaBuilder.equal(root.get("userId"), userId);
    }
    
    public static Specification<Booking> hasPropertyId(UUID propertyId) {
        return (root, query, criteriaBuilder) -> 
            criteriaBuilder.equal(root.get("propertyId"), propertyId);
    }
    
    public static Specification<Booking> hasStatus(BookingStatus status) {
        return (root, query, criteriaBuilder) -> 
            criteriaBuilder.equal(root.get("status"), status);
    }
    
    public static Specification<Booking> checkInBetween(LocalDate from, LocalDate to) {
        return (root, query, criteriaBuilder) -> 
            criteriaBuilder.between(root.get("checkInDate"), from, to);
    }
    
    public static Specification<Booking> checkOutBetween(LocalDate from, LocalDate to) {
        return (root, query, criteriaBuilder) -> 
            criteriaBuilder.between(root.get("checkOutDate"), from, to);
    }
}