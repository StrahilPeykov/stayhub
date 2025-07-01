package com.stayhub.booking_service.exception;

public class ConcurrentBookingException extends BookingException {
    public ConcurrentBookingException(String message) {
        super(message);
    }
}
