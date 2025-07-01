package com.stayhub.booking_service.service;

import com.stayhub.booking_service.dto.BookingRequest;
import com.stayhub.booking_service.dto.BookingResponse;
import com.stayhub.booking_service.entity.*;
import com.stayhub.booking_service.exception.*;
import com.stayhub.booking_service.repository.*;
import com.stayhub.booking_service.client.PropertyServiceClient;
import com.stayhub.booking_service.event.BookingEventPublisher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {
    
    @Mock
    private BookingRepository bookingRepository;
    
    @Mock
    private AvailabilityRepository availabilityRepository;
    
    @Mock
    private RoomTypeRepository roomTypeRepository;
    
    @Mock
    private PropertyServiceClient propertyClient;
    
    @Mock
    private BookingEventPublisher eventPublisher;
    
    @Mock(lenient = true)
    private RedisTemplate<String, String> redisTemplate;
    
    @Mock(lenient = true)
    private ValueOperations<String, String> valueOperations;
    
    @InjectMocks
    private BookingService bookingService;
    
    private BookingRequest validRequest;
    private RoomType roomType;
    private UUID propertyId = UUID.randomUUID();
    private UUID userId = UUID.randomUUID();
    private UUID roomTypeId = UUID.randomUUID();
    
    @BeforeEach
    void setUp() {
        validRequest = BookingRequest.builder()
                .propertyId(propertyId)
                .userId(userId)
                .roomTypeId(roomTypeId)
                .checkIn(LocalDate.now().plusDays(1))
                .checkOut(LocalDate.now().plusDays(3))
                .numberOfRooms(1)
                .numberOfGuests(2)
                .specialRequests("Late check-in")
                .idempotencyKey("test-key-123")
                .build();
        
        roomType = RoomType.builder()
                .id(roomTypeId)
                .propertyId(propertyId)
                .name("Deluxe Room")
                .maxOccupancy(3)
                .basePrice(new BigDecimal("100.00"))
                .totalRooms(10)
                .build();
        
        // Setup Redis mocks - lenient now so won't fail if unused
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    }
    
    @Test
    void createBooking_Success() {
        // Given
        when(roomTypeRepository.findById(roomTypeId)).thenReturn(Optional.of(roomType));
        when(valueOperations.setIfAbsent(anyString(), anyString(), anyLong(), any(TimeUnit.class)))
                .thenReturn(true);
        when(availabilityRepository.findByPropertyIdAndRoomTypeIdAndDateBetweenWithLock(
                any(), any(), any(), any())).thenReturn(createAvailabilityList());
        when(availabilityRepository.decrementAvailability(any(), any(), any(), any(), anyInt()))
                .thenReturn(2);
        
        Booking savedBooking = createBooking();
        when(bookingRepository.save(any(Booking.class))).thenReturn(savedBooking);
        
        // When
        BookingResponse response = bookingService.createBooking(validRequest);
        
        // Then
        assertThat(response).isNotNull();
        assertThat(response.getPropertyId()).isEqualTo(propertyId);
        assertThat(response.getStatus()).isEqualTo(BookingStatus.CONFIRMED);
        assertThat(response.getTotalAmount()).isNotNull();
        
        verify(eventPublisher).publishBookingCreated(any(Booking.class));
        verify(redisTemplate).delete(anyString());
    }
    
    @Test
    void createBooking_IdempotentRequest_ReturnsExisting() {
        // Given
        Booking existingBooking = createBooking();
        when(bookingRepository.findByIdempotencyKey("test-key-123"))
                .thenReturn(Optional.of(existingBooking));
        
        // When
        BookingResponse response = bookingService.createBooking(validRequest);
        
        // Then
        assertThat(response.getId()).isEqualTo(existingBooking.getId());
        verify(bookingRepository, never()).save(any());
    }
    
    @Test
    void createBooking_RoomNotAvailable_ThrowsException() {
        // Given
        when(roomTypeRepository.findById(roomTypeId)).thenReturn(Optional.of(roomType));
        when(valueOperations.setIfAbsent(anyString(), anyString(), anyLong(), any(TimeUnit.class)))
                .thenReturn(true);
        
        List<Availability> unavailable = createAvailabilityList();
        unavailable.get(0).setAvailableRooms(0);
        when(availabilityRepository.findByPropertyIdAndRoomTypeIdAndDateBetweenWithLock(
                any(), any(), any(), any())).thenReturn(unavailable);
        
        // When/Then
        assertThatThrownBy(() -> bookingService.createBooking(validRequest))
                .isInstanceOf(RoomNotAvailableException.class);
        
        verify(redisTemplate).delete(anyString());
    }
    
    @Test
    void createBooking_ConcurrentBooking_ThrowsException() {
        // Given
        when(roomTypeRepository.findById(roomTypeId)).thenReturn(Optional.of(roomType));
        when(valueOperations.setIfAbsent(anyString(), anyString(), anyLong(), any(TimeUnit.class)))
                .thenReturn(false);
        
        // When/Then
        assertThatThrownBy(() -> bookingService.createBooking(validRequest))
                .isInstanceOf(ConcurrentBookingException.class)
                .hasMessage("Another booking is in progress for these dates");
    }
    
    @Test
    void cancelBooking_Success() {
        // Given
        UUID bookingId = UUID.randomUUID();
        Booking booking = createBooking();
        booking.setStatus(BookingStatus.CONFIRMED);
        
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenReturn(booking);
        
        // When
        BookingResponse response = bookingService.cancelBooking(bookingId, "Customer request");
        
        // Then
        assertThat(response.getStatus()).isEqualTo(BookingStatus.CANCELLED);
        verify(availabilityRepository).incrementAvailability(any(), any(), any(), any(), anyInt());
        verify(eventPublisher).publishBookingCancelled(any(Booking.class));
    }
    
    @Test
    void cancelBooking_InvalidState_ThrowsException() {
        // Given
        UUID bookingId = UUID.randomUUID();
        Booking booking = createBooking();
        booking.setStatus(BookingStatus.COMPLETED);
        
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        
        // When/Then
        assertThatThrownBy(() -> bookingService.cancelBooking(bookingId, "Customer request"))
                .isInstanceOf(InvalidBookingStateException.class);
    }
    
    @Test
    void checkAvailability_ReturnsCorrectData() {
        // Given
        when(availabilityRepository.getMinimumAvailability(any(), any(), any(), any()))
                .thenReturn(5);
        when(roomTypeRepository.findById(roomTypeId)).thenReturn(Optional.of(roomType));
        
        // When
        var response = bookingService.checkAvailability(
                propertyId, roomTypeId, 
                LocalDate.now().plusDays(1), 
                LocalDate.now().plusDays(3)
        );
        
        // Then
        assertThat(response.getAvailableRooms()).isEqualTo(5);
        assertThat(response.getTotalRooms()).isEqualTo(10);
        assertThat(response.getPricePerNight()).isEqualTo(new BigDecimal("100.00"));
    }
    
    private Booking createBooking() {
        return Booking.builder()
                .id(UUID.randomUUID())
                .propertyId(propertyId)
                .userId(userId)
                .roomTypeId(roomTypeId)
                .checkInDate(validRequest.getCheckIn())
                .checkOutDate(validRequest.getCheckOut())
                .numberOfRooms(1)
                .numberOfGuests(2)
                .totalAmount(new BigDecimal("200.00"))
                .currency("USD")
                .status(BookingStatus.CONFIRMED)
                .confirmationCode("BK123456")
                .build();
    }
    
    private List<Availability> createAvailabilityList() {
        List<Availability> list = new ArrayList<>();
        LocalDate date = validRequest.getCheckIn();
        while (!date.isAfter(validRequest.getCheckOut().minusDays(1))) {
            list.add(Availability.builder()
                    .propertyId(propertyId)
                    .roomTypeId(roomTypeId)
                    .date(date)
                    .totalRooms(10)
                    .availableRooms(5)
                    .bookedRooms(5)
                    .build());
            date = date.plusDays(1);
        }
        return list;
    }
}
