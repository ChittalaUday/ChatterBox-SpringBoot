package com.chatter.backend.repository;

import com.chatter.backend.model.ChatMessage;
import com.chatter.backend.model.User;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    
    @Query("SELECT cm FROM ChatMessage cm WHERE " +
           "(cm.sender = :user1 AND cm.receiver = :user2) OR " +
           "(cm.sender = :user2 AND cm.receiver = :user1) " +
           "ORDER BY cm.timestamp ASC")
    List<ChatMessage> findConversationBetweenUsers(@Param("user1") User user1, @Param("user2") User user2);
    
    List<ChatMessage> findByReceiverAndIsReadFalse(User receiver);
    
    List<ChatMessage> findBySenderAndReceiverOrderByTimestampAsc(User sender, User receiver);
}