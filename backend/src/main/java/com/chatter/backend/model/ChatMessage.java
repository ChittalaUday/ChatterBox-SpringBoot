package com.chatter.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "sender_id", nullable = false)
    @JsonIgnore
    private User sender;
    
    @ManyToOne
    @JoinColumn(name = "receiver_id", nullable = false)
    @JsonIgnore
    private User receiver;
    
    @Column(nullable = false, length = 1000)
    private String content;
    
    @CreationTimestamp
    private LocalDateTime timestamp;
    
    @Column(nullable = false)
    private boolean isRead = false;
    
    // Constructors
    public ChatMessage() {}
    
    public ChatMessage(User sender, User receiver, String content) {
        this.sender = sender;
        this.receiver = receiver;
        this.content = content;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    @JsonIgnore
    public User getSender() {
        return sender;
    }
    
    public void setSender(User sender) {
        this.sender = sender;
    }
    
    @JsonIgnore
    public User getReceiver() {
        return receiver;
    }
    
    public void setReceiver(User receiver) {
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
}