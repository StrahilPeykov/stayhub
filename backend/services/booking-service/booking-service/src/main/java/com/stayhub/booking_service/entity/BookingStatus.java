package com.stayhub.booking_service.entity;

public enum BookingStatus {
    PENDING,
    CONFIRMED,
    CANCELLED,
    COMPLETED,
    PAYMENT_FAILED,
    FAILED,
    EXPIRED;
    
    public boolean canTransitionTo(BookingStatus newStatus) {
        return switch (this) {
            case PENDING -> newStatus == CONFIRMED || newStatus == CANCELLED || 
                           newStatus == PAYMENT_FAILED || newStatus == EXPIRED;
            case CONFIRMED -> newStatus == CANCELLED || newStatus == COMPLETED;
            case CANCELLED, COMPLETED, PAYMENT_FAILED, FAILED, EXPIRED -> false;
        };
    }
}