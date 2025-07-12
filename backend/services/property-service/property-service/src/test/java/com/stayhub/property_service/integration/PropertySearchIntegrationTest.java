package com.stayhub.property_service.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stayhub.property_service.dto.PropertySearchRequest;
import com.stayhub.property_service.dto.PropertySearchResponse;
import com.stayhub.property_service.entity.Property;
import com.stayhub.property_service.repository.PropertyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebMvc
@ActiveProfiles("test")
@Transactional
class PropertySearchIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        propertyRepository.deleteAll();
        createTestProperties();
    }

    private void createTestProperties() {
        // Create test properties with different characteristics
        
        // Luxury hotel in Amsterdam
        Property luxuryHotel = new Property();
        luxuryHotel.setName("Grand Luxury Hotel Amsterdam");
        luxuryHotel.setDescription("5-star luxury hotel in the heart of Amsterdam");
        luxuryHotel.setCity("Amsterdam");
        luxuryHotel.setCountry("Netherlands");
        luxuryHotel.setLatitude(52.3676);
        luxuryHotel.setLongitude(4.9041);
        luxuryHotel.setPropertyType(Property.PropertyType.HOTEL);
        luxuryHotel.setTotalRooms(100);
        luxuryHotel.setMaxGuests(200);
        luxuryHotel.setBasePrice(new BigDecimal("350"));
        luxuryHotel.setRating(4.8);
        luxuryHotel.setReviewCount(250);
        luxuryHotel.setFeatured(true);
        luxuryHotel.setInstantBooking(true);
        luxuryHotel.setAmenities(Arrays.asList("WiFi", "Pool", "Spa", "Gym", "Restaurant"));
        luxuryHotel.setIsActive(true);
        luxuryHotel.setStatus(Property.PropertyStatus.ACTIVE);
        luxuryHotel.setCreatedAt(LocalDateTime.now());
        propertyRepository.save(luxuryHotel);

        // Budget hostel in Amsterdam
        Property budgetHostel = new Property();
        budgetHostel.setName("Amsterdam Budget Hostel");
        budgetHostel.setDescription("Clean and affordable hostel near Central Station");
        budgetHostel.setCity("Amsterdam");
        budgetHostel.setCountry("Netherlands");
        budgetHostel.setLatitude(52.3738);
        budgetHostel.setLongitude(4.8934);
        budgetHostel.setPropertyType(Property.PropertyType.HOSTEL);
        budgetHostel.setTotalRooms(50);
        budgetHostel.setMaxGuests(200);
        budgetHostel.setBasePrice(new BigDecimal("35"));
        budgetHostel.setRating(4.2);
        budgetHostel.setReviewCount(150);
        budgetHostel.setFeatured(false);
        budgetHostel.setInstantBooking(false);
        budgetHostel.setAmenities(Arrays.asList("WiFi", "Shared Kitchen", "Laundry"));
        budgetHostel.setIsActive(true);
        budgetHostel.setStatus(Property.PropertyStatus.ACTIVE);
        budgetHostel.setCreatedAt(LocalDateTime.now());
        propertyRepository.save(budgetHostel);

        // Apartment in Paris
        Property parisApartment = new Property();
        parisApartment.setName("Montmartre Studio Apartment");
        parisApartment.setDescription("Charming studio in artistic Montmartre");
        parisApartment.setCity("Paris");
        parisApartment.setCountry("France");
        parisApartment.setLatitude(48.8867);
        parisApartment.setLongitude(2.3407);
        parisApartment.setPropertyType(Property.PropertyType.APARTMENT);
        parisApartment.setTotalRooms(1);
        parisApartment.setMaxGuests(2);
        parisApartment.setBasePrice(new BigDecimal("95"));
        parisApartment.setRating(4.5);
        parisApartment.setReviewCount(89);
        parisApartment.setFeatured(false);
        parisApartment.setInstantBooking(true);
        parisApartment.setAmenities(Arrays.asList("WiFi", "Kitchen", "Balcony"));
        parisApartment.setIsActive(true);
        parisApartment.setStatus(Property.PropertyStatus.ACTIVE);
        parisApartment.setCreatedAt(LocalDateTime.now());
        propertyRepository.save(parisApartment);

        // Villa in Barcelona
        Property barcelonaVilla = new Property();
        barcelonaVilla.setName("Barcelona Beachfront Villa");
        barcelonaVilla.setDescription("Luxury villa with sea views");
        barcelonaVilla.setCity("Barcelona");
        barcelonaVilla.setCountry("Spain");
        barcelonaVilla.setLatitude(41.3851);
        barcelonaVilla.setLongitude(2.1734);
        barcelonaVilla.setPropertyType(Property.PropertyType.VILLA);
        barcelonaVilla.setTotalRooms(5);
        barcelonaVilla.setMaxGuests(10);
        barcelonaVilla.setBasePrice(new BigDecimal("450"));
        barcelonaVilla.setRating(4.9);
        barcelonaVilla.setReviewCount(45);
        barcelonaVilla.setFeatured(true);
        barcelonaVilla.setInstantBooking(false);
        barcelonaVilla.setAmenities(Arrays.asList("WiFi", "Pool", "Garden", "BBQ", "Beach Access"));
        barcelonaVilla.setIsActive(true);
        barcelonaVilla.setStatus(Property.PropertyStatus.ACTIVE);
        barcelonaVilla.setCreatedAt(LocalDateTime.now());
        propertyRepository.save(barcelonaVilla);
    }

    @Test
    void testBasicPropertySearch() throws Exception {
        PropertySearchRequest request = PropertySearchRequest.builder()
                .search("Amsterdam")
                .page(0)
                .size(10)
                .build();

        MvcResult result = mockMvc.perform(post("/api/properties/search")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andReturn();

        PropertySearchResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(), PropertySearchResponse.class);

        assertThat(response.getProperties()).hasSize(2);
        assertThat(response.getMetadata().getResultsCount()).isEqualTo(2);
        assertThat(response.getPagination().getTotalElements()).isEqualTo(2);
    }

    @Test
    void testCityFilterSearch() throws Exception {
        PropertySearchRequest request = PropertySearchRequest.builder()
                .city("Paris")
                .page(0)
                .size(10)
                .build();

        MvcResult result = mockMvc.perform(post("/api/properties/search")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpected(status().isOk())
                .andReturn();

        PropertySearchResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(), PropertySearchResponse.class);

        assertThat(response.getProperties()).hasSize(1);
        assertThat(response.getProperties().get(0).getName()).contains("Montmartre");
    }

    @Test
    void testPriceRangeFilter() throws Exception {
        PropertySearchRequest request = PropertySearchRequest.builder()
                .minPrice(new BigDecimal("30"))
                .maxPrice(new BigDecimal("100"))
                .page(0)
                .size(10)
                .sortBy("price")
                .sortDirection("asc")
                .build();

        MvcResult result = mockMvc.perform(post("/api/properties/search")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        PropertySearchResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(), PropertySearchResponse.class);

        assertThat(response.getProperties()).hasSize(2); // Hostel and Paris apartment
        assertThat(response.getProperties().get(0).getBasePrice()).isLessThanOrEqualTo(new BigDecimal("100"));
    }

    @Test
    void testPropertyTypeFilter() throws Exception {
        PropertySearchRequest request = PropertySearchRequest.builder()
                .propertyTypes(Arrays.asList("HOTEL", "VILLA"))
                .page(0)
                .size(10)
                .build();

        MvcResult result = mockMvc.perform(post("/api/properties/search")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        PropertySearchResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(), PropertySearchResponse.class);

        assertThat(response.getProperties()).hasSize(2); // Hotel and Villa
        assertThat(response.getProperties())
                .extracting("propertyType")
                .containsExactlyInAnyOrder("HOTEL", "VILLA");
    }

    @Test
    void testAmenitiesFilter() throws Exception {
        PropertySearchRequest request = PropertySearchRequest.builder()
                .amenities(Arrays.asList("Pool"))
                .amenityMatchType(PropertySearchRequest.AmenityMatchType.ANY)
                .page(0)
                .size(10)
                .build();

        MvcResult result = mockMvc.perform(post("/api/properties/search")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        PropertySearchResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(), PropertySearchResponse.class);

        assertThat(response.getProperties()).hasSize(2); // Hotel and Villa with pools
        response.getProperties().forEach(property -> 
            assertThat(property.getAmenities()).contains("Pool"));
    }

    @Test
    void testGeographicSearch() throws Exception {
        // Search within 50km of Amsterdam center
        PropertySearchRequest request = PropertySearchRequest.builder()
                .latitude(52.3676)
                .longitude(4.9041)
                .radius(50.0)
                .page(0)
                .size(10)
                .build();

        MvcResult result = mockMvc.perform(post("/api/properties/search")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        PropertySearchResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(), PropertySearchResponse.class);

        assertThat(response.getProperties()).hasSize(2); // Both Amsterdam properties
        response.getProperties().forEach(property -> 
            assertThat(property.getAddress().getCity()).isEqualTo("Amsterdam"));
    }

    @Test
    void testFeaturedPropertiesFilter() throws Exception {
        PropertySearchRequest request = PropertySearchRequest.builder()
                .featured(true)
                .page(0)
                .size(10)
                .build();

        MvcResult result = mockMvc.perform(post("/api/properties/search")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        PropertySearchResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(), PropertySearchResponse.class);

        assertThat(response.getProperties()).hasSize(2); // Hotel and Villa are featured
        response.getProperties().forEach(property -> 
            assertThat(property.getFeatured()).isTrue());
    }

    @Test
    void testRatingFilter() throws Exception {
        PropertySearchRequest request = PropertySearchRequest.builder()
                .minRating(4.5)
                .page(0)
                .size(10)
                .sortBy("rating")
                .sortDirection("desc")
                .build();

        MvcResult result = mockMvc.perform(post("/api/properties/search")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        PropertySearchResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(), PropertySearchResponse.class);

        assertThat(response.getProperties()).hasSize(3); // Hotel (4.8), Apartment (4.5), Villa (4.9)
        response.getProperties().forEach(property -> 
            assertThat(property.getRating()).isGreaterThanOrEqualTo(4.5));
    }

    @Test
    void testSortingBehavior() throws Exception {
        PropertySearchRequest request = PropertySearchRequest.builder()
                .sortBy("price")
                .sortDirection("asc")
                .page(0)
                .size(10)
                .build();

        MvcResult result = mockMvc.perform(post("/api/properties/search")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        PropertySearchResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(), PropertySearchResponse.class);

        assertThat(response.getProperties()).hasSize(4);
        
        // Verify prices are in ascending order
        List<BigDecimal> prices = response.getProperties().stream()
                .map(property -> property.getBasePrice())
                .toList();
        
        for (int i = 1; i < prices.size(); i++) {
            assertThat(prices.get(i)).isGreaterThanOrEqualTo(prices.get(i - 1));
        }
    }

    @Test
    void testPaginationBehavior() throws Exception {
        PropertySearchRequest request = PropertySearchRequest.builder()
                .page(0)
                .size(2) // Only 2 per page
                .sortBy("name")
                .sortDirection("asc")
                .build();

        MvcResult result = mockMvc.perform(post("/api/properties/search")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        PropertySearchResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(), PropertySearchResponse.class);

        assertThat(response.getProperties()).hasSize(2);
        assertThat(response.getPagination().getCurrentPage()).isEqualTo(0);
        assertThat(response.getPagination().getPageSize()).isEqualTo(2);
        assertThat(response.getPagination().getTotalElements()).isEqualTo(4);
        assertThat(response.getPagination().getTotalPages()).isEqualTo(2);
        assertThat(response.getPagination().isHasNext()).isTrue();
        assertThat(response.getPagination().isHasPrevious()).isFalse();
    }

    @Test
    void testComplexCombinedFilters() throws Exception {
        PropertySearchRequest request = PropertySearchRequest.builder()
                .city("Amsterdam")
                .minPrice(new BigDecimal("30"))
                .maxPrice(new BigDecimal("400"))
                .amenities(Arrays.asList("WiFi"))
                .amenityMatchType(PropertySearchRequest.AmenityMatchType.ANY)
                .minRating(4.0)
                .page(0)
                .size(10)
                .sortBy("rating")
                .sortDirection("desc")
                .build();

        MvcResult result = mockMvc.perform(post("/api/properties/search")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        PropertySearchResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(), PropertySearchResponse.class);

        assertThat(response.getProperties()).hasSize(2); // Both Amsterdam properties match
        response.getProperties().forEach(property -> {
            assertThat(property.getAddress().getCity()).isEqualTo("Amsterdam");
            assertThat(property.getBasePrice()).isBetween(new BigDecimal("30"), new BigDecimal("400"));
            assertThat(property.getAmenities()).contains("WiFi");
            assertThat(property.getRating()).isGreaterThanOrEqualTo(4.0);
        });

        // Verify they're sorted by rating in descending order
        List<Double> ratings = response.getProperties().stream()
                .map(property -> property.getRating())
                .toList();
        
        for (int i = 1; i < ratings.size(); i++) {
            assertThat(ratings.get(i)).isLessThanOrEqualTo(ratings.get(i - 1));
        }
    }

    @Test
    void testGetSearchWithQueryParameters() throws Exception {
        mockMvc.perform(get("/api/properties/search")
                .param("city", "Amsterdam")
                .param("minPrice", "50")
                .param("maxPrice", "400")
                .param("sortBy", "price")
                .param("sortDirection", "asc"))
                .andExpect(status().isOk())
                .andExpected(jsonPath("$.properties").isArray())
                .andExpect(jsonPath("$.properties[0].address.city").value("Amsterdam"))
                .andExpect(jsonPath("$.pagination.totalElements").value(1)); // Only the hotel fits criteria
    }

    @Test
    void testEmptySearchResults() throws Exception {
        PropertySearchRequest request = PropertySearchRequest.builder()
                .city("NonExistentCity")
                .page(0)
                .size(10)
                .build();

        MvcResult result = mockMvc.perform(post("/api/properties/search")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        PropertySearchResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(), PropertySearchResponse.class);

        assertThat(response.getProperties()).isEmpty();
        assertThat(response.getMetadata().getResultsCount()).isEqualTo(0);
        assertThat(response.getMetadata().getSuggestions()).isNotEmpty(); // Should have suggestions
    }

    @Test
    void testSearchMetadata() throws Exception {
        PropertySearchRequest request = PropertySearchRequest.builder()
                .search("luxury")
                .city("Amsterdam")
                .featured(true)
                .page(0)
                .size(10)
                .build();

        MvcResult result = mockMvc.perform(post("/api/properties/search")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        PropertySearchResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(), PropertySearchResponse.class);

        assertThat(response.getMetadata()).isNotNull();
        assertThat(response.getMetadata().getQuery()).isEqualTo("luxury");
        assertThat(response.getMetadata().getSearchTimeMs()).isGreaterThan(0);
        assertThat(response.getMetadata().getAppliedFilters()).containsKeys("search", "city", "featured");
        assertThat(response.getMetadata().getAppliedFilters().get("search")).isEqualTo("luxury");
        assertThat(response.getMetadata().getAppliedFilters().get("city")).isEqualTo("Amsterdam");
        assertThat(response.getMetadata().getAppliedFilters().get("featured")).isEqualTo(true);
    }

    @Test
    void testInvalidSearchParameters() throws Exception {
        PropertySearchRequest request = PropertySearchRequest.builder()
                .page(-1) // Invalid page
                .size(1000) // Too large size
                .minPrice(new BigDecimal("-100")) // Invalid price
                .build();

        mockMvc.perform(post("/api/properties/search")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk()) // Should handle gracefully
                .andExpect(jsonPath("$.pagination.currentPage").value(0)) // Should default to 0
                .andExpect(jsonPath("$.pagination.pageSize").value(100)); // Should cap at max
    }

    @Test
    void testSearchPerformance() throws Exception {
        // Create many more properties for performance testing
        for (int i = 0; i < 100; i++) {
            Property property = new Property();
            property.setName("Test Property " + i);
            property.setDescription("Performance test property " + i);
            property.setCity("TestCity" + (i % 10));
            property.setCountry("TestCountry");
            property.setLatitude(52.0 + (i % 10) * 0.1);
            property.setLongitude(4.0 + (i % 10) * 0.1);
            property.setPropertyType(Property.PropertyType.HOTEL);
            property.setTotalRooms(10 + i);
            property.setMaxGuests(20 + i);
            property.setBasePrice(new BigDecimal(100 + i));
            property.setRating(3.0 + (i % 20) * 0.1);
            property.setReviewCount(50 + i);
            property.setIsActive(true);
            property.setStatus(Property.PropertyStatus.ACTIVE);
            property.setCreatedAt(LocalDateTime.now());
            propertyRepository.save(property);
        }

        PropertySearchRequest request = PropertySearchRequest.builder()
                .search("Test")
                .minPrice(new BigDecimal("100"))
                .maxPrice(new BigDecimal("200"))
                .page(0)
                .size(50)
                .sortBy("rating")
                .sortDirection("desc")
                .build();

        long startTime = System.currentTimeMillis();
        
        MvcResult result = mockMvc.perform(post("/api/properties/search")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();
        
        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;

        PropertySearchResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(), PropertySearchResponse.class);

        assertThat(response.getProperties()).isNotEmpty();
        assertThat(executionTime).isLessThan(2000); // Should complete within 2 seconds
        assertThat(response.getMetadata().getSearchTimeMs()).isLessThan(1000); // Backend should be faster
    }
}