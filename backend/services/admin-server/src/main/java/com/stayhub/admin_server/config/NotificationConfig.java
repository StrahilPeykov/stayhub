package com.stayhub.admin_server.config;

import de.codecentric.boot.admin.server.domain.entities.Instance;
import de.codecentric.boot.admin.server.domain.entities.InstanceRepository;
import de.codecentric.boot.admin.server.domain.events.InstanceEvent;
import de.codecentric.boot.admin.server.domain.events.InstanceStatusChangedEvent;
import de.codecentric.boot.admin.server.notify.AbstractEventNotifier;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.MailSender;
import org.springframework.mail.SimpleMailMessage;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Configuration
@Slf4j
public class NotificationConfig {

    @Bean
    public CustomNotifier customNotifier(InstanceRepository repository) {
        return new CustomNotifier(repository);
    }

    @Bean
    public EmailNotifier emailNotifier(InstanceRepository repository, MailSender mailSender) {
        return new EmailNotifier(repository, mailSender);
    }

    public static class CustomNotifier extends AbstractEventNotifier {

        public CustomNotifier(InstanceRepository repository) {
            super(repository);
            // Note: setRemindPeriod is not available in Spring Boot Admin 3.2.0
            // Reminders are handled differently in newer versions
        }

        @Override
        protected Mono<Void> doNotify(InstanceEvent event, Instance instance) {
            return Mono.fromRunnable(() -> {
                if (event instanceof InstanceStatusChangedEvent) {
                    InstanceStatusChangedEvent statusChange = (InstanceStatusChangedEvent) event;
                    String status = statusChange.getStatusInfo().getStatus();
                    
                    log.warn("Instance {} ({}) changed status to {}", 
                        instance.getRegistration().getName(),
                        instance.getId(),
                        status);
                    
                    // Here you could send notifications to Slack, Teams, etc.
                    if ("DOWN".equals(status) || "OFFLINE".equals(status)) {
                        // Send critical alert
                        sendCriticalAlert(instance, status);
                    }
                }
            });
        }
        
        private void sendCriticalAlert(Instance instance, String status) {
            // Implement your notification logic here
            // For example: send to Slack, PagerDuty, etc.
            log.error("CRITICAL ALERT: Service {} is {}", 
                instance.getRegistration().getName(), status);
        }
    }

    @Slf4j
    public static class EmailNotifier extends AbstractEventNotifier {
        
        private final MailSender mailSender;
        private final String[] recipients = {"ops@stayhub.com", "admin@stayhub.com"};

        public EmailNotifier(InstanceRepository repository, MailSender mailSender) {
            super(repository);
            this.mailSender = mailSender;
        }

        @Override
        protected Mono<Void> doNotify(InstanceEvent event, Instance instance) {
            return Mono.fromRunnable(() -> {
                if (event instanceof InstanceStatusChangedEvent) {
                    try {
                        InstanceStatusChangedEvent statusChange = (InstanceStatusChangedEvent) event;
                        
                        SimpleMailMessage message = new SimpleMailMessage();
                        message.setTo(recipients);
                        message.setFrom("admin@stayhub.com");
                        message.setSubject(String.format("Service Alert: %s is %s", 
                            instance.getRegistration().getName(),
                            statusChange.getStatusInfo().getStatus()));
                        
                        message.setText(String.format(
                            "Service: %s\n" +
                            "Instance: %s\n" +
                            "Status: %s\n" +
                            "Time: %s\n" +
                            "Service URL: %s\n" +
                            "Health URL: %s",
                            instance.getRegistration().getName(),
                            instance.getId(),
                            statusChange.getStatusInfo().getStatus(),
                            event.getTimestamp(),
                            instance.getRegistration().getServiceUrl(),
                            instance.getRegistration().getHealthUrl()
                        ));
                        
                        if (mailSender != null) {
                            mailSender.send(message);
                            log.info("Email notification sent for instance {}", instance.getId());
                        } else {
                            log.warn("MailSender is null, email notification not sent");
                        }
                    } catch (Exception e) {
                        log.error("Failed to send email notification", e);
                    }
                }
            });
        }
    }
}
