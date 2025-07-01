package com.stayhub.booking_service.exception;

public class BookingException extends RuntimeException {
    public BookingException(String message) {
        super(message);
    }
    
    public BookingException(String message, Throwable cause) {
        super(message, cause);
    }
}
