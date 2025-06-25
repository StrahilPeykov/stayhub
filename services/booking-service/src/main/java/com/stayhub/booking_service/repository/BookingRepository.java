package com.stayhub.booking_service.repository;

import com.stayhub.booking_service.entity.Booking;
import com.stayhub.booking_service.entity.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID>, JpaSpecificationExecutor<Booking> {
    
    Optional<Booking> findByIdempotencyKey(String idempotencyKey);
    
    Optional<Booking> findByConfirmationCode(String confirmationCode);
    
    List<Booking> findByUserId(UUID userId);
    
    Page<Booking> findByUserId(UUID userId, Pageable pageable);
    
    List<Booking> findByPropertyIdAndStatus(UUID propertyId, BookingStatus status);
    
    @Query("SELECT b FROM Booking b WHERE b.propertyId = :propertyId " +
           "AND b.status IN ('CONFIRMED', 'PENDING') " +
           "AND ((b.checkInDate <= :checkOut AND b.checkOutDate >= :checkIn))")
    List<Booking> findOverlappingBookings(@Param("propertyId") UUID propertyId,
                                         @Param("checkIn") LocalDate checkIn,
                                         @Param("checkOut") LocalDate checkOut);
    
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.propertyId = :propertyId " +
           "AND b.roomTypeId = :roomTypeId " +
           "AND b.status IN ('CONFIRMED', 'PENDING') " +
           "AND ((b.checkInDate <= :checkOut AND b.checkOutDate >= :checkIn))")
    Long countOverlappingBookings(@Param("propertyId") UUID propertyId,
                                  @Param("roomTypeId") UUID roomTypeId,
                                  @Param("checkIn") LocalDate checkIn,
                                  @Param("checkOut") LocalDate checkOut);
    
    @Query("SELECT SUM(b.numberOfRooms) FROM Booking b WHERE b.propertyId = :propertyId " +
           "AND b.roomTypeId = :roomTypeId " +
           "AND b.status IN ('CONFIRMED', 'PENDING') " +
           "AND :date BETWEEN b.checkInDate AND b.checkOutDate")
    Integer getTotalBookedRoomsForDate(@Param("propertyId") UUID propertyId,
                                      @Param("roomTypeId") UUID roomTypeId,
                                      @Param("date") LocalDate date);
    
    @Query("SELECT b FROM Booking b WHERE b.status = 'PENDING' " +
           "AND b.createdAt < :expirationTime")
    List<Booking> findExpiredPendingBookings(@Param("expirationTime") LocalDate expirationTime);
}
