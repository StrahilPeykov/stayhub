package com.stayhub.user_service.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserController {
    
    // In-memory storage for demo purposes
    private final Map<String, Map<String, Object>> users = new ConcurrentHashMap<>();
    private final Map<String, String> emailToId = new ConcurrentHashMap<>();
    
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("service", "user-service");
        response.put("status", "UP");
        response.put("timestamp", System.currentTimeMillis());
        response.put("message", "User service is operational");
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, Object> request) {
        String email = (String) request.get("email");
        String password = (String) request.get("password");
        String name = (String) request.get("name");
        
        // Validate input
        if (email == null || password == null || name == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", "Email, password, and name are required");
            return ResponseEntity.badRequest().body(error);
        }
        
        // Check if email already exists
        if (emailToId.containsKey(email)) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", "Email already exists");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        }
        
        // Create user
        String userId = UUID.randomUUID().toString();
        Map<String, Object> user = new HashMap<>();
        user.put("id", userId);
        user.put("email", email);
        user.put("name", name);
        user.put("password", password); // In production, hash this!
        user.put("avatar", null);
        user.put("createdAt", LocalDateTime.now().toString());
        user.put("status", "ACTIVE");
        
        // Store user
        users.put(userId, user);
        emailToId.put(email, userId);
        
        // Return user without password
        Map<String, Object> response = new HashMap<>(user);
        response.remove("password");
        response.put("message", "User registered successfully");
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, Object> request) {
        String email = (String) request.get("email");
        String password = (String) request.get("password");
        
        // Validate input
        if (email == null || password == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", "Email and password are required");
            return ResponseEntity.badRequest().body(error);
        }
        
        // Find user by email
        String userId = emailToId.get(email);
        if (userId == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", "Invalid email or password");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
        
        Map<String, Object> user = users.get(userId);
        if (!password.equals(user.get("password"))) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", "Invalid email or password");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
        
        // Return user without password
        Map<String, Object> response = new HashMap<>(user);
        response.remove("password");
        response.put("token", "dummy-jwt-token-" + userId); // In production, generate real JWT
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/oauth")
    public ResponseEntity<Map<String, Object>> oauth(@RequestBody Map<String, Object> request) {
        String provider = (String) request.get("provider");
        String providerId = (String) request.get("providerId");
        String email = (String) request.get("email");
        String name = (String) request.get("name");
        String image = (String) request.get("image");
        
        // Check if user exists
        String userId = emailToId.get(email);
        Map<String, Object> user;
        
        if (userId != null) {
            // User exists, update their info
            user = users.get(userId);
            if (name != null) user.put("name", name);
            if (image != null) user.put("avatar", image);
            user.put("lastLogin", LocalDateTime.now().toString());
        } else {
            // Create new user
            userId = UUID.randomUUID().toString();
            user = new HashMap<>();
            user.put("id", userId);
            user.put("email", email);
            user.put("name", name != null ? name : "User");
            user.put("avatar", image);
            user.put("provider", provider);
            user.put("providerId", providerId);
            user.put("createdAt", LocalDateTime.now().toString());
            user.put("status", "ACTIVE");
            
            users.put(userId, user);
            emailToId.put(email, userId);
        }
        
        // Return user data
        Map<String, Object> response = new HashMap<>(user);
        response.remove("password");
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getUser(@PathVariable String id) {
        Map<String, Object> user = users.get(id);
        
        if (user == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", "User not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
        
        // Return user without password
        Map<String, Object> response = new HashMap<>(user);
        response.remove("password");
        
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateUser(
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {
        
        Map<String, Object> user = users.get(id);
        
        if (user == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", "User not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
        
        // Update allowed fields
        if (request.containsKey("name")) {
            user.put("name", request.get("name"));
        }
        if (request.containsKey("avatar")) {
            user.put("avatar", request.get("avatar"));
        }
        if (request.containsKey("phone")) {
            user.put("phone", request.get("phone"));
        }
        if (request.containsKey("preferences")) {
            user.put("preferences", request.get("preferences"));
        }
        
        user.put("updatedAt", LocalDateTime.now().toString());
        
        // Return updated user without password
        Map<String, Object> response = new HashMap<>(user);
        response.remove("password");
        response.put("message", "User updated successfully");
        
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable String id) {
        Map<String, Object> user = users.remove(id);
        
        if (user == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", "User not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
        
        // Remove email mapping
        emailToId.remove(user.get("email"));
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "User deleted successfully");
        response.put("id", id);
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, Object>> changePassword(@RequestBody Map<String, Object> request) {
        String userId = (String) request.get("userId");
        String currentPassword = (String) request.get("currentPassword");
        String newPassword = (String) request.get("newPassword");
        
        Map<String, Object> user = users.get(userId);
        
        if (user == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", "User not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
        
        // Verify current password
        if (!currentPassword.equals(user.get("password"))) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", "Current password is incorrect");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
        
        // Update password
        user.put("password", newPassword);
        user.put("passwordChangedAt", LocalDateTime.now().toString());
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Password changed successfully");
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> forgotPassword(@RequestBody Map<String, Object> request) {
        String email = (String) request.get("email");
        
        String userId = emailToId.get(email);
        if (userId == null) {
            // Don't reveal if email exists or not for security
            Map<String, Object> response = new HashMap<>();
            response.put("message", "If the email exists, a reset link has been sent");
            return ResponseEntity.ok(response);
        }
        
        // In production, send email with reset token
        String resetToken = UUID.randomUUID().toString();
        Map<String, Object> user = users.get(userId);
        user.put("resetToken", resetToken);
        user.put("resetTokenExpiry", LocalDateTime.now().plusHours(1).toString());
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "If the email exists, a reset link has been sent");
        response.put("resetToken", resetToken); // Only for demo, don't include in production
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(@RequestBody Map<String, Object> request) {
        String token = (String) request.get("token");
        String newPassword = (String) request.get("newPassword");
        
        // Find user by reset token
        Map<String, Object> foundUser = null;
        for (Map<String, Object> user : users.values()) {
            if (token.equals(user.get("resetToken"))) {
                foundUser = user;
                break;
            }
        }
        
        if (foundUser == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", "Invalid or expired reset token");
            return ResponseEntity.badRequest().body(error);
        }
        
        // Update password and clear reset token
        foundUser.put("password", newPassword);
        foundUser.remove("resetToken");
        foundUser.remove("resetTokenExpiry");
        foundUser.put("passwordChangedAt", LocalDateTime.now().toString());
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Password reset successfully");
        
        return ResponseEntity.ok(response);
    }
}