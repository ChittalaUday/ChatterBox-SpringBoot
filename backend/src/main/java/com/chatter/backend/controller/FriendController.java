package com.chatter.backend.controller;

import com.chatter.backend.model.Friendship;
import com.chatter.backend.model.User;
import com.chatter.backend.service.FriendService;
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
@RequestMapping("/friends")
public class FriendController {

    private static final Logger logger = LoggerFactory.getLogger(FriendController.class);

    @Autowired
    private FriendService friendService;

    @Autowired
    private UserRepo userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/request")
    public ResponseEntity<?> sendFriendRequest(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Long> payload) {
        
        try {
            logger.info("sendFriendRequest: Received request with auth header: {}", authHeader);
            
            String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
            String email = jwtUtil.extractUsername(token);
            User currentUser = userRepository.findByEmail(email);
            
            logger.info("sendFriendRequest: User {} sending request", email);
            
            if (currentUser == null) {
                logger.warn("sendFriendRequest: User not found for email {}", email);
                return ResponseEntity.status(404).body(Map.of("message", "User not found"));
            }
            
            Long friendId = payload.get("friendId");
            User friend = userRepository.findById(friendId.intValue()).orElse(null);
            
            if (friend == null) {
                logger.warn("sendFriendRequest: Friend not found for id {}", friendId);
                return ResponseEntity.status(404).body(Map.of("message", "Friend not found"));
            }
            
            Friendship friendship = friendService.sendFriendRequest(currentUser, friend);
            logger.info("sendFriendRequest: Request sent successfully from {} to {}", email, friend.getEmail());
            return ResponseEntity.ok(friendship);
        } catch (Exception e) {
            logger.error("sendFriendRequest: Error occurred", e);
            return ResponseEntity.status(500).body(Map.of("message", "Error sending friend request: " + e.getMessage()));
        }
    }

    @PostMapping("/accept")
    public ResponseEntity<?> acceptFriendRequest(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Long> payload) {
        
        try {
            logger.info("acceptFriendRequest: Received request with auth header: {}", authHeader);
            
            String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
            String email = jwtUtil.extractUsername(token);
            User currentUser = userRepository.findByEmail(email);
            
            logger.info("acceptFriendRequest: User {} accepting request", email);
            
            if (currentUser == null) {
                logger.warn("acceptFriendRequest: User not found for email {}", email);
                return ResponseEntity.status(404).body(Map.of("message", "User not found"));
            }
            
            Long friendId = payload.get("friendId");
            User friend = userRepository.findById(friendId.intValue()).orElse(null);
            
            if (friend == null) {
                logger.warn("acceptFriendRequest: Friend not found for id {}", friendId);
                return ResponseEntity.status(404).body(Map.of("message", "Friend not found"));
            }
            
            Friendship friendship = friendService.acceptFriendRequest(currentUser, friend);
            logger.info("acceptFriendRequest: Request accepted successfully between {} and {}", email, friend.getEmail());
            return ResponseEntity.ok(friendship);
        } catch (Exception e) {
            logger.error("acceptFriendRequest: Error occurred", e);
            return ResponseEntity.status(500).body(Map.of("message", "Error accepting friend request: " + e.getMessage()));
        }
    }

    @PostMapping("/reject")
    public ResponseEntity<?> rejectFriendRequest(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Long> payload) {
        
        try {
            logger.info("rejectFriendRequest: Received request with auth header: {}", authHeader);
            
            String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
            String email = jwtUtil.extractUsername(token);
            User currentUser = userRepository.findByEmail(email);
            
            logger.info("rejectFriendRequest: User {} rejecting request", email);
            
            if (currentUser == null) {
                logger.warn("rejectFriendRequest: User not found for email {}", email);
                return ResponseEntity.status(404).body(Map.of("message", "User not found"));
            }
            
            Long friendId = payload.get("friendId");
            User friend = userRepository.findById(friendId.intValue()).orElse(null);
            
            if (friend == null) {
                logger.warn("rejectFriendRequest: Friend not found for id {}", friendId);
                return ResponseEntity.status(404).body(Map.of("message", "Friend not found"));
            }
            
            Friendship friendship = friendService.rejectFriendRequest(currentUser, friend);
            if (friendship == null) {
                logger.warn("rejectFriendRequest: Friend request not found between {} and {}", email, friend.getEmail());
                return ResponseEntity.status(404).body(Map.of("message", "Friend request not found"));
            }
            
            logger.info("rejectFriendRequest: Request rejected successfully between {} and {}", email, friend.getEmail());
            return ResponseEntity.ok(friendship);
        } catch (Exception e) {
            logger.error("rejectFriendRequest: Error occurred", e);
            return ResponseEntity.status(500).body(Map.of("message", "Error rejecting friend request: " + e.getMessage()));
        }
    }

    @GetMapping("/list")
    public ResponseEntity<?> getFriends(@RequestHeader("Authorization") String authHeader) {
        try {
            logger.info("getFriends: Received request with auth header: {}", authHeader);
            
            String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
            logger.info("getFriends: Extracted token: {}", token);
            
            String email = jwtUtil.extractUsername(token);
            logger.info("getFriends: Extracted email from token: {}", email);
            
            User currentUser = userRepository.findByEmail(email);
            logger.info("getFriends: Found user in DB: {}", currentUser != null);
            
            if (currentUser == null) {
                logger.warn("getFriends: User not found for email {}", email);
                return ResponseEntity.status(404).body(Map.of("message", "User not found"));
            }
            
            List<User> friends = friendService.getFriends(currentUser);
            logger.info("getFriends: Found {} friends for user {}", friends.size(), email);
            return ResponseEntity.ok(friends);
        } catch (Exception e) {
            logger.error("getFriends: Error occurred", e);
            return ResponseEntity.status(500).body(Map.of("message", "Error fetching friends: " + e.getMessage()));
        }
    }

    @GetMapping("/requests")
    public ResponseEntity<?> getPendingRequests(@RequestHeader("Authorization") String authHeader) {
        try {
            logger.info("getPendingRequests: Received request with auth header: {}", authHeader);
            
            String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
            String email = jwtUtil.extractUsername(token);
            User currentUser = userRepository.findByEmail(email);
            
            logger.info("getPendingRequests: User {} fetching pending requests", email);
            
            if (currentUser == null) {
                logger.warn("getPendingRequests: User not found for email {}", email);
                return ResponseEntity.status(404).body(Map.of("message", "User not found"));
            }
            
            List<User> requests = friendService.getPendingRequests(currentUser);
            logger.info("getPendingRequests: Found {} pending requests for user {}", requests.size(), email);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            logger.error("getPendingRequests: Error occurred", e);
            return ResponseEntity.status(500).body(Map.of("message", "Error fetching friend requests: " + e.getMessage()));
        }
    }

    @DeleteMapping("/remove")
    public ResponseEntity<?> removeFriend(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Long> payload) {
        
        try {
            logger.info("removeFriend: Received request with auth header: {}", authHeader);
            
            String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
            String email = jwtUtil.extractUsername(token);
            User currentUser = userRepository.findByEmail(email);
            
            logger.info("removeFriend: User {} removing friend", email);
            
            if (currentUser == null) {
                logger.warn("removeFriend: User not found for email {}", email);
                return ResponseEntity.status(404).body(Map.of("message", "User not found"));
            }
            
            Long friendId = payload.get("friendId");
            User friend = userRepository.findById(friendId.intValue()).orElse(null);
            
            if (friend == null) {
                logger.warn("removeFriend: Friend not found for id {}", friendId);
                return ResponseEntity.status(404).body(Map.of("message", "Friend not found"));
            }
            
            friendService.removeFriend(currentUser, friend);
            logger.info("removeFriend: Friend removed successfully between {} and {}", email, friend.getEmail());
            return ResponseEntity.ok(Map.of("message", "Friend removed successfully"));
        } catch (Exception e) {
            logger.error("removeFriend: Error occurred", e);
            return ResponseEntity.status(500).body(Map.of("message", "Error removing friend: " + e.getMessage()));
        }
    }
}