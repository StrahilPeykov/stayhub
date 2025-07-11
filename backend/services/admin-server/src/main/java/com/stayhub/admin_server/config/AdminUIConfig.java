package com.stayhub.admin_server.config;

import de.codecentric.boot.admin.server.web.client.HttpHeadersProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;

@Configuration
public class AdminUIConfig {
    
    @Bean
    public HttpHeadersProvider customHttpHeadersProvider() {
        return instance -> {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Custom-Header", "StayHub-Admin");
            return headers;
        };
    }
}