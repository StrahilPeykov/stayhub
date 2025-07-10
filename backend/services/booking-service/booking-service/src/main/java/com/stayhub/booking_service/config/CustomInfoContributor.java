package com.stayhub.booking_service.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.info.Info;
import org.springframework.boot.actuate.info.InfoContributor;
import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Component
public class CustomInfoContributor implements InfoContributor {
    
    @Value("${spring.application.name}")
    private String applicationName;
    
    @Value("${server.port}")
    private String serverPort;
    
    @Value("${spring.profiles.active:default}")
    private String activeProfiles;
    
    @Override
    public void contribute(Info.Builder builder) {
        Map<String, Object> serviceInfo = new HashMap<>();
        
        try {
            serviceInfo.put("hostname", InetAddress.getLocalHost().getHostName());
            serviceInfo.put("ip", InetAddress.getLocalHost().getHostAddress());
        } catch (Exception e) {
            serviceInfo.put("hostname", "unknown");
            serviceInfo.put("ip", "unknown");
        }
        
        serviceInfo.put("port", serverPort);
        serviceInfo.put("profiles", activeProfiles);
        serviceInfo.put("startupTime", LocalDateTime.now());
        
        Map<String, Object> features = new HashMap<>();
        features.put("dynamicPricing", true);
        features.put("multiRoomBooking", true);
        features.put("instantBooking", true);
        features.put("cancellationSupport", true);
        features.put("bookingModification", true);
        
        builder.withDetail("service", serviceInfo);
        builder.withDetail("features", features);
        builder.withDetail("api-version", "v1");
        builder.withDetail("documentation", "/swagger-ui.html");
    }
}