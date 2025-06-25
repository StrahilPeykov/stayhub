package com.stayhub.booking_service.exception;

public class RoomNotAvailableException extends BookingException {
    public RoomNotAvailableException(String message) {
        super(message);
    }
}