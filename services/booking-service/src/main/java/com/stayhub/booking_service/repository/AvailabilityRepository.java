package com.stayhub.booking_service.repository;

import com.stayhub.booking_service.entity.Availability;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AvailabilityRepository extends JpaRepository<Availability, UUID> {
    
    Optional<Availability> findByPropertyIdAndRoomTypeIdAndDate(UUID propertyId, UUID roomTypeId, LocalDate date);
    
    List<Availability> findByPropertyIdAndDateBetween(UUID propertyId, LocalDate startDate, LocalDate endDate);
    
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Availability a WHERE a.propertyId = :propertyId " +
           "AND a.roomTypeId = :roomTypeId " +
           "AND a.date BETWEEN :startDate AND :endDate")
    List<Availability> findByPropertyIdAndRoomTypeIdAndDateBetweenWithLock(
            @Param("propertyId") UUID propertyId,
            @Param("roomTypeId") UUID roomTypeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
    
    @Modifying
    @Query("UPDATE Availability a SET a.availableRooms = a.availableRooms - :rooms, " +
           "a.bookedRooms = a.bookedRooms + :rooms " +
           "WHERE a.propertyId = :propertyId AND a.roomTypeId = :roomTypeId " +
           "AND a.date BETWEEN :startDate AND :endDate " +
           "AND a.availableRooms >= :rooms")
    int decrementAvailability(@Param("propertyId") UUID propertyId,
                             @Param("roomTypeId") UUID roomTypeId,
                             @Param("startDate") LocalDate startDate,
                             @Param("endDate") LocalDate endDate,
                             @Param("rooms") Integer rooms);
    
    @Modifying
    @Query("UPDATE Availability a SET a.availableRooms = a.availableRooms + :rooms, " +
           "a.bookedRooms = a.bookedRooms - :rooms " +
           "WHERE a.propertyId = :propertyId AND a.roomTypeId = :roomTypeId " +
           "AND a.date BETWEEN :startDate AND :endDate")
    int incrementAvailability(@Param("propertyId") UUID propertyId,
                             @Param("roomTypeId") UUID roomTypeId,
                             @Param("startDate") LocalDate startDate,
                             @Param("endDate") LocalDate endDate,
                             @Param("rooms") Integer rooms);
    
    @Query("SELECT MIN(a.availableRooms) FROM Availability a " +
           "WHERE a.propertyId = :propertyId AND a.roomTypeId = :roomTypeId " +
           "AND a.date BETWEEN :startDate AND :endDate")
    Integer getMinimumAvailability(@Param("propertyId") UUID propertyId,
                                  @Param("roomTypeId") UUID roomTypeId,
                                  @Param("startDate") LocalDate startDate,
                                  @Param("endDate") LocalDate endDate);
}