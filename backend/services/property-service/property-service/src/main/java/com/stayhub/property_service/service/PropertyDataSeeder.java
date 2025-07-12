package com.stayhub.property_service.service;

import com.stayhub.property_service.entity.Property;
import com.stayhub.property_service.repository.PropertyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PropertyDataSeeder implements CommandLineRunner {
    
    private final PropertyRepository propertyRepository;
    private final Random random = new Random();
    
    @Override
    public void run(String... args) throws Exception {
        if (propertyRepository.count() == 0) {
            log.info("Database is empty, seeding with sample properties...");
            seedProperties();
        } else {
            log.info("Database already contains {} properties, skipping seeding", propertyRepository.count());
        }
    }
    
    @Transactional
    public void seedProperties() {
        List<PropertySeed> seeds = createPropertySeeds();
        
        for (PropertySeed seed : seeds) {
            try {
                Property property = createPropertyFromSeed(seed);
                propertyRepository.save(property);
                log.debug("Seeded property: {}", property.getName());
            } catch (Exception e) {
                log.error("Failed to seed property: {}", seed.name, e);
            }
        }
        
        log.info("Successfully seeded {} properties", seeds.size());
    }
    
    private List<PropertySeed> createPropertySeeds() {
        return Arrays.asList(
            // Amsterdam
            new PropertySeed("Grand Hotel Amsterdam", "Luxury hotel in the heart of Amsterdam",
                "Damrak 93", "Amsterdam", "North Holland", "Netherlands", "1012 LP",
                52.3667, 4.9036, Property.PropertyType.HOTEL, 120, 240,
                new BigDecimal("285"), true, true, Arrays.asList("WiFi", "Parking", "Pool", "Gym", "Restaurant", "Spa", "Bar", "Concierge")),
            
            new PropertySeed("Canal View Apartment", "Charming apartment overlooking Amsterdam canals",
                "Herengracht 254", "Amsterdam", "North Holland", "Netherlands", "1016 BV",
                52.3676, 4.8831, Property.PropertyType.APARTMENT, 2, 4,
                new BigDecimal("175"), false, true, Arrays.asList("WiFi", "Kitchen", "Washing Machine", "Balcony")),
            
            new PropertySeed("Amsterdam Budget Hostel", "Clean and affordable hostel near Central Station",
                "Nieuwezijds Voorburgwal 124", "Amsterdam", "North Holland", "Netherlands", "1012 SH",
                52.3738, 4.8934, Property.PropertyType.HOSTEL, 50, 200,
                new BigDecimal("35"), false, false, Arrays.asList("WiFi", "Shared Kitchen", "Laundry", "Common Room")),
            
            // Paris
            new PropertySeed("Le Meurice Paris", "Palace hotel with views of the Tuileries Garden",
                "228 Rue de Rivoli", "Paris", "Île-de-France", "France", "75001",
                48.8656, 2.3286, Property.PropertyType.HOTEL, 160, 320,
                new BigDecimal("750"), true, true, Arrays.asList("WiFi", "Restaurant", "Spa", "Gym", "Bar", "Concierge", "Room Service", "Valet Parking")),
            
            new PropertySeed("Montmartre Studio", "Artistic studio in the heart of Montmartre",
                "18 Place du Tertre", "Paris", "Île-de-France", "France", "75018",
                48.8867, 2.3407, Property.PropertyType.APARTMENT, 1, 2,
                new BigDecimal("95"), false, true, Arrays.asList("WiFi", "Kitchen", "Balcony", "City View")),
            
            new PropertySeed("Paris Central Hostel", "Modern hostel in the Latin Quarter",
                "5 Rue de la Huchette", "Paris", "Île-de-France", "France", "75005",
                48.8534, 2.3454, Property.PropertyType.HOSTEL, 40, 160,
                new BigDecimal("45"), false, false, Arrays.asList("WiFi", "Shared Kitchen", "Common Room", "Laundry")),
            
            // London
            new PropertySeed("The Savoy London", "Iconic luxury hotel on the Strand",
                "The Strand", "London", "England", "United Kingdom", "WC2R 0EU",
                51.5101, -0.1204, Property.PropertyType.HOTEL, 267, 534,
                new BigDecimal("650"), true, true, Arrays.asList("WiFi", "Restaurant", "Spa", "Gym", "Bar", "Concierge", "Room Service", "Valet Parking", "Business Center")),
            
            new PropertySeed("Covent Garden Loft", "Stylish loft in trendy Covent Garden",
                "12 King Street", "London", "England", "United Kingdom", "WC2E 8HN",
                51.5123, -0.1244, Property.PropertyType.APARTMENT, 2, 4,
                new BigDecimal("220"), false, true, Arrays.asList("WiFi", "Kitchen", "Washing Machine", "Elevator")),
            
            new PropertySeed("London Budget Inn", "Affordable accommodation near King's Cross",
                "45 Gray's Inn Road", "London", "England", "United Kingdom", "WC1X 8PP",
                51.5245, -0.1192, Property.PropertyType.GUESTHOUSE, 25, 50,
                new BigDecimal("85"), false, false, Arrays.asList("WiFi", "Shared Kitchen", "Laundry")),
            
            // New York
            new PropertySeed("The Plaza New York", "Legendary luxury hotel at Fifth Avenue",
                "768 5th Ave", "New York", "New York", "United States", "10019",
                40.7647, -73.9753, Property.PropertyType.HOTEL, 282, 564,
                new BigDecimal("795"), true, true, Arrays.asList("WiFi", "Restaurant", "Spa", "Gym", "Bar", "Concierge", "Room Service", "Valet Parking", "Business Center")),
            
            new PropertySeed("Manhattan Modern Apartment", "Contemporary apartment in Midtown",
                "350 W 42nd St", "New York", "New York", "United States", "10036",
                40.7589, -73.9925, Property.PropertyType.APARTMENT, 3, 6,
                new BigDecimal("350"), false, true, Arrays.asList("WiFi", "Kitchen", "Gym", "Laundry", "Balcony", "City View")),
            
            new PropertySeed("NYC Budget Hostel", "Budget-friendly hostel in Lower East Side",
                "123 Rivington St", "New York", "New York", "United States", "10002",
                40.7210, -73.9896, Property.PropertyType.HOSTEL, 60, 240,
                new BigDecimal("55"), false, false, Arrays.asList("WiFi", "Shared Kitchen", "Common Room", "Laundry", "Tours")),
            
            // Tokyo
            new PropertySeed("Park Hyatt Tokyo", "Luxury hotel with stunning city views",
                "3-7-1-2 Nishi Shinjuku", "Tokyo", "Tokyo", "Japan", "163-1055",
                35.6852, 139.6947, Property.PropertyType.HOTEL, 177, 354,
                new BigDecimal("580"), true, true, Arrays.asList("WiFi", "Restaurant", "Spa", "Gym", "Bar", "Concierge", "Room Service", "Business Center")),
            
            new PropertySeed("Shibuya Modern Studio", "Compact modern studio in Shibuya",
                "2-15-1 Shibuya", "Tokyo", "Tokyo", "Japan", "150-0002",
                35.6598, 139.7006, Property.PropertyType.APARTMENT, 1, 2,
                new BigDecimal("125"), false, true, Arrays.asList("WiFi", "Kitchen", "Washing Machine", "City View")),
            
            new PropertySeed("Tokyo Capsule Hotel", "Modern capsule hotel in Shinjuku",
                "1-2-3 Kabukicho", "Tokyo", "Tokyo", "Japan", "160-0021",
                35.6938, 139.7034, Property.PropertyType.HOSTEL, 200, 200,
                new BigDecimal("65"), false, false, Arrays.asList("WiFi", "Shared Bathroom", "Lounge", "Vending Machines")),
            
            // Barcelona
            new PropertySeed("Hotel Casa Fuster", "Modernist luxury hotel on Passeig de Gràcia",
                "Passeig de Gràcia 132", "Barcelona", "Catalonia", "Spain", "08008",
                41.4036, 2.1607, Property.PropertyType.HOTEL, 105, 210,
                new BigDecimal("425"), true, true, Arrays.asList("WiFi", "Restaurant", "Spa", "Gym", "Bar", "Concierge", "Room Service", "Rooftop Terrace")),
            
            new PropertySeed("Gothic Quarter Apartment", "Historic apartment in the Gothic Quarter",
                "Carrer del Bisbe 9", "Barcelona", "Catalonia", "Spain", "08002",
                41.3836, 2.1769, Property.PropertyType.APARTMENT, 2, 4,
                new BigDecimal("145"), false, true, Arrays.asList("WiFi", "Kitchen", "Balcony", "Historic Building")),
            
            new PropertySeed("Barcelona Beach Hostel", "Beachfront hostel in Barceloneta",
                "Passeig Marítim 33", "Barcelona", "Catalonia", "Spain", "08003",
                41.3763, 2.1926, Property.PropertyType.HOSTEL, 80, 320,
                new BigDecimal("35"), false, false, Arrays.asList("WiFi", "Shared Kitchen", "Beach Access", "Common Room", "Laundry")),
            
            // Dubai
            new PropertySeed("Burj Al Arab", "Iconic sail-shaped luxury hotel",
                "Jumeirah Beach Road", "Dubai", "Dubai", "UAE", "00000",
                25.1412, 55.1856, Property.PropertyType.RESORT, 202, 404,
                new BigDecimal("1200"), true, true, Arrays.asList("WiFi", "Restaurant", "Spa", "Gym", "Bar", "Concierge", "Room Service", "Helicopter Pad", "Butler Service", "Beach")),
            
            new PropertySeed("Dubai Marina Apartment", "Luxury apartment with marina views",
                "Marina Walk", "Dubai", "Dubai", "UAE", "00000",
                25.0737, 55.1444, Property.PropertyType.APARTMENT, 3, 6,
                new BigDecimal("280"), false, true, Arrays.asList("WiFi", "Kitchen", "Pool", "Gym", "Marina View", "Balcony")),
            
            new PropertySeed("Dubai Budget Hotel", "Affordable hotel in Deira",
                "Al Sabkha Road", "Dubai", "Dubai", "UAE", "00000",
                25.2697, 55.3095, Property.PropertyType.HOTEL, 50, 100,
                new BigDecimal("75"), false, false, Arrays.asList("WiFi", "Restaurant", "Shuttle Service")),
            
            // Singapore
            new PropertySeed("Marina Bay Sands", "Iconic resort with infinity pool",
                "10 Bayfront Ave", "Singapore", "Singapore", "Singapore", "018956",
                1.2834, 103.8607, Property.PropertyType.RESORT, 2561, 5122,
                new BigDecimal("485"), true, true, Arrays.asList("WiFi", "Restaurant", "Spa", "Gym", "Bar", "Concierge", "Room Service", "Infinity Pool", "Casino", "Shopping")),
            
            new PropertySeed("Chinatown Heritage Apartment", "Traditional shophouse apartment",
                "Ann Siang Road", "Singapore", "Singapore", "Singapore", "069719",
                1.2838, 103.8469, Property.PropertyType.APARTMENT, 2, 4,
                new BigDecimal("165"), false, true, Arrays.asList("WiFi", "Kitchen", "Heritage Building", "Central Location")),
            
            new PropertySeed("Singapore Backpacker Hostel", "Social hostel in Little India",
                "Campbell Lane", "Singapore", "Singapore", "Singapore", "209854",
                1.3067, 103.8521, Property.PropertyType.HOSTEL, 30, 120,
                new BigDecimal("40"), false, false, Arrays.asList("WiFi", "Shared Kitchen", "Common Room", "Laundry", "Tours"))
        );
    }
    
    private Property createPropertyFromSeed(PropertySeed seed) {
        Property property = new Property();
        
        // Basic information
        property.setName(seed.name);
        property.setDescription(seed.description);
        
        // Address
        property.setStreet(seed.street);
        property.setCity(seed.city);
        property.setState(seed.state);
        property.setCountry(seed.country);
        property.setZipCode(seed.zipCode);
        
        // Location
        property.setLatitude(seed.latitude);
        property.setLongitude(seed.longitude);
        
        // Property details
        property.setPropertyType(seed.propertyType);
        property.setTotalRooms(seed.totalRooms);
        property.setMaxGuests(seed.maxGuests);
        property.setBasePrice(seed.basePrice);
        property.setCurrency("USD");
        
        // Features
        property.setFeatured(seed.featured);
        property.setVerified(seed.verified);
        property.setInstantBooking(random.nextBoolean()); // Random instant booking
        property.setPetFriendly(random.nextDouble() < 0.3); // 30% pet friendly
        property.setFreeCancellation(random.nextDouble() < 0.7); // 70% free cancellation
        property.setWheelchairAccessible(random.nextDouble() < 0.4); // 40% wheelchair accessible
        
        // Amenities
        property.setAmenities(seed.amenities);
        
        // Rating and reviews
        property.setRating(4.0 + random.nextDouble() * 1.0); // 4.0 - 5.0
        property.setReviewCount(50 + random.nextInt(450)); // 50 - 500 reviews
        
        // Policies
        property.setCancellationPolicy(getRandomCancellationPolicy());
        property.setCheckInTime("15:00");
        property.setCheckOutTime("11:00");
        property.setMinimumStay(1);
        
        // Tags based on property type and price
        property.setTags(generateTags(seed));
        
        // Languages (commonly English + local language)
        property.setLanguagesSpoken(generateLanguages(seed.country));
        
        // Audit
        property.setCreatedAt(LocalDateTime.now());
        property.setUpdatedAt(LocalDateTime.now());
        property.setCreatedBy("system");
        property.setIsActive(true);
        property.setStatus(Property.PropertyStatus.ACTIVE);
        property.setVisibility(Property.PropertyVisibility.PUBLIC);
        
        // Owner (generate random UUID for now)
        property.setOwnerId(UUID.randomUUID());
        
        return property;
    }
    
    private Property.CancellationPolicy getRandomCancellationPolicy() {
        Property.CancellationPolicy[] policies = Property.CancellationPolicy.values();
        return policies[random.nextInt(policies.length)];
    }
    
    private List<String> generateTags(PropertySeed seed) {
        List<String> tags = Arrays.asList();
        
        // Price-based tags
        if (seed.basePrice.compareTo(new BigDecimal("300")) > 0) {
            tags = Arrays.asList("luxury", "premium");
        } else if (seed.basePrice.compareTo(new BigDecimal("100")) < 0) {
            tags = Arrays.asList("budget", "affordable");
        } else {
            tags = Arrays.asList("mid-range", "value");
        }
        
        // Type-based tags
        if (seed.propertyType == Property.PropertyType.HOTEL || seed.propertyType == Property.PropertyType.RESORT) {
            tags = Arrays.asList(tags.get(0), "business", "central");
        } else if (seed.propertyType == Property.PropertyType.APARTMENT) {
            tags = Arrays.asList(tags.get(0), "family-friendly", "local-experience");
        } else if (seed.propertyType == Property.PropertyType.HOSTEL) {
            tags = Arrays.asList(tags.get(0), "social", "backpacker");
        }
        
        // Location-based tags
        if (seed.city.equals("Paris") || seed.city.equals("London")) {
            tags = Arrays.asList(tags.get(0), tags.get(1), "historic");
        } else if (seed.city.equals("Dubai") || seed.city.equals("Singapore")) {
            tags = Arrays.asList(tags.get(0), tags.get(1), "modern");
        }
        
        return tags;
    }
    
    private List<String> generateLanguages(String country) {
        return switch (country) {
            case "Netherlands" -> Arrays.asList("English", "Dutch");
            case "France" -> Arrays.asList("English", "French");
            case "United Kingdom" -> Arrays.asList("English");
            case "United States" -> Arrays.asList("English", "Spanish");
            case "Japan" -> Arrays.asList("English", "Japanese");
            case "Spain" -> Arrays.asList("English", "Spanish");
            case "UAE" -> Arrays.asList("English", "Arabic");
            case "Singapore" -> Arrays.asList("English", "Mandarin", "Malay");
            default -> Arrays.asList("English");
        };
    }
    
    // Inner class for property seed data
    private static class PropertySeed {
        String name, description, street, city, state, country, zipCode;
        Double latitude, longitude;
        Property.PropertyType propertyType;
        Integer totalRooms, maxGuests;
        BigDecimal basePrice;
        Boolean featured, verified;
        List<String> amenities;
        
        PropertySeed(String name, String description, String street, String city, String state, 
                    String country, String zipCode, Double latitude, Double longitude, 
                    Property.PropertyType propertyType, Integer totalRooms, Integer maxGuests,
                    BigDecimal basePrice, Boolean featured, Boolean verified, List<String> amenities) {
            this.name = name;
            this.description = description;
            this.street = street;
            this.city = city;
            this.state = state;
            this.country = country;
            this.zipCode = zipCode;
            this.latitude = latitude;
            this.longitude = longitude;
            this.propertyType = propertyType;
            this.totalRooms = totalRooms;
            this.maxGuests = maxGuests;
            this.basePrice = basePrice;
            this.featured = featured;
            this.verified = verified;
            this.amenities = amenities;
        }
    }
}
