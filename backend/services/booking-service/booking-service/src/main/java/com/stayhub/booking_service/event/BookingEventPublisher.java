package com.stayhub.booking_service.event;

import com.stayhub.booking_service.entity.Booking;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class BookingEventPublisher {
    
    @Autowired(required = false)
    private KafkaTemplate<String, Object> kafkaTemplate;
    
    private static final String BOOKING_EVENTS_TOPIC = "booking-events";
    
    public void publishBookingCreated(Booking booking) {
        if (kafkaTemplate == null) {
            log.debug("Kafka is disabled, skipping event publishing for booking: {}", booking.getId());
            return;
        }
        
        BookingCreatedEvent event = BookingCreatedEvent.builder()
                .bookingId(booking.getId())
                .propertyId(booking.getPropertyId())
                .userId(booking.getUserId())
                .roomTypeId(booking.getRoomTypeId())
                .checkInDate(booking.getCheckInDate())
                .checkOutDate(booking.getCheckOutDate())
                .numberOfRooms(booking.getNumberOfRooms())
                .status(booking.getStatus().toString())
                .build();
        
        kafkaTemplate.send(BOOKING_EVENTS_TOPIC, event.getBookingId().toString(), event);
        log.info("Published booking created event for booking: {}", booking.getId());
    }
    
    public void publishBookingCancelled(Booking booking) {
        if (kafkaTemplate == null) {
            log.debug("Kafka is disabled, skipping event publishing for booking: {}", booking.getId());
            return;
        }
        
        BookingCancelledEvent event = BookingCancelledEvent.builder()
                .bookingId(booking.getId())
                .propertyId(booking.getPropertyId())
                .roomTypeId(booking.getRoomTypeId())
                .checkInDate(booking.getCheckInDate())
                .checkOutDate(booking.getCheckOutDate())
                .numberOfRooms(booking.getNumberOfRooms())
                .cancellationReason(booking.getCancellationReason())
                .refundAmount(booking.getRefundAmount())
                .build();
        
        kafkaTemplate.send(BOOKING_EVENTS_TOPIC, event.getBookingId().toString(), event);
        log.info("Published booking cancelled event for booking: {}", booking.getId());
    }
}