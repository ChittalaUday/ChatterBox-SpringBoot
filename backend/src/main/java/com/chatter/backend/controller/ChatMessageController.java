package com.chatter.backend.controller;

import com.chatter.backend.model.ChatMessage;
import com.chatter.backend.model.User;
import com.chatter.backend.repository.ChatMessageRepository;
import com.chatter.backend.repository.UserRepo;
import com.chatter.backend.util.JwtUtil;
import com.chatter.backend.dto.ChatMessageDTO;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/chat")
public class ChatMessageController {

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private UserRepo userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping("/messages")
    public ResponseEntity<?> getChatHistory(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam Long friendId) {
        
        try {
            String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
            String email = jwtUtil.extractUsername(token);
            User currentUser = userRepository.findByEmail(email);
            
            if (currentUser == null) {
                return ResponseEntity.status(404).body(Map.of("message", "User not found"));
            }
            
            User friend = userRepository.findById(friendId.intValue()).orElse(null);
            
            if (friend == null) {
                return ResponseEntity.status(404).body(Map.of("message", "Friend not found"));
            }
            
            List<ChatMessage> messages = chatMessageRepository.findConversationBetweenUsers(currentUser, friend);
            
            // Convert to DTOs for proper serialization
            List<ChatMessageDTO> messageDTOs = messages.stream().map(chatMessage -> {
                ChatMessageDTO messageDTO = new ChatMessageDTO();
                messageDTO.setId(chatMessage.getId());
                messageDTO.setContent(chatMessage.getContent());
                messageDTO.setTimestamp(chatMessage.getTimestamp());
                messageDTO.setRead(chatMessage.isRead());
                
                // Set sender info
                ChatMessageDTO.UserDTO senderDTO = new ChatMessageDTO.UserDTO();
                senderDTO.setId(chatMessage.getSender().getId());
                senderDTO.setName(chatMessage.getSender().getName());
                senderDTO.setEmail(chatMessage.getSender().getEmail());
                messageDTO.setSender(senderDTO);
                
                // Set receiver info
                ChatMessageDTO.UserDTO receiverDTO = new ChatMessageDTO.UserDTO();
                receiverDTO.setId(chatMessage.getReceiver().getId());
                receiverDTO.setName(chatMessage.getReceiver().getName());
                receiverDTO.setEmail(chatMessage.getReceiver().getEmail());
                messageDTO.setReceiver(receiverDTO);
                
                return messageDTO;
            }).collect(Collectors.toList());
            
            return ResponseEntity.ok(messageDTOs);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error fetching chat history: " + e.getMessage()));
        }
    }

    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> payload) {
        
        try {
            String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
            String email = jwtUtil.extractUsername(token);
            User sender = userRepository.findByEmail(email);
            
            if (sender == null) {
                return ResponseEntity.status(404).body(Map.of("message", "User not found"));
            }
            
            Integer receiverId = (Integer) payload.get("receiverId");
            String content = (String) payload.get("content");
            
            User receiver = userRepository.findById(receiverId).orElse(null);
            
            if (receiver == null) {
                return ResponseEntity.status(404).body(Map.of("message", "Receiver not found"));
            }
            
            ChatMessage message = new ChatMessage(sender, receiver, content);
            ChatMessage savedMessage = chatMessageRepository.save(message);
            
            return ResponseEntity.ok(savedMessage);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error sending message: " + e.getMessage()));
        }
    }

    @PutMapping("/mark-as-read")
    public ResponseEntity<?> markMessagesAsRead(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Long> payload) {
        
        try {
            String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
            String email = jwtUtil.extractUsername(token);
            User currentUser = userRepository.findByEmail(email);
            
            if (currentUser == null) {
                return ResponseEntity.status(404).body(Map.of("message", "User not found"));
            }
            
            Long senderId = payload.get("senderId");
            User sender = userRepository.findById(senderId.intValue()).orElse(null);
            
            if (sender == null) {
                return ResponseEntity.status(404).body(Map.of("message", "Sender not found"));
            }
            
            List<ChatMessage> unreadMessages = chatMessageRepository.findBySenderAndReceiverOrderByTimestampAsc(
                sender, currentUser);
            
            for (ChatMessage message : unreadMessages) {
                if (!message.isRead()) {
                    message.setRead(true);
                    chatMessageRepository.save(message);
                }
            }
            
            return ResponseEntity.ok(Map.of("message", "Messages marked as read"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error marking messages as read: " + e.getMessage()));
        }
    }
}