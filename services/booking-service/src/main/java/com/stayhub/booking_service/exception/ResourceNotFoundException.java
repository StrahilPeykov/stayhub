package com.stayhub.booking_service.exception;

public class ResourceNotFoundException extends BookingException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}