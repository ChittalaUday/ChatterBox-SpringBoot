package com.chatter.backend.controller;

import com.chatter.backend.model.ChatMessage;
import com.chatter.backend.model.User;
import com.chatter.backend.repository.ChatMessageRepository;
import com.chatter.backend.repository.UserRepo;
import com.chatter.backend.util.JwtUtil;
import com.chatter.backend.dto.ChatMessageDTO;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Controller
public class ChatController {
    
    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private UserRepo userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @MessageMapping("/chat")
    public void sendMessage(@Payload ChatMessage chatMessage) {
        logger.info("Received public chat message: {}", chatMessage.getContent());
        
        // Save message to database
        chatMessage.setTimestamp(LocalDateTime.now());
        ChatMessage savedMessage = chatMessageRepository.save(chatMessage);
        
        logger.info("Saved public chat message with ID: {}", savedMessage.getId());
        
        // Convert to DTO for proper serialization
        ChatMessageDTO messageDTO = new ChatMessageDTO();
        messageDTO.setId(savedMessage.getId());
        messageDTO.setContent(savedMessage.getContent());
        messageDTO.setTimestamp(savedMessage.getTimestamp());
        messageDTO.setRead(savedMessage.isRead());
        
        // Set sender info
        ChatMessageDTO.UserDTO senderDTO = new ChatMessageDTO.UserDTO();
        senderDTO.setId(savedMessage.getSender().getId());
        senderDTO.setName(savedMessage.getSender().getName());
        senderDTO.setEmail(savedMessage.getSender().getEmail());
        messageDTO.setSender(senderDTO);
        
        // Set receiver info
        ChatMessageDTO.UserDTO receiverDTO = new ChatMessageDTO.UserDTO();
        receiverDTO.setId(savedMessage.getReceiver().getId());
        receiverDTO.setName(savedMessage.getReceiver().getName());
        receiverDTO.setEmail(savedMessage.getReceiver().getEmail());
        messageDTO.setReceiver(receiverDTO);
        
        // Send to public topic
        logger.info("Sending public message to /topic/messages");
        messagingTemplate.convertAndSend("/topic/messages", messageDTO);
    }

    @MessageMapping("/private")
    public void sendPrivateMessage(@Payload ChatMessage chatMessage) {
        logger.info("Received private chat message from user {} to user {}: {}", 
            chatMessage.getSender().getId(), 
            chatMessage.getReceiver().getId(), 
            chatMessage.getContent());
        
        // Save message to database
        chatMessage.setTimestamp(LocalDateTime.now());
        chatMessage.setRead(false);
        ChatMessage savedMessage = chatMessageRepository.save(chatMessage);
        
        logger.info("Saved private chat message with ID: {}", savedMessage.getId());
        
        // Convert to DTO for proper serialization
        ChatMessageDTO messageDTO = new ChatMessageDTO();
        messageDTO.setId(savedMessage.getId());
        messageDTO.setContent(savedMessage.getContent());
        messageDTO.setTimestamp(savedMessage.getTimestamp());
        messageDTO.setRead(savedMessage.isRead());
        
        // Set sender info
        ChatMessageDTO.UserDTO senderDTO = new ChatMessageDTO.UserDTO();
        senderDTO.setId(savedMessage.getSender().getId());
        senderDTO.setName(savedMessage.getSender().getName());
        senderDTO.setEmail(savedMessage.getSender().getEmail());
        messageDTO.setSender(senderDTO);
        
        // Set receiver info
        ChatMessageDTO.UserDTO receiverDTO = new ChatMessageDTO.UserDTO();
        receiverDTO.setId(savedMessage.getReceiver().getId());
        receiverDTO.setName(savedMessage.getReceiver().getName());
        receiverDTO.setEmail(savedMessage.getReceiver().getEmail());
        messageDTO.setReceiver(receiverDTO);
        
        // Send to specific user's queue - using the correct Spring WebSocket convention
        logger.info("Sending private message to user {} at /user/{}/queue/messages", 
            chatMessage.getReceiver().getId(), 
            chatMessage.getReceiver().getId());
        messagingTemplate.convertAndSendToUser(
            String.valueOf(chatMessage.getReceiver().getId()), 
            "/queue/messages", 
            messageDTO
        );
        
        // Also send to sender's queue so they can see their own messages
        logger.info("Sending private message to sender {} at /user/{}/queue/messages", 
            chatMessage.getSender().getId(), 
            chatMessage.getSender().getId());
        messagingTemplate.convertAndSendToUser(
            String.valueOf(chatMessage.getSender().getId()), 
            "/queue/messages", 
            messageDTO
        );
    }
}