package com.chatter.backend.controller;

import com.chatter.backend.model.Notification;
import com.chatter.backend.model.User;
import com.chatter.backend.service.NotificationService;
import com.chatter.backend.util.JwtUtil;
import com.chatter.backend.repository.UserRepo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private static final Logger logger = LoggerFactory.getLogger(NotificationController.class);

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepo userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping("/unread")
    public ResponseEntity<?> getUnreadNotifications(@RequestHeader("Authorization") String authHeader) {
        try {
            logger.info("getUnreadNotifications: Received request with auth header: {}", authHeader);
            
            String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
            String email = jwtUtil.extractUsername(token);
            User currentUser = userRepository.findByEmail(email);
            
            logger.info("getUnreadNotifications: User {} fetching unread notifications", email);
            
            if (currentUser == null) {
                logger.warn("getUnreadNotifications: User not found for email {}", email);
                return ResponseEntity.status(404).body(Map.of("message", "User not found"));
            }
            
            List<Notification> notifications = notificationService.getUnreadNotifications(currentUser);
            logger.info("getUnreadNotifications: Found {} unread notifications for user {}", notifications.size(), email);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            logger.error("getUnreadNotifications: Error occurred", e);
            return ResponseEntity.status(500).body(Map.of("message", "Error fetching notifications: " + e.getMessage()));
        }
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllNotifications(@RequestHeader("Authorization") String authHeader) {
        try {
            logger.info("getAllNotifications: Received request with auth header: {}", authHeader);
            
            String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
            String email = jwtUtil.extractUsername(token);
            User currentUser = userRepository.findByEmail(email);
            
            logger.info("getAllNotifications: User {} fetching all notifications", email);
            
            if (currentUser == null) {
                logger.warn("getAllNotifications: User not found for email {}", email);
                return ResponseEntity.status(404).body(Map.of("message", "User not found"));
            }
            
            List<Notification> notifications = notificationService.getAllNotifications(currentUser);
            logger.info("getAllNotifications: Found {} notifications for user {}", notifications.size(), email);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            logger.error("getAllNotifications: Error occurred", e);
            return ResponseEntity.status(500).body(Map.of("message", "Error fetching notifications: " + e.getMessage()));
        }
    }

    @GetMapping("/unread/count")
    public ResponseEntity<?> getUnreadNotificationsCount(@RequestHeader("Authorization") String authHeader) {
        try {
            logger.info("getUnreadNotificationsCount: Received request with auth header: {}", authHeader);
            
            String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
            String email = jwtUtil.extractUsername(token);
            User currentUser = userRepository.findByEmail(email);
            
            logger.info("getUnreadNotificationsCount: User {} fetching unread notifications count", email);
            
            if (currentUser == null) {
                logger.warn("getUnreadNotificationsCount: User not found for email {}", email);
                return ResponseEntity.status(404).body(Map.of("message", "User not found"));
            }
            
            long count = notificationService.getUnreadNotificationsCount(currentUser);
            logger.info("getUnreadNotificationsCount: Found {} unread notifications for user {}", count, email);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            logger.error("getUnreadNotificationsCount: Error occurred", e);
            return ResponseEntity.status(500).body(Map.of("message", "Error fetching notifications count: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markNotificationAsRead(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        try {
            logger.info("markNotificationAsRead: Received request with auth header: {} and notification id: {}", authHeader, id);
            
            String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
            String email = jwtUtil.extractUsername(token);
            User currentUser = userRepository.findByEmail(email);
            
            logger.info("markNotificationAsRead: User {} marking notification {} as read", email, id);
            
            if (currentUser == null) {
                logger.warn("markNotificationAsRead: User not found for email {}", email);
                return ResponseEntity.status(404).body(Map.of("message", "User not found"));
            }
            
            Notification notification = notificationService.markAsRead(id);
            if (notification == null) {
                logger.warn("markNotificationAsRead: Notification not found for id {}", id);
                return ResponseEntity.status(404).body(Map.of("message", "Notification not found"));
            }
            
            logger.info("markNotificationAsRead: Notification {} marked as read successfully", id);
            return ResponseEntity.ok(notification);
        } catch (Exception e) {
            logger.error("markNotificationAsRead: Error occurred", e);
            return ResponseEntity.status(500).body(Map.of("message", "Error marking notification as read: " + e.getMessage()));
        }
    }

    @PostMapping("/read-all")
    public ResponseEntity<?> markAllNotificationsAsRead(@RequestHeader("Authorization") String authHeader) {
        try {
            logger.info("markAllNotificationsAsRead: Received request with auth header: {}", authHeader);
            
            String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
            String email = jwtUtil.extractUsername(token);
            User currentUser = userRepository.findByEmail(email);
            
            logger.info("markAllNotificationsAsRead: User {} marking all notifications as read", email);
            
            if (currentUser == null) {
                logger.warn("markAllNotificationsAsRead: User not found for email {}", email);
                return ResponseEntity.status(404).body(Map.of("message", "User not found"));
            }
            
            notificationService.markAllAsRead(currentUser);
            logger.info("markAllNotificationsAsRead: All notifications marked as read for user {}", email);
            return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
        } catch (Exception e) {
            logger.error("markAllNotificationsAsRead: Error occurred", e);
            return ResponseEntity.status(500).body(Map.of("message", "Error marking all notifications as read: " + e.getMessage()));
        }
    }
}