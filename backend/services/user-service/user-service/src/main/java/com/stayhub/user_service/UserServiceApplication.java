package com.stayhub.user_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.event.EventListener;
import org.springframework.boot.context.event.ApplicationReadyEvent;

@SpringBootApplication
public class UserServiceApplication {

	public static void main(String[] args) {
		System.out.println("=== STARTING USER SERVICE APPLICATION ===");
		System.out.println("Java version: " + System.getProperty("java.version"));
		System.out.println("Max memory: " + Runtime.getRuntime().maxMemory() / 1024 / 1024 + "MB");
		System.out.println("Arguments: " + java.util.Arrays.toString(args));
		
		try {
			SpringApplication.run(UserServiceApplication.class, args);
		} catch (Exception e) {
			System.err.println("=== APPLICATION STARTUP FAILED ===");
			e.printStackTrace();
			System.exit(1);
		}
	}
	
	@EventListener(ApplicationReadyEvent.class)
	public void onApplicationReady() {
		System.out.println("=== APPLICATION READY EVENT RECEIVED ===");
		System.out.println("Application is now ready to serve requests");
		System.out.println("Server port: " + System.getProperty("server.port"));
		System.out.println("Available memory: " + Runtime.getRuntime().freeMemory() / 1024 / 1024 + "MB");
	}
}