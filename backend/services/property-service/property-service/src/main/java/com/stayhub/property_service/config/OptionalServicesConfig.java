package com.stayhub.property_service.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.CacheManager;
import org.springframework.cache.support.NoOpCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.util.concurrent.ListenableFuture;
import org.springframework.util.concurrent.SettableListenableFuture;

@Configuration
@Slf4j
public class OptionalServicesConfig {
    
    @Configuration
    @ConditionalOnMissingBean(KafkaTemplate.class)
    public static class NoOpKafkaConfig {
        
        @Bean
        @Primary
        public KafkaTemplate<String, Object> noOpKafkaTemplate() {
            return new KafkaTemplate<String, Object>(null) {
                @Override
                public ListenableFuture<SendResult<String, Object>> send(String topic, Object data) {
                    log.info("KAFKA DISABLED - Would send to topic {}: {}", topic, data);
                    SettableListenableFuture<SendResult<String, Object>> future = new SettableListenableFuture<>();
                    future.set(null);
                    return future;
                }
                
                @Override
                public ListenableFuture<SendResult<String, Object>> send(String topic, String key, Object data) {
                    log.info("KAFKA DISABLED - Would send to topic {} with key {}: {}", topic, key, data);
                    SettableListenableFuture<SendResult<String, Object>> future = new SettableListenableFuture<>();
                    future.set(null);
                    return future;
                }
            };
        }
    }
    
    @Configuration
    @ConditionalOnMissingBean(CacheManager.class)
    public static class NoOpCacheConfig {
        
        @Bean
        @Primary
        public CacheManager noOpCacheManager() {
            log.info("REDIS DISABLED - Using NoOp cache manager");
            return new NoOpCacheManager();
        }
    }
}