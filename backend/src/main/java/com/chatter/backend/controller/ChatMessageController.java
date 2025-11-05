package com.chatter.backend.controller;

import com.chatter.backend.model.ChatMessage;
import com.chatter.backend.model.User;
import com.chatter.backend.repository.ChatMessageRepository;
import com.chatter.backend.repository.UserRepo;
import com.chatter.backend.service.NotificationService;
import com.chatter.backend.util.JwtUtil;
import com.chatter.backend.dto.ChatMessageDTO;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
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

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private NotificationService notificationService;

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
                messageDTO.setFileUrl(chatMessage.getFileUrl());
                messageDTO.setFileName(chatMessage.getFileName());
                messageDTO.setFileType(chatMessage.getFileType());
                messageDTO.setFileSize(chatMessage.getFileSize());
                messageDTO.setMessageType(chatMessage.getMessageType());
                messageDTO.setDeleted(chatMessage.isDeleted());
                
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
            String fileUrl = (String) payload.get("fileUrl");
            String fileName = (String) payload.get("fileName");
            String fileType = (String) payload.get("fileType");
            Long fileSize = payload.get("fileSize") != null ? ((Number) payload.get("fileSize")).longValue() : null;
            String messageType = (String) payload.get("messageType");
            
            if (messageType == null || messageType.isEmpty()) {
                messageType = fileUrl != null ? "FILE" : "TEXT";
            }
            
            User receiver = userRepository.findById(receiverId).orElse(null);
            
            if (receiver == null) {
                return ResponseEntity.status(404).body(Map.of("message", "Receiver not found"));
            }
            
            ChatMessage message = new ChatMessage(sender, receiver, content != null ? content : "");
            message.setTimestamp(LocalDateTime.now());
            message.setRead(false);
            message.setFileUrl(fileUrl);
            message.setFileName(fileName);
            message.setFileType(fileType);
            message.setFileSize(fileSize);
            message.setMessageType(messageType);
            ChatMessage savedMessage = chatMessageRepository.save(message);
            
            // Create notification for receiver
            String notificationContent = content != null && !content.isEmpty() 
                ? content 
                : (fileName != null ? fileName : "a file");
            String notificationMessage = String.format("%s sent you %s", 
                sender.getName(), 
                messageType.equals("IMAGE") ? "an image" :
                messageType.equals("VIDEO") ? "a video" :
                messageType.equals("AUDIO") ? "an audio" :
                messageType.equals("FILE") ? "a file" :
                notificationContent.length() > 50 ? notificationContent.substring(0, 50) + "..." : notificationContent);
            notificationService.createNotification(receiver, notificationMessage, "MESSAGE");
            
            // Convert to DTO for WebSocket broadcasting
            ChatMessageDTO messageDTO = new ChatMessageDTO();
            messageDTO.setId(savedMessage.getId());
            messageDTO.setContent(savedMessage.getContent());
            messageDTO.setTimestamp(savedMessage.getTimestamp());
            messageDTO.setRead(savedMessage.isRead());
            messageDTO.setFileUrl(savedMessage.getFileUrl());
            messageDTO.setFileName(savedMessage.getFileName());
            messageDTO.setFileType(savedMessage.getFileType());
            messageDTO.setFileSize(savedMessage.getFileSize());
            messageDTO.setMessageType(savedMessage.getMessageType());
            messageDTO.setDeleted(savedMessage.isDeleted());
            
            // Set sender info
            ChatMessageDTO.UserDTO senderDTO = new ChatMessageDTO.UserDTO();
            senderDTO.setId(sender.getId());
            senderDTO.setName(sender.getName());
            senderDTO.setEmail(sender.getEmail());
            messageDTO.setSender(senderDTO);
            
            // Set receiver info
            ChatMessageDTO.UserDTO receiverDTO = new ChatMessageDTO.UserDTO();
            receiverDTO.setId(receiver.getId());
            receiverDTO.setName(receiver.getName());
            receiverDTO.setEmail(receiver.getEmail());
            messageDTO.setReceiver(receiverDTO);
            
            // Broadcast via WebSocket to both sender and receiver
            messagingTemplate.convertAndSendToUser(
                String.valueOf(receiver.getId()), 
                "/queue/messages", 
                messageDTO
            );
            messagingTemplate.convertAndSendToUser(
                String.valueOf(sender.getId()), 
                "/queue/messages", 
                messageDTO
            );
            
            // Notify receiver about new notification count
            messagingTemplate.convertAndSendToUser(
                String.valueOf(receiver.getId()),
                "/queue/notifications",
                Map.of("type", "NEW_NOTIFICATION")
            );
            
            // Return DTO for consistent response format
            return ResponseEntity.ok(messageDTO);
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
            
            boolean anyRead = false;
            for (ChatMessage message : unreadMessages) {
                if (!message.isRead()) {
                    message.setRead(true);
                    chatMessageRepository.save(message);
                    anyRead = true;
                }
            }
            
            // Broadcast read status update to sender via WebSocket
            if (anyRead) {
                Map<String, Object> readStatusUpdate = new HashMap<>();
                readStatusUpdate.put("type", "MESSAGES_READ");
                readStatusUpdate.put("receiverId", currentUser.getId());
                readStatusUpdate.put("senderId", sender.getId());
                
                messagingTemplate.convertAndSendToUser(
                    String.valueOf(sender.getId()),
                    "/queue/messages",
                    readStatusUpdate
                );
                
                // Also notify current user's other clients about updated unread counts
                messagingTemplate.convertAndSendToUser(
                    String.valueOf(currentUser.getId()),
                    "/queue/unread-update",
                    Map.of("type", "UNREAD_COUNT_UPDATED")
                );
            }
            
            return ResponseEntity.ok(Map.of("message", "Messages marked as read"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error marking messages as read: " + e.getMessage()));
        }
    }

    @GetMapping("/unread-counts")
    public ResponseEntity<?> getUnreadMessageCounts(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
            String email = jwtUtil.extractUsername(token);
            User currentUser = userRepository.findByEmail(email);
            
            if (currentUser == null) {
                return ResponseEntity.status(404).body(Map.of("message", "User not found"));
            }
            
            List<Object[]> unreadCounts = chatMessageRepository.countUnreadMessagesBySender(currentUser);
            Map<Long, Long> result = new HashMap<>();
            
            for (Object[] row : unreadCounts) {
                Long senderId = (Long) row[0];
                Long count = (Long) row[1];
                result.put(senderId, count);
            }
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error fetching unread message counts: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{messageId}")
    public ResponseEntity<?> deleteMessage(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long messageId) {
        
        try {
            String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
            String email = jwtUtil.extractUsername(token);
            User currentUser = userRepository.findByEmail(email);
            
            if (currentUser == null) {
                return ResponseEntity.status(404).body(Map.of("message", "User not found"));
            }
            
            ChatMessage message = chatMessageRepository.findById(messageId).orElse(null);
            
            if (message == null) {
                return ResponseEntity.status(404).body(Map.of("message", "Message not found"));
            }
            
            // Only allow sender to delete their own messages
            if (message.getSender().getId() != currentUser.getId()) {
                return ResponseEntity.status(403).body(Map.of("message", "You can only delete your own messages"));
            }
            
            message.setDeleted(true);
            chatMessageRepository.save(message);
            
            // Broadcast deletion via WebSocket
            ChatMessageDTO messageDTO = new ChatMessageDTO();
            messageDTO.setId(message.getId());
            messageDTO.setDeleted(true);
            
            messagingTemplate.convertAndSendToUser(
                String.valueOf(message.getReceiver().getId()),
                "/queue/messages",
                messageDTO
            );
            
            return ResponseEntity.ok(Map.of("message", "Message deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error deleting message: " + e.getMessage()));
        }
    }

    @PostMapping("/typing")
    public ResponseEntity<?> sendTypingIndicator(
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
            Boolean isTyping = (Boolean) payload.get("isTyping");
            
            User receiver = userRepository.findById(receiverId).orElse(null);
            
            if (receiver == null) {
                return ResponseEntity.status(404).body(Map.of("message", "Receiver not found"));
            }
            
            // Broadcast typing indicator via WebSocket
            Map<String, Object> typingData = new HashMap<>();
            typingData.put("type", "TYPING");
            typingData.put("senderId", sender.getId());
            typingData.put("senderName", sender.getName());
            typingData.put("isTyping", isTyping != null ? isTyping : true);
            
            messagingTemplate.convertAndSendToUser(
                String.valueOf(receiverId),
                "/queue/typing",
                typingData
            );
            
            return ResponseEntity.ok(Map.of("message", "Typing indicator sent"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error sending typing indicator: " + e.getMessage()));
        }
    }
}