package com.stayhub.booking_service.exception;

public class InvalidBookingStateException extends BookingException {
    public InvalidBookingStateException(String message) {
        super(message);
    }
}