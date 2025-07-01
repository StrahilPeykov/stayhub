package com.stayhub.booking_service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stayhub.booking_service.dto.BookingRequest;
import com.stayhub.booking_service.entity.Availability;
import com.stayhub.booking_service.entity.RoomType;
import com.stayhub.booking_service.repository.AvailabilityRepository;
import com.stayhub.booking_service.repository.RoomTypeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@Transactional
class BookingIntegrationTest {
    
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");
    
    @Container
    static GenericContainer<?> redis = new GenericContainer<>(DockerImageName.parse("redis:7-alpine"))
            .withExposedPorts(6379);
    
    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
    }
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Autowired
    private RoomTypeRepository roomTypeRepository;
    
    @Autowired
    private AvailabilityRepository availabilityRepository;
    
    private UUID propertyId;
    private UUID roomTypeId;
    
    @BeforeEach
    void setUp() {
        propertyId = UUID.randomUUID();
        
        // Create room type
        RoomType roomType = RoomType.builder()
                .propertyId(propertyId)
                .name("Test Room")
                .description("A test room for integration testing")
                .maxOccupancy(2)
                .basePrice(new BigDecimal("100.00"))
                .totalRooms(5)
                .build();
        
        roomType = roomTypeRepository.save(roomType);
        roomTypeId = roomType.getId();
        
        // Initialize availability for the next 30 days
        initializeAvailability();
    }
    
    private void initializeAvailability() {
        List<Availability> availabilities = new ArrayList<>();
        LocalDate startDate = LocalDate.now();
        LocalDate endDate = startDate.plusDays(30);
        
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            Availability availability = Availability.builder()
                    .propertyId(propertyId)
                    .roomTypeId(roomTypeId)
                    .date(current)
                    .totalRooms(5)
                    .availableRooms(5)
                    .bookedRooms(0)
                    .build();
            
            availabilities.add(availability);
            current = current.plusDays(1);
        }
        
        availabilityRepository.saveAll(availabilities);
    }
    
    @Test
    void createBooking_Integration_Success() throws Exception {
        BookingRequest request = BookingRequest.builder()
                .propertyId(propertyId)
                .userId(UUID.randomUUID())
                .roomTypeId(roomTypeId)
                .checkIn(LocalDate.now().plusDays(1))
                .checkOut(LocalDate.now().plusDays(3))
                .numberOfRooms(1)
                .numberOfGuests(2)
                .specialRequests("Integration test booking")
                .idempotencyKey("integration-test-" + System.currentTimeMillis())
                .build();
        
        mockMvc.perform(post("/api/v1/bookings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.propertyId").value(propertyId.toString()))
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.confirmationCode").isNotEmpty())
                .andExpect(jsonPath("$.totalAmount").isNumber())
                .andExpect(jsonPath("$.numberOfRooms").value(1))
                .andExpect(jsonPath("$.numberOfGuests").value(2));
    }
    
    @Test
    void createBooking_NoAvailability_ReturnsConflict() throws Exception {
        // Book all available rooms first
        for (int i = 0; i < 5; i++) {
            BookingRequest request = BookingRequest.builder()
                    .propertyId(propertyId)
                    .userId(UUID.randomUUID())
                    .roomTypeId(roomTypeId)
                    .checkIn(LocalDate.now().plusDays(5))
                    .checkOut(LocalDate.now().plusDays(7))
                    .numberOfRooms(1)
                    .numberOfGuests(1)
                    .idempotencyKey("test-" + i + "-" + System.currentTimeMillis())
                    .build();
            
            mockMvc.perform(post("/api/v1/bookings")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated());
        }
        
        // Now try to book one more room - should fail
        BookingRequest request = BookingRequest.builder()
                .propertyId(propertyId)
                .userId(UUID.randomUUID())
                .roomTypeId(roomTypeId)
                .checkIn(LocalDate.now().plusDays(5))
                .checkOut(LocalDate.now().plusDays(7))
                .numberOfRooms(1)
                .numberOfGuests(1)
                .idempotencyKey("test-fail-" + System.currentTimeMillis())
                .build();
        
        mockMvc.perform(post("/api/v1/bookings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Rooms not available for selected dates"));
    }
    
    @Test
    void checkAvailability_ReturnsCorrectData() throws Exception {
        LocalDate checkIn = LocalDate.now().plusDays(10);
        LocalDate checkOut = LocalDate.now().plusDays(12);
        
        mockMvc.perform(get("/api/v1/bookings/availability")
                .param("propertyId", propertyId.toString())
                .param("roomTypeId", roomTypeId.toString())
                .param("checkIn", checkIn.toString())
                .param("checkOut", checkOut.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.propertyId").value(propertyId.toString()))
                .andExpect(jsonPath("$.roomTypeId").value(roomTypeId.toString()))
                .andExpect(jsonPath("$.availableRooms").value(5))
                .andExpect(jsonPath("$.totalRooms").value(5))
                .andExpect(jsonPath("$.pricePerNight").value(100.00));
    }
}
