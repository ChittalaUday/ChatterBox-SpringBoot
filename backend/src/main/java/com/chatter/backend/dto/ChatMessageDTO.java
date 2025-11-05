package com.chatter.backend.dto;

import java.time.LocalDateTime;

public class ChatMessageDTO {
    private Long id;
    private UserDTO sender;
    private UserDTO receiver;
    private String content;
    private LocalDateTime timestamp;
    private boolean isRead;
    
    // Constructors
    public ChatMessageDTO() {}
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public UserDTO getSender() {
        return sender;
    }
    
    public void setSender(UserDTO sender) {
        this.sender = sender;
    }
    
    public UserDTO getReceiver() {
        return receiver;
    }
    
    public void setReceiver(UserDTO receiver) {
        this.receiver = receiver;
    }
    
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }
    
    public LocalDateTime getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
    
    public boolean isRead() {
        return isRead;
    }
    
    public void setRead(boolean isRead) {
        this.isRead = isRead;
    }
    
    // Inner class for UserDTO
    public static class UserDTO {
        private int id;
        private String name;
        private String email;
        
        public UserDTO() {}
        
        public UserDTO(int id, String name, String email) {
            this.id = id;
            this.name = name;
            this.email = email;
        }
        
        // Getters and Setters
        public int getId() {
            return id;
        }
        
        public void setId(int id) {
            this.id = id;
        }
        
        public String getName() {
            return name;
        }
        
        public void setName(String name) {
            this.name = name;
        }
        
        public String getEmail() {
            return email;
        }
        
        public void setEmail(String email) {
            this.email = email;
        }
    }
}