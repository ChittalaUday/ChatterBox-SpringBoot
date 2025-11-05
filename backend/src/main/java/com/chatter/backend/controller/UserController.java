package com.chatter.backend.controller;

import org.springframework.web.bind.annotation.RestController;

import com.chatter.backend.dta.LoginRequest;
import com.chatter.backend.dta.RegisterRequest;
import com.chatter.backend.model.User;
import com.chatter.backend.repository.UserRepo;
import com.chatter.backend.util.JwtUtil;

import jakarta.validation.Valid;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PutMapping;

@RestController
public class UserController {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private JwtUtil jwtUtil;

    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        if (userRepo.existsByEmail(registerRequest.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already exists. please try again with new email..."));
        }
        if (registerRequest.getMobile() != null && userRepo.existsByMobile(registerRequest.getMobile())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Mobile number already exists. please try again with new mobile number..."));
        }

        // Create User entity from RegisterRequest
        User user = new User();
        user.setName(registerRequest.getName());
        user.setEmail(registerRequest.getEmail());
        user.setPassword(registerRequest.getPassword());
        user.setGender(registerRequest.getGender());
        user.setDob(registerRequest.getDob());
        user.setMobile(registerRequest.getMobile());
        
        // Set default role
        user.setRole("USER");

        // Set default values for optional fields if not provided
        if (user.getGender() == null || user.getGender().isEmpty()) {
            user.setGender("OTHER");
        }

        if (user.getDob() == null) {
            // Set default DOB to 18 years ago from today
            user.setDob(LocalDate.now().minusYears(18));
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        User savedUser = userRepo.save(user);
        return ResponseEntity.ok(savedUser);
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody LoginRequest login) {
        User user = userRepo.findByEmail(login.getEmail());

        if (user == null || !passwordEncoder.matches(login.getPassword(), user.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid email or password"));
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole(), user.getId());

        return ResponseEntity.ok(Map.of("message", "Login successful", "user", user, "token", token));
    }

    @GetMapping("/users")
    public ResponseEntity<?> getMethodName() {
        Map<Integer, User> users = userRepo.findAll().stream().collect(Collectors.toMap(User::getId, user -> user));
        return ResponseEntity.ok(users);
    }

    @GetMapping("/users/search")
    public ResponseEntity<?> searchUsers(@RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String query) {
        try {
            String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
            String email = jwtUtil.extractUsername(token);
            User currentUser = userRepo.findByEmail(email);

            if (currentUser == null) {
                return ResponseEntity.status(404).body(Map.of("message", "User not found"));
            }

            List<User> users;
            if (query != null && !query.trim().isEmpty()) {
                users = userRepo.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(query, query);
            } else {
                users = userRepo.findAll();
            }

            // Remove current user from the list
            users = users.stream()
                    .filter(user -> user.getId() != currentUser.getId())
                    .collect(Collectors.toList());

            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error searching users: " + e.getMessage()));
        }
    }

    @GetMapping("/users/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;

        // Extract email from token
        String email = jwtUtil.extractUsername(token);

        // Find user by email
        User user = userRepo.findByEmail(email);
        if (user == null) {
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        }

        return ResponseEntity.ok(user);
    }

    @PutMapping("/users")
    public ResponseEntity<?> updateUser(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> updates) {

        // 1️⃣ Extract token
        String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;

        // 2️⃣ Extract email (username) from token
        String email = jwtUtil.extractUsername(token);

        // 3️⃣ Find the user
        User existingUser = userRepo.findByEmail(email);
        if (existingUser == null) {
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        }

        // 4️⃣ Prevent sensitive updates
        updates.remove("id");
        updates.remove("email");
        updates.remove("password");
        updates.remove("role");

        // 5️⃣ Apply updates dynamically
        updates.forEach((key, value) -> {
            try {
                java.lang.reflect.Field field = User.class.getDeclaredField(key);
                field.setAccessible(true);
                field.set(existingUser, value);
            } catch (NoSuchFieldException | IllegalAccessException e) {
                // Ignore invalid fields
            }
        });

        // 6️⃣ Save updated user
        User updatedUser = userRepo.save(existingUser);

        return ResponseEntity.ok(Map.of(
                "message", "User updated successfully",
                "user", updatedUser));
    }

    @PatchMapping("/users/me")
    public ResponseEntity<?> patchUser(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> updates) {
        // 1️⃣ Extract token
        String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;

        // 2️⃣ Extract email (username) from token
        String email = jwtUtil.extractUsername(token);

        // 3️⃣ Find the user
        User existingUser = userRepo.findByEmail(email);
        if (existingUser == null) {
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        }

        // 4️⃣ Prevent sensitive updates
        updates.remove("id");
        updates.remove("email");
        updates.remove("password");
        updates.remove("role");

        // 5️⃣ Apply updates dynamically
        updates.forEach((key, value) -> {
            try {
                java.lang.reflect.Field field = User.class.getDeclaredField(key);
                field.setAccessible(true);
                field.set(existingUser, value);
            } catch (NoSuchFieldException | IllegalAccessException e) {
                // Ignore invalid fields
            }
        });

        // 6️⃣ Save updated user
        User updatedUser = userRepo.save(existingUser);

        updatedUser.setPassword(null);
        updatedUser.setRole(null);

        return ResponseEntity.ok(Map.of(
                "message", "User updated successfully",
                "user", updatedUser));
    }

}